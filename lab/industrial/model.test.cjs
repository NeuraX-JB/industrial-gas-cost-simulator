"use strict";
const test=require("node:test"); const assert=require("node:assert/strict");
const m=require("./model.js"); require("./market.js"); const market=global.GAS_COST_MARKET;
const base={quantities:[10,20,30,40,50],spots:[2,2,2,2,2],forwards:[3,3,3,3,3],share:.5,basis:.25,delivery:.5,monthlyFee:10};
test("custom quantities, same local charges and math tie out",()=>{const r=m.calculate(base); assert.equal(r.local,162.5);assert.equal(r.variable,462.5);assert.equal(r.mixed,537.5);assert.equal(r.difference,75);});
test("zero share, fully fixed and zero consumption all retain tariff terms",()=>{for(const s of [0,1]){const r=m.calculate({...base,share:s});assert.equal(r.difference,150*s);}
 const r=m.calculate({...base,quantities:[0,0,0,0,0]});assert.equal(r.variable,50);assert.equal(r.mixed,50);assert.equal(r.difference,0);});
test("negative local basis and savings are retained",()=>{const r=m.calculate({...base,basis:-1,forwards:[1,1,1,1,1]});assert.equal(r.difference,-75);assert.equal(r.rows[0].basisCost,-10);});
test("rejects missing monthly delivery, negative physical usage, high fixed share",()=>{for(const a of [{spots:[1,2]}, {quantities:[1,2,3,-1,0]}, {share:1.01},{basis:NaN}])assert.throws(()=>m.calculate({...base,...a}));});
test("full winters only, anchored to earlier independent fixing date",()=>{const seasons=m.availableSeasons(market);assert.ok(seasons[0]>=2025);assert.equal(seasons.at(-1),1997);assert.ok(seasons.length>=29);
 for(const y of seasons){const ms=m.months(y);for(const d of m.eligibleCurves(market,y)){assert.ok(d<ms[0]+"-01");assert.equal(ms.filter(x=>Number.isFinite(market.curves[d].prices[x])).length,5);}}
 assert.equal(m.eligibleCurves(market,2025)[0],"2025-09-30");assert.equal(m.eligibleCurves(market,2020).length,0);assert.equal(market.spot["2026-01"],7.72);assert.equal(market.curves["2025-09-30"].prices["2026-01"],4.177);});
