#!/usr/bin/env python3
"""Validate the Brix architecture context control plane."""

from __future__ import annotations

import argparse
import hashlib
import json
import posixpath
import re
import subprocess
import sys
from collections import Counter
from datetime import date
from pathlib import Path
from typing import Any
from urllib.parse import unquote

from jsonschema import Draft202012Validator, FormatChecker


REQUIRED_APPROVAL_ROLES = {"architecture-committee", "security", "sre"}
IMMUTABLE_FIELDS = ("domain", "kind", "path", "version", "sha256", "gitBlob")
RETIRED_STATUSES = {"SUPERSEDED", "ARCHIVED"}
ARCHIVE_PREFIX = "docs/archived/"
ARCHIVE_INDEX = ARCHIVE_PREFIX + "README.md"
ENTRY_PAGE = "docs/README.md"
ENTRY_PAGE_BLUEPRINTS = "## 当前生效的蓝图"
MARKDOWN_LINK = re.compile(r"\]\(([^)\s]+)\)")
REQUIRED_INSTRUCTION_FILES = ("AGENTS.md", "CLAUDE.md")
REQUIRED_INSTRUCTION_MARKERS = (
    "docs/architecture-baselines.lock.yaml",
    "已读取并校验当前仓库架构基线",
    "ACTIVE",
    "CANDIDATE",
    "内部记忆",
    "停止",
)


class BaselineValidationError(RuntimeError):
    """Raised when a baseline cannot be trusted as declared."""


def sha256_bytes(content: bytes) -> str:
    """Return the lowercase SHA-256 digest for raw content."""
    return hashlib.sha256(content).hexdigest()


def git_blob_id(content: bytes) -> str:
    """Return the Git SHA-1 object ID for raw file content without writing it."""
    header = f"blob {len(content)}\0".encode("ascii")
    return hashlib.sha1(header + content).hexdigest()


def load_json(path: Path) -> Any:
    """Load JSON; the lock uses JSON syntax, which is a YAML 1.2 subset."""
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise BaselineValidationError(f"Cannot parse {path}: {error}") from error


def validate_schema(lock: Any, schema: Any, label: str = "Baseline lock") -> None:
    """Validate lock structure and standard date/date-time formats."""
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    errors = sorted(validator.iter_errors(lock), key=lambda error: list(error.path))
    if errors:
        details = "; ".join(
            f"{'/'.join(map(str, error.path)) or '<root>'}: {error.message}"
            for error in errors
        )
        raise BaselineValidationError(f"{label} schema validation failed: {details}")


def validate_exemptions(
    exemptions_path: Path,
    schema_path: Path,
    today: date,
) -> list[dict[str, Any]]:
    """Validate temporary exemptions (BRX-RS-GOVERNANCE-013); an expired one fails."""
    if not exemptions_path.exists():
        return []
    registry = load_json(exemptions_path)
    validate_schema(registry, load_json(schema_path), "Architecture exemptions")
    exemptions = registry["exemptions"]
    ids = [exemption["id"] for exemption in exemptions]
    if len(ids) != len(set(ids)):
        raise BaselineValidationError("Temporary exemption ids must be unique")
    for exemption in exemptions:
        expires_on = date.fromisoformat(exemption["expiresOn"])
        if expires_on < today:
            raise BaselineValidationError(
                f"Temporary exemption {exemption['id']} expired on {expires_on.isoformat()} "
                "(BRX-RS-GOVERNANCE-013); finish its exit criteria or renew it with a new approval"
            )
    return exemptions


def git_file_bytes(repo_root: Path, commit: str, relative_path: str) -> bytes:
    """Read a file exactly as stored in a Git commit."""
    try:
        return subprocess.run(
            ["git", "-C", str(repo_root), "show", f"{commit}:{relative_path}"],
            check=True,
            capture_output=True,
        ).stdout
    except subprocess.CalledProcessError as error:
        stderr = error.stderr.decode("utf-8", errors="replace").strip()
        raise BaselineValidationError(
            f"Cannot read {relative_path} from commit {commit}: {stderr}"
        ) from error


def validate_document_state(document: str, blueprint: dict[str, Any]) -> None:
    """Ensure human-readable state and version agree with the registry."""
    if blueprint["status"] == "ACTIVE":
        frozen = "Architecture Frozen" in document
        active_ssot = "Active" in document and "当前生效" in document
        if not (frozen or active_ssot):
            raise BaselineValidationError(
                f"ACTIVE blueprint {blueprint['id']} lacks an active/frozen marker"
            )
    elif blueprint["status"] == "CANDIDATE" and "Freeze Candidate" not in document:
        raise BaselineValidationError(
            f"CANDIDATE blueprint {blueprint['id']} lacks Freeze Candidate marker"
        )

    if blueprint["version"] not in document[:2000]:
        raise BaselineValidationError(
            f"Blueprint {blueprint['id']} does not declare version {blueprint['version']}"
        )


def frozen_path(blueprint: dict[str, Any]) -> str:
    """Return where a blueprint's frozen commit holds it.

    A retired blueprint may move into docs/archived after its freeze, so the
    commit recorded at the freeze still holds it directly under docs/.
    """
    path = blueprint["path"]
    if blueprint["status"] in RETIRED_STATUSES and path.startswith(ARCHIVE_PREFIX):
        return "docs/" + path.removeprefix(ARCHIVE_PREFIX)
    return path


def validate_blueprint(
    repo_root: Path,
    blueprint: dict[str, Any],
) -> None:
    """Validate one blueprint's bytes, state, approvals, and Git provenance."""
    document_path = repo_root / blueprint["path"]
    try:
        working_bytes = document_path.read_bytes()
    except OSError as error:
        raise BaselineValidationError(f"Cannot read {document_path}: {error}") from error

    actual_digest = sha256_bytes(working_bytes)
    if actual_digest != blueprint["sha256"]:
        raise BaselineValidationError(
            f"SHA-256 mismatch for {blueprint['path']}: "
            f"lock={blueprint['sha256']} actual={actual_digest}"
        )

    actual_blob = git_blob_id(working_bytes)
    if actual_blob != blueprint["gitBlob"]:
        raise BaselineValidationError(
            f"Git blob mismatch for {blueprint['path']}: "
            f"lock={blueprint['gitBlob']} actual={actual_blob}"
        )

    validate_document_state(working_bytes.decode("utf-8"), blueprint)

    if blueprint["status"] == "ACTIVE" and "/archived/" in blueprint["path"]:
        raise BaselineValidationError(
            f"ACTIVE blueprint {blueprint['id']} cannot live under docs/archived"
        )

    if blueprint["status"] in RETIRED_STATUSES and not blueprint["path"].startswith(
        ARCHIVE_PREFIX
    ):
        raise BaselineValidationError(
            f"Retired blueprint {blueprint['id']} must live under docs/archived"
        )

    if blueprint["kind"] == "ROOT" and blueprint["status"] == "ACTIVE":
        roles = [approval["role"] for approval in blueprint["approvals"]]
        if len(roles) != len(set(roles)) or set(roles) != REQUIRED_APPROVAL_ROLES:
            raise BaselineValidationError(
                "ACTIVE root requires exactly one architecture-committee, security, "
                "and sre approval"
            )

    if blueprint["gitCommit"] is None:
        return

    committed_bytes = git_file_bytes(
        repo_root, blueprint["gitCommit"], frozen_path(blueprint)
    )
    if sha256_bytes(committed_bytes) != blueprint["sha256"]:
        raise BaselineValidationError(
            f"Commit {blueprint['gitCommit']} does not contain locked bytes for "
            f"{blueprint['path']}"
        )


def validate_registry(lock: dict[str, Any]) -> None:
    """Validate uniqueness, active domains, and root inheritance."""
    blueprints = lock["blueprints"]
    for field in ("id", "path"):
        values = [blueprint[field] for blueprint in blueprints]
        if len(values) != len(set(values)):
            raise BaselineValidationError(f"Blueprint {field} values must be unique")

    active = [blueprint for blueprint in blueprints if blueprint["status"] == "ACTIVE"]
    active_roots = [blueprint for blueprint in active if blueprint["kind"] == "ROOT"]
    if len(active_roots) != 1:
        raise BaselineValidationError("Exactly one ACTIVE ROOT blueprint is required")
    active_root = active_roots[0]

    active_domains = {blueprint["domain"] for blueprint in active}
    required_domains = set(lock["requiredActiveDomains"])
    if active_domains != required_domains:
        raise BaselineValidationError(
            f"ACTIVE domains mismatch: required={sorted(required_domains)} "
            f"actual={sorted(active_domains)}"
        )

    for blueprint in active:
        if blueprint["kind"] != "SPECIALIZED":
            continue
        inheritance = blueprint["inherits"]
        if inheritance["id"] != active_root["id"] or (
            inheritance["version"] != active_root["version"]
        ):
            raise BaselineValidationError(
                f"ACTIVE specialized blueprint {blueprint['id']} must inherit "
                f"{active_root['id']} version {active_root['version']}"
            )


def load_lock_from_git(repo_root: Path, revision: str, relative_path: str) -> Any:
    """Load a lock file from a Git revision."""
    try:
        content = git_file_bytes(repo_root, revision, relative_path)
    except BaselineValidationError:
        return None
    try:
        return json.loads(content.decode("utf-8"))
    except json.JSONDecodeError as error:
        raise BaselineValidationError(
            f"Cannot parse baseline lock at {revision}:{relative_path}: {error}"
        ) from error


def is_archive_move(old: dict[str, Any], new: dict[str, Any]) -> bool:
    """Tell whether a record, retired after this change, moves into docs/archived unrenamed."""
    return (
        new["status"] in RETIRED_STATUSES
        and new["path"] == ARCHIVE_PREFIX + Path(old["path"]).name
    )


def validate_transition(previous: Any, current: dict[str, Any]) -> None:
    """Reject in-place mutation and illegal activation across revisions."""
    if not previous or previous.get("schemaVersion") != 2:
        return
    old_by_id = {item["id"]: item for item in previous["blueprints"]}
    new_by_id = {item["id"]: item for item in current["blueprints"]}

    for blueprint_id, old in old_by_id.items():
        new = new_by_id.get(blueprint_id)
        if new is None:
            raise BaselineValidationError(
                f"Blueprint history is append-only; missing record {blueprint_id}"
            )
        changed = [field for field in IMMUTABLE_FIELDS if old[field] != new[field]]
        if changed == ["path"] and is_archive_move(old, new):
            changed = []
        if old["status"] != "CANDIDATE" and changed:
            raise BaselineValidationError(
                f"Frozen blueprint record {blueprint_id} changed immutable fields: "
                f"{changed}; add a new version instead"
            )
        if old["status"] in RETIRED_STATUSES and new["status"] == "ACTIVE":
            raise BaselineValidationError(
                f"Historical record {blueprint_id} cannot be reactivated in place"
            )
        if old["status"] == "CANDIDATE" and new["status"] not in {
            "CANDIDATE",
            "ACTIVE",
            "ARCHIVED",
        }:
            raise BaselineValidationError(
                f"CANDIDATE record {blueprint_id} may only remain CANDIDATE, "
                "become ACTIVE after approval, or become ARCHIVED"
            )
        if old["status"] == "ACTIVE" and new["status"] not in {
            "ACTIVE",
            "SUPERSEDED",
        }:
            raise BaselineValidationError(
                f"ACTIVE record {blueprint_id} may only remain ACTIVE or become SUPERSEDED"
            )


def validate_instructions(repo_root: Path) -> None:
    """Ensure supported AI entry points carry the same control-plane contract."""
    for relative_path in REQUIRED_INSTRUCTION_FILES:
        path = repo_root / relative_path
        try:
            content = path.read_text(encoding="utf-8")
        except OSError as error:
            raise BaselineValidationError(f"Cannot read AI instructions {path}: {error}")
        missing = [marker for marker in REQUIRED_INSTRUCTION_MARKERS if marker not in content]
        if missing:
            raise BaselineValidationError(
                f"AI instructions {relative_path} lack required markers: {missing}"
            )


def read_page(repo_root: Path, relative_path: str) -> str:
    """Read a navigation page or fail clearly."""
    try:
        return (repo_root / relative_path).read_text(encoding="utf-8")
    except OSError as error:
        raise BaselineValidationError(f"Cannot read {relative_path}: {error}") from error


def local_links(page: str, text: str) -> list[str]:
    """Return the repository-relative targets of the local links in a page's text."""
    targets = []
    for target in MARKDOWN_LINK.findall(text):
        if target.startswith(("http://", "https://", "mailto:", "#")):
            continue
        path = unquote(target.partition("#")[0])
        targets.append(posixpath.normpath(posixpath.join(posixpath.dirname(page), path)))
    return targets


def table_rows(page: str, text: str) -> list[tuple[str, list[str]]]:
    """Return each table row that links a file, as its first target and its cells."""
    rows = []
    for line in text.splitlines():
        targets = local_links(page, line)
        if line.startswith("|") and targets:
            cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
            rows.append((targets[0], cells))
    return rows


def validate_links_resolve(repo_root: Path, page: str, links: list[str]) -> None:
    """Reject a navigation page that sends its reader to a missing file."""
    dead = sorted(link for link in links if not (repo_root / link).exists())
    if dead:
        raise BaselineValidationError(f"{page} has dead links: {dead}")


def validate_entry_page(repo_root: Path, lock: dict[str, Any]) -> None:
    """Keep the documentation entry page equal to the ACTIVE records (BRX-RS-AUTH-007)."""
    page = read_page(repo_root, ENTRY_PAGE)
    links = local_links(ENTRY_PAGE, page)
    validate_links_resolve(repo_root, ENTRY_PAGE, links)

    active = {b["path"]: b for b in lock["blueprints"] if b["status"] == "ACTIVE"}
    registered = {b["path"] for b in lock["blueprints"]}
    barred = sorted(
        link
        for link in links
        if link.startswith(ARCHIVE_PREFIX) or (link in registered and link not in active)
    )
    if barred:
        raise BaselineValidationError(
            f"{ENTRY_PAGE} may link only ACTIVE baselines, not {barred} (BRX-RS-AUTH-007)"
        )

    _, heading, rest = page.partition(ENTRY_PAGE_BLUEPRINTS + "\n")
    if not heading:
        raise BaselineValidationError(f"{ENTRY_PAGE} lacks {ENTRY_PAGE_BLUEPRINTS}")
    rows = table_rows(ENTRY_PAGE, rest.partition("\n## ")[0])
    if sorted(path for path, _ in rows) != sorted(active):
        raise BaselineValidationError(
            f"{ENTRY_PAGE} must list each ACTIVE blueprint once: "
            f"listed={sorted(path for path, _ in rows)} active={sorted(active)}"
        )
    for path, cells in rows:
        blueprint = active[path]
        expected = [
            blueprint["version"],
            blueprint["effectiveDate"],
            f"`{blueprint['implementationStatus']}`",
            "是" if blueprint["rebaseRequired"] else "否",
        ]
        if cells[2:] != expected:
            raise BaselineValidationError(
                f"{ENTRY_PAGE} says {cells[2:]} for {blueprint['id']}, the lock says {expected}"
            )


def validate_archive_index(repo_root: Path, lock: dict[str, Any]) -> None:
    """Keep the history index equal to the archive folder and the registry."""
    page = read_page(repo_root, ARCHIVE_INDEX)
    links = local_links(ARCHIVE_INDEX, page)
    validate_links_resolve(repo_root, ARCHIVE_INDEX, links)

    listed = Counter(link for link in links if link.startswith(ARCHIVE_PREFIX))
    stored = {
        ARCHIVE_PREFIX + item.name
        for item in (repo_root / ARCHIVE_PREFIX).iterdir()
        if item.is_file()
    } - {ARCHIVE_INDEX}
    wrong = sorted(path for path in stored if listed[path] != 1)
    if wrong:
        raise BaselineValidationError(
            f"{ARCHIVE_INDEX} must list each archived file once: {wrong}"
        )

    rows = dict(table_rows(ARCHIVE_INDEX, page))
    for blueprint in lock["blueprints"]:
        if not blueprint["path"].startswith(ARCHIVE_PREFIX):
            continue
        cells = rows.get(blueprint["path"])
        if (
            cells is None
            or cells[1] != blueprint["version"]
            or not cells[2].startswith(f"`{blueprint['status']}`")
        ):
            raise BaselineValidationError(
                f"{ARCHIVE_INDEX} row for {blueprint['id']} must state version "
                f"{blueprint['version']} and status `{blueprint['status']}`"
            )


def relative_to_repo(repo_root: Path, path: Path) -> str:
    """Return a POSIX repository-relative path or fail clearly."""
    try:
        return path.resolve().relative_to(repo_root).as_posix()
    except ValueError as error:
        raise BaselineValidationError(
            f"Path {path} must be inside repository {repo_root}"
        ) from error


def parse_args() -> argparse.Namespace:
    """Parse command-line options."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
    )
    parser.add_argument(
        "--lock",
        type=Path,
        default=Path("docs/architecture-baselines.lock.yaml"),
    )
    parser.add_argument(
        "--schema",
        type=Path,
        default=Path("docs/.schemas/architecture-baseline-lock.schema.json"),
    )
    parser.add_argument(
        "--exemptions",
        type=Path,
        default=Path("docs/architecture-exemptions.json"),
    )
    parser.add_argument(
        "--exemptions-schema",
        type=Path,
        default=Path("docs/.schemas/architecture-exemptions.schema.json"),
    )
    parser.add_argument("--require-active", action="store_true")
    parser.add_argument("--check-instructions", action="store_true")
    parser.add_argument("--base-ref")
    return parser.parse_args()


def main() -> int:
    """Validate the configured baseline lock and print a stable verdict."""
    args = parse_args()
    repo_root = args.repo_root.resolve()
    lock_path = args.lock if args.lock.is_absolute() else repo_root / args.lock
    schema_path = args.schema if args.schema.is_absolute() else repo_root / args.schema
    exemptions_path = (
        args.exemptions if args.exemptions.is_absolute() else repo_root / args.exemptions
    )
    exemptions_schema_path = (
        args.exemptions_schema
        if args.exemptions_schema.is_absolute()
        else repo_root / args.exemptions_schema
    )

    try:
        lock = load_json(lock_path)
        schema = load_json(schema_path)
        validate_schema(lock, schema)
        validate_registry(lock)
        for blueprint in lock["blueprints"]:
            validate_blueprint(repo_root, blueprint)
        validate_entry_page(repo_root, lock)
        validate_archive_index(repo_root, lock)
        if args.require_active and any(
            blueprint["status"] == "CANDIDATE" and blueprint["effective"]
            for blueprint in lock["blueprints"]
        ):
            raise BaselineValidationError("CANDIDATE blueprints cannot be effective")
        if args.check_instructions:
            validate_instructions(repo_root)
        if args.base_ref:
            lock_relative_path = relative_to_repo(repo_root, lock_path)
            previous = load_lock_from_git(repo_root, args.base_ref, lock_relative_path)
            validate_transition(previous, lock)
        exemptions = validate_exemptions(exemptions_path, exemptions_schema_path, date.today())
    except BaselineValidationError as error:
        print(f"architecture-baseline: FAIL: {error}", file=sys.stderr)
        return 1

    active = ", ".join(
        f"{blueprint['domain']}={blueprint['version']}"
        for blueprint in lock["blueprints"]
        if blueprint["status"] == "ACTIVE"
    )
    candidates = ", ".join(
        f"{blueprint['domain']}={blueprint['version']}"
        for blueprint in lock["blueprints"]
        if blueprint["status"] == "CANDIDATE"
    ) or "none"
    print(
        f"architecture-baseline: PASS: ACTIVE[{active}] "
        f"CANDIDATE(non-guiding)[{candidates}]"
    )
    active_exemptions = ", ".join(
        f"{exemption['id']} until {exemption['expiresOn']}" for exemption in exemptions
    ) or "none"
    print(f"architecture-exemptions: ACTIVE[{active_exemptions}]")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())