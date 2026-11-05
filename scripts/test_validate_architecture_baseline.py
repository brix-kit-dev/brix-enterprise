"""Tests for the architecture baseline freeze validator."""

from __future__ import annotations

import importlib.util
import subprocess
import tempfile
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


class ArchiveMoveTransitionTest(unittest.TestCase):
    """A retired record may move into docs/archived; nothing else about it may change."""

    def record(self, **overrides: object) -> dict[str, object]:
        value: dict[str, object] = {
            "id": "runtime-shell-3.0.10",
            "domain": "runtime-shell",
            "kind": "ROOT",
            "status": "SUPERSEDED",
            "path": "docs/root.md",
            "version": "3.0.10",
            "inherits": None,
            "sha256": "a" * 64,
            "gitBlob": "b" * 40,
        }
        value.update(overrides)
        return value

    def transition(self, old: dict[str, object], new: dict[str, object]) -> None:
        VALIDATOR.validate_transition(
            {"schemaVersion": 2, "blueprints": [old]},
            {"schemaVersion": 2, "blueprints": [new]},
        )

    def assert_rejected(
        self, old: dict[str, object], new: dict[str, object], message: str
    ) -> None:
        with self.assertRaisesRegex(VALIDATOR.BaselineValidationError, message):
            self.transition(old, new)

    def test_superseded_record_moves_under_its_name(self) -> None:
        self.transition(self.record(), self.record(path="docs/archived/root.md"))

    def test_archived_record_moves_under_its_name(self) -> None:
        self.transition(
            self.record(status="ARCHIVED"),
            self.record(status="ARCHIVED", path="docs/archived/root.md"),
        )

    def test_record_superseded_by_this_revision_moves_with_it(self) -> None:
        self.transition(
            self.record(status="ACTIVE"),
            self.record(path="docs/archived/root.md"),
        )

    def test_a_record_already_in_the_archive_stays_valid(self) -> None:
        record = self.record(path="docs/archived/root.md")
        self.transition(record, dict(record))

    def test_active_record_cannot_move(self) -> None:
        self.assert_rejected(
            self.record(status="ACTIVE"),
            self.record(status="ACTIVE", path="docs/archived/root.md"),
            "immutable fields",
        )

    def test_move_cannot_reactivate_a_retired_record(self) -> None:
        self.assert_rejected(
            self.record(),
            self.record(status="ACTIVE", path="docs/archived/root.md"),
            "immutable fields",
        )

    def test_retired_record_cannot_be_reactivated_in_place(self) -> None:
        for status in ("SUPERSEDED", "ARCHIVED"):
            self.assert_rejected(
                self.record(status=status),
                self.record(status="ACTIVE"),
                "cannot be reactivated",
            )

    def test_move_cannot_rename(self) -> None:
        self.assert_rejected(
            self.record(),
            self.record(path="docs/archived/root-retired.md"),
            "immutable fields",
        )

    def test_retired_record_cannot_move_anywhere_else(self) -> None:
        self.assert_rejected(
            self.record(), self.record(path="docs/old.md"), "immutable fields"
        )

    def test_retired_record_cannot_leave_the_archive(self) -> None:
        self.assert_rejected(
            self.record(path="docs/archived/root.md"),
            self.record(path="docs/root.md"),
            "immutable fields",
        )

    def test_move_cannot_change_the_locked_hash(self) -> None:
        self.assert_rejected(
            self.record(),
            self.record(path="docs/archived/root.md", sha256="c" * 64),
            "immutable fields",
        )

    def test_move_cannot_change_the_git_blob(self) -> None:
        self.assert_rejected(
            self.record(),
            self.record(path="docs/archived/root.md", gitBlob="c" * 40),
            "immutable fields",
        )

    def test_move_cannot_change_the_version(self) -> None:
        self.assert_rejected(
            self.record(),
            self.record(path="docs/archived/root.md", version="3.0.11"),
            "immutable fields",
        )

    def test_move_cannot_drop_the_record(self) -> None:
        with self.assertRaisesRegex(VALIDATOR.BaselineValidationError, "append-only"):
            VALIDATOR.validate_transition(
                {"schemaVersion": 2, "blueprints": [self.record()]},
                {"schemaVersion": 2, "blueprints": []},
            )


class FrozenPathTest(unittest.TestCase):
    def test_retired_record_in_the_archive_was_frozen_under_docs(self) -> None:
        for status in ("SUPERSEDED", "ARCHIVED"):
            self.assertEqual(
                VALIDATOR.frozen_path({"status": status, "path": "docs/archived/root.md"}),
                "docs/root.md",
            )

    def test_record_outside_the_archive_keeps_its_path(self) -> None:
        for status in ("ACTIVE", "CANDIDATE", "SUPERSEDED", "ARCHIVED"):
            self.assertEqual(
                VALIDATOR.frozen_path({"status": status, "path": "docs/root.md"}),
                "docs/root.md",
            )

    def test_only_a_retired_record_is_translated(self) -> None:
        for status in ("ACTIVE", "CANDIDATE"):
            self.assertEqual(
                VALIDATOR.frozen_path({"status": status, "path": "docs/archived/root.md"}),
                "docs/archived/root.md",
            )


class FrozenCommitAfterArchiveMoveTest(unittest.TestCase):
    """The commit recorded at the freeze still proves the bytes after the move."""

    content = b"v1.0 blueprint\n"

    def setUp(self) -> None:
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        self.git("init", "-q")
        self.git("config", "user.email", "validator-test@example.invalid")
        self.git("config", "user.name", "validator test")
        (self.root / "docs/archived").mkdir(parents=True)
        (self.root / "docs/root.md").write_bytes(self.content)
        self.git("add", "docs/root.md")
        self.git("commit", "-q", "-m", "freeze")
        self.frozen_commit = self.git("rev-parse", "HEAD").strip()

    def git(self, *arguments: str) -> str:
        return subprocess.run(
            ["git", "-C", str(self.root), *arguments],
            check=True,
            capture_output=True,
            text=True,
        ).stdout

    def record(self, content: bytes, **overrides: object) -> dict[str, object]:
        value: dict[str, object] = {
            "id": "runtime-shell-1.0",
            "kind": "ROOT",
            "status": "SUPERSEDED",
            "path": "docs/archived/root.md",
            "version": "1.0",
            "sha256": VALIDATOR.sha256_bytes(content),
            "gitBlob": VALIDATOR.git_blob_id(content),
            "gitCommit": self.frozen_commit,
            "approvals": [],
        }
        value.update(overrides)
        return value

    def test_moved_record_is_found_in_its_frozen_commit(self) -> None:
        self.git("mv", "docs/root.md", "docs/archived/root.md")
        self.git("commit", "-q", "-m", "archive")

        VALIDATOR.validate_blueprint(self.root, self.record(self.content))

    def test_moved_record_with_other_bytes_is_rejected(self) -> None:
        other = b"v1.0 blueprint, rewritten\n"
        self.git("mv", "docs/root.md", "docs/archived/root.md")
        (self.root / "docs/archived/root.md").write_bytes(other)

        with self.assertRaisesRegex(
            VALIDATOR.BaselineValidationError, "does not contain locked bytes"
        ):
            VALIDATOR.validate_blueprint(self.root, self.record(other))

    def test_moved_record_must_match_its_lock(self) -> None:
        self.git("mv", "docs/root.md", "docs/archived/root.md")
        (self.root / "docs/archived/root.md").write_bytes(b"v1.0 blueprint, rewritten\n")

        with self.assertRaisesRegex(VALIDATOR.BaselineValidationError, "SHA-256 mismatch"):
            VALIDATOR.validate_blueprint(self.root, self.record(self.content))

    def test_file_never_frozen_under_docs_is_rejected(self) -> None:
        (self.root / "docs/archived/other.md").write_bytes(self.content)

        with self.assertRaisesRegex(VALIDATOR.BaselineValidationError, "Cannot read"):
            VALIDATOR.validate_blueprint(
                self.root, self.record(self.content, path="docs/archived/other.md")
            )

    def test_record_under_docs_is_still_read_at_its_registered_path(self) -> None:
        (self.root / "docs/other.md").write_bytes(self.content)

        with self.assertRaisesRegex(VALIDATOR.BaselineValidationError, "Cannot read"):
            VALIDATOR.validate_blueprint(
                self.root, self.record(self.content, path="docs/other.md")
            )


if __name__ == "__main__":
    unittest.main()