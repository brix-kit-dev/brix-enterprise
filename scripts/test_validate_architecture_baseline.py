"""Tests for the architecture baseline freeze validator."""

from __future__ import annotations

import contextlib
import importlib.util
import io
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock


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
        content = b"v1.0 Architecture Frozen\n"
        (self.root / "docs/other.md").write_bytes(content)

        with self.assertRaisesRegex(VALIDATOR.BaselineValidationError, "Cannot read"):
            VALIDATOR.validate_blueprint(
                self.root,
                self.record(content, status="ACTIVE", kind="SPECIALIZED", path="docs/other.md"),
            )


class RetiredBlueprintLocationTest(unittest.TestCase):
    """A retired blueprint leaves docs/ in the change that retires it."""

    content = b"v1.0 blueprint (Freeze Candidate)\n"

    def setUp(self) -> None:
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        (self.root / "docs/archived").mkdir(parents=True)
        (self.root / "docs/root.md").write_bytes(self.content)
        (self.root / "docs/archived/root.md").write_bytes(self.content)

    def record(self, status: str, path: str) -> dict[str, object]:
        return {
            "id": "runtime-shell-1.0",
            "kind": "SPECIALIZED",
            "status": status,
            "path": path,
            "version": "1.0",
            "sha256": VALIDATOR.sha256_bytes(self.content),
            "gitBlob": VALIDATOR.git_blob_id(self.content),
            "gitCommit": None,
            "approvals": [],
        }

    def test_retired_blueprint_outside_the_archive_is_rejected(self) -> None:
        for status in ("SUPERSEDED", "ARCHIVED"):
            with self.assertRaisesRegex(
                VALIDATOR.BaselineValidationError, "must live under docs/archived"
            ):
                VALIDATOR.validate_blueprint(self.root, self.record(status, "docs/root.md"))

    def test_retired_blueprint_in_the_archive_passes(self) -> None:
        for status in ("SUPERSEDED", "ARCHIVED"):
            VALIDATOR.validate_blueprint(self.root, self.record(status, "docs/archived/root.md"))

    def test_candidate_may_stay_under_docs(self) -> None:
        VALIDATOR.validate_blueprint(self.root, self.record("CANDIDATE", "docs/root.md"))


ENTRY_PAGE = """# Entry

The [registry](lock.yaml), [the site](https://example.invalid/old.md), [a heading](#top).
History stays in `docs/archived/`.

## 当前生效的蓝图

| 领域 | 蓝图 | 版本 | 生效日期 | 实施状态 | 待重基线 |
|---|---|---|---|---|---|
| Root | [root](root.md) | 1.1 | 2026-01-02 | `pending` | 否 |
| Frontend | [frontend](frontend%20v2.md) | 2.0 | 2026-01-03 | `not-assessed` | 是 |

Prose in the section.

## Plans

| Plan | State |
|---|---|
| [plan](plan.md) | running |
"""


class EntryPageTest(unittest.TestCase):
    """docs/README.md equals the ACTIVE records and links nothing retired."""

    def setUp(self) -> None:
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        (self.root / "docs/archived").mkdir(parents=True)
        for name in (
            "lock.yaml",
            "root.md",
            "frontend v2.md",
            "plan.md",
            "next.md",
            "archived/old.md",
            "archived/notes.md",
        ):
            (self.root / "docs" / name).write_text("x", encoding="utf-8")
        self.lock = {
            "blueprints": [
                {
                    "id": "root-1.1",
                    "status": "ACTIVE",
                    "path": "docs/root.md",
                    "version": "1.1",
                    "effectiveDate": "2026-01-02",
                    "implementationStatus": "pending",
                    "rebaseRequired": False,
                },
                {
                    "id": "frontend-2.0",
                    "status": "ACTIVE",
                    "path": "docs/frontend v2.md",
                    "version": "2.0",
                    "effectiveDate": "2026-01-03",
                    "implementationStatus": "not-assessed",
                    "rebaseRequired": True,
                },
                {"id": "root-1.0", "status": "SUPERSEDED", "path": "docs/archived/old.md"},
                {"id": "root-1.2", "status": "CANDIDATE", "path": "docs/next.md"},
            ]
        }
        self.write(ENTRY_PAGE)

    def write(self, text: str) -> None:
        (self.root / "docs/README.md").write_text(text, encoding="utf-8")

    def edit(self, old: str, new: str) -> None:
        self.assertIn(old, ENTRY_PAGE)
        self.write(ENTRY_PAGE.replace(old, new))

    def assert_rejected(self, message: str) -> None:
        with self.assertRaisesRegex(VALIDATOR.BaselineValidationError, message):
            VALIDATOR.validate_entry_page(self.root, self.lock)

    def test_page_equal_to_the_lock_passes(self) -> None:
        VALIDATOR.validate_entry_page(self.root, self.lock)

    def test_a_link_with_an_anchor_resolves(self) -> None:
        self.edit("[plan](plan.md)", "[plan](plan.md#state)")
        VALIDATOR.validate_entry_page(self.root, self.lock)

    def test_missing_page_is_rejected(self) -> None:
        (self.root / "docs/README.md").unlink()
        self.assert_rejected("Cannot read docs/README.md")

    def test_missing_section_is_rejected(self) -> None:
        self.edit("## 当前生效的蓝图", "## Blueprints")
        self.assert_rejected("lacks")

    def test_missing_row_is_rejected(self) -> None:
        self.edit("| Root | [root](root.md) | 1.1 | 2026-01-02 | `pending` | 否 |\n", "")
        self.assert_rejected("each ACTIVE blueprint once")

    def test_repeated_row_is_rejected(self) -> None:
        row = "| Root | [root](root.md) | 1.1 | 2026-01-02 | `pending` | 否 |\n"
        self.edit(row, row + row)
        self.assert_rejected("each ACTIVE blueprint once")

    def test_row_for_a_file_that_is_not_active_is_rejected(self) -> None:
        self.edit("Prose in the section.", "| Extra | [plan](plan.md) | 1 | 2 | 3 | 4 |")
        self.assert_rejected("each ACTIVE blueprint once")

    def test_wrong_version_is_rejected(self) -> None:
        self.edit("| 1.1 |", "| 1.0 |")
        self.assert_rejected("the lock says")

    def test_wrong_effective_date_is_rejected(self) -> None:
        self.edit("| 2026-01-02 |", "| 2026-01-01 |")
        self.assert_rejected("the lock says")

    def test_wrong_implementation_status_is_rejected(self) -> None:
        self.edit("`pending`", "`accepted`")
        self.assert_rejected("the lock says")

    def test_wrong_rebase_flag_is_rejected(self) -> None:
        self.edit("`not-assessed` | 是 |", "`not-assessed` | 否 |")
        self.assert_rejected("the lock says")

    def test_link_to_a_retired_blueprint_is_rejected(self) -> None:
        self.edit("Prose in the section.", "See [old](archived/old.md).")
        self.assert_rejected("BRX-RS-AUTH-007")

    def test_link_to_a_candidate_is_rejected(self) -> None:
        self.edit("Prose in the section.", "See [next](next.md).")
        self.assert_rejected("BRX-RS-AUTH-007")

    def test_link_into_the_archive_is_rejected(self) -> None:
        self.edit("Prose in the section.", "See [notes](archived/notes.md).")
        self.assert_rejected("BRX-RS-AUTH-007")

    def test_dead_link_is_rejected(self) -> None:
        self.edit("[plan](plan.md)", "[plan](gone.md)")
        self.assert_rejected("dead links")


ARCHIVE_INDEX = """# Index

Back to the [entry](../README.md).

| Domain | Version | Status | File |
|---|---|---|---|
| Root | 1.0 | `SUPERSEDED` | [old.md](old.md) |
| Root | 1.0.1 | `ARCHIVED`, never approved | [old candidate.md](old%20candidate.md) |

| File | Note |
|---|---|
| [prompt.txt](prompt.txt) | a prompt |
"""


class ArchiveIndexTest(unittest.TestCase):
    """docs/archived/README.md lists the folder and agrees with the registry."""

    def setUp(self) -> None:
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        (self.root / "docs/archived").mkdir(parents=True)
        (self.root / "docs/README.md").write_text("x", encoding="utf-8")
        for name in ("old.md", "old candidate.md", "prompt.txt"):
            (self.root / "docs/archived" / name).write_text("x", encoding="utf-8")
        self.lock = {
            "blueprints": [
                {
                    "id": "root-1.0",
                    "status": "SUPERSEDED",
                    "path": "docs/archived/old.md",
                    "version": "1.0",
                },
                {
                    "id": "root-1.0.1",
                    "status": "ARCHIVED",
                    "path": "docs/archived/old candidate.md",
                    "version": "1.0.1",
                },
                {"id": "root-1.1", "status": "ACTIVE", "path": "docs/root.md", "version": "1.1"},
            ]
        }
        self.write(ARCHIVE_INDEX)

    def write(self, text: str) -> None:
        (self.root / "docs/archived/README.md").write_text(text, encoding="utf-8")

    def edit(self, old: str, new: str) -> None:
        self.assertIn(old, ARCHIVE_INDEX)
        self.write(ARCHIVE_INDEX.replace(old, new))

    def assert_rejected(self, message: str) -> None:
        with self.assertRaisesRegex(VALIDATOR.BaselineValidationError, message):
            VALIDATOR.validate_archive_index(self.root, self.lock)

    def test_index_equal_to_the_folder_passes(self) -> None:
        VALIDATOR.validate_archive_index(self.root, self.lock)

    def test_missing_index_is_rejected(self) -> None:
        (self.root / "docs/archived/README.md").unlink()
        self.assert_rejected("Cannot read docs/archived/README.md")

    def test_unlisted_file_is_rejected(self) -> None:
        (self.root / "docs/archived/new.md").write_text("x", encoding="utf-8")
        self.assert_rejected("each archived file once")

    def test_file_listed_twice_is_rejected(self) -> None:
        row = "| [prompt.txt](prompt.txt) | a prompt |\n"
        self.edit(row, row + row)
        self.assert_rejected("each archived file once")

    def test_row_for_a_missing_file_is_rejected(self) -> None:
        (self.root / "docs/archived/prompt.txt").unlink()
        self.assert_rejected("dead links")

    def test_dead_link_out_of_the_folder_is_rejected(self) -> None:
        (self.root / "docs/README.md").unlink()
        self.assert_rejected("dead links")

    def test_wrong_version_of_a_registered_record_is_rejected(self) -> None:
        self.edit("| Root | 1.0 |", "| Root | 0.9 |")
        self.assert_rejected("must state version")

    def test_wrong_status_of_a_registered_record_is_rejected(self) -> None:
        self.edit("`SUPERSEDED`", "`ARCHIVED`")
        self.assert_rejected("must state version")

    def test_registered_record_outside_a_table_is_rejected(self) -> None:
        self.write(
            ARCHIVE_INDEX.replace("| Root | 1.0 | `SUPERSEDED` | [old.md](old.md) |\n", "")
            + "\nSee [old.md](old.md).\n"
        )
        self.assert_rejected("must state version")


class ChangelogTest(unittest.TestCase):
    """Each ACTIVE blueprint has an entry stating its locked SHA-256."""

    root_hash = "a" * 64
    special_hash = "b" * 64

    def setUp(self) -> None:
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        (self.root / "docs").mkdir()
        self.lock = {
            "blueprints": [
                {
                    "id": "runtime-shell-3.3.0",
                    "kind": "ROOT",
                    "status": "ACTIVE",
                    "sha256": self.root_hash,
                },
                {
                    "id": "frontend-1.2.1",
                    "kind": "SPECIALIZED",
                    "status": "ACTIVE",
                    "sha256": self.special_hash,
                },
                {
                    "id": "runtime-shell-3.2.0",
                    "kind": "ROOT",
                    "status": "SUPERSEDED",
                    "sha256": "c" * 64,
                },
                {
                    "id": "frontend-1.3",
                    "kind": "SPECIALIZED",
                    "status": "CANDIDATE",
                    "sha256": "d" * 64,
                },
            ]
        }
        self.write(self.root_hash, self.special_hash)

    def write(self, runtime: str, specialized: str) -> None:
        (self.root / "docs/CHANGELOG-runtime-shell.md").write_text(runtime, encoding="utf-8")
        (self.root / "docs/CHANGELOG-architecture-specialized.md").write_text(
            specialized, encoding="utf-8"
        )

    def assert_rejected(self, message: str) -> None:
        with self.assertRaisesRegex(VALIDATOR.BaselineValidationError, message):
            VALIDATOR.validate_changelogs(self.root, self.lock)

    def test_active_records_with_entries_pass(self) -> None:
        VALIDATOR.validate_changelogs(self.root, self.lock)

    def test_retired_and_candidate_records_need_no_entry(self) -> None:
        VALIDATOR.validate_changelogs(self.root, self.lock)
        self.lock["blueprints"][2]["status"] = "ACTIVE"
        self.assert_rejected("runtime-shell-3.2.0")

    def test_active_root_without_an_entry_is_rejected(self) -> None:
        self.write("nothing here", self.special_hash)
        self.assert_rejected("runtime-shell-3.3.0")

    def test_active_specialized_without_an_entry_is_rejected(self) -> None:
        self.write(self.root_hash, "nothing here")
        self.assert_rejected("frontend-1.2.1")

    def test_an_entry_in_the_other_changelog_does_not_count(self) -> None:
        self.write(self.special_hash, self.root_hash)
        self.assert_rejected("runtime-shell-3.3.0")

    def test_a_partial_hash_does_not_count(self) -> None:
        self.write(self.root_hash[:63], self.special_hash)
        self.assert_rejected("runtime-shell-3.3.0")

    def test_every_missing_record_is_named(self) -> None:
        self.write("nothing here", "nothing here")
        with self.assertRaises(VALIDATOR.BaselineValidationError) as caught:
            VALIDATOR.validate_changelogs(self.root, self.lock)
        self.assertIn("runtime-shell-3.3.0", str(caught.exception))
        self.assertIn("frontend-1.2.1", str(caught.exception))

    def test_missing_changelog_is_rejected(self) -> None:
        (self.root / "docs/CHANGELOG-runtime-shell.md").unlink()
        self.assert_rejected("Cannot read docs/CHANGELOG-runtime-shell.md")


class LineEndingProtectionTest(unittest.TestCase):
    """Git must not convert the line endings of a hash-locked blueprint."""

    paths = ("docs/root.md", "docs/archived/old（退役）.md", "docs/archived/old candidate.md")

    def setUp(self) -> None:
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        subprocess.run(["git", "-C", str(self.root), "init", "-q"], check=True)
        self.lock = {"blueprints": [{"path": path} for path in self.paths]}

    def attributes(self, text: str) -> None:
        (self.root / ".gitattributes").write_text(text, encoding="utf-8")

    def assert_rejected(self, message: str) -> None:
        with self.assertRaisesRegex(VALIDATOR.BaselineValidationError, message):
            VALIDATOR.validate_line_endings_protected(self.root, self.lock)

    def test_protected_paths_pass(self) -> None:
        self.attributes("docs/*.md -text\ndocs/archived/** -text\n")
        VALIDATOR.validate_line_endings_protected(self.root, self.lock)

    def test_no_attributes_are_rejected(self) -> None:
        self.assert_rejected("line endings")

    def test_a_path_left_out_is_rejected(self) -> None:
        self.attributes("docs/archived/** -text\n")
        self.assert_rejected("docs/root.md")

    def test_the_rejection_names_only_what_is_left_out(self) -> None:
        self.attributes("docs/*.md -text\n")
        with self.assertRaises(VALIDATOR.BaselineValidationError) as caught:
            VALIDATOR.validate_line_endings_protected(self.root, self.lock)
        self.assertNotIn("docs/root.md", str(caught.exception))
        self.assertIn("old candidate.md", str(caught.exception))

    def test_text_auto_is_rejected(self) -> None:
        self.attributes("docs/*.md text=auto\ndocs/archived/** -text\n")
        self.assert_rejected("docs/root.md")

    def test_text_set_is_rejected(self) -> None:
        self.attributes("docs/*.md text\ndocs/archived/** -text\n")
        self.assert_rejected("docs/root.md")

    def test_a_directory_that_is_no_repository_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as outside:
            with self.assertRaisesRegex(
                VALIDATOR.BaselineValidationError, "Cannot read Git attributes"
            ):
                VALIDATOR.validate_line_endings_protected(Path(outside), self.lock)


class MainRunsThePageChecksTest(unittest.TestCase):
    """A check that main does not call protects nothing."""

    def assert_main_runs(self, check: str) -> None:
        marker = f"{check} ran"
        stderr = io.StringIO()
        with (
            mock.patch.object(
                VALIDATOR, check, side_effect=VALIDATOR.BaselineValidationError(marker)
            ),
            mock.patch.object(
                sys, "argv", ["validator", "--repo-root", str(MODULE_PATH.parents[1])]
            ),
            contextlib.redirect_stderr(stderr),
        ):
            result = VALIDATOR.main()
        self.assertEqual(result, 1)
        self.assertIn(marker, stderr.getvalue())

    def test_main_checks_the_entry_page(self) -> None:
        self.assert_main_runs("validate_entry_page")

    def test_main_checks_the_archive_index(self) -> None:
        self.assert_main_runs("validate_archive_index")

    def test_main_checks_the_changelogs(self) -> None:
        self.assert_main_runs("validate_changelogs")

    def test_main_checks_the_line_ending_protection(self) -> None:
        self.assert_main_runs("validate_line_endings_protected")


if __name__ == "__main__":
    unittest.main()