#!/usr/bin/env python3
"""Type-check every frontend package against the registered baseline of existing errors.

Standard-link plan queue item 19, 19h, D165. Runs the ``typecheck`` script of each workspace package that has one
(the repository root aside) and reads tsc's errors. An error is keyed by its file, its code and its message, without
line and column, so moving code does not change it; a key that occurs twice counts twice.
Compared with the baseline file:

- an error the baseline does not list fails the run, so a package the baseline does not name must have none;
- an error the baseline lists that no longer occurs fails the run as well: the baseline only shrinks, and the change
  that fixes an error removes it from the baseline (``--prune`` does that, and never adds an entry);
- a package whose ``typecheck`` fails without a single tsc error (it did not run) fails the run.

Prerequisites: brix beside this repository, installed, with its type dependencies built
(``node scripts/build-type-dependencies.mjs`` in brix), and this repository installed with its plugin shared packages
built (``pnpm run build:shared``). The Frontend Stability job of Architecture Guard runs exactly that.

Packages are checked a few at a time (``--jobs``, default the number of processors up to 4); the report is in
package order.

Usage: python3 scripts/frontend_typecheck_baseline.py [--prune | --init] [--baseline FILE] [--jobs N]
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Iterable

ROOT = Path(__file__).resolve().parent.parent
ABOUT = (
    "Existing frontend type errors, keyed 'file: code: message' per package directory (standard-link plan queue item "
    "19, 19h, D165). scripts/frontend_typecheck_baseline.py fails on an error not listed here and on a listed one "
    "that no longer occurs; fixing the errors is in the plan's backlog."
)
PACKAGE_TIMEOUT_SECONDS = 600
DEFAULT_JOBS = max(1, min(4, os.cpu_count() or 1))

LOCATED = re.compile(r"^(?P<file>\S[^(]*)\((?P<line>\d+),(?P<column>\d+)\): error (?P<code>TS\d+): (?P<message>.*)$")
GLOBAL = re.compile(r"^error (?P<code>TS\d+): (?P<message>.*)$")


@dataclass(frozen=True)
class TscError:
    """One tsc error. ``file`` is relative to the package for a file of this repository, ``<brix>/...`` for a file of
    brix beside it, and empty for an error with no file (see ``canonical_file``)."""

    file: str
    line: int
    column: int
    code: str
    message: str

    @property
    def key(self) -> str:
        return f"{self.file or '(no file)'}: {self.code}: {self.message}"


@dataclass
class PackageRun:
    directory: str
    name: str
    exit_code: int
    errors: list[TscError]
    output: str


@dataclass
class Grown:
    """A key that occurs more often than the baseline lists. Which occurrence is the new one cannot be told, so all
    of them are kept."""

    key: str
    occurrences: list[TscError]
    listed: int


@dataclass
class Result:
    new: dict[str, list[Grown]] = field(default_factory=dict)
    fixed: dict[str, list[str]] = field(default_factory=dict)
    not_run: list[PackageRun] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.new and not self.fixed and not self.not_run


def parse_tsc_output(output: str, replacements: Iterable[tuple[str, str]] = ()) -> list[TscError]:
    """The errors in tsc's plain output (not ``--pretty``). Continuation lines of a message are left out of the key.

    ``replacements`` turn machine-specific absolute paths in a message into placeholders."""
    errors = []
    for raw in output.splitlines():
        line = raw.rstrip("\r")
        located = LOCATED.match(line)
        if located:
            errors.append(
                TscError(
                    located["file"],
                    int(located["line"]),
                    int(located["column"]),
                    located["code"],
                    _normalize(located["message"], replacements),
                )
            )
            continue
        global_error = GLOBAL.match(line)
        if global_error:
            errors.append(TscError("", 0, 0, global_error["code"], _normalize(global_error["message"], replacements)))
    return errors


def _normalize(message: str, replacements: Iterable[tuple[str, str]]) -> str:
    for absolute, placeholder in replacements:
        message = message.replace(absolute, placeholder)
    return message.strip()


def compare(runs: list[PackageRun], baseline: dict[str, list[str]]) -> Result:
    """New errors per package, baseline entries that no longer occur, packages that did not run."""
    result = Result()
    seen = set()
    for run in runs:
        seen.add(run.directory)
        if run.exit_code != 0 and not run.errors:
            result.not_run.append(run)
            continue
        expected = Counter(baseline.get(run.directory, []))
        actual = Counter(error.key for error in run.errors)
        grown = sorted(key for key in actual if actual[key] > expected[key])
        if grown:
            result.new[run.directory] = [
                Grown(key, [error for error in run.errors if error.key == key], expected[key]) for key in grown
            ]
        gone = expected - actual
        if gone:
            result.fixed[run.directory] = sorted(gone.elements())
    for directory, entries in baseline.items():
        if directory not in seen and entries:
            result.fixed[directory] = sorted(entries)
    return result


def pruned(baseline: dict[str, list[str]], result: Result) -> dict[str, list[str]]:
    """The baseline without the entries that no longer occur. Never adds one."""
    out = {}
    for directory, entries in baseline.items():
        remaining = Counter(entries) - Counter(result.fixed.get(directory, []))
        if remaining:
            out[directory] = sorted(remaining.elements())
    return out


def from_runs(runs: list[PackageRun]) -> dict[str, list[str]]:
    return {run.directory: sorted(error.key for error in run.errors) for run in runs if run.errors}


def load_baseline(path: Path) -> dict[str, list[str]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    packages = data.get("packages")
    if not isinstance(packages, dict) or not all(
        isinstance(entries, list) and all(isinstance(entry, str) for entry in entries) for entries in packages.values()
    ):
        raise ValueError(f"{path}: 'packages' must map package directories to lists of strings")
    return packages


def write_baseline(path: Path, packages: dict[str, list[str]]) -> None:
    data = {"about": ABOUT, "packages": {directory: sorted(packages[directory]) for directory in sorted(packages)}}
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def workspace_packages(root: Path) -> list[tuple[str, str]]:
    """(directory relative to the root, name) of each workspace package with a typecheck script, the root aside."""
    listing = subprocess.run(
        ["pnpm", "-r", "ls", "--depth", "-1", "--json"], cwd=root, capture_output=True, text=True, check=True
    )
    packages = []
    for project in json.loads(listing.stdout):
        directory = Path(project["path"]).resolve()
        if directory == root.resolve():
            continue
        manifest = json.loads((directory / "package.json").read_text(encoding="utf-8-sig"))
        if (manifest.get("scripts") or {}).get("typecheck"):
            packages.append((directory.relative_to(root.resolve()).as_posix(), project["name"]))
    return sorted(packages)


def run_typecheck(root: Path, directory: str, name: str, replacements: list[tuple[str, str]]) -> PackageRun:
    env = dict(os.environ, NO_COLOR="1", FORCE_COLOR="0")
    try:
        completed = subprocess.run(
            ["pnpm", "run", "typecheck"],
            cwd=root / directory,
            capture_output=True,
            text=True,
            env=env,
            timeout=PACKAGE_TIMEOUT_SECONDS,
        )
        output = completed.stdout + completed.stderr
        exit_code = completed.returncode
    except subprocess.TimeoutExpired as expired:
        output = f"typecheck did not finish in {PACKAGE_TIMEOUT_SECONDS} s\n{expired.stdout or ''}{expired.stderr or ''}"
        return PackageRun(directory, name, 124, [], output)
    errors = [
        TscError(canonical_file(root, directory, error.file), error.line, error.column, error.code, error.message)
        for error in parse_tsc_output(output, replacements)
    ]
    return PackageRun(directory, name, exit_code, errors, output)


def brix_root(root: Path) -> Path:
    return (root.parent / "brix").resolve()


def canonical_file(root: Path, directory: str, file: str) -> str:
    """An error's file the same on every machine: relative to the package for a file of this repository, under
    ``<brix>/`` for a file of brix beside it (tsc prints brix's real path, which differs where brix is a link)."""
    if not file:
        return file
    path = Path(os.path.normpath(root / directory / file))
    package = Path(os.path.normpath(root / directory))
    try:
        return "<brix>/" + path.relative_to(brix_root(root)).as_posix()
    except ValueError:
        pass
    try:
        path.relative_to(root.resolve())
    except ValueError:
        return file
    return Path(os.path.relpath(path, package)).as_posix()


def path_replacements(root: Path) -> list[tuple[str, str]]:
    """Absolute paths a message may quote, longest first: brix beside this repository, then this repository."""
    pairs = [(str(brix_root(root)) + os.sep, "<brix>/"), (str(root.resolve()) + os.sep, "<enterprise>/")]
    return sorted(pairs, key=lambda pair: len(pair[0]), reverse=True)


def annotate(kind: str, message: str, file: str | None = None, line: int = 0, column: int = 0) -> None:
    if os.environ.get("GITHUB_ACTIONS") != "true":
        return
    location = ""
    if file:
        location = f"file={_escape_property(file)}"
        if line:
            location += f",line={line},col={column}"
        location += ","
    print(f"::error {location}title={_escape_property(f'Typecheck ({kind})')}::{_escape(message)}")


def _escape(text: str) -> str:
    """A workflow command's message."""
    return text.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")


def _escape_property(text: str) -> str:
    """A workflow command's property value, where a comma or a colon would end it."""
    return _escape(text).replace(":", "%3A").replace(",", "%2C")


def repository_file(root: Path, directory: str, file: str) -> str | None:
    """The file of an error relative to the repository, or None when it lies outside (in brix)."""
    if not file or file.startswith("<brix>/"):
        return None
    path = Path(os.path.normpath(root / directory / file))
    try:
        return path.relative_to(root.resolve()).as_posix()
    except ValueError:
        return None


def report(root: Path, runs: list[PackageRun], baseline: dict[str, list[str]], result: Result, baseline_path: Path) -> None:
    try:
        relative_baseline = baseline_path.resolve().relative_to(root.resolve()).as_posix()
    except ValueError:
        relative_baseline = str(baseline_path)
    for run in result.not_run:
        print(f"\n{run.name} ({run.directory}): typecheck exited {run.exit_code} without a tsc error; its output:")
        print(run.output.rstrip())
        annotate("did not run", f"{run.name}: typecheck exited {run.exit_code} without a tsc error", f"{run.directory}/package.json")
    for directory, grown in result.new.items():
        print(f"\n{directory}: errors not in the baseline:")
        for item in grown:
            count = f"{len(item.occurrences)} now, the baseline lists {item.listed}"
            print(f"  {item.key} ({count}):" if item.listed else f"  {item.key}:")
            for error in item.occurrences:
                print(f"    {error.file or '(no file)'}({error.line},{error.column})")
                note = f" ({count})" if item.listed else ""
                annotate("new error", f"{error.code}: {error.message}{note}", repository_file(root, directory, error.file), error.line, error.column)
    for directory, keys in result.fixed.items():
        print(f"\n{directory}: {len(keys)} baseline entr{'y' if len(keys) == 1 else 'ies'} no longer occur; remove them from {relative_baseline} (--prune):")
        for key in keys:
            print(f"  {key}")
            annotate("fixed, remove from the baseline", f"{directory}: {key}", relative_baseline)
    total = sum(len(run.errors) for run in runs)
    listed = sum(len(entries) for entries in baseline.values())
    print(f"\nType-checked {len(runs)} packages: {total} errors; the baseline lists {listed}.")
    if result.ok:
        print("Every error is in the baseline, and every baseline entry still occurs.")
    else:
        parts = []
        if result.new:
            new = sum(len(item.occurrences) - item.listed for grown in result.new.values() for item in grown)
            parts.append(f"{new} new error(s) in {len(result.new)} package(s)")
        if result.fixed:
            parts.append(f"{sum(len(k) for k in result.fixed.values())} baseline entr(ies) no longer occurring in {len(result.fixed)} package(s)")
        if result.not_run:
            parts.append(f"{len(result.not_run)} package(s) whose typecheck did not run")
        print("Failed: " + "; ".join(parts) + ".")


def main(
    argv: list[str] | None = None,
    root: Path = ROOT,
    packages: Callable[[Path], list[tuple[str, str]]] = workspace_packages,
    runner: Callable[[Path, str, str, list[tuple[str, str]]], PackageRun] = run_typecheck,
) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--prune", action="store_true", help="remove baseline entries that no longer occur (never adds)")
    mode.add_argument("--init", action="store_true", help="write the baseline from the current errors; only when there is none")
    parser.add_argument("--baseline", type=Path, default=None, help="baseline file (default: scripts/frontend-typecheck-baseline.json)")
    parser.add_argument("--jobs", type=int, default=DEFAULT_JOBS, help=f"packages type-checked at once (default {DEFAULT_JOBS})")
    args = parser.parse_args(argv)
    baseline_path = args.baseline or root / "scripts" / "frontend-typecheck-baseline.json"
    if args.jobs < 1:
        parser.error("--jobs must be at least 1")

    if args.init and baseline_path.exists():
        print(f"{baseline_path} exists; --init only writes a first baseline. Use --prune to remove fixed entries.", file=sys.stderr)
        return 2
    baseline = {} if args.init else load_baseline(baseline_path)

    replacements = path_replacements(root)
    runs = []
    with ThreadPoolExecutor(max_workers=args.jobs) as pool:
        futures = [pool.submit(runner, root, directory, name, replacements) for directory, name in packages(root)]
        for future in as_completed(futures):
            run = future.result()
            runs.append(run)
            state = "did not run" if run.exit_code != 0 and not run.errors else f"{len(run.errors)} errors"
            print(f"=== {run.name} ({run.directory}): {state}", flush=True)
    runs.sort(key=lambda run: run.directory)
    if not runs:
        print("No package has a typecheck script: nothing was checked.", file=sys.stderr)
        return 1

    if args.init:
        not_run = [run for run in runs if run.exit_code != 0 and not run.errors]
        if not_run:
            for run in not_run:
                print(f"{run.name} ({run.directory}): typecheck exited {run.exit_code} without a tsc error:\n{run.output.rstrip()}", file=sys.stderr)
            return 1
        write_baseline(baseline_path, from_runs(runs))
        print(f"Wrote {baseline_path}: {sum(len(run.errors) for run in runs)} errors in {len(from_runs(runs))} packages.")
        return 0

    result = compare(runs, baseline)
    report(root, runs, baseline, result, baseline_path)
    if args.prune and result.fixed:
        write_baseline(baseline_path, pruned(baseline, result))
        removed = sum(len(keys) for keys in result.fixed.values())
        print(f"Removed {removed} entr{'y' if removed == 1 else 'ies'} from {baseline_path}.")
        result.fixed = {}
    return 0 if result.ok else 1


if __name__ == "__main__":
    sys.exit(main())
