#!/usr/bin/env python3
"""Check that every module of this repository that ships contracts is locked (standard-link plan queue item 3, D115).

A module's lock is its own Java test calling ContractSources.verify (brix runtime-contract-generator), which pins each
schema version the module ships in src/main/brix/contracts.api: a published version never changes. A module without
one could change a published version unnoticed. This check walks the repository and fails for every Maven module whose
src/main/resources/META-INF/brix ships a schema, query, command or event contract but has no listing or no such test.
Test resources, build output, hidden directories and templates ship nothing. brix runs the same check as
RepositoryContractLocksTest.

The listing's content is the module test's to check, and that test needs the brix artifacts; this check needs only the
files, so the Architecture Context Control Plane job runs it.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


CONTRACTS = ("schemas", "queries", "commands", "events")
NOT_SOURCES = frozenset({"target", "node_modules"})
LISTING = "src/main/brix/contracts.api"
LOCK_CALL = "ContractSources.verify("
WRITE = "brix.contracts.write"


def scan(repository: Path) -> dict[str, list[str]]:
    """Return the Maven modules under the repository that ship contracts, by path, with what each lacks of a lock."""

    modules: dict[str, list[str]] = {}
    for module in maven_modules(repository):
        if not ships_contracts(module):
            continue
        lacks = []
        if not (module / LISTING).is_file():
            lacks.append(f"no {LISTING}")
        if not calls_the_lock(module / "src" / "test" / "java"):
            lacks.append(f"no test calls {LOCK_CALL})")
        modules[module.relative_to(repository).as_posix()] = lacks
    return dict(sorted(modules.items()))


def maven_modules(repository: Path) -> list[Path]:
    """Return the directories holding a pom.xml, skipping hidden directories, build output and node_modules."""

    found = []
    for directory, subdirectories, files in os.walk(repository):
        subdirectories[:] = sorted(
            name for name in subdirectories if not name.startswith(".") and name not in NOT_SOURCES
        )
        if "pom.xml" in files:
            found.append(Path(directory))
    return found


def ships_contracts(module: Path) -> bool:
    """Tell whether the module's main resources hold a schema, query, command or event contract."""

    brix = module / "src" / "main" / "resources" / "META-INF" / "brix"
    return any(path.is_file() for kind in CONTRACTS for path in (brix / kind).rglob("*.json"))


def calls_the_lock(tests: Path) -> bool:
    """Tell whether a Java test under the directory calls ContractSources.verify."""

    return any(path.is_file() and LOCK_CALL in path.read_text(encoding="utf-8") for path in tests.rglob("*.java"))


def unlocked(modules: dict[str, list[str]]) -> list[str]:
    """Return one line per module that lacks part of its lock."""

    return [f"{path}: {', '.join(lacks)}" for path, lacks in modules.items() if lacks]


def parse_args(argv: list[str]) -> argparse.Namespace:
    """Parse command-line arguments."""

    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path(__file__).resolve().parent.parent,
        help="repository to check (default: the one holding this script)",
    )
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    """Run the check and return the process exit code."""

    repository = parse_args(argv).repo_root.resolve()
    modules = scan(repository)
    missing = unlocked(modules)
    if missing:
        print(
            "A module that ships contracts locks them: add a test under src/test/java that calls "
            'ContractSources.verify(Path.of(""), "<package of the generated types>"), with '
            f"io.brix:runtime-contract-generator in test scope, and run it once with -D{WRITE}=true to write {LISTING} "
            "(see the Queries guide of brix):\n  " + "\n  ".join(missing),
            file=sys.stderr,
        )
        return 1
    print(f"Contract locks: {len(modules)} module(s) ship contracts, all locked.")
    for path in modules:
        print(f"  {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
