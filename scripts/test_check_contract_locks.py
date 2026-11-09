"""Tests for the contract lock check (standard-link plan queue item 3, D115)."""

from __future__ import annotations

import contextlib
import importlib.util
import io
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory


MODULE_PATH = Path(__file__).with_name("check_contract_locks.py")
SPEC = importlib.util.spec_from_file_location("check_contract_locks", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
LOCKS = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = LOCKS
SPEC.loader.exec_module(LOCKS)

REPOSITORY = MODULE_PATH.resolve().parent.parent
LACKS_BOTH = f"no {LOCKS.LISTING}, no test calls {LOCKS.LOCK_CALL})"


def write(path: Path, content: str) -> None:
    """Write a file, creating its directories."""

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def module(repository: Path, path: str) -> Path:
    """Create a Maven module directory."""

    directory = repository / path
    write(directory / "pom.xml", "<project/>")
    return directory


def lock_test(package: str) -> str:
    """A test that calls the lock."""

    return f'class ContractSourcesTest {{ void locked() {{ ContractSources.verify(Path.of(""), "{package}"); }} }}'


class CheckContractLocksTest(unittest.TestCase):
    """The check finds every module that ships contracts and what each lacks of a lock."""

    def test_this_repository_is_locked(self) -> None:
        self.assertIn(
            "packages/@brix/enterprise-solutions/app-booking/booking-server",
            [path.relative_to(REPOSITORY).as_posix() for path in LOCKS.maven_modules(REPOSITORY)],
            "the check walks this repository's Maven modules",
        )
        self.assertEqual([], LOCKS.unlocked(LOCKS.scan(REPOSITORY)))

    def test_a_module_that_ships_contracts_without_a_listing_and_a_test_is_unlocked(self) -> None:
        with TemporaryDirectory() as temporary:
            repository = Path(temporary)
            booking = module(repository, "plugins/booking-api")
            write(booking / "src/main/resources/META-INF/brix/schemas/booking/create-request/1.0.0.json", "{}")
            rooms = module(repository, "plugins/rooms-api")
            write(rooms / "src/main/resources/META-INF/brix/queries/rooms.find-room/1.0.0.json", "{}")

            self.assertEqual(
                [f"plugins/booking-api: {LACKS_BOTH}", f"plugins/rooms-api: {LACKS_BOTH}"],
                LOCKS.unlocked(LOCKS.scan(repository)),
            )

            write(booking / LOCKS.LISTING, "\n")
            write(rooms / "src/test/java/rooms/ContractSourcesTest.java", lock_test("rooms"))
            self.assertEqual(
                [
                    f"plugins/booking-api: no test calls {LOCKS.LOCK_CALL})",
                    f"plugins/rooms-api: no {LOCKS.LISTING}",
                ],
                LOCKS.unlocked(LOCKS.scan(repository)),
            )

            write(booking / "src/test/java/booking/ContractSourcesTest.java", lock_test("booking"))
            write(rooms / LOCKS.LISTING, "\n")
            self.assertEqual(
                {"plugins/booking-api": [], "plugins/rooms-api": []},
                LOCKS.scan(repository),
            )

    def test_test_resources_build_output_hidden_directories_and_templates_ship_no_contract(self) -> None:
        with TemporaryDirectory() as temporary:
            repository = Path(temporary)
            server = module(repository, "plugins/booking-server")
            write(server / "src/test/resources/META-INF/brix/schemas/booking/fixture/1.0.0.json", "{}")
            write(server / "src/main/resources/META-INF/brix/plugin-manifest.yaml", "kind: Plugin\n")
            for elsewhere in (
                "plugins/booking-server/target/generated",
                "ui/node_modules/some-package",
                ".worktrees/other/plugins/booking-api",
            ):
                write(
                    module(repository, elsewhere)
                    / "src/main/resources/META-INF/brix/schemas/booking/create-request/1.0.0.json",
                    "{}",
                )
            write(repository / "templates/plugin-api/src/main/resources/META-INF/brix/schemas/x/y/1.0.0.json", "{}")

            self.assertEqual({}, LOCKS.scan(repository))

    def test_the_command_fails_with_each_unlocked_module_and_what_to_do(self) -> None:
        with TemporaryDirectory() as temporary:
            repository = Path(temporary)
            booking = module(repository, "plugins/booking-api")
            write(booking / "src/main/resources/META-INF/brix/events/booking.booked/1.0.0.json", "{}")

            errors = io.StringIO()
            with contextlib.redirect_stderr(errors), contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(1, LOCKS.main(["--repo-root", str(repository)]))
            self.assertIn(f"plugins/booking-api: {LACKS_BOTH}", errors.getvalue())
            self.assertIn("-Dbrix.contracts.write=true", errors.getvalue())

            write(booking / LOCKS.LISTING, "\n")
            write(booking / "src/test/java/booking/ContractSourcesTest.java", lock_test("booking"))
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                self.assertEqual(0, LOCKS.main(["--repo-root", str(repository)]))
            self.assertIn("1 module(s) ship contracts, all locked", output.getvalue())


if __name__ == "__main__":
    unittest.main()
