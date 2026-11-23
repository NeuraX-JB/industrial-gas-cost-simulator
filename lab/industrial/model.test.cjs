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

test("sparse arrays cannot masquerade as five valid observations",()=>{
 for(const field of ["quantities","spots","forwards"]){
  assert.throws(()=>m.calculate({...base,[field]:new Array(5)}),/five monthly/);
  const partial=[1,2,3,4,5];delete partial[2];assert.throws(()=>m.calculate({...base,[field]:partial}),/five monthly/);
 }
});
test("finite inputs that overflow rows, totals or the shared chart range are rejected",()=>{
 assert.throws(()=>m.calculate({...base,quantities:Array(5).fill(1e308)}),/supported calculation range/);
 assert.throws(()=>m.calculate({...base,quantities:[1,1,1,1,1],spots:Array(5).fill(1e308),forwards:Array(5).fill(1e308),basis:0,delivery:0,monthlyFee:0}),/supported calculation range/);
 assert.throws(()=>m.calculate({...base,quantities:[1,1,0,0,0],spots:[-1e308,1e308,0,0,0],forwards:[-1e308,1e308,0,0,0],basis:0,delivery:0,monthlyFee:0}),/supported calculation range/);
});
test("small fixed-price effects survive very large common local charges",()=>{
 const r=m.calculate({...base,quantities:[1,1,1,1,1],basis:1e18,delivery:0,monthlyFee:0});
 assert.equal(r.difference,2.5);
 assert.equal(r.rows[0].difference,.5);
 assert.equal(r.mixed,r.variable); // IEEE-754 totals cannot resolve this small difference.
});
test("winter years normalize numeric strings and retain four-digit calendar labels",()=>{
 assert.deepEqual(m.months("2025"),["2025-11","2025-12","2026-01","2026-02","2026-03"]);
 assert.deepEqual(m.months(1),["0001-11","0001-12","0002-01","0002-02","0002-03"]);
 for(const year of [0,9999,2025.5,"",NaN])assert.throws(()=>m.months(year),/winter start year/);
});
test("the published market asset remains byte-identical",()=>{
 const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
 assert.equal(crypto.createHash("sha256").update(fs.readFileSync(path.join(__dirname,"market.js"))).digest("hex"),"5856f9a890e4b5031df28354aeef305e86615b6d464c67e9dd5587b2a7303653");
});
