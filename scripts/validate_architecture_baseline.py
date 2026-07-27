#!/usr/bin/env python3
"""Validate Brix root architecture baseline integrity and approval state."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker


REQUIRED_APPROVAL_ROLES = {"architecture-committee", "security", "sre"}
FROZEN_TITLE = "架构设计蓝图（Architecture Frozen）"
FROZEN_HEADER = "**架构状态**：Architecture Frozen"
CANDIDATE_TITLE = "架构设计蓝图（Freeze Candidate）"
CANDIDATE_HEADER = "**架构状态**：Freeze Candidate"


class BaselineValidationError(RuntimeError):
    """Raised when a baseline cannot be trusted as declared."""


def sha256_bytes(content: bytes) -> str:
    """Return the lowercase SHA-256 digest for raw content."""
    return hashlib.sha256(content).hexdigest()


def load_json(path: Path) -> Any:
    """Load JSON; the lock uses JSON syntax, which is a YAML 1.2 subset."""
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise BaselineValidationError(f"Cannot parse {path}: {error}") from error


def validate_schema(lock: Any, schema: Any) -> None:
    """Validate lock structure and standard date/date-time formats."""
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    errors = sorted(validator.iter_errors(lock), key=lambda error: list(error.path))
    if errors:
        details = "; ".join(
            f"{'/'.join(map(str, error.path)) or '<root>'}: {error.message}"
            for error in errors
        )
        raise BaselineValidationError(f"Baseline lock schema validation failed: {details}")


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


def validate_document_state(document: str, frozen: bool) -> None:
    """Ensure human-readable and machine-readable states cannot diverge."""
    expected = (FROZEN_TITLE, FROZEN_HEADER) if frozen else (
        CANDIDATE_TITLE,
        CANDIDATE_HEADER,
    )
    missing = [marker for marker in expected if marker not in document]
    if missing:
        raise BaselineValidationError(
            f"Blueprint state markers do not match lock state; missing: {missing}"
        )

    metadata_status = (
        "status: architecture-frozen" if frozen else "status: freeze-candidate"
    )
    metadata_effective = "effective: true" if frozen else "effective: false"
    for marker in (metadata_status, metadata_effective):
        if marker not in document:
            raise BaselineValidationError(
                f"Blueprint machine metadata does not match lock state: {marker}"
            )


def validate_baseline(
    repo_root: Path,
    baseline: dict[str, Any],
    require_frozen: bool,
) -> None:
    """Validate one baseline's bytes, state, approvals, and Git provenance."""
    document_path = repo_root / baseline["path"]
    try:
        working_bytes = document_path.read_bytes()
    except OSError as error:
        raise BaselineValidationError(f"Cannot read {document_path}: {error}") from error

    actual_digest = sha256_bytes(working_bytes)
    if actual_digest != baseline["sha256"]:
        raise BaselineValidationError(
            f"SHA-256 mismatch for {baseline['path']}: "
            f"lock={baseline['sha256']} actual={actual_digest}"
        )

    frozen = baseline["status"] == "architecture-frozen"
    validate_document_state(working_bytes.decode("utf-8"), frozen)

    if require_frozen and not frozen:
        raise BaselineValidationError(
            f"Baseline {baseline['id']} is pending approval, not Architecture Frozen"
        )

    if not frozen:
        return

    roles = [approval["role"] for approval in baseline["approvals"]]
    if len(roles) != len(set(roles)) or set(roles) != REQUIRED_APPROVAL_ROLES:
        raise BaselineValidationError(
            "Frozen baseline requires exactly one architecture-committee, security, "
            "and sre approval"
        )

    committed_bytes = git_file_bytes(
        repo_root, baseline["gitCommit"], baseline["path"]
    )
    committed_digest = sha256_bytes(committed_bytes)
    if committed_digest != baseline["sha256"]:
        raise BaselineValidationError(
            f"Commit {baseline['gitCommit']} does not contain the locked blueprint bytes"
        )


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
    parser.add_argument("--require-frozen", action="store_true")
    return parser.parse_args()


def main() -> int:
    """Validate the configured baseline lock and print a stable verdict."""
    args = parse_args()
    repo_root = args.repo_root.resolve()
    lock_path = args.lock if args.lock.is_absolute() else repo_root / args.lock
    schema_path = args.schema if args.schema.is_absolute() else repo_root / args.schema

    try:
        lock = load_json(lock_path)
        schema = load_json(schema_path)
        validate_schema(lock, schema)
        for baseline in lock["baselines"]:
            validate_baseline(repo_root, baseline, args.require_frozen)
    except BaselineValidationError as error:
        print(f"architecture-baseline: FAIL: {error}", file=sys.stderr)
        return 1

    states = ", ".join(
        f"{baseline['id']}={baseline['status']}" for baseline in lock["baselines"]
    )
    print(f"architecture-baseline: PASS: {states}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())