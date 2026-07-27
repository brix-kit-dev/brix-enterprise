"""Tests for the architecture baseline freeze validator."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("validate_architecture_baseline.py")
SPEC = importlib.util.spec_from_file_location("baseline_validator", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


class ArchitectureBaselineValidatorTest(unittest.TestCase):
    def test_candidate_document_matches_pending_lock(self) -> None:
        document = "\n".join(
            [
                VALIDATOR.CANDIDATE_TITLE,
                VALIDATOR.CANDIDATE_HEADER,
                "status: freeze-candidate",
                "effective: false",
            ]
        )

        VALIDATOR.validate_document_state(document, frozen=False)

    def test_candidate_document_is_rejected_for_frozen_lock(self) -> None:
        document = "\n".join(
            [
                VALIDATOR.CANDIDATE_TITLE,
                VALIDATOR.CANDIDATE_HEADER,
                "status: freeze-candidate",
                "effective: false",
            ]
        )

        with self.assertRaises(VALIDATOR.BaselineValidationError):
            VALIDATOR.validate_document_state(document, frozen=True)

    def test_frozen_document_requires_machine_metadata(self) -> None:
        document = "\n".join(
            [
                VALIDATOR.FROZEN_TITLE,
                VALIDATOR.FROZEN_HEADER,
            ]
        )

        with self.assertRaises(VALIDATOR.BaselineValidationError):
            VALIDATOR.validate_document_state(document, frozen=True)

    def test_raw_byte_digest_is_stable(self) -> None:
        self.assertEqual(
            VALIDATOR.sha256_bytes(b"brix\n"),
            "a2a02b0ec0cb729fe560388f2aeb734662b0b7157755cbab2cbd8e1e7eda682f",
        )


if __name__ == "__main__":
    unittest.main()