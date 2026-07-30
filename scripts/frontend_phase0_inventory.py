#!/usr/bin/env python3
"""Collect Phase 0 frontend route inventory and architecture gate findings."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


SCHEMA = "io.brix.frontend.phase0/inventory/v1"
ROUTE_GATE = "frontend-route-snapshot"
LAYER_GATE = "frontend-layered-arch"
ALL_GATES = (ROUTE_GATE, LAYER_GATE)
SOURCE_SUFFIXES = (".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs")
IGNORED_DIRS = {".git", "node_modules", "dist", "build", "target", "coverage"}
HOST_PLATFORM_ADMIN_SYMBOLS = {
    "createPlatformAdminPublicRoutes",
    "platformAdminMenus",
    "platformAdminProtectedRoutes",
    "PLATFORM_ADMIN_PERMISSIONS",
    "PLATFORM_ADMIN_ROUTES",
    "PLATFORM_ROLE_CODE",
}
PUBLIC_INTERNAL_EXPORTS = {"./pages", "./hooks", "./repositories"}
L1_LAYER_SEGMENTS = {
    "pages",
    "views",
    "components",
    "hooks",
    "repositories",
    "repository",
}


class InventoryError(RuntimeError):
    """Raised when Phase 0 inventory cannot be collected deterministically."""


@dataclass(frozen=True)
class RouteRecord:
    """One frontend route or route-like declaration discovered from source."""

    source: str
    file: str
    line: int
    owner: str
    route_kind: str
    path: str
    symbol: str
    permission: str | None = None
    page_id: str | None = None


@dataclass(frozen=True)
class Finding:
    """One classified Phase 0 architecture finding."""

    gate: str
    rule_id: str
    category: str
    severity: str
    file: str
    line: int
    symbol: str
    relationship: str
    target_deletion_phase: str


def utc_now() -> str:
    """Return the current UTC instant in stable ISO-8601 form."""

    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def read_text(path: Path) -> str:
    """Read a source file with replacement for malformed legacy bytes."""

    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError as error:
        raise InventoryError(f"Cannot read {path}: {error}") from error


def write_text(path: Path, content: str) -> None:
    """Write a report without following a pre-existing symlink."""

    if path.exists() and path.is_symlink():
        raise InventoryError(f"Refusing to overwrite symlink: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def line_number(text: str, offset: int) -> int:
    """Return a 1-based line number for a character offset."""

    return text.count("\n", 0, max(0, offset)) + 1


def normalize_value(raw: str) -> str:
    """Normalize a small YAML/TS literal value."""

    value = raw.strip().rstrip(",")
    if "  #" in value:
        value = value.split("  #", 1)[0].rstrip()
    if value.startswith(("'", '"')) and value.endswith(("'", '"')):
        return value[1:-1]
    return value


def relative_file(path: Path, enterprise_root: Path, oss_root: Path) -> str:
    """Return a stable repository-qualified relative path."""

    resolved = path.resolve()
    for prefix, root in (("enterprise", enterprise_root), ("oss", oss_root)):
        try:
            return f"{prefix}:{resolved.relative_to(root.resolve()).as_posix()}"
        except ValueError:
            continue
    return resolved.as_posix()


def should_skip(path: Path) -> bool:
    """Return true when a path is generated, vendored, or irrelevant."""

    if any(part in IGNORED_DIRS or part == "__tests__" for part in path.parts):
        return True
    return ".test." in path.name or ".spec." in path.name


def iter_source_files(roots: Iterable[Path]) -> Iterable[Path]:
    """Yield frontend source files from bounded repository roots."""

    for root in roots:
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if path.is_file() and path.suffix in SOURCE_SUFFIXES and not should_skip(path):
                yield path


def iter_ui_manifests(root: Path) -> Iterable[Path]:
    """Yield UI manifest declarations in the enterprise repository."""

    for path in root.rglob("ui-manifest.yaml"):
        if path.is_file() and not should_skip(path):
            yield path


def parse_manifest_routes(path: Path, enterprise_root: Path, oss_root: Path) -> list[RouteRecord]:
    """Extract page and menu route declarations from the current UI manifest shape."""

    records: list[RouteRecord] = []
    plugin_id = path.parent.name
    section: str | None = None
    current: dict[str, str] | None = None
    current_start = 1
    in_web_platform = False
    file_name = relative_file(path, enterprise_root, oss_root)

    def flush_current() -> None:
        nonlocal current
        if not current:
            return
        if section == "pages":
            records.append(
                RouteRecord(
                    source="ui-manifest",
                    file=file_name,
                    line=current_start,
                    owner=plugin_id,
                    route_kind="manifest-page",
                    path=current.get("suggestedPath", ""),
                    symbol=current.get("component", ""),
                    permission=current.get("permission"),
                    page_id=current.get("pageId"),
                )
            )
        elif section == "menus":
            path_value = current.get("path", "")
            if path_value or current.get("pageId"):
                records.append(
                    RouteRecord(
                        source="ui-manifest",
                        file=file_name,
                        line=current_start,
                        owner=plugin_id,
                        route_kind="manifest-menu",
                        path=path_value,
                        symbol=current.get("id", ""),
                        permission=current.get("permission"),
                        page_id=current.get("pageId"),
                )
            )
        current = None

    for index, raw_line in enumerate(read_text(path).splitlines(), start=1):
        if not raw_line.strip() or raw_line.lstrip().startswith("#"):
            continue
        indent = len(raw_line) - len(raw_line.lstrip(" "))
        stripped = raw_line.strip()
        if indent == 0 and stripped.endswith(":"):
            flush_current()
            section = stripped[:-1]
            in_web_platform = False
            continue
        if section == "plugin" and indent == 2 and stripped.startswith("id:"):
            plugin_id = normalize_value(stripped.split(":", 1)[1])
            continue
        page_item = section == "pages" and indent == 2
        menu_item = section == "menus" and indent in {2, 6}
        if (page_item or menu_item) and re.match(r"^- +[A-Za-z0-9_-]+:", stripped):
            flush_current()
            current = {}
            current_start = index
            in_web_platform = False
            key, value = stripped[2:].split(":", 1)
            current[key.strip()] = normalize_value(value)
            continue
        if not current:
            continue
        if section == "pages" and indent == 6 and stripped == "web:":
            in_web_platform = True
            continue
        if section == "pages" and indent <= 4 and stripped.endswith(":"):
            in_web_platform = False
        if ":" not in stripped:
            continue
        key, value = stripped.split(":", 1)
        key = key.strip()
        if section == "pages" and in_web_platform and key == "suggestedPath":
            current[key] = normalize_value(value)
        elif section == "pages" and indent == 4 and key in {"pageId", "component", "permission"}:
            current[key] = normalize_value(value)
        elif section == "menus" and key in {"id", "path", "pageId", "permission"}:
            current[key] = normalize_value(value)
    flush_current()
    return records


def extract_object_routes(text: str, file_name: str) -> list[RouteRecord]:
    """Extract route constants from PLATFORM_ADMIN_ROUTES."""

    records: list[RouteRecord] = []
    match = re.search(
        r"PLATFORM_ADMIN_ROUTES\s*=\s*Object\.freeze\(\{(?P<body>.*?)\}\s+as const\)",
        text,
        re.S,
    )
    if not match:
        return records
    for item in re.finditer(r"(?P<name>[A-Z0-9_]+):\s*['\"](?P<path>/[^'\"]+)['\"]", match.group("body")):
        records.append(
            RouteRecord(
                source="platform-admin-constants",
                file=file_name,
                line=line_number(text, match.start("body") + item.start()),
                owner="platform-admin-web",
                route_kind="platform-admin-route-constant",
                path=item.group("path"),
                symbol=f"PLATFORM_ADMIN_ROUTES.{item.group('name')}",
            )
        )
    return records


def extract_react_routes(text: str, file_name: str) -> list[RouteRecord]:
    """Extract literal React Router path attributes."""

    records: list[RouteRecord] = []
    for match in re.finditer(r"<Route\b[^>]*\bpath=(?:['\"]|{['\"])(?P<path>/[^'\"}]+)", text):
        records.append(
            RouteRecord(
                source="host-route-tree",
                file=file_name,
                line=line_number(text, match.start()),
                owner="host-shell-standalone-web",
                route_kind="react-route",
                path=match.group("path"),
                symbol="<Route path>",
            )
        )
    for match in re.finditer(r"renderDynamicRoutes\((?P<symbol>[A-Za-z0-9_]+)", text):
        records.append(
            RouteRecord(
                source="host-route-tree",
                file=file_name,
                line=line_number(text, match.start()),
                owner="host-shell-standalone-web",
                route_kind="dynamic-route-snapshot-input",
                path="*dynamic*",
                symbol=match.group("symbol"),
            )
        )
    return records


def extract_host_config_routes(text: str, file_name: str) -> list[RouteRecord]:
    """Extract static host route arrays and local plugin manifest declarations."""

    records: list[RouteRecord] = []
    for array_name in ("publicRoutes", "protectedRoutes"):
        match = re.search(rf"{array_name}:\s*\[(?P<body>.*?)\]", text, re.S)
        if not match:
            continue
        for item in re.finditer(r"['\"](?P<path>/[^'\"]+)['\"]", match.group("body")):
            records.append(
                RouteRecord(
                    source="host-config",
                    file=file_name,
                    line=line_number(text, match.start("body") + item.start()),
                    owner="host-shell-standalone-web",
                    route_kind=array_name,
                    path=item.group("path"),
                    symbol=array_name,
                )
            )
    for item in re.finditer(r"manifestUrl:\s*`\$\{baseUrl\}/ui-manifest\.json`", text):
        records.append(
            RouteRecord(
                source="host-config",
                file=file_name,
                line=line_number(text, item.start()),
                owner="host-shell-standalone-web",
                route_kind="local-plugin-manifest-url",
                path="ui-manifest.json",
                symbol="LocalPluginConfig.manifestUrl",
            )
        )
    return records


def finding(
    gate: str,
    rule_id: str,
    category: str,
    file: str,
    line: int,
    symbol: str,
    relationship: str,
    phase: str,
    severity: str = "blocking-after-target-phase",
) -> Finding:
    """Create one finding with a stable default severity."""

    return Finding(
        gate=gate,
        rule_id=rule_id,
        category=category,
        severity=severity,
        file=file,
        line=line,
        symbol=symbol,
        relationship=relationship,
        target_deletion_phase=phase,
    )


def collect_platform_admin_import_findings(text: str, file_name: str) -> list[Finding]:
    """Find Host imports that directly consume platform-admin route/menu symbols."""

    findings: list[Finding] = []
    pattern = re.compile(
        r"import\s*\{(?P<imports>.*?)\}\s*from\s*['\"]@brix-sdk/platform-admin-web['\"]",
        re.S,
    )
    for match in pattern.finditer(text):
        names = []
        for raw_name in match.group("imports").split(","):
            name = raw_name.strip().split(" as ", 1)[0].strip()
            if name.startswith("type "):
                name = name.removeprefix("type ").strip()
            if name in HOST_PLATFORM_ADMIN_SYMBOLS:
                names.append(name)
        for name in names:
            symbol_offset = text.find(name, match.start(), match.end())
            findings.append(
                finding(
                    ROUTE_GATE,
                    "FRS-001",
                    "host-direct-platform-admin-route-menu-import",
                    file_name,
                    line_number(text, symbol_offset),
                    name,
                    "Host imports platform-admin route/menu/role symbol instead of a route snapshot.",
                    "Phase 2",
                )
            )
    return findings


def collect_layer_findings(path: Path, text: str, file_name: str) -> list[Finding]:
    """Find current Page/Hook/Repository/Guard layering violations."""

    findings: list[Finding] = []
    parts = set(path.parts)
    is_l1_scope = "enterprise-solutions" in parts or "platform-admin-web" in parts
    is_l1_layer = is_l1_scope and bool(parts & L1_LAYER_SEGMENTS)
    is_page_like = bool(parts & {"pages", "views", "components"})
    is_hook = "hooks" in parts
    is_repository = bool(parts & {"repositories", "repository"})
    is_guard = "guards" in parts

    if is_l1_scope and is_page_like:
        for match in re.finditer(r"from\s+['\"][^'\"]*/repositories?/[^'\"]*['\"]", text):
            findings.append(
                finding(
                    LAYER_GATE,
                    "FLA-001",
                    "page-direct-repository-import",
                    file_name,
                    line_number(text, match.start()),
                    "repository import",
                    "Page/View/Component imports Repository directly instead of going through Hook/ViewModel.",
                    "Phase 4",
                )
            )
    if is_l1_scope and is_hook:
        for match in re.finditer(
            r"\bfetch\s*\(|from\s+['\"]axios['\"]|require\(['\"]axios['\"]\)|\baxios\.",
            text,
        ):
            findings.append(
                finding(
                    LAYER_GATE,
                    "FLA-002",
                    "hook-direct-transport-or-url",
                    file_name,
                    line_number(text, match.start()),
                    match.group(0),
                    "Hook/ViewModel constructs transport details or calls a transport API.",
                    "Phase 4",
                )
            )
    if is_l1_scope and is_repository:
        for match in re.finditer(r"\bfetch\s*\(|from\s+['\"]axios['\"]|require\(['\"]axios['\"]\)", text):
            findings.append(
                finding(
                    LAYER_GATE,
                    "FLA-003",
                    "repository-direct-fetch-or-axios",
                    file_name,
                    line_number(text, match.start()),
                    match.group(0),
                    "Repository must use injected HttpCapability or generated Query client.",
                    "Phase 4",
                )
            )
    if is_l1_layer:
        for match in re.finditer(r"\bfetch\s*\(|from\s+['\"]axios['\"]|require\(['\"]axios['\"]\)", text):
            findings.append(
                finding(
                    LAYER_GATE,
                    "FLA-004",
                    "l1-direct-fetch-or-axios",
                    file_name,
                    line_number(text, match.start()),
                    match.group(0),
                    "L1 frontend code must not use direct fetch/axios.",
                    "Phase 5",
                )
            )
    if is_l1_scope and is_guard:
        for match in re.finditer(r"\batob\s*\(|JSON\.parse\s*\(|getToken\s*\(", text):
            findings.append(
                finding(
                    LAYER_GATE,
                    "FLA-005",
                    "guard-token-introspection",
                    file_name,
                    line_number(text, match.start()),
                    match.group(0),
                    "Guard parses or reads raw token instead of AuthCapability verified context.",
                    "Phase 3",
                )
            )
    for match in re.finditer(
        r"\bconvertLocalPlugin(?:Menus|Routes)\s*\(|\broutes\?:\s*LocalPluginRoute|\bmenus\?:\s*LocalPluginMenu",
        text,
    ):
        findings.append(
            finding(
                ROUTE_GATE,
                "FRS-002",
                "inline-local-route-menu-fallback",
                file_name,
                line_number(text, match.start()),
                match.group(0),
                "LocalPluginConfig still permits or converts inline routes/menus instead of manifest snapshot inputs.",
                "Phase 5",
            )
        )
    if "runtime-orchestrator-web/src" in file_name:
        for match in re.finditer(r"\bfetch\s*\(", text):
            findings.append(
                finding(
                    ROUTE_GATE,
                    "FRS-003",
                    "unmanaged-manifest-asset-fetch",
                    file_name,
                    line_number(text, match.start()),
                    "fetch(",
                    "Runtime manifest/remote health loading uses browser fetch without the Phase 5 transport bridge.",
                    "Phase 5",
                )
            )
    return findings


def collect_public_export_findings(path: Path, enterprise_root: Path, oss_root: Path) -> list[Finding]:
    """Find package exports that expose internal platform-admin layers."""

    findings: list[Finding] = []
    if path.name != "package.json" or path.parent.name != "platform-admin-web":
        return findings
    text = read_text(path)
    file_name = relative_file(path, enterprise_root, oss_root)
    try:
        document = json.loads(text)
    except json.JSONDecodeError as error:
        raise InventoryError(f"Cannot parse package JSON {path}: {error}") from error
    exports = document.get("exports", {})
    if not isinstance(exports, dict):
        return findings
    for export_name in sorted(PUBLIC_INTERNAL_EXPORTS & set(exports)):
        offset = text.find(f'"{export_name}"')
        findings.append(
            finding(
                LAYER_GATE,
                "FLA-006",
                "platform-admin-public-internal-export",
                file_name,
                line_number(text, offset),
                export_name,
                "platform-admin-web package exports internal Page/Hook/Repository layers.",
                "Phase 4",
            )
        )
    return findings


def collect_inventory(enterprise_root: Path, oss_root: Path) -> dict[str, object]:
    """Collect all Phase 0 route records and classified findings."""

    enterprise_root = enterprise_root.resolve()
    oss_root = oss_root.resolve()
    roots = [
        enterprise_root / "packages/@brix/enterprise-host/host-shell-standalone-web/src",
        enterprise_root / "packages/@brix/enterprise-solutions",
        oss_root / "packages/@brix/platform-commons/packages/client/platform-admin-web",
        oss_root / "packages/@brix/runtime-sdk/runtime-orchestrator-web/src",
    ]
    routes: list[RouteRecord] = []
    findings: list[Finding] = []

    for manifest in iter_ui_manifests(enterprise_root):
        routes.extend(parse_manifest_routes(manifest, enterprise_root, oss_root))

    for source in iter_source_files(roots):
        file_name = relative_file(source, enterprise_root, oss_root)
        text = read_text(source)
        if source.name == "constants.ts" and source.parent.name == "src":
            routes.extend(extract_object_routes(text, file_name))
        if source.name == "routes.config.tsx":
            routes.extend(extract_react_routes(text, file_name))
        if source.name == "host.config.ts":
            routes.extend(extract_host_config_routes(text, file_name))
        if "host-shell-standalone-web/src" in file_name:
            findings.extend(collect_platform_admin_import_findings(text, file_name))
        findings.extend(collect_layer_findings(source, text, file_name))

    package_json = oss_root / "packages/@brix/platform-commons/packages/client/platform-admin-web/package.json"
    findings.extend(collect_public_export_findings(package_json, enterprise_root, oss_root))

    route_dicts = [
        asdict(route)
        for route in sorted(routes, key=lambda item: (item.file, item.line, item.path))
    ]
    finding_dicts = [
        asdict(item)
        for item in sorted(findings, key=lambda item: (item.gate, item.file, item.line, item.rule_id, item.symbol))
    ]
    return {
        "schema": SCHEMA,
        "capturedAt": utc_now(),
        "enterpriseRoot": str(enterprise_root),
        "ossRoot": str(oss_root),
        "governingBaselines": {
            "runtime-shell": "3.0.10",
            "frontend": "1.1",
            "super-admin": "3.0",
            "multi-tenant": "4.0",
        },
        "gateDefinitions": gate_definitions(),
        "routeInventory": route_dicts,
        "findings": finding_dicts,
        "summary": summarize(route_dicts, finding_dicts),
    }


def gate_definitions() -> list[dict[str, object]]:
    """Return the Phase 0 gate definitions."""

    return [
        {
            "id": ROUTE_GATE,
            "authority": [
                "runtime-shell-3.0.10 BRX-RS-UI-001, BRX-RS-UI-017, A-7, A-18",
                "frontend-1.1 BRX-FE-ROUTE-001, BRX-FE-ROUTE-002, BRX-FE-CONTRACT-002, FE-9",
                "frontend alignment plan Phase 0, Phase 2, Phase 5",
            ],
            "scope": [
                "Host route tree and route config",
                "platform-admin route constants/public/protected route declarations",
                "enterprise plugin ui-manifest.yaml pages and menus",
                "local plugin route/menu fallback and unmanaged manifest asset fetch",
            ],
            "phase0PassCondition": "Every finding is inventoried and has a target deletion phase.",
            "enforcementMode": "Use --gate frontend-route-snapshot --fail-on-violations after target phases remove findings.",
        },
        {
            "id": LAYER_GATE,
            "authority": [
                "runtime-shell-3.0.10 BRX-RS-UI-001, A-7, A-18",
                "frontend-1.1 BRX-FE-LAYER-001..004, BRX-FE-UX-001..004, FE-1..FE-4",
                "super-admin-3.0 BRX-SA-UI-001..003",
            ],
            "scope": [
                "Page/View/Component direct Repository import",
                "Hook URL or direct transport usage",
                "Repository direct fetch/axios usage",
                "Guard raw token parsing",
                "platform-admin package public exports for internal layers",
            ],
            "phase0PassCondition": "Every finding is inventoried and has a target deletion phase.",
            "enforcementMode": "Use --gate frontend-layered-arch --fail-on-violations after target phases remove findings.",
        },
    ]


def summarize(routes: list[dict[str, object]], findings: list[dict[str, object]]) -> dict[str, object]:
    """Build a compact deterministic summary."""

    by_gate: dict[str, int] = {gate: 0 for gate in ALL_GATES}
    by_phase: dict[str, int] = {}
    by_category: dict[str, int] = {}
    for item in findings:
        gate = str(item["gate"])
        phase = str(item["target_deletion_phase"])
        category = str(item["category"])
        by_gate[gate] = by_gate.get(gate, 0) + 1
        by_phase[phase] = by_phase.get(phase, 0) + 1
        by_category[category] = by_category.get(category, 0) + 1
    return {
        "routeCount": len(routes),
        "findingCount": len(findings),
        "findingsByGate": by_gate,
        "findingsByTargetDeletionPhase": dict(sorted(by_phase.items())),
        "findingsByCategory": dict(sorted(by_category.items())),
        "unclassifiedFindingCount": sum(
            1 for item in findings if not item.get("target_deletion_phase")
        ),
    }


def markdown_table(headers: list[str], rows: list[list[object]]) -> str:
    """Render a GitHub-flavored Markdown table."""

    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    for row in rows:
        values = [str(value).replace("\n", " ").replace("|", "\\|") for value in row]
        lines.append("| " + " | ".join(values) + " |")
    return "\n".join(lines)


def render_markdown(inventory: dict[str, object]) -> str:
    """Render the inventory as a human-readable Phase 0 evidence document."""

    summary = inventory["summary"]
    assert isinstance(summary, dict)
    routes = inventory["routeInventory"]
    findings = inventory["findings"]
    assert isinstance(routes, list)
    assert isinstance(findings, list)
    route_rows = [
        [
            item["source"],
            item["file"],
            item["line"],
            item["owner"],
            item["route_kind"],
            item["path"],
            item["symbol"],
            item.get("permission") or "",
            item.get("page_id") or "",
        ]
        for item in routes
    ]
    finding_rows = [
        [
            item["gate"],
            item["rule_id"],
            item["category"],
            item["file"],
            item["line"],
            item["symbol"],
            item["target_deletion_phase"],
            item["relationship"],
        ]
        for item in findings
    ]
    gate_rows = [
        [
            item["id"],
            "; ".join(item["authority"]),
            "; ".join(item["scope"]),
            item["phase0PassCondition"],
            item["enforcementMode"],
        ]
        for item in inventory["gateDefinitions"]  # type: ignore[index]
    ]
    return (
        "# Frontend Phase 0 Inventory\n\n"
        f"- Schema: `{inventory['schema']}`\n"
        f"- Captured at: `{inventory['capturedAt']}`\n"
        "- Baselines: runtime-shell 3.0.10, frontend 1.1, super-admin 3.0, multi-tenant 4.0\n"
        f"- Route records: {summary['routeCount']}\n"
        f"- Findings: {summary['findingCount']}\n\n"
        "## Gate Definitions\n\n"
        + markdown_table(
            ["Gate", "Authority", "Scope", "Phase 0 pass condition", "Enforcement mode"],
            gate_rows,
        )
        + "\n\n## Route Inventory\n\n"
        + markdown_table(
            ["Source", "File", "Line", "Owner", "Kind", "Path", "Symbol", "Permission", "Page"],
            route_rows,
        )
        + "\n\n## Findings\n\n"
        + markdown_table(
            ["Gate", "Rule", "Category", "File", "Line", "Symbol", "Target phase", "Relationship"],
            finding_rows,
        )
        + "\n"
    )


def filter_findings(inventory: dict[str, object], gate: str) -> list[dict[str, object]]:
    """Return findings in scope for a gate."""

    findings = inventory["findings"]
    assert isinstance(findings, list)
    if gate == "all":
        return findings
    return [item for item in findings if item.get("gate") == gate]


def parse_args(argv: list[str]) -> argparse.Namespace:
    """Parse CLI arguments."""

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--oss-root", type=Path)
    parser.add_argument("--write-report", type=Path)
    parser.add_argument("--write-json", type=Path)
    parser.add_argument("--gate", choices=("all", *ALL_GATES), default="all")
    parser.add_argument("--fail-on-violations", action="store_true")
    parser.add_argument("--json", action="store_true", help="Print full JSON inventory to stdout.")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    """CLI entry point."""

    args = parse_args(argv)
    enterprise_root = args.repo_root.resolve()
    oss_root = args.oss_root.resolve() if args.oss_root else enterprise_root.parent / "brix"
    inventory = collect_inventory(enterprise_root, oss_root)
    if args.write_json:
        write_text(args.write_json, json.dumps(inventory, ensure_ascii=False, indent=2, sort_keys=True) + "\n")
    if args.write_report:
        write_text(args.write_report, render_markdown(inventory))
    if args.json:
        print(json.dumps(inventory, ensure_ascii=False, indent=2, sort_keys=True))
    else:
        summary = inventory["summary"]
        assert isinstance(summary, dict)
        print(
            "frontend-phase0-inventory: "
            f"routes={summary['routeCount']} "
            f"findings={summary['findingCount']} "
            f"gate={args.gate}"
        )
    scoped_findings = filter_findings(inventory, args.gate)
    unclassified = [item for item in scoped_findings if not item.get("target_deletion_phase")]
    if unclassified:
        print(f"Unclassified findings: {len(unclassified)}", file=sys.stderr)
        return 2
    if args.fail_on_violations and scoped_findings:
        print(f"Blocking findings for {args.gate}: {len(scoped_findings)}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
