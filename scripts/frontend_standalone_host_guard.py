#!/usr/bin/env python3
"""Validate the standalone web Host boundary."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Iterable


FORBIDDEN_PATH_SEGMENTS = {
    "services",
    "governance",
    "domain",
    "repositories",
    "pages",
    "hooks",
}

FORBIDDEN_FILE_NAMES = {
    "capabilities.ts",
    "capabilities.tsx",
}

FORBIDDEN_TEXT = {
    "fetch(",
    "axios",
    "jwt",
    "getToken",
    "refreshToken",
    "tenant cache",
    "pluginId",
    "platformAdminMenus",
    "platformAdminProtectedRoutes",
    "PLATFORM_ROLE_CODE",
    "PLATFORM_ADMIN_PERMISSIONS",
    "@brix-sdk/platform-auth-web",
    "@brix-sdk/platform-tenant-web",
    "@brix-sdk/infra-adapter-http-web",
    "@brix-sdk/infra-adapter-ui-",
    "host-shell-standalone-web/src",
}

ALLOWED_SOURCE_SUFFIXES = {".ts", ".tsx", ".css"}
PHASE3_COMPOSITION_PLATFORM_ADMIN_IMPORT = "@brix-sdk/platform-admin-web"


def is_phase3_composition_snapshot_file(path: Path, src: Path) -> bool:
    relative = path.relative_to(src)
    return relative.parts[:1] == ("composition",) and path.name.endswith("-route-snapshot.ts")


def iter_files(root: Path) -> Iterable[Path]:
    for path in sorted(root.rglob("*")):
        if "node_modules" in path.parts or "dist" in path.parts:
            continue
        if path.is_file():
            yield path


def add_violation(violations: list[dict[str, str]], code: str, path: Path, message: str) -> None:
    violations.append({
        "code": code,
        "path": str(path),
        "message": message,
    })


def validate_host(host: Path) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    src = host / "src"
    if not src.is_dir():
        add_violation(violations, "frontend-host.src-missing", src, "src directory is required.")
        return violations

    for path in iter_files(src):
        relative_parts = path.relative_to(src).parts
        for part in relative_parts[:-1]:
            if part in FORBIDDEN_PATH_SEGMENTS:
                add_violation(
                    violations,
                    "frontend-host.forbidden-directory",
                    path,
                    f"src/{part}/ is not allowed in the Host.",
                )

        if path.name in FORBIDDEN_FILE_NAMES:
            add_violation(
                violations,
                "frontend-host.forbidden-file",
                path,
                f"{path.name} is not allowed in the Host.",
            )

        if path.suffix not in ALLOWED_SOURCE_SUFFIXES:
            continue

        text = path.read_text(encoding="utf-8")
        if (
            PHASE3_COMPOSITION_PLATFORM_ADMIN_IMPORT in text
            and not is_phase3_composition_snapshot_file(path, src)
        ):
            add_violation(
                violations,
                "frontend-host.forbidden-text",
                path,
                (
                    "Forbidden Host token found: "
                    f"{PHASE3_COMPOSITION_PLATFORM_ADMIN_IMPORT}"
                ),
            )
        for token in sorted(FORBIDDEN_TEXT):
            if token in text:
                add_violation(
                    violations,
                    "frontend-host.forbidden-text",
                    path,
                    f"Forbidden Host token found: {token}",
                )

    package_json = host / "package.json"
    if package_json.is_file():
        package_data = json.loads(package_json.read_text(encoding="utf-8"))
        dependencies = {
            **package_data.get("dependencies", {}),
            **package_data.get("devDependencies", {}),
        }
        for dependency in dependencies:
            if dependency.startswith("@brix-sdk/platform-") or dependency.startswith("@brix-sdk/infra-adapter-"):
                if dependency not in {
                    "@brix-sdk/runtime-orchestrator-web",
                    "@brix-sdk/runtime-sdk-api-web",
                    "@brix-sdk/runtime-sdk-react",
                    "@brix-sdk/platform-admin-web",
                    "@brix-sdk/shared-runtime-web",
                }:
                    add_violation(
                        violations,
                        "frontend-host.forbidden-dependency",
                        package_json,
                        f"Host must not depend on provider package {dependency}.",
                    )
    else:
        add_violation(violations, "frontend-host.package-missing", package_json, "package.json is required.")

    return violations


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", required=True)
    args = parser.parse_args()

    host = Path(args.host).resolve()

    violations = validate_host(host)

    if violations:
        print(json.dumps({"violations": violations}, indent=2, ensure_ascii=False))
        return 1

    print(json.dumps({"violations": []}, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
