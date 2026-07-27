#!/usr/bin/env python3
"""Tests for the Phase 0 evidence verifier."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import phase0_evidence as evidence


class Phase0EvidenceTest(unittest.TestCase):
    """Exercise redaction and fail-closed digest behavior."""

    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def write_csv(self, columns: tuple[str, ...] = evidence.CSV_COLUMNS) -> Path:
        path = self.root / "history.csv"
        with path.open("w", encoding="utf-8", newline="") as stream:
            writer = csv.DictWriter(stream, fieldnames=columns)
            writer.writeheader()
            writer.writerow(
                {
                    "installed_rank": "1",
                    "version": "100",
                    "description": "create app tenant tables",
                    "type": "SQL",
                    "script": "V100__create_app_tenant_tables.sql",
                    "checksum": "-123456",
                    "installed_on_utc": "2026-07-27T01:02:03.000Z",
                    "execution_time_ms": "14",
                    "success": "t",
                    **({"installed_by": "secret-user"} if "installed_by" in columns else {}),
                }
            )
        return path

    def create_git_repository(self, name: str) -> Path:
        path = self.root / name
        path.mkdir()
        subprocess.run(["git", "init", "-q", str(path)], check=True)
        subprocess.run(
            ["git", "-C", str(path), "config", "user.name", "Phase Zero Test"],
            check=True,
        )
        subprocess.run(
            ["git", "-C", str(path), "config", "user.email", "phase0@example.invalid"],
            check=True,
        )
        subprocess.run(
            [
                "git",
                "-C",
                str(path),
                "remote",
                "add",
                "origin",
                f"https://github.com/brix-kit-dev/{name}.git",
            ],
            check=True,
        )
        (path / "pom.xml").write_text("<project/>\n", encoding="utf-8")
        subprocess.run(["git", "-C", str(path), "add", "pom.xml"], check=True)
        subprocess.run(
            ["git", "-C", str(path), "commit", "-q", "-m", "fixture"],
            check=True,
        )
        return path

    def test_sanitized_history_contains_only_allowlisted_fields(self) -> None:
        source = self.write_csv()
        output = self.root / "app-tenant.json"
        evidence.sanitize_flyway(
            argparse.Namespace(
                environment="production",
                module="app-tenant",
                input=str(source),
                output=str(output),
            )
        )
        document = json.loads(output.read_text(encoding="utf-8"))
        serialized = output.read_text(encoding="utf-8")
        self.assertEqual(evidence.SCHEMA_FLYWAY, document["schema"])
        self.assertEqual("flyway_schema_history_app_tenant", document["historyTable"])
        self.assertNotIn("installed_by", document["entries"][0])
        self.assertNotIn("secret-user", serialized)
        self.assertTrue(document["entries"][0]["success"])

    def test_sanitizer_rejects_unapproved_identity_column(self) -> None:
        source = self.write_csv(evidence.CSV_COLUMNS + ("installed_by",))
        with self.assertRaises(evidence.EvidenceError):
            evidence.sanitize_flyway(
                argparse.Namespace(
                    environment="production",
                    module="app-tenant",
                    input=str(source),
                    output=str(self.root / "unsafe.json"),
                )
            )

    def test_deployment_digest_must_match_binding(self) -> None:
        binding = self.root / "binding.json"
        binding.write_text(
            json.dumps(
                {
                    "schema": evidence.SCHEMA_BINDING,
                    "artifact": {"sha256": hashlib.sha256(b"expected").hexdigest()},
                }
            ),
            encoding="utf-8",
        )
        deployed = self.root / "deployed.jar"
        deployed.write_bytes(b"different")
        with self.assertRaises(evidence.EvidenceError):
            evidence.record_deployment(
                argparse.Namespace(
                    environment="production",
                    binding=str(binding),
                    deployed_artifact=str(deployed),
                    capture_method="copied-from-running-host",
                    output=str(self.root / "deployment.json"),
                )
            )

    def test_flyway_checksum_is_line_ending_independent(self) -> None:
        lf = self.root / "lf.sql"
        crlf = self.root / "crlf.sql"
        lf.write_bytes(b"SELECT 1;\nSELECT 2;\n")
        crlf.write_bytes(b"SELECT 1;\r\nSELECT 2;\r\n")
        self.assertEqual(evidence.flyway_checksum(lf), evidence.flyway_checksum(crlf))
        self.assertEqual(-1665099012, evidence.flyway_checksum(lf))

    def test_history_allows_known_not_applied_migration(self) -> None:
        sources = [
            {
                "version": "100",
                "script": "V100__one.sql",
                "flywayChecksum": 12,
                "sha256": "a" * 64,
                "size": 1,
            },
            {
                "version": "101",
                "script": "V101__two.sql",
                "flywayChecksum": 34,
                "sha256": "b" * 64,
                "size": 1,
            },
        ]
        history = {
            "schema": evidence.SCHEMA_FLYWAY,
            "environment": "production",
            "module": "app-tenant",
            "historyTable": evidence.MODULE_TABLES["app-tenant"],
            "entries": [
                {
                    "installedRank": 1,
                    "version": "100",
                    "script": "V100__one.sql",
                    "checksum": 12,
                    "success": True,
                }
            ],
        }
        result = evidence.verify_history(
            history,
            self.root / "history.json",
            "production",
            "app-tenant",
            sources,
        )
        self.assertEqual(["100"], [item["version"] for item in result["applied"]])
        self.assertEqual(["101"], [item["version"] for item in result["notApplied"]])

    def test_history_rejects_a_gap_in_applied_migrations(self) -> None:
        sources = [
            {
                "version": version,
                "script": f"V{version}__migration.sql",
                "flywayChecksum": index,
                "sha256": str(index) * 64,
                "size": 1,
            }
            for index, version in enumerate(("100", "101", "102"), start=1)
        ]
        history = {
            "schema": evidence.SCHEMA_FLYWAY,
            "environment": "production",
            "module": "app-tenant",
            "historyTable": evidence.MODULE_TABLES["app-tenant"],
            "entries": [
                {
                    "installedRank": 1,
                    "version": "100",
                    "script": "V100__migration.sql",
                    "checksum": 1,
                    "success": True,
                },
                {
                    "installedRank": 2,
                    "version": "102",
                    "script": "V102__migration.sql",
                    "checksum": 3,
                    "success": True,
                },
            ],
        }
        with self.assertRaises(evidence.EvidenceError):
            evidence.verify_history(
                history,
                self.root / "history.json",
                "production",
                "app-tenant",
                sources,
            )

    def test_repository_binding_detects_untracked_files_even_when_git_hides_them(
        self,
    ) -> None:
        repository = self.create_git_repository("brix")
        subprocess.run(
            [
                "git",
                "-C",
                str(repository),
                "config",
                "status.showUntrackedFiles",
                "no",
            ],
            check=True,
        )
        (repository / "untracked.txt").write_text("not committed\n", encoding="utf-8")
        with self.assertRaises(evidence.EvidenceError):
            evidence.repository_record("brix", repository)

    def test_verification_repositories_must_match_bound_commits(self) -> None:
        brix = self.create_git_repository("brix")
        enterprise = self.create_git_repository("brix-enterprise")
        binding = {
            "repositories": [
                evidence.repository_record("brix", brix),
                evidence.repository_record("brix-enterprise", enterprise),
            ]
        }
        records, paths = evidence.validate_source_repositories(
            binding,
            [f"brix={brix}", f"brix-enterprise={enterprise}"],
        )
        self.assertEqual(
            {"brix", "brix-enterprise"},
            {record["name"] for record in records},
        )
        self.assertEqual(brix.resolve(), paths["brix"])

        binding["repositories"][0]["commit"] = "0" * 40
        with self.assertRaises(evidence.EvidenceError):
            evidence.validate_source_repositories(
                binding,
                [f"brix={brix}", f"brix-enterprise={enterprise}"],
            )

    def test_migration_paths_must_belong_to_bound_repositories(self) -> None:
        brix = self.root / "brix"
        enterprise = self.root / "brix-enterprise"
        expected_platform = (
            brix / evidence.MIGRATION_LOCATIONS["platform-tenant"][1]
        )
        expected_app = enterprise / evidence.MIGRATION_LOCATIONS["app-tenant"][1]
        paths = evidence.authoritative_migration_paths(
            [
                f"platform-tenant={expected_platform}",
                f"app-tenant={expected_app}",
            ],
            {"brix": brix, "brix-enterprise": enterprise},
        )
        self.assertEqual(expected_platform.resolve(), paths["platform-tenant"])

        with self.assertRaises(evidence.EvidenceError):
            evidence.authoritative_migration_paths(
                [
                    f"platform-tenant={self.root / 'copied-migrations'}",
                    f"app-tenant={expected_app}",
                ],
                {"brix": brix, "brix-enterprise": enterprise},
            )

    def test_source_migrations_use_numeric_version_order(self) -> None:
        directory = self.root / "migrations"
        directory.mkdir()
        for version in ("10", "2", "1"):
            (directory / f"V{version}__migration.sql").write_text(
                f"SELECT {version};\n",
                encoding="utf-8",
            )
        inventory = evidence.source_migrations("app-tenant", directory)
        self.assertEqual(["1", "2", "10"], [item["version"] for item in inventory])


if __name__ == "__main__":
    unittest.main()
