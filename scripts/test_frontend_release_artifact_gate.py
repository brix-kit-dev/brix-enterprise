"""Tests for Phase 7 frontend release artifact gate."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory


MODULE_PATH = Path(__file__).with_name("frontend_release_artifact_gate.py")
SPEC = importlib.util.spec_from_file_location("frontend_release_artifact_gate", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
GATE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = GATE
SPEC.loader.exec_module(GATE)


def shared(singleton: bool = True, strict: bool = True, import_false: bool | None = None) -> dict[str, object]:
    """Create a minimal shared dependency config."""

    document: dict[str, object] = {
        "singleton": singleton,
        "strictVersion": strict,
        "requiredVersion": "^18.2.0",
    }
    if import_false is not None:
        document["import"] = import_false
    return document


def write_valid_dist(root: Path, include_supply_chain: bool = True) -> Path:
    """Create a minimal valid frontend dist tree."""

    dist = root / "dist"
    dist.mkdir()
    (dist / "remoteEntry.js").write_text("window.remoteEntry = true;", encoding="utf-8")
    (dist / "main.js").write_text(
        "window.__BRIX_FRONTEND_RUNTIME_IDENTITY__ = {};",
        encoding="utf-8",
    )
    (dist / "index.html").write_text('<script src="/main.js"></script>', encoding="utf-8")
    (dist / "brix-frontend-release-artifact.json").write_text(
        """
{
  "schema": "io.brix.frontend.release-artifact/v1",
  "host": {
    "id": "host-shell-standalone-web",
    "kind": "standalone-web",
    "profile": "standalone-web"
  },
  "federation": {
    "name": "brix_standalone_host",
    "filename": "remoteEntry.js",
    "shareScope": "default",
    "sharedProfiles": {
      "host": {
        "react": {"singleton": true, "strictVersion": true, "requiredVersion": "^18.2.0"},
        "react-dom": {"singleton": true, "strictVersion": true, "requiredVersion": "^18.2.0"},
        "react-router-dom": {"singleton": true, "strictVersion": true, "requiredVersion": "^6.22.0"}
      },
      "remote": {
        "react": {"singleton": true, "strictVersion": true, "requiredVersion": "^18.2.0", "import": false},
        "react-dom": {"singleton": true, "strictVersion": true, "requiredVersion": "^18.2.0", "import": false},
        "react-router-dom": {"singleton": true, "strictVersion": true, "requiredVersion": "^6.22.0", "import": false}
      }
    }
  },
  "runtimeIdentity": {
    "schema": "io.brix.frontend.runtime-identity/v1",
    "global": "__BRIX_FRONTEND_RUNTIME_IDENTITY__"
  },
  "supplyChainEvidence": {
    "required": ["sbom", "license", "sca", "signature", "provenance"]
  }
}
""".strip(),
        encoding="utf-8",
    )
    if include_supply_chain:
        evidence = dist / "release-evidence"
        evidence.mkdir()
        for name in (
            "sbom.cyclonedx.json",
            "license-report.json",
            "sca-report.json",
            "artifact.sig",
            "provenance.intoto.jsonl",
        ):
            (evidence / name).write_text("{}", encoding="utf-8")
    return dist


class FrontendReleaseArtifactGateTest(unittest.TestCase):
    def test_valid_dist_passes_release_gate(self) -> None:
        with TemporaryDirectory() as tmp:
            dist = write_valid_dist(Path(tmp))

            result = GATE.run_gate(dist, require_supply_chain=True)

            self.assertEqual(result["status"], "pass")
            self.assertEqual(result["summary"]["blocking"], 0)

    def test_eager_shared_dependency_fails(self) -> None:
        with TemporaryDirectory() as tmp:
            dist = write_valid_dist(Path(tmp))
            artifact = dist / "brix-frontend-release-artifact.json"
            document = GATE.load_json(artifact)
            document["federation"]["sharedProfiles"]["host"]["react"]["eager"] = True
            artifact.write_text(GATE.json.dumps(document), encoding="utf-8")

            result = GATE.run_gate(dist, require_supply_chain=True)

            self.assertEqual(result["status"], "fail")
            self.assertIn(
                "FE7-MF-004",
                [item["rule_id"] for item in result["findings"]],
            )

    def test_remote_missing_import_false_fails(self) -> None:
        with TemporaryDirectory() as tmp:
            dist = write_valid_dist(Path(tmp))
            artifact = dist / "brix-frontend-release-artifact.json"
            document = GATE.load_json(artifact)
            del document["federation"]["sharedProfiles"]["remote"]["react"]["import"]
            artifact.write_text(GATE.json.dumps(document), encoding="utf-8")

            result = GATE.run_gate(dist, require_supply_chain=True)

            self.assertEqual(result["status"], "fail")
            self.assertIn(
                "FE7-MF-005",
                [item["rule_id"] for item in result["findings"]],
            )

    def test_dependency_pollution_fails(self) -> None:
        with TemporaryDirectory() as tmp:
            dist = write_valid_dist(Path(tmp))
            (dist / "package.json").write_text(
                '{"dependencies": {"@brix-sdk/shared-runtime-web": "workspace:*"}}',
                encoding="utf-8",
            )

            result = GATE.run_gate(dist, require_supply_chain=True)

            self.assertEqual(result["status"], "fail")
            self.assertIn(
                "FE7-DEP-001",
                [item["rule_id"] for item in result["findings"]],
            )

    def test_missing_supply_chain_evidence_is_blocking_when_required(self) -> None:
        with TemporaryDirectory() as tmp:
            dist = write_valid_dist(Path(tmp), include_supply_chain=False)

            result = GATE.run_gate(dist, require_supply_chain=True)

            self.assertEqual(result["status"], "fail")
            self.assertEqual(result["summary"]["blocking"], 5)

    def test_missing_supply_chain_can_be_reported_for_scoped_local_evidence(self) -> None:
        with TemporaryDirectory() as tmp:
            dist = write_valid_dist(Path(tmp), include_supply_chain=False)

            result = GATE.run_gate(dist, require_supply_chain=False)

            self.assertEqual(result["status"], "pass")
            self.assertEqual(
                {item["severity"] for item in result["findings"]},
                {"missing-blocking"},
            )


if __name__ == "__main__":
    unittest.main()
