#!/usr/bin/env python3
"""Collect and verify Phase 0 migration and artifact evidence."""

from __future__ import annotations

import argparse
import base64
import binascii
import csv
import hashlib
import json
import re
import subprocess
import sys
import zlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


SCHEMA_FLYWAY = "io.brix.phase0/flyway-history/v1"
SCHEMA_BINDING = "io.brix.phase0/artifact-binding/v1"
SCHEMA_DEPLOYMENT = "io.brix.phase0/deployment/v1"
BINDING_PREDICATE = "https://brix.dev/attestations/artifact-binding/v1"
CI_REPOSITORY = "brix-kit-dev/brix-enterprise"
SIGNER_WORKFLOW = (
    "brix-kit-dev/brix-enterprise/.github/workflows/phase0-supply-chain.yml"
)
EXPECTED_REPOSITORIES = {
    "brix": "brix-kit-dev/brix",
    "brix-enterprise": CI_REPOSITORY,
}
MODULE_TABLES = {
    "platform-tenant": "flyway_schema_history_platform_tenant",
    "app-tenant": "flyway_schema_history_app_tenant",
}
MIGRATION_LOCATIONS = {
    "platform-tenant": (
        "brix",
        "packages/@brix/platform-commons/packages/server/platform-tenant/"
        "src/main/resources/db/migration/platform-tenant",
    ),
    "app-tenant": (
        "brix-enterprise",
        "packages/@brix/enterprise-solutions/app-tenant/tenant-core/"
        "src/main/resources/db/migration/app-tenant",
    ),
}
CSV_COLUMNS = (
    "installed_rank",
    "version",
    "description",
    "type",
    "script",
    "checksum",
    "installed_on_utc",
    "execution_time_ms",
    "success",
)
SAFE_IDENTIFIER = re.compile(r"^[a-z0-9][a-z0-9._-]{0,62}$")
SAFE_SCRIPT = re.compile(r"^V[0-9][0-9A-Za-z_.-]*__[0-9A-Za-z_.-]+\.sql$")
SAFE_DESCRIPTION = re.compile(r"^[0-9A-Za-z][0-9A-Za-z _.-]{0,254}$")
VERSION = re.compile(r"^[0-9]+(?:\.[0-9]+)*$")
SHA256 = re.compile(r"^[0-9a-f]{64}$")


class EvidenceError(RuntimeError):
    """Raised when evidence is incomplete, unsafe, or inconsistent."""


def utc_now() -> str:
    """Return the current UTC instant in ISO-8601 form."""
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def sha256_file(path: Path) -> str:
    """Return the SHA-256 digest of a regular file."""
    if not path.is_file():
        raise EvidenceError(f"Required file does not exist: {path}")
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def write_json(path: Path, value: Any) -> None:
    """Write deterministic UTF-8 JSON without following a pre-existing symlink."""
    if path.exists() and path.is_symlink():
        raise EvidenceError(f"Refusing to overwrite symlink: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def read_json(path: Path) -> Any:
    """Read a JSON document and report a stable validation error."""
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise EvidenceError(f"Cannot read JSON {path}: {error}") from error


def read_object(path: Path) -> dict[str, Any]:
    """Read a JSON object."""
    value = read_json(path)
    if not isinstance(value, dict):
        raise EvidenceError(f"JSON document must be an object: {path}")
    return value


def require_identifier(value: str, label: str) -> str:
    """Validate a non-sensitive, portable evidence identifier."""
    if not SAFE_IDENTIFIER.fullmatch(value):
        raise EvidenceError(
            f"{label} must match {SAFE_IDENTIFIER.pattern}; received {value!r}"
        )
    return value


def parse_utc(value: str) -> str:
    """Validate and normalize an ISO-8601 UTC timestamp."""
    if not value.endswith("Z"):
        raise EvidenceError(f"Flyway installed_on_utc must end in Z: {value!r}")
    try:
        datetime.fromisoformat(value[:-1] + "+00:00")
    except ValueError as error:
        raise EvidenceError(f"Invalid Flyway installed_on_utc: {value!r}") from error
    return value


def parse_bool(value: str) -> bool:
    """Parse PostgreSQL boolean export values."""
    normalized = value.strip().lower()
    if normalized in {"true", "t"}:
        return True
    if normalized in {"false", "f"}:
        return False
    raise EvidenceError(f"Invalid Flyway success value: {value!r}")


def sanitize_flyway(args: argparse.Namespace) -> None:
    """Convert a narrowly selected Flyway CSV export into sanitized JSON."""
    environment = require_identifier(args.environment, "environment")
    module = require_identifier(args.module, "module")
    if module not in MODULE_TABLES:
        raise EvidenceError(f"Unsupported Phase 0 Flyway module: {module}")

    source = Path(args.input).resolve()
    with source.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        if tuple(reader.fieldnames or ()) != CSV_COLUMNS:
            raise EvidenceError(
                "Flyway CSV must contain exactly the approved columns in order: "
                + ", ".join(CSV_COLUMNS)
            )
        entries = []
        ranks: set[int] = set()
        for line_number, row in enumerate(reader, start=2):
            try:
                rank = int(row["installed_rank"])
                execution_time = int(row["execution_time_ms"])
                checksum = int(row["checksum"])
            except (TypeError, ValueError) as error:
                raise EvidenceError(
                    f"Flyway CSV line {line_number} has a non-integer numeric field"
                ) from error
            if rank < 1 or rank in ranks:
                raise EvidenceError(
                    f"Flyway CSV line {line_number} has invalid/duplicate installed_rank"
                )
            ranks.add(rank)
            version = row["version"].strip()
            script = row["script"].strip()
            if not VERSION.fullmatch(version):
                raise EvidenceError(f"Invalid Flyway version at line {line_number}")
            if not SAFE_SCRIPT.fullmatch(script):
                raise EvidenceError(f"Unsafe Flyway script at line {line_number}")
            description = row["description"].strip()
            if not SAFE_DESCRIPTION.fullmatch(description):
                raise EvidenceError(f"Unsafe Flyway description at line {line_number}")
            if row["type"].strip() != "SQL":
                raise EvidenceError(f"Only SQL Flyway entries are accepted at line {line_number}")
            if execution_time < 0:
                raise EvidenceError(f"Negative execution time at line {line_number}")
            entries.append(
                {
                    "checksum": checksum,
                    "description": description,
                    "executionTimeMs": execution_time,
                    "installedOnUtc": parse_utc(row["installed_on_utc"].strip()),
                    "installedRank": rank,
                    "script": script,
                    "success": parse_bool(row["success"]),
                    "type": "SQL",
                    "version": version,
                }
            )
    if not entries:
        raise EvidenceError("Flyway CSV contains no history rows")
    if entries != sorted(entries, key=lambda item: item["installedRank"]):
        raise EvidenceError("Flyway CSV must be ordered by installed_rank")

    output = {
        "schema": SCHEMA_FLYWAY,
        "capturedAt": utc_now(),
        "environment": environment,
        "module": module,
        "historyTable": MODULE_TABLES[module],
        "sourceExportSha256": sha256_file(source),
        "entries": entries,
        "redaction": {
            "excluded": [
                "database host",
                "database name",
                "database user",
                "Flyway installed_by",
                "credentials",
            ],
            "approvedColumns": list(CSV_COLUMNS),
        },
    }
    write_json(Path(args.output), output)


def git(repo: Path, *arguments: str) -> str:
    """Run a read-only Git command."""
    try:
        return subprocess.run(
            ["git", "-C", str(repo), *arguments],
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
    except subprocess.CalledProcessError as error:
        raise EvidenceError(
            f"Git command failed in {repo}: {error.stderr.strip()}"
        ) from error


def parse_named_paths(values: Iterable[str], label: str) -> list[tuple[str, Path]]:
    """Parse repeatable NAME=PATH options."""
    result = []
    names: set[str] = set()
    for value in values:
        if "=" not in value:
            raise EvidenceError(f"{label} must use NAME=PATH: {value!r}")
        name, raw_path = value.split("=", 1)
        require_identifier(name, label)
        if name in names:
            raise EvidenceError(f"Duplicate {label} name: {name}")
        names.add(name)
        result.append((name, Path(raw_path).resolve()))
    return result


def bom_files(repo: Path) -> list[dict[str, Any]]:
    """Hash repository dependency/BOM inputs that exist at the repository root."""
    candidates = ("pom.xml", "package.json", "pnpm-lock.yaml")
    files = []
    for relative in candidates:
        path = repo / relative
        if path.is_file():
            files.append(
                {
                    "path": relative,
                    "sha256": sha256_file(path),
                    "size": path.stat().st_size,
                }
            )
    if not files:
        raise EvidenceError(f"No root BOM/dependency input found in {repo}")
    return files


def repository_record(name: str, repo: Path) -> dict[str, Any]:
    """Capture commit and BOM binding for a clean Git checkout."""
    if git(repo, "status", "--porcelain=v1", "--untracked-files=all"):
        raise EvidenceError(f"Repository must be clean before binding: {repo}")
    commit = git(repo, "rev-parse", "HEAD")
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise EvidenceError(f"Invalid Git commit for {repo}: {commit}")
    remote = git(repo, "remote", "get-url", "origin")
    remote_match = re.search(
        r"github\.com[/:]([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+?)(?:\.git)?$", remote
    )
    if not remote_match:
        raise EvidenceError(f"Origin is not a canonical GitHub repository: {repo}")
    return {
        "name": name,
        "commit": commit,
        "repository": remote_match.group(1),
        "workingTree": "clean",
        "bomInputs": bom_files(repo),
    }


def validate_spdx(path: Path) -> dict[str, str]:
    """Validate the minimum identity fields of an SPDX JSON SBOM."""
    document = read_object(path)
    if not str(document.get("spdxVersion", "")).startswith("SPDX-"):
        raise EvidenceError(f"SBOM is not an SPDX JSON document: {path}")
    namespace = document.get("documentNamespace")
    if not isinstance(namespace, str) or not namespace:
        raise EvidenceError(f"SPDX SBOM lacks documentNamespace: {path}")
    return {"format": document["spdxVersion"], "documentNamespace": namespace}


def file_record(name: str, path: Path) -> dict[str, Any]:
    """Create a named immutable file reference."""
    return {
        "name": require_identifier(name, "evidence name"),
        "file": path.name,
        "sha256": sha256_file(path),
        "size": path.stat().st_size,
    }


def validate_file_record(base: Path, record: dict[str, Any], label: str) -> Path:
    """Resolve and validate a binding-owned evidence file."""
    filename = record.get("file")
    digest = record.get("sha256")
    size = record.get("size")
    if (
        not isinstance(filename, str)
        or Path(filename).name != filename
        or not isinstance(digest, str)
        or not SHA256.fullmatch(digest)
        or not isinstance(size, int)
        or size < 0
    ):
        raise EvidenceError(f"Invalid {label} file record")
    path = base / filename
    if sha256_file(path) != digest or path.stat().st_size != size:
        raise EvidenceError(f"{label} file digest/size mismatch: {path}")
    return path


def decode_statement(bundle_path: Path) -> dict[str, Any]:
    """Decode the in-toto statement carried by a Sigstore bundle."""
    bundle = read_object(bundle_path)
    try:
        encoded = bundle["dsseEnvelope"]["payload"]
        statement = json.loads(base64.b64decode(encoded, validate=True))
    except (KeyError, TypeError, ValueError, binascii.Error, json.JSONDecodeError) as error:
        raise EvidenceError(f"Invalid Sigstore bundle: {bundle_path}") from error
    if not isinstance(statement, dict) or (
        statement.get("_type") != "https://in-toto.io/Statement/v1"
    ):
        raise EvidenceError(f"Bundle does not contain an in-toto v1 statement: {bundle_path}")
    return statement


def require_subject(statement: dict[str, Any], digest: str, bundle_path: Path) -> None:
    """Require an attestation subject to bind the artifact SHA-256."""
    subjects = statement.get("subject")
    if not isinstance(subjects, list) or not any(
        isinstance(subject, dict)
        and isinstance(subject.get("digest"), dict)
        and subject["digest"].get("sha256") == digest
        for subject in subjects
    ):
        raise EvidenceError(
            f"Attestation subject does not bind artifact sha256 {digest}: {bundle_path}"
        )


def create_binding(args: argparse.Namespace) -> None:
    """Bind an artifact to SBOM, signed attestations, commits, and BOM inputs."""
    if args.ci_repository != CI_REPOSITORY:
        raise EvidenceError(f"Unexpected CI repository: {args.ci_repository}")
    if args.workflow_ref != SIGNER_WORKFLOW:
        raise EvidenceError(f"Unexpected signer workflow: {args.workflow_ref}")
    if not args.run_id.isdecimal() or int(args.run_id) < 1:
        raise EvidenceError("CI run ID must be a positive integer")
    if not args.run_attempt.isdecimal() or int(args.run_attempt) < 1:
        raise EvidenceError("CI run attempt must be a positive integer")

    artifact = Path(args.artifact).resolve()
    sbom = Path(args.sbom).resolve()
    artifact_digest = sha256_file(artifact)
    sbom_identity = validate_spdx(sbom)
    attestations = []
    predicate_types: set[str] = set()
    for name, path in parse_named_paths(args.attestation, "attestation"):
        statement = decode_statement(path)
        require_subject(statement, artifact_digest, path)
        predicate_type = statement.get("predicateType")
        if not isinstance(predicate_type, str):
            raise EvidenceError(f"Attestation lacks predicateType: {path}")
        predicate_types.add(predicate_type)
        record = file_record(name, path)
        record["predicateType"] = predicate_type
        attestations.append(record)
    required_predicates = {
        "https://slsa.dev/provenance/v1",
        "https://spdx.dev/Document/v2.3",
    }
    if not required_predicates.issubset(predicate_types):
        raise EvidenceError(
            "Both SLSA v1 provenance and SPDX 2.3 SBOM attestations are required"
        )

    verifications = []
    verified_predicates: set[str] = set()
    for name, path in parse_named_paths(args.verification, "verification"):
        output = read_json(path)
        if not isinstance(output, list) or not output:
            raise EvidenceError(f"gh verification output is empty: {path}")
        for item in output:
            try:
                result = item["verificationResult"]
                statement = result["statement"]
                certificate = result["signature"]["certificate"]
                timestamps = result["verifiedTimestamps"]
            except (KeyError, TypeError) as error:
                raise EvidenceError(f"Invalid gh verification output: {path}") from error
            if not isinstance(certificate, dict) or not certificate:
                raise EvidenceError(f"gh output lacks a verified certificate: {path}")
            if not isinstance(timestamps, list) or not timestamps:
                raise EvidenceError(f"gh output lacks a verified timestamp: {path}")
            require_subject(statement, artifact_digest, path)
            predicate_type = statement.get("predicateType")
            if not isinstance(predicate_type, str):
                raise EvidenceError(f"gh output lacks predicateType: {path}")
            verified_predicates.add(predicate_type)
        verifications.append(file_record(name, path))
    if not required_predicates.issubset(verified_predicates):
        raise EvidenceError(
            "Fresh gh verification outputs are required for both required predicates"
        )

    repositories = [
        repository_record(name, path)
        for name, path in parse_named_paths(args.repository, "repository")
    ]
    if {item["name"] for item in repositories} != {"brix", "brix-enterprise"}:
        raise EvidenceError("Bindings require exactly the brix and brix-enterprise repositories")
    for item in repositories:
        if item["repository"] != EXPECTED_REPOSITORIES[item["name"]]:
            raise EvidenceError(
                f"Repository identity mismatch for {item['name']}: {item['repository']}"
            )

    output = {
        "schema": SCHEMA_BINDING,
        "createdAt": utc_now(),
        "artifact": {
            "file": artifact.name,
            "sha256": artifact_digest,
            "size": artifact.stat().st_size,
        },
        "sbom": {
            "file": sbom.name,
            "sha256": sha256_file(sbom),
            "size": sbom.stat().st_size,
            **sbom_identity,
        },
        "attestations": attestations,
        "verificationOutputs": verifications,
        "repositories": repositories,
        "ci": {
            "repository": args.ci_repository,
            "workflowRef": args.workflow_ref,
            "runId": args.run_id,
            "runAttempt": args.run_attempt,
        },
    }
    write_json(Path(args.output), output)


def run_gh_verification(
    artifact: Path,
    bundle: Path,
    predicate_type: str,
    repository: str,
    signer_workflow: str,
    source_digest: str,
) -> None:
    """Cryptographically verify a bundle with the GitHub trusted root."""
    command = [
        "gh",
        "attestation",
        "verify",
        str(artifact),
        "--repo",
        repository,
        "--bundle",
        str(bundle),
        "--predicate-type",
        predicate_type,
        "--source-digest",
        source_digest,
        "--signer-workflow",
        signer_workflow,
        "--deny-self-hosted-runners",
        "--format",
        "json",
    ]
    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        output = json.loads(result.stdout)
    except FileNotFoundError as error:
        raise EvidenceError("GitHub CLI is required for cryptographic verification") from error
    except subprocess.CalledProcessError as error:
        raise EvidenceError(
            f"Cryptographic attestation verification failed: {error.stderr.strip()}"
        ) from error
    except json.JSONDecodeError as error:
        raise EvidenceError("GitHub CLI returned invalid verification JSON") from error
    if not isinstance(output, list) or not output:
        raise EvidenceError("GitHub CLI returned no verified attestations")


def validate_binding(binding_path: Path, binding_attestation_path: Path) -> tuple[dict[str, Any], Path]:
    """Validate every file reference and the signed binding predicate."""
    binding = read_object(binding_path)
    if binding.get("schema") != SCHEMA_BINDING:
        raise EvidenceError(f"Unsupported artifact binding: {binding_path}")
    base = binding_path.parent
    artifact = validate_file_record(base, binding.get("artifact", {}), "artifact")
    artifact_digest = binding["artifact"]["sha256"]
    sbom_path = validate_file_record(base, binding.get("sbom", {}), "SBOM")
    validate_spdx(sbom_path)

    predicate_types: set[str] = set()
    attestation_paths: list[tuple[str, Path]] = []
    for record in binding.get("attestations", []):
        path = validate_file_record(base, record, "attestation")
        statement = decode_statement(path)
        require_subject(statement, artifact_digest, path)
        predicate_type = statement.get("predicateType")
        if predicate_type != record.get("predicateType"):
            raise EvidenceError(f"Attestation predicate mismatch: {path}")
        predicate_types.add(predicate_type)
        attestation_paths.append((predicate_type, path))
    required_predicates = {
        "https://slsa.dev/provenance/v1",
        "https://spdx.dev/Document/v2.3",
    }
    if not required_predicates.issubset(predicate_types):
        raise EvidenceError("Artifact binding lacks required signed predicates")
    for record in binding.get("verificationOutputs", []):
        validate_file_record(base, record, "verification output")

    repositories = binding.get("repositories")
    if not isinstance(repositories, list) or {
        item.get("name") for item in repositories if isinstance(item, dict)
    } != {"brix", "brix-enterprise"}:
        raise EvidenceError("Artifact binding has incomplete repository identities")
    commits: dict[str, str] = {}
    for repository_record_value in repositories:
        commit = repository_record_value.get("commit")
        if not isinstance(commit, str) or not re.fullmatch(r"[0-9a-f]{40}", commit):
            raise EvidenceError("Artifact binding contains an invalid repository commit")
        if repository_record_value.get("workingTree") != "clean":
            raise EvidenceError("Artifact binding was not produced from a clean checkout")
        bom_inputs = repository_record_value.get("bomInputs")
        if not isinstance(bom_inputs, list) or not bom_inputs:
            raise EvidenceError("Artifact binding lacks BOM input digests")
        for bom in bom_inputs:
            if (
                not isinstance(bom, dict)
                or not isinstance(bom.get("sha256"), str)
                or not SHA256.fullmatch(bom["sha256"])
            ):
                raise EvidenceError("Artifact binding contains an invalid BOM digest")
        commits[repository_record_value["name"]] = commit

    binding_statement = decode_statement(binding_attestation_path)
    require_subject(binding_statement, artifact_digest, binding_attestation_path)
    if binding_statement.get("predicateType") != BINDING_PREDICATE:
        raise EvidenceError("Binding attestation has the wrong predicate type")
    if binding_statement.get("predicate") != binding:
        raise EvidenceError("Signed binding predicate differs from artifact-binding.json")

    ci = binding.get("ci", {})
    if ci.get("repository") != CI_REPOSITORY:
        raise EvidenceError("Artifact binding has an unexpected CI repository")
    signer_workflow = ci.get("workflowRef")
    if signer_workflow != SIGNER_WORKFLOW:
        raise EvidenceError("Artifact binding lacks signer workflow identity")
    for predicate_type, bundle_path in [
        *attestation_paths,
        (BINDING_PREDICATE, binding_attestation_path),
    ]:
        run_gh_verification(
            artifact,
            bundle_path,
            predicate_type,
            ci["repository"],
            signer_workflow,
            commits["brix-enterprise"],
        )
    return binding, artifact


def validate_source_repositories(
    binding: dict[str, Any], values: Iterable[str]
) -> tuple[list[dict[str, Any]], dict[str, Path]]:
    """Require clean source checkouts to match every repository bound by CI."""
    parsed = parse_named_paths(values, "repository")
    current = [repository_record(name, path) for name, path in parsed]
    paths = {name: path for name, path in parsed}
    current_by_name = {item["name"]: item for item in current}
    bound_by_name = {
        item["name"]: item
        for item in binding.get("repositories", [])
        if isinstance(item, dict) and isinstance(item.get("name"), str)
    }
    required = {"brix", "brix-enterprise"}
    if set(current_by_name) != required or set(bound_by_name) != required:
        raise EvidenceError(
            "Verification requires exactly the bound brix and brix-enterprise repositories"
        )
    for name in sorted(required):
        for field in ("repository", "commit", "bomInputs"):
            if current_by_name[name][field] != bound_by_name[name].get(field):
                raise EvidenceError(
                    f"Source repository {name} does not match bound {field}"
                )
    return current, paths


def record_deployment(args: argparse.Namespace) -> None:
    """Bind bytes copied from a target deployment to a build evidence record."""
    environment = require_identifier(args.environment, "environment")
    binding_path = Path(args.binding).resolve()
    binding = read_object(binding_path)
    if binding.get("schema") != SCHEMA_BINDING:
        raise EvidenceError(f"Unsupported artifact binding: {binding_path}")
    bound_digest = binding.get("artifact", {}).get("sha256")
    if not isinstance(bound_digest, str) or not SHA256.fullmatch(bound_digest):
        raise EvidenceError(f"Artifact binding has no valid SHA-256: {binding_path}")
    deployed = Path(args.deployed_artifact).resolve()
    digest = sha256_file(deployed)
    if digest != bound_digest:
        raise EvidenceError(
            f"Deployed artifact digest {digest} does not match bound artifact "
            f"{bound_digest}"
        )
    capture_method = require_identifier(args.capture_method, "capture method")
    output = {
        "schema": SCHEMA_DEPLOYMENT,
        "capturedAt": utc_now(),
        "environment": environment,
        "artifact": {
            "file": deployed.name,
            "sha256": digest,
            "size": deployed.stat().st_size,
        },
        "binding": {
            "file": binding_path.name,
            "sha256": sha256_file(binding_path),
        },
        "captureMethod": capture_method,
    }
    write_json(Path(args.output), output)


def source_migrations(module: str, directory: Path) -> list[dict[str, Any]]:
    """Inventory immutable migration source files for one module."""
    if module not in MODULE_TABLES:
        raise EvidenceError(f"Unsupported Phase 0 migration module: {module}")
    if not directory.is_dir():
        raise EvidenceError(f"Migration source directory does not exist: {directory}")
    entries = []
    versioned_paths = []
    for path in directory.glob("V*__*.sql"):
        name = path.name
        if not SAFE_SCRIPT.fullmatch(name):
            raise EvidenceError(f"Unsafe migration source filename: {name}")
        version = name.split("__", 1)[0][1:]
        if not VERSION.fullmatch(version):
            raise EvidenceError(f"Invalid migration source version: {name}")
        versioned_paths.append(
            (tuple(int(component) for component in version.split(".")), version, path)
        )
    versioned_paths.sort(key=lambda item: item[0])
    versions: set[str] = set()
    for _sort_key, version, path in versioned_paths:
        name = path.name
        if version in versions:
            raise EvidenceError(f"Duplicate migration source version: {version}")
        versions.add(version)
        entries.append(
            {
                "version": version,
                "script": name,
                "flywayChecksum": flyway_checksum(path),
                "sha256": sha256_file(path),
                "size": path.stat().st_size,
            }
        )
    if not entries:
        raise EvidenceError(f"No migrations found in {directory}")
    return entries


def authoritative_migration_paths(
    values: Iterable[str], repository_paths: dict[str, Path]
) -> dict[str, Path]:
    """Resolve only migration directories owned by the bound source checkouts."""
    provided = dict(parse_named_paths(values, "migration source"))
    if set(provided) != set(MODULE_TABLES):
        raise EvidenceError("Both platform-tenant and app-tenant migration sources are required")
    for module, (repository_name, relative_path) in MIGRATION_LOCATIONS.items():
        expected = (repository_paths[repository_name] / relative_path).resolve()
        if provided[module] != expected:
            raise EvidenceError(
                f"Migration source {module} must be the authoritative path in "
                f"the bound {repository_name} checkout"
            )
    return provided


def flyway_checksum(path: Path) -> int:
    """Calculate Flyway 11's signed CRC-32 over UTF-8 lines without line endings."""
    try:
        content = path.read_text(encoding="utf-8")
    except UnicodeDecodeError as error:
        raise EvidenceError(f"Migration is not valid UTF-8: {path}") from error
    checksum = 0
    for line in re.split(r"\r\n|\r|\n", content):
        checksum = zlib.crc32(line.removeprefix("\ufeff").encode("utf-8"), checksum)
    return checksum if checksum < 2**31 else checksum - 2**32


def verify_history(
    history: dict[str, Any],
    history_path: Path,
    environment: str,
    module: str,
    sources: list[dict[str, Any]],
) -> dict[str, Any]:
    """Verify one environment/module ledger and classify applied source migrations."""
    if history.get("schema") != SCHEMA_FLYWAY:
        raise EvidenceError(f"Unsupported Flyway evidence: {history_path}")
    if history.get("environment") != environment or history.get("module") != module:
        raise EvidenceError(f"Flyway evidence identity mismatch: {history_path}")
    if history.get("historyTable") != MODULE_TABLES[module]:
        raise EvidenceError(f"Flyway history table mismatch: {history_path}")
    entries = history.get("entries")
    if not isinstance(entries, list) or not entries:
        raise EvidenceError(f"Flyway evidence has no history rows: {history_path}")
    installed_ranks = [
        entry.get("installedRank") for entry in entries if isinstance(entry, dict)
    ]
    if (
        len(installed_ranks) != len(entries)
        or installed_ranks != list(range(1, len(entries) + 1))
    ):
        raise EvidenceError(
            f"Flyway installed ranks are not contiguous: {history_path}"
        )
    source_by_identity = {
        (entry["version"], entry["script"]): entry for entry in sources
    }
    if len(source_by_identity) != len(sources):
        raise EvidenceError(f"Migration source contains duplicate identity: {module}")
    applied_order: list[tuple[str, str]] = []
    for entry in entries:
        if not isinstance(entry, dict) or entry.get("success") is not True:
            raise EvidenceError(f"Flyway history contains a failed/invalid row: {history_path}")
        identity = (entry.get("version"), entry.get("script"))
        source = source_by_identity.get(identity)
        if source is None:
            raise EvidenceError(
                f"Flyway history references migration absent from source: "
                f"{identity!r} in {history_path}"
            )
        if entry.get("checksum") != source["flywayChecksum"]:
            raise EvidenceError(
                f"Flyway checksum differs from source for {identity!r}: {history_path}"
            )
        if identity in applied_order:
            raise EvidenceError(
                f"Flyway history contains duplicate migration {identity!r}: {history_path}"
            )
        applied_order.append(identity)
    expected_order = [
        (entry["version"], entry["script"])
        for entry in sources[: len(applied_order)]
    ]
    if applied_order != expected_order:
        raise EvidenceError(
            f"Flyway migrations are not a monotonic source prefix: {history_path}"
        )
    applied = set(applied_order)
    return {
        "applied": [
            entry
            for entry in sources
            if (entry["version"], entry["script"]) in applied
        ],
        "notApplied": [
            entry
            for entry in sources
            if (entry["version"], entry["script"]) not in applied
        ],
    }


def verify(args: argparse.Namespace) -> None:
    """Fail closed unless all requested Phase 0 evidence is complete and consistent."""
    binding_path = Path(args.binding).resolve()
    binding_attestation_path = Path(args.binding_attestation).resolve()
    binding, _artifact = validate_binding(binding_path, binding_attestation_path)
    artifact_digest = binding.get("artifact", {}).get("sha256")
    if not isinstance(artifact_digest, str) or not SHA256.fullmatch(artifact_digest):
        raise EvidenceError("Artifact binding has no valid SHA-256")
    repositories, repository_paths = validate_source_repositories(
        binding, args.repository
    )

    migration_paths = authoritative_migration_paths(
        args.migration_source, repository_paths
    )
    migration_sources = {
        module: source_migrations(module, path)
        for module, path in migration_paths.items()
    }

    root = Path(args.evidence_root).resolve()
    checked = []
    environment_migrations: dict[str, Any] = {}
    if len(args.environment) != len(set(args.environment)):
        raise EvidenceError("Target environments must be unique")
    for raw_environment in args.environment:
        environment = require_identifier(raw_environment, "environment")
        for module in MODULE_TABLES:
            history_path = root / "flyway" / environment / f"{module}.json"
            history = read_object(history_path)
            environment_migrations.setdefault(environment, {})[module] = verify_history(
                history,
                history_path,
                environment,
                module,
                migration_sources[module],
            )

        deployment_path = root / "deployments" / f"{environment}.json"
        deployment = read_object(deployment_path)
        if deployment.get("schema") != SCHEMA_DEPLOYMENT:
            raise EvidenceError(f"Unsupported deployment evidence: {deployment_path}")
        if deployment.get("environment") != environment:
            raise EvidenceError(f"Deployment evidence identity mismatch: {deployment_path}")
        if deployment.get("artifact", {}).get("sha256") != artifact_digest:
            raise EvidenceError(f"Deployment artifact mismatch: {deployment_path}")
        if deployment.get("binding", {}).get("sha256") != sha256_file(binding_path):
            raise EvidenceError(f"Deployment binding digest mismatch: {deployment_path}")
        checked.append(environment)

    result = {
        "status": "PASS",
        "schema": "io.brix.phase0/verification-result/v1",
        "verifiedAt": utc_now(),
        "artifactSha256": artifact_digest,
        "bindingSha256": sha256_file(binding_path),
        "bindingAttestationSha256": sha256_file(binding_attestation_path),
        "repositories": repositories,
        "environments": checked,
        "environmentMigrations": environment_migrations,
        "migrationSources": migration_sources,
    }
    if args.output:
        write_json(Path(args.output), result)
    print(
        "phase0-evidence: PASS: "
        f"environments={','.join(checked)} artifact=sha256:{artifact_digest}"
    )


def parser() -> argparse.ArgumentParser:
    """Build the command-line parser."""
    root = argparse.ArgumentParser(description=__doc__)
    commands = root.add_subparsers(dest="command", required=True)

    flyway = commands.add_parser("sanitize-flyway")
    flyway.add_argument("--environment", required=True)
    flyway.add_argument("--module", required=True, choices=sorted(MODULE_TABLES))
    flyway.add_argument("--input", required=True)
    flyway.add_argument("--output", required=True)
    flyway.set_defaults(handler=sanitize_flyway)

    binding = commands.add_parser("create-binding")
    binding.add_argument("--artifact", required=True)
    binding.add_argument("--sbom", required=True)
    binding.add_argument("--attestation", action="append", required=True)
    binding.add_argument("--verification", action="append", required=True)
    binding.add_argument("--repository", action="append", required=True)
    binding.add_argument("--ci-repository", required=True)
    binding.add_argument("--workflow-ref", required=True)
    binding.add_argument("--run-id", required=True)
    binding.add_argument("--run-attempt", required=True)
    binding.add_argument("--output", required=True)
    binding.set_defaults(handler=create_binding)

    deployment = commands.add_parser("record-deployment")
    deployment.add_argument("--environment", required=True)
    deployment.add_argument("--binding", required=True)
    deployment.add_argument("--deployed-artifact", required=True)
    deployment.add_argument("--capture-method", required=True)
    deployment.add_argument("--output", required=True)
    deployment.set_defaults(handler=record_deployment)

    verification = commands.add_parser("verify")
    verification.add_argument("--evidence-root", required=True)
    verification.add_argument("--binding", required=True)
    verification.add_argument("--binding-attestation", required=True)
    verification.add_argument("--repository", action="append", required=True)
    verification.add_argument("--environment", action="append", required=True)
    verification.add_argument("--migration-source", action="append", required=True)
    verification.add_argument("--output")
    verification.set_defaults(handler=verify)
    return root


def main() -> int:
    """Execute the requested evidence operation."""
    try:
        args = parser().parse_args()
        args.handler(args)
        return 0
    except (EvidenceError, OSError) as error:
        print(f"phase0-evidence: FAIL: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
