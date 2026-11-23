"""Rebuild the offline market-data asset. Usage: python refresh.py [saved EIA HTML]."""
import csv
import datetime as dt
from decimal import Decimal, ROUND_HALF_UP
import json
from html.parser import HTMLParser
from pathlib import Path
import re
import sys
from urllib.request import Request, urlopen

HERE = Path(__file__).resolve().parent
SPOT_URL = "https://www.eia.gov/dnav/ng/hist/rngwhhdM.htm"


class TableRows(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows, self.row, self.cell = [], None, None

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self.row = []
        if tag == "td" and self.row is not None:
            self.cell = []

    def handle_data(self, text):
        if self.cell is not None:
            self.cell.append(text)

    def handle_endtag(self, tag):
        if tag == "td" and self.cell is not None:
            self.row.append("".join(self.cell).strip())
            self.cell = None
        if tag == "tr" and self.row is not None:
            self.rows.append(self.row)
            self.row = self.cell = None


def get_spot(html):
    parser = TableRows()
    parser.feed(html)
    spot = {}
    for row in parser.rows:
        if len(row) != 13 or not re.fullmatch(r"\d{4}", row[0]):
            continue
        for month, value in enumerate(row[1:], 1):
            if re.fullmatch(r"-?\d+(?:\.\d+)?", value):
                spot[f"{row[0]}-{month:02}"] = float(value)
    if len(spot) < 250 or "1997-01" not in spot:
        raise ValueError("EIA monthly table has insufficient coverage")
    release = dt.datetime.strptime(re.search(r"(?<!Next )Release Date:\s*(\d+/\d+/\d+)", html).group(1), "%m/%d/%Y").date().isoformat()
    return spot, release


def get_curves():
    curves = {}
    with (HERE / "forward-audit.csv").open() as handle:
        for row in csv.DictReader(handle):
            date = row["trade_date"]
            price = ((Decimal(row["notional_amount"]) + Decimal(row["unrealized_gain_loss"])) /
                     (Decimal(row["contracts"]) * Decimal(10000))).quantize(Decimal(".001"), rounding=ROUND_HALF_UP)
            if price != Decimal(row["implied_settlement"]):
                raise ValueError(f"Failed audit of {date} {row['delivery_month']}")
            rec = curves.setdefault(date, {"source": row["source_url"], "prices": {}})
            rec["prices"][row["delivery_month"]] = float(price)
    return curves


if __name__ == "__main__":
    if len(sys.argv) > 1:
        source = Path(sys.argv[1]).read_text()
    else:
        request = Request(SPOT_URL, headers={"User-Agent": "HenryHubResearch/1.0 offline dataset refresh"})
        with urlopen(request, timeout=40) as r:
            source = r.read().decode()
    values, release_date = get_spot(source)
    bundle = {"spot": values, "eiaRelease": release_date, "spotUrl": SPOT_URL, "curves": get_curves()}
    out = HERE / "market.js"
    tmp = out.with_suffix(".tmp")
    tmp.write_text("globalThis.GAS_COST_MARKET=" + json.dumps(bundle, separators=(",", ":")) + ";\n")
    tmp.replace(out)
    print(f"Market data: {len(values)} months; EIA release {release_date}; {len(bundle['curves'])} dated strips")
