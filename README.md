# Industrial Gas Cost Simulator

**John Barreto · Independent natural gas research**

Replay industrial winter gas costs and compare floating versus fixed-share procurement scenarios.

**[Open the live project](https://neurax-jb.github.io/Henry-Hub-Futures-Curve-Explorer-How-the-Natural-Gas-Market-prices-winter/lab/industrial/) · [Research portfolio](https://neurax-jb.github.io/Henry-Hub-Futures-Curve-Explorer-How-the-Natural-Gas-Market-prices-winter/lab/)**

**Methods and tools:** JavaScript, Python, energy procurement, scenario modelling.

## Research question
How does fixing part of an illustrative industrial plant's gas consumption change its winter fuel budget?

Compare historical monthly Henry Hub spot prices and fixed-price scenarios, including adjustable consumption, local basis, variable delivery tariffs and service charges. Archived forward quotes are distinguished from illustrative assumptions. The model excludes taxes, margin, financing and volume deviations; it is not a live procurement quote.

## Methods and evidence
- [Budget calculation model](lab/industrial/model.js)
- [Historical forward-price audit](lab/industrial/forward-audit.csv)
- [Market data builder](lab/industrial/refresh.py)
- [Calculation tests](lab/industrial/model.test.cjs)

## Run locally
Serve the root with `python -m http.server 8000` and visit `http://localhost:8000/lab/industrial/`. Run `node --test lab/industrial/model.test.cjs` to validate the cost calculations.

## Source and publication

This repository is a project-specific snapshot of the [canonical research lab](https://github.com/NeuraX-JB/Henry-Hub-Futures-Curve-Explorer-How-the-Natural-Gas-Market-prices-winter). The live site and automated updates remain there, so the existing website and forecast ledger are preserved. Check the [source and attribution notes](DATA_SOURCES.md) before reusing third-party data. No new license is granted. Research and educational use; not investment advice.
