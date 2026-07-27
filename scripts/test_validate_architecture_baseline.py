"""Tests for the architecture baseline freeze validator."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("validate_architecture_baseline.py")
SPEC = importlib.util.spec_from_file_location("baseline_validator", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


class ArchitectureBaselineValidatorTest(unittest.TestCase):
    def blueprint(self, **overrides: object) -> dict[str, object]:
        value: dict[str, object] = {
            "id": "runtime-shell-3.0.10",
            "domain": "runtime-shell",
            "kind": "ROOT",
            "status": "ACTIVE",
            "path": "docs/root.md",
            "version": "3.0.10",
            "inherits": None,
            "sha256": "a" * 64,
            "gitBlob": "b" * 40,
        }
        value.update(overrides)
        return value

    def test_candidate_document_matches_registry(self) -> None:
        blueprint = self.blueprint(status="CANDIDATE", version="3.0.11")
        VALIDATOR.validate_document_state(
            "v3.0.11 architecture blueprint (Freeze Candidate)", blueprint
        )

    def test_candidate_document_is_rejected_for_active_record(self) -> None:
        blueprint = self.blueprint()
        with self.assertRaises(VALIDATOR.BaselineValidationError):
            VALIDATOR.validate_document_state(
                "v3.0.10 architecture blueprint (Freeze Candidate)", blueprint
            )

    def test_registry_requires_single_active_root(self) -> None:
        lock = {
            "requiredActiveDomains": ["runtime-shell"],
            "blueprints": [
                self.blueprint(),
                self.blueprint(id="runtime-shell-3.0.9", version="3.0.9"),
            ],
        }
        with self.assertRaises(VALIDATOR.BaselineValidationError):
            VALIDATOR.validate_registry(lock)

    def test_specialized_blueprint_must_inherit_active_root(self) -> None:
        lock = {
            "requiredActiveDomains": ["runtime-shell", "frontend"],
            "blueprints": [
                self.blueprint(),
                self.blueprint(
                    id="frontend-1.0",
                    domain="frontend",
                    kind="SPECIALIZED",
                    version="1.0",
                    inherits={"id": "runtime-shell-3.0.9", "version": "3.0.9"},
                ),
            ],
        }
        with self.assertRaises(VALIDATOR.BaselineValidationError):
            VALIDATOR.validate_registry(lock)

    def test_active_record_cannot_change_locked_bytes(self) -> None:
        previous = {"schemaVersion": 2, "blueprints": [self.blueprint()]}
        current = {
            "schemaVersion": 2,
            "blueprints": [self.blueprint(sha256="c" * 64)],
        }
        with self.assertRaises(VALIDATOR.BaselineValidationError):
            VALIDATOR.validate_transition(previous, current)

    def test_candidate_can_be_promoted_with_frozen_bytes(self) -> None:
        previous = {
            "schemaVersion": 2,
            "blueprints": [
                self.blueprint(
                    status="CANDIDATE",
                    path="docs/archived/root.md",
                    sha256="c" * 64,
                    gitBlob="d" * 40,
                )
            ],
        }
        current = {"schemaVersion": 2, "blueprints": [self.blueprint()]}

        VALIDATOR.validate_transition(previous, current)

    def test_raw_byte_digest_is_stable(self) -> None:
        self.assertEqual(
            VALIDATOR.sha256_bytes(b"brix\n"),
            "a2a02b0ec0cb729fe560388f2aeb734662b0b7157755cbab2cbd8e1e7eda682f",
        )

    def test_git_blob_id_is_stable(self) -> None:
        self.assertEqual(
            VALIDATOR.git_blob_id(b"brix\n"),
            "3795ed96c2969c0ea7af9ab8aeb2ae89668ef654",
        )


if __name__ == "__main__":
    unittest.main()