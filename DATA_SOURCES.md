# Industrial gas cost data and attribution

This repository contains the industrial procurement replay. It does not include the weather, storage or API datasets from the original portfolio.

| Source | Material used here | Reference and audit |
| :--- | :--- | :--- |
| U.S. Energy Information Administration | 358 monthly average Henry Hub spot observations, 1997-01–2026-10; release 2026-11-18 | [EIA monthly series](https://www.eia.gov/dnav/ng/hist/rngwhhdM.htm), [frozen market asset](lab/industrial/market.js) |
| U.S. 12 Month Natural Gas Fund SEC filings | 13 reconstructed curve snapshots, 2023-09-29–2026-09-30 | [Position audit with source URLs](lab/industrial/forward-audit.csv), [reconstruction code](lab/industrial/refresh.py) |
| User assumptions | Plant volumes, fixed percentage, local basis, delivery tariffs, monthly fee and optional flat fixed price | Entered in [the simulator](https://neurax-jb.github.io/industrial-gas-cost-simulator/lab/industrial/); the supplied plant profiles and local charges are illustrative |

For each audited long futures position, `(original notional + signed unrealized gain/loss) / (contracts × 10,000 MMBtu)` gives the implied price, rounded to $0.001/MMBtu. The observation date precedes the winter in which it can be used, but the filing became public later. These reconstructions are historical marks, not a record of executable plant quotes or information necessarily available to a trader on the observation date.

The simulator uses complete November–March cash periods and requires all five delivery prices for an archived fixed-price scenario. EIA monthly averages do not account for a plant's daily consumption pattern. The full model assumptions and exclusions are in [README.md](README.md) and the application's methodology section.

[SOURCE_SNAPSHOT.json](SOURCE_SNAPSHOT.json) records the original source commit and frozen-file provenance. This standalone edition does not automatically update its data; source releases may be revised later.

EIA attributes its underlying Henry Hub spot data to Refinitiv, an LSEG business. Public access does not necessarily permit unrestricted redistribution or commercial reuse. Review the source and third-party terms, including material in SEC filings. No repository-wide license or new rights to third-party content are granted here.
