#!/usr/bin/env python3
"""Validate Phase 7 frontend federation and release artifact evidence."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable


SCHEMA = "io.brix.frontend.release-artifact-gate/v1"
ARTIFACT_SCHEMA = "io.brix.frontend.release-artifact/v1"
RUNTIME_IDENTITY_SCHEMA = "io.brix.frontend.runtime-identity/v1"
CORE_SHARED = ("react", "react-dom", "react-router-dom")
REQUIRED_SUPPLY_CHAIN = ("sbom", "license", "sca", "signature", "provenance")
METADATA_SUFFIXES = (".json",)
FORBIDDEN_DEPENDENCY_PATTERNS = (
    re.compile(r"\blink:"),
    re.compile(r"\bworkspace:\*"),
    re.compile(r"\bworkspace:"),
    re.compile(r"(?:^|[\"'=:\s])/(?:home|Users|workspace|tmp|var/tmp)/"),
    re.compile(r"[A-Za-z]:\\\\"),
)


class GateError(RuntimeError):
    """Raised when a release gate input cannot be read deterministically."""


@dataclass(frozen=True)
class Finding:
    """One Phase 7 release gate finding."""

    rule_id: str
    severity: str
    file: str
    message: str


def read_text(path: Path) -> str:
    """Read a small artifact text file with stable error reporting."""

    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError as error:
        raise GateError(f"Cannot read {path}: {error}") from error


def load_json(path: Path) -> object:
    """Read JSON with a deterministic error."""

    try:
        return json.loads(read_text(path))
    except json.JSONDecodeError as error:
        raise GateError(f"Cannot parse JSON {path}: {error}") from error


def finding(rule_id: str, file: Path, message: str, severity: str = "blocking") -> Finding:
    """Create a normalized finding."""

    return Finding(rule_id, severity, file.as_posix(), message)


def find_artifact(dist_dir: Path) -> Path:
    """Return the generated Phase 7 artifact manifest path."""

    artifact = dist_dir / "brix-frontend-release-artifact.json"
    if not artifact.is_file():
        raise GateError(f"Release artifact manifest not found: {artifact}")
    return artifact


def require_mapping(value: object, path: str) -> dict[str, object]:
    """Return a JSON object or fail with path context."""

    if not isinstance(value, dict):
        raise GateError(f"{path} must be a JSON object")
    return value


def validate_shared_profile(
    profile_name: str,
    shared: object,
    artifact_file: Path,
) -> list[Finding]:
    """Validate one Module Federation shared profile."""

    findings: list[Finding] = []
    shared_config = require_mapping(shared, f"federation.sharedProfiles.{profile_name}")
    for package_name in CORE_SHARED:
        dependency = shared_config.get(package_name)
        if not isinstance(dependency, dict):
            findings.append(
                finding(
                    "FE7-MF-001",
                    artifact_file,
                    f"{profile_name} shared profile is missing {package_name}.",
                )
            )
            continue
        if dependency.get("singleton") is not True:
            findings.append(
                finding(
                    "FE7-MF-002",
                    artifact_file,
                    f"{profile_name}:{package_name} must set singleton=true.",
                )
            )
        if dependency.get("strictVersion") is not True:
            findings.append(
                finding(
                    "FE7-MF-003",
                    artifact_file,
                    f"{profile_name}:{package_name} must set strictVersion=true.",
                )
            )
        if "eager" in dependency:
            findings.append(
                finding(
                    "FE7-MF-004",
                    artifact_file,
                    f"{profile_name}:{package_name} must not set eager.",
                )
            )
        if profile_name in {"remote", "adapter"} and dependency.get("import") is not False:
            findings.append(
                finding(
                    "FE7-MF-005",
                    artifact_file,
                    f"{profile_name}:{package_name} must set import=false.",
                )
            )
    return findings


def iter_metadata_files(dist_dir: Path) -> Iterable[Path]:
    """Yield bounded metadata artifacts that may carry dependency specifiers."""

    for path in dist_dir.rglob("*"):
        if path.is_file() and path.suffix in METADATA_SUFFIXES:
            yield path


def validate_artifact_manifest(dist_dir: Path, artifact_file: Path) -> list[Finding]:
    """Validate generated federation metadata and required bundle files."""

    document = require_mapping(load_json(artifact_file), "release artifact")
    findings: list[Finding] = []
    if document.get("schema") != ARTIFACT_SCHEMA:
        findings.append(
            finding("FE7-ART-001", artifact_file, f"schema must be {ARTIFACT_SCHEMA}.")
        )

    federation = require_mapping(document.get("federation"), "federation")
    remote_entry = federation.get("filename")
    if not isinstance(remote_entry, str) or not remote_entry:
        findings.append(finding("FE7-ART-002", artifact_file, "federation.filename is required."))
    else:
        remote_entry_file = dist_dir / remote_entry
        if not remote_entry_file.is_file() or remote_entry_file.stat().st_size <= 0:
            findings.append(
                finding("FE7-ART-003", remote_entry_file, "federation remoteEntry file is missing or empty.")
            )

    shared_profiles = require_mapping(federation.get("sharedProfiles"), "federation.sharedProfiles")
    for profile_name in ("host", "remote"):
        findings.extend(
            validate_shared_profile(profile_name, shared_profiles.get(profile_name), artifact_file)
        )

    runtime_identity = require_mapping(document.get("runtimeIdentity"), "runtimeIdentity")
    if runtime_identity.get("schema") != RUNTIME_IDENTITY_SCHEMA:
        findings.append(
            finding("FE7-RID-001", artifact_file, f"runtimeIdentity.schema must be {RUNTIME_IDENTITY_SCHEMA}.")
        )
    if runtime_identity.get("global") != "__BRIX_FRONTEND_RUNTIME_IDENTITY__":
        findings.append(
            finding("FE7-RID-002", artifact_file, "runtimeIdentity.global must be the governed browser global.")
        )

    js_files = [path for path in dist_dir.iterdir() if path.is_file() and path.suffix in {".js", ".mjs"}]
    if not js_files:
        findings.append(finding("FE7-ART-004", dist_dir, "dist must contain at least one JavaScript bundle."))
    elif not any("__BRIX_FRONTEND_RUNTIME_IDENTITY__" in read_text(path) for path in js_files):
        findings.append(
            finding("FE7-RID-003", dist_dir, "built JavaScript bundle does not publish runtime identity evidence.")
        )

    return findings


def validate_no_release_dependency_pollution(dist_dir: Path) -> list[Finding]:
    """Scan emitted artifacts for forbidden release dependency specifiers."""

    findings: list[Finding] = []
    for path in iter_metadata_files(dist_dir):
        text = read_text(path)
        for pattern in FORBIDDEN_DEPENDENCY_PATTERNS:
            if pattern.search(text):
                findings.append(
                    finding(
                        "FE7-DEP-001",
                        path,
                        "release artifact contains link/workspace/local absolute-path dependency metadata.",
                    )
                )
                break
    return findings


def validate_supply_chain_evidence(dist_dir: Path, require_supply_chain: bool) -> list[Finding]:
    """Validate required supply-chain evidence files."""

    findings: list[Finding] = []
    evidence_dir = dist_dir / "release-evidence"
    expected = {
        "sbom": evidence_dir / "sbom.cyclonedx.json",
        "license": evidence_dir / "license-report.json",
        "sca": evidence_dir / "sca-report.json",
        "signature": evidence_dir / "artifact.sig",
        "provenance": evidence_dir / "provenance.intoto.jsonl",
    }
    for evidence_name in REQUIRED_SUPPLY_CHAIN:
        path = expected[evidence_name]
        if not path.is_file() or path.stat().st_size <= 0:
            findings.append(
                finding(
                    "FE7-SC-001",
                    path,
                    f"required supply-chain evidence is missing: {evidence_name}.",
                    "blocking" if require_supply_chain else "missing-blocking",
                )
            )
    return findings


def run_gate(dist_dir: Path, require_supply_chain: bool) -> dict[str, object]:
    """Run the Phase 7 release artifact gate."""

    dist_dir = dist_dir.resolve()
    if not dist_dir.is_dir():
        raise GateError(f"dist directory not found: {dist_dir}")

    artifact_file = find_artifact(dist_dir)
    findings: list[Finding] = []
    findings.extend(validate_artifact_manifest(dist_dir, artifact_file))
    findings.extend(validate_no_release_dependency_pollution(dist_dir))
    findings.extend(validate_supply_chain_evidence(dist_dir, require_supply_chain))

    blocking = [
        item for item in findings
        if item.severity == "blocking" or (require_supply_chain and item.severity == "missing-blocking")
    ]
    return {
        "schema": SCHEMA,
        "distDir": dist_dir.as_posix(),
        "artifact": artifact_file.as_posix(),
        "status": "pass" if not blocking else "fail",
        "findings": [asdict(item) for item in findings],
        "summary": {
            "findings": len(findings),
            "blocking": len(blocking),
            "supplyChainRequired": require_supply_chain,
        },
    }


def parse_args(argv: list[str]) -> argparse.Namespace:
    """Parse CLI arguments."""

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dist",
        type=Path,
        default=Path("packages/@brix/enterprise-host/host-shell-standalone-web/dist"),
        help="Frontend dist directory containing brix-frontend-release-artifact.json.",
    )
    parser.add_argument(
        "--allow-missing-supply-chain",
        action="store_true",
        help="Report missing SBOM/license/SCA/signature/provenance as missing-blocking instead of passing.",
    )
    parser.add_argument("--json", action="store_true", help="Print machine-readable JSON.")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    """CLI entrypoint."""

    args = parse_args(argv)
    try:
        result = run_gate(args.dist, require_supply_chain=not args.allow_missing_supply_chain)
    except GateError as error:
        print(f"frontend-release-artifact-gate: ERROR: {error}", file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        print(
            "frontend-release-artifact-gate: "
            f"{result['status'].upper()} "
            f"findings={result['summary']['findings']} "
            f"blocking={result['summary']['blocking']}"
        )
        for item in result["findings"]:
            print(f"{item['severity']} {item['rule_id']} {item['file']}: {item['message']}")
    return 0 if result["status"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
