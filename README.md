# Industrial Gas Cost Simulator

How much of a U.S. plant’s winter gas bill changes when it fixes half its monthly consumption at Henry Hub? This historical replay compares two ways of buying the same gas. It follows the cost from the hub to the plant and shows which months drive the difference.

**[Open the simulator](https://neurax-jb.github.io/industrial-gas-cost-simulator/lab/industrial/)** · [Inspect the price data](DATA_SOURCES.md) · [John Barreto’s research portfolio](https://github.com/NeuraX-JB)

## Replay a paper mill’s 2025–26 winter

Open the simulator and select **Reset scenario** to reproduce this example. The illustrative mill consumes 46,900 MMBtu from November through March. It fixes 50% of each month’s volume against the September 30, 2025 curve reconstructed from fund holdings. Both plans assume $0.20/MMBtu in local basis, a $0.35/MMBtu delivery tariff and a $0 monthly service fee.

| Delivered winter cost | USD |
| --- | ---: |
| Buy all gas at monthly Henry Hub cash prices | $238,559.00 |
| Fix half of each month and buy the rest at cash | $221,327.65 |
| Fixed-share cost minus all-variable cost | −$17,231.35 |

January accounts for more than the entire winter saving. That month, the mill uses 9,900 MMBtu. Its fixed half costs $4.177/MMBtu against $7.72/MMBtu at cash, a saving of $17,537.85. Fixing costs an extra $1,669.35 in February and $2,652.65 in March. Those months give back part of the saving from the first three months.

**Try changing one assumption.** Raise local basis from $0.20 to $0.30/MMBtu. Each winter bill rises by $4,690 because the charge applies to all 46,900 MMBtu. The fixed-share plan still costs $17,231.35 less. Try a different monthly load to see how the timing of consumption changes the result.

## Which winters can I replay?

The frozen EIA series has 358 monthly Henry Hub spot averages from January 1997 through October 2026, from the November 18, 2026 release. The interface offers the **29 complete November–March winters from 1997–98 through 2025–26**.

| Fixed price option | When to use it |
| --- | --- |
| Dated curve | The archive contains 13 snapshots through September 30, 2026. Only winters 2023–24, 2024–25 and 2025–26 have a pre-November snapshot covering all five delivery months and a complete cash history. Each contract month uses its own reconstructed mark. |
| Assumed flat quote | Enter one price for all five months of any available winter. It is a scenario assumption unless you supply and document a historical quote. A manual quote carries over when you switch winters. |
| 0% fixed | Use the cash price for every unit. The interface leaves the fixed quote unapplied. |

The marks come from U.S. 12 Month Natural Gas Fund SEC filings published after their position dates. They describe historical exchange positions. A plant’s actual contract price and the information available to its buyer at the time can differ. The simulator uses the bundled data offline.

## How to read the budget

Henry Hub cash is the EIA monthly spot average. **Basis** is the assumed local price difference from Henry Hub in dollars per million British thermal units (MMBtu). **Delivery** is the variable tariff per MMBtu. A separate monthly service fee applies even in a month with zero use.

The monthly calculation uses USD/MMBtu for prices and USD for the service fee.

```text
Local charges   = volume × (basis + delivery) + monthly fee
All-variable    = volume × cash price + local charges
Fixed-share     = fixed volume × fixed price + floating volume × cash price + local charges
Cost difference = fixed volume × (fixed price − cash price)
```

The fixed volume equals monthly use times the fixed share. The other units float at cash. The winter result sums the five monthly differences before rounding. A negative difference means a cheaper bill in that replay. The model calculates the difference directly so a small effect survives large common charges.

Select **Download CSV** to inspect the five monthly rows. Sum `mixed_minus_variable_USD` for the signed winter result. The export also records the split volumes, local charges, price origin, mark date and source links. Monetary values on screen use cents and the CSV keeps up to six decimal places.

The model matches the fixed volume to actual monthly use and settles both plans against the same monthly index. Taxes, supplier premiums, financing, margin, volume mismatches and timing differences fall outside the calculation. A plant with uneven daily use can pay a different average cash price. Negative basis and market prices are supported. Volumes, delivery tariffs and service fees must be nonnegative.

## Run or audit the project

From the repository root, run `python -m http.server 8000`. Open `http://localhost:8000/lab/industrial/`. The browser application runs without API keys or runtime packages.

To check the links, frozen data hashes and Python and Node.js regression tests, run the validator.

```sh
python scripts/validate.py
```

[Validation instructions](VALIDATION.md) · [Calculation model](lab/industrial/model.js) · [Frozen market data](lab/industrial/market.js) · [SEC position audit](lab/industrial/forward-audit.csv)

Maintainers can rebuild the asset with `python lab/industrial/refresh.py saved-eia-monthly.html`, or omit the file argument to request the source page. The [builder](lab/industrial/refresh.py) checks the reconstructed marks against the position audit. Review changes and update the [snapshot manifest](SOURCE_SNAPSHOT.json) when publishing a new data vintage.

John Barreto maintains this standalone edition. The original implementation is preserved in the [original research lab snapshot](https://github.com/NeuraX-JB/Henry-Hub-Futures-Curve-Explorer-How-the-Natural-Gas-Market-prices-winter/tree/80c2e5321dadc95aadd4c7f65792fb15f0e2f156). Reuse is subject to the [source and third-party terms](DATA_SOURCES.md).
