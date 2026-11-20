"""Tests for the frontend type-error baseline check (standard-link plan queue item 19, 19h, D165)."""

from __future__ import annotations

import contextlib
import importlib.util
import io
import json
import os
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import mock


MODULE_PATH = Path(__file__).with_name("frontend_typecheck_baseline.py")
SPEC = importlib.util.spec_from_file_location("frontend_typecheck_baseline", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
BASELINE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = BASELINE
SPEC.loader.exec_module(BASELINE)

TscError = BASELINE.TscError
PackageRun = BASELINE.PackageRun

UI = "packages/@brix/enterprise-solutions/app-x/x-ui-web"
SHARED = "packages/@brix/enterprise-solutions/app-x/x-shared"


def error(file: str, line: int, code: str, message: str) -> TscError:
    return TscError(file, line, 1, code, message)


def run(directory: str, *errors: TscError, exit_code: int | None = None) -> PackageRun:
    code = exit_code if exit_code is not None else (2 if errors else 0)
    return PackageRun(directory, directory.rsplit("/", 1)[-1], code, list(errors), "")


class ParseTest(unittest.TestCase):
    def test_reads_located_and_global_errors_and_skips_the_rest(self) -> None:
        output = "\n".join(
            [
                "> @brix-sdk/x-ui-web@3.2.0 typecheck /work/brix-enterprise/packages/x",
                "> tsc --noEmit",
                "",
                "src/pages/List.tsx(12,7): error TS2322: Type 'string' is not assignable to type 'number'.",
                "  Types of property 'id' are incompatible.",
                "../x-shared/src/index.ts(3,1): error TS2307: Cannot find module 'y' or its corresponding type declarations.",
                "error TS5083: Cannot read file '/work/brix-enterprise/packages/tsconfig.base.json'.",
                " ELIFECYCLE  Command failed with exit code 2.",
            ]
        )
        errors = BASELINE.parse_tsc_output(output, [("/work/brix-enterprise/", "<enterprise>/")])
        self.assertEqual(
            [
                TscError("src/pages/List.tsx", 12, 7, "TS2322", "Type 'string' is not assignable to type 'number'."),
                TscError("../x-shared/src/index.ts", 3, 1, "TS2307", "Cannot find module 'y' or its corresponding type declarations."),
                TscError("", 0, 0, "TS5083", "Cannot read file '<enterprise>/packages/tsconfig.base.json'."),
            ],
            errors,
        )

    def test_the_key_has_no_line_or_column(self) -> None:
        self.assertEqual(
            "src/a.ts: TS2304: Cannot find name 'x'.",
            error("src/a.ts", 40, "TS2304", "Cannot find name 'x'.").key,
        )
        self.assertEqual("(no file): TS5083: m", TscError("", 0, 0, "TS5083", "m").key)

    def test_windows_line_endings_are_read(self) -> None:
        errors = BASELINE.parse_tsc_output("src/a.ts(1,2): error TS1005: ';' expected.\r\n")
        self.assertEqual([TscError("src/a.ts", 1, 2, "TS1005", "';' expected.")], errors)


class CanonicalFileTest(unittest.TestCase):
    def test_files_of_the_repository_stay_relative_to_the_package_and_brix_files_get_a_placeholder(self) -> None:
        with TemporaryDirectory() as temporary:
            workspace = Path(temporary).resolve()
            root = workspace / "brix-enterprise"
            (root / UI).mkdir(parents=True)
            (workspace / "brix" / "packages").mkdir(parents=True)
            depth = "../" * len(UI.split("/"))
            self.assertEqual("src/a.ts", BASELINE.canonical_file(root, UI, "src/a.ts"))
            self.assertEqual("../x-shared/src/b.ts", BASELINE.canonical_file(root, UI, "../x-shared/src/b.ts"))
            self.assertEqual(
                "<brix>/packages/p/src/c.ts",
                BASELINE.canonical_file(root, UI, f"{depth}../brix/packages/p/src/c.ts"),
            )
            self.assertEqual("", BASELINE.canonical_file(root, UI, ""))

    def test_a_linked_brix_is_named_by_its_real_path(self) -> None:
        with TemporaryDirectory() as temporary:
            workspace = Path(temporary).resolve()
            real = workspace / "elsewhere" / "brix-checkout"
            (real / "packages").mkdir(parents=True)
            pair = workspace / "pair"
            root = pair / "brix-enterprise"
            (root / UI).mkdir(parents=True)
            os.symlink(real, pair / "brix")
            printed = os.path.relpath(real / "packages" / "p" / "src" / "c.ts", root / UI)
            self.assertEqual("<brix>/packages/p/src/c.ts", BASELINE.canonical_file(root, UI, printed))
            self.assertIn((str(real) + os.sep, "<brix>/"), BASELINE.path_replacements(root))


class CompareTest(unittest.TestCase):
    BASE = {UI: ["src/a.ts: TS2304: Cannot find name 'x'.", "src/a.ts: TS2304: Cannot find name 'x'."]}

    def test_errors_the_baseline_lists_pass_wherever_they_moved(self) -> None:
        runs = [
            run(UI, error("src/a.ts", 3, "TS2304", "Cannot find name 'x'."), error("src/a.ts", 90, "TS2304", "Cannot find name 'x'.")),
            run(SHARED),
        ]
        self.assertTrue(BASELINE.compare(runs, self.BASE).ok)

    def test_one_more_occurrence_of_a_listed_error_is_new_and_every_occurrence_is_shown(self) -> None:
        occurrences = [error("src/a.ts", line, "TS2304", "Cannot find name 'x'.") for line in (3, 5, 7)]
        result = BASELINE.compare([run(UI, *occurrences)], self.BASE)
        self.assertEqual({UI: [BASELINE.Grown("src/a.ts: TS2304: Cannot find name 'x'.", occurrences, 2)]}, result.new)
        self.assertEqual({}, result.fixed)

    def test_an_error_in_a_package_the_baseline_does_not_name_is_new(self) -> None:
        wrong = error("src/index.ts", 1, "TS2322", "m")
        result = BASELINE.compare([run(UI, error("src/a.ts", 1, "TS2304", "Cannot find name 'x'."), error("src/a.ts", 2, "TS2304", "Cannot find name 'x'.")), run(SHARED, wrong)], self.BASE)
        self.assertEqual({SHARED: [BASELINE.Grown(wrong.key, [wrong], 0)]}, result.new)

    def test_a_listed_error_that_no_longer_occurs_fails_until_it_is_removed(self) -> None:
        result = BASELINE.compare([run(UI, error("src/a.ts", 3, "TS2304", "Cannot find name 'x'."))], self.BASE)
        self.assertEqual({UI: ["src/a.ts: TS2304: Cannot find name 'x'."]}, result.fixed)
        self.assertFalse(result.ok)
        self.assertEqual({UI: ["src/a.ts: TS2304: Cannot find name 'x'."]}, BASELINE.pruned(self.BASE, result))

    def test_a_listed_package_that_no_longer_typechecks_has_all_its_entries_fixed(self) -> None:
        result = BASELINE.compare([run(SHARED)], self.BASE)
        self.assertEqual({UI: sorted(self.BASE[UI])}, result.fixed)
        self.assertEqual({}, BASELINE.pruned(self.BASE, result))

    def test_a_package_that_fails_without_a_tsc_error_did_not_run(self) -> None:
        broken = run(UI, exit_code=1)
        result = BASELINE.compare([broken], self.BASE)
        self.assertEqual([broken], result.not_run)
        self.assertEqual({}, result.fixed)
        self.assertFalse(result.ok)


class MainTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = TemporaryDirectory()
        self.root = Path(self.temporary.name).resolve() / "brix-enterprise"
        (self.root / "scripts").mkdir(parents=True)
        self.baseline = self.root / "scripts" / "frontend-typecheck-baseline.json"
        self.results: dict[str, PackageRun] = {}

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def main(self, *argv: str) -> tuple[int, str]:
        out = io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(out):
            code = BASELINE.main(
                list(argv),
                root=self.root,
                packages=lambda root: sorted((directory, directory.rsplit("/", 1)[-1]) for directory in self.results),
                runner=lambda root, directory, name, replacements: self.results[directory],
            )
        return code, out.getvalue()

    def write(self, packages: dict[str, list[str]]) -> None:
        BASELINE.write_baseline(self.baseline, packages)

    def test_init_writes_a_first_baseline_and_refuses_to_overwrite_it(self) -> None:
        self.results = {UI: run(UI, error("src/b.ts", 2, "TS2322", "b"), error("src/a.ts", 9, "TS2304", "a")), SHARED: run(SHARED)}
        code, _ = self.main("--init")
        self.assertEqual(0, code)
        data = json.loads(self.baseline.read_text(encoding="utf-8"))
        self.assertEqual({UI: ["src/a.ts: TS2304: a", "src/b.ts: TS2322: b"]}, data["packages"])
        code, out = self.main("--init")
        self.assertEqual(2, code)
        self.assertIn("--prune", out)

    def test_check_passes_and_fails_on_a_new_error_with_an_annotation(self) -> None:
        self.write({UI: ["src/a.ts: TS2304: a"]})
        self.results = {UI: run(UI, error("src/a.ts", 9, "TS2304", "a")), SHARED: run(SHARED)}
        code, out = self.main()
        self.assertEqual(0, code, out)
        self.results[SHARED] = run(SHARED, error("src/c.ts", 4, "TS2339", "c"))
        with mock.patch.dict(os.environ, {"GITHUB_ACTIONS": "true"}):
            code, out = self.main()
        self.assertEqual(1, code)
        self.assertIn(f"::error file={SHARED}/src/c.ts,line=4,col=1,title=Typecheck (new error)::TS2339: c", out)

    def test_a_fixed_entry_is_annotated_on_the_baseline_with_escaped_properties(self) -> None:
        self.write({UI: ["src/a.ts: TS2304: a"]})
        self.results = {UI: run(UI)}
        with mock.patch.dict(os.environ, {"GITHUB_ACTIONS": "true"}):
            code, out = self.main()
        self.assertEqual(1, code)
        self.assertIn(
            "::error file=scripts/frontend-typecheck-baseline.json,title=Typecheck (fixed%2C remove from the baseline)::"
            f"{UI}: src/a.ts: TS2304: a",
            out,
        )

    def test_packages_can_be_checked_at_once(self) -> None:
        self.write({UI: ["src/a.ts: TS2304: a"]})
        self.results = {UI: run(UI, error("src/a.ts", 9, "TS2304", "a")), SHARED: run(SHARED), "e2e-tests/x": run("e2e-tests/x")}
        code, out = self.main("--jobs", "3")
        self.assertEqual(0, code, out)
        self.assertIn("Type-checked 3 packages: 1 errors; the baseline lists 1.", out)
        with self.assertRaises(SystemExit) as refused:
            self.main("--jobs", "0")
        self.assertEqual(2, refused.exception.code)

    def test_prune_removes_fixed_entries_only_and_never_adds(self) -> None:
        self.write({UI: ["src/a.ts: TS2304: a", "src/b.ts: TS2322: b"]})
        self.results = {UI: run(UI, error("src/a.ts", 9, "TS2304", "a")), SHARED: run(SHARED, error("src/c.ts", 4, "TS2339", "c"))}
        code, out = self.main("--prune")
        self.assertEqual(1, code, out)
        data = json.loads(self.baseline.read_text(encoding="utf-8"))
        self.assertEqual({UI: ["src/a.ts: TS2304: a"]}, data["packages"])
        del self.results[SHARED]
        code, out = self.main()
        self.assertEqual(0, code, out)

    def test_no_package_to_check_fails(self) -> None:
        self.write({})
        code, out = self.main()
        self.assertEqual(1, code)
        self.assertIn("nothing was checked", out)


class RepositoryBaselineTest(unittest.TestCase):
    def test_the_registered_baseline_is_sorted_and_names_package_directories(self) -> None:
        path = MODULE_PATH.resolve().parent / "frontend-typecheck-baseline.json"
        packages = BASELINE.load_baseline(path)
        self.assertEqual(sorted(packages), list(packages))
        root = MODULE_PATH.resolve().parent.parent
        for directory, entries in packages.items():
            self.assertTrue((root / directory / "package.json").is_file(), directory)
            self.assertEqual(sorted(entries), entries, directory)
            self.assertTrue(entries, directory)


if __name__ == "__main__":
    unittest.main()
