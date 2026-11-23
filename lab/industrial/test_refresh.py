"""Regression tests for lossless forward-audit reconstruction; never fetch data."""
import csv
import json
from pathlib import Path
import tempfile
import unittest

from refresh import get_curves

HERE = Path(__file__).resolve().parent


class ForwardAuditTests(unittest.TestCase):
    def fixture(self, rows):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        path = Path(temp.name) / "audit.csv"
        with path.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=rows[0].keys())
            writer.writeheader()
            writer.writerows(rows)
        return path

    def source_rows(self):
        with (HERE / "forward-audit.csv").open(newline="", encoding="utf-8") as handle:
            return list(csv.DictReader(handle))

    def test_duplicate_observation_is_rejected_instead_of_overwriting(self):
        row = self.source_rows()[0]
        with self.assertRaisesRegex(ValueError, "Duplicate forward observation"):
            get_curves(self.fixture([row, row]))

    def test_conflicting_source_for_one_curve_is_rejected(self):
        first, second = self.source_rows()[:2]
        self.assertEqual(first["trade_date"], second["trade_date"])
        second["source_url"] = "https://example.invalid/different-filing"
        with self.assertRaisesRegex(ValueError, "Conflicting source URLs"):
            get_curves(self.fixture([first, second]))

    def test_all_original_forward_prices_and_sources_are_unchanged(self):
        content = (HERE / "market.js").read_text(encoding="utf-8")
        frozen = json.loads(content.split("=", 1)[1].rstrip(";\n"))
        rebuilt = get_curves()
        self.assertEqual(rebuilt, frozen["curves"])
        self.assertEqual(sum(len(curve["prices"]) for curve in rebuilt.values()), 156)


if __name__ == "__main__":
    unittest.main()
