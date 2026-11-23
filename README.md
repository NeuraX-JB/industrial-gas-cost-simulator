# Industrial Gas Cost Simulator

**John Barreto · Independent natural gas research**

Replay an illustrative plant's November–March gas costs and compare all-variable purchases with a fixed share of monthly consumption.

**[Open this project](https://neurax-jb.github.io/industrial-gas-cost-simulator/) · [Open the simulator directly](https://neurax-jb.github.io/industrial-gas-cost-simulator/lab/industrial/) · [Original research portfolio](https://neurax-jb.github.io/Henry-Hub-Futures-Curve-Explorer-How-the-Natural-Gas-Market-prices-winter/lab/)**

This standalone edition is a **historical snapshot**. It includes monthly cash observations from **January 1997 through October 2026**, from the EIA release dated **18 November 2026**, and 13 SEC-derived curve snapshots through **30 September 2026**. It has no live feed or automatic refresh.

## Research question

How would fixing part of an illustrative industrial plant's gas consumption have changed its winter fuel budget under the selected historical prices and assumptions?

Select a complete winter, choose an illustrative or custom monthly consumption profile, and set the fixed share, local basis, delivery tariff and service fee. A pre-winter reconstructed curve is offered only when all five winter delivery months are present; otherwise use an explicitly assumed flat quote. A manually selected quote remains selected when changing winters, so the price assumption does not silently switch.

## Calculation and interpretation

For month `i`, let `qᵢ` be consumption in MMBtu, `s` the fixed fraction, `Pᵢ` the monthly Henry Hub cash price, `Fᵢ` the fixed price, `b` local basis, `d` delivery tariff and `f` the monthly fee:

```text
All-variable cost = qᵢ × (Pᵢ + b + d) + f
Fixed-share cost  = qᵢ × [s × Fᵢ + (1 − s) × Pᵢ + b + d] + f
Effect of fixing  = qᵢ × s × (Fᵢ − Pᵢ)
```

Winter totals sum the five months. The effect is calculated directly from the fixed volume and price difference, avoiding loss of small changes when common local charges are very large. A negative effect means a lower cost in that replay; it does not establish that fixing is always preferable. Costs display cents, with sub-cent differences labelled explicitly. The CSV retains six decimal places, with assumptions and source references.

At 0% fixed, no fixed-price quote is required or applied. Service fees still apply in a month with zero consumption. Negative local basis and negative market prices are supported; consumption, delivery tariffs and service fees must be nonnegative, and the fixed share must be between 0% and 100%. Non-finite calculations are rejected instead of displayed or exported.

The model assumes the fixed share exactly matches actual monthly volume and settles against the same monthly cash index. It excludes taxes, supplier premiums, financing, margin, volume deviations and timing differences. Monthly averages may differ from a plant's daily load-weighted price. An SEC holdings reconstruction is a historical reference, not an executable plant quote; the source filing was published after its position date.

## Evidence and source files

- [Budget calculation model](lab/industrial/model.js)
- [Frozen market asset](lab/industrial/market.js)
- [Forward-position audit](lab/industrial/forward-audit.csv)
- [Market-data builder](lab/industrial/refresh.py)
- [Data construction and attribution](DATA_SOURCES.md)

## Run and verify locally

Python 3 and Node.js are sufficient; the application has no runtime package dependencies or API keys.

```sh
python -m http.server 8000
# Open http://localhost:8000/ or /lab/industrial/
node --test lab/industrial/*.test.cjs
python -m unittest discover -s lab/industrial -p 'test_*.py'
python scripts/validate.py --static-only
```

To deliberately rebuild the offline asset, run `python lab/industrial/refresh.py saved-eia-monthly.html` with a saved EIA monthly table, or omit the argument to request the source website. This is a manual maintenance action, not a browser feature. The builder verifies each implied forward price against the position audit and rejects duplicate observations or conflicting per-date sources. Review the resulting data changes before publishing them.

See [VALIDATION.md](VALIDATION.md) and [SOURCE_SNAPSHOT.json](SOURCE_SNAPSHOT.json) for repository checks and source provenance.

## Source and publication

This project was extracted from the [canonical research lab](https://github.com/NeuraX-JB/Henry-Hub-Futures-Curve-Explorer-How-the-Natural-Gas-Market-prices-winter/tree/80c2e5321dadc95aadd4c7f65792fb15f0e2f156) at commit `80c2e5321dadc95aadd4c7f65792fb15f0e2f156`. The standalone interface is maintained here; its underlying snapshot remains frozen unless an explicit, reviewed refresh changes it. The original website and forecast ledger remain separate.

Research and education, not a live procurement quote or investment advice. No new license is granted; review the source terms before reuse.
