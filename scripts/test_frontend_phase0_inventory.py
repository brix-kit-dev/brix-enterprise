"""Tests for the frontend Phase 0 inventory and gate definition script."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory


MODULE_PATH = Path(__file__).with_name("frontend_phase0_inventory.py")
SPEC = importlib.util.spec_from_file_location("frontend_phase0_inventory", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
INVENTORY = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = INVENTORY
SPEC.loader.exec_module(INVENTORY)


class FrontendPhase0InventoryTest(unittest.TestCase):
    def test_manifest_routes_are_extracted(self) -> None:
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            manifest = root / "packages/@brix/enterprise-solutions/app-demo/demo-ui-web/ui-manifest.yaml"
            manifest.parent.mkdir(parents=True)
            manifest.write_text(
                """
plugin:
  id: demo
pages:
  - pageId: demo:list
    component: ./pages/DemoList
    permission: demo:read
    platforms:
      web:
        suggestedPath: /demo
menus:
  - id: demo
    children:
      - id: demo:list
        pageId: demo:list
        permission: demo:read
""".lstrip(),
                encoding="utf-8",
            )

            records = INVENTORY.parse_manifest_routes(manifest, root, root / "oss")

            self.assertEqual(len(records), 2)
            self.assertEqual(records[0].path, "/demo")
            self.assertEqual(records[0].page_id, "demo:list")
            self.assertEqual(records[0].permission, "demo:read")
            self.assertEqual(records[1].page_id, "demo:list")

    def test_host_platform_admin_imports_are_classified_to_phase_2(self) -> None:
        text = """
import {
  platformAdminMenus,
  platformAdminProtectedRoutes,
  type PlatformAdminRouteEntry,
} from '@brix-sdk/platform-admin-web';
""".lstrip()

        findings = INVENTORY.collect_platform_admin_import_findings(text, "enterprise:host.tsx")

        self.assertEqual(
            [item.symbol for item in findings],
            ["platformAdminMenus", "platformAdminProtectedRoutes"],
        )
        self.assertTrue(all(item.gate == INVENTORY.ROUTE_GATE for item in findings))
        self.assertTrue(all(item.target_deletion_phase == "Phase 2" for item in findings))

    def test_layer_findings_are_classified(self) -> None:
        page = Path("packages/@brix/enterprise-solutions/app-demo/demo-ui-web/src/pages/DemoPage.tsx")
        hook = Path("packages/@brix/enterprise-solutions/app-demo/demo-ui-web/src/hooks/useDemo.ts")
        guard = Path("packages/@brix/platform-commons/packages/client/platform-admin-web/src/guards/DemoGuard.tsx")

        findings = []
        findings.extend(
            INVENTORY.collect_layer_findings(
                page,
                "import { createDemoRepository } from '../repositories/DemoRepository';",
                "enterprise:src/pages/DemoPage.tsx",
            )
        )
        findings.extend(
            INVENTORY.collect_layer_findings(
                hook,
                "const response = await fetch('/api/demo');",
                "enterprise:src/hooks/useDemo.ts",
            )
        )
        findings.extend(
            INVENTORY.collect_layer_findings(
                guard,
                "const payload = JSON.parse(atob(token.split('.')[1]));",
                "oss:src/guards/DemoGuard.tsx",
            )
        )

        self.assertEqual(
            {item.rule_id for item in findings},
            {"FLA-001", "FLA-002", "FLA-004", "FLA-005"},
        )
        self.assertTrue(all(item.target_deletion_phase for item in findings))

    def test_public_internal_exports_are_phase_4_findings(self) -> None:
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            package_json = root / "platform-admin-web/package.json"
            package_json.parent.mkdir()
            package_json.write_text(
                '{"exports": {".": "./dist/index.js", "./pages": "./dist/pages.js", "./hooks": "./dist/hooks.js"}}',
                encoding="utf-8",
            )

            findings = INVENTORY.collect_public_export_findings(package_json, root, root)

            self.assertEqual([item.symbol for item in findings], ["./hooks", "./pages"])
            self.assertTrue(all(item.target_deletion_phase == "Phase 4" for item in findings))

    def test_fail_on_violations_is_gate_scoped(self) -> None:
        inventory = {
            "findings": [
                {"gate": INVENTORY.ROUTE_GATE, "target_deletion_phase": "Phase 2"},
                {"gate": INVENTORY.LAYER_GATE, "target_deletion_phase": "Phase 4"},
            ]
        }

        self.assertEqual(len(INVENTORY.filter_findings(inventory, INVENTORY.ROUTE_GATE)), 1)
        self.assertEqual(len(INVENTORY.filter_findings(inventory, "all")), 2)


if __name__ == "__main__":
    unittest.main()
