"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {createDOM}=require("./test-dom.cjs");
const read=name=>fs.readFileSync(path.join(__dirname,name),"utf8");
function boot({missingData=false}={}){
 const {document,Option}=createDOM(read("index.html"));const errors=[],timers=new Map(),blobs=[];let tick=0;
 const context=vm.createContext({document,Option,Intl,Blob,console:{error:e=>errors.push(e)},
  URL:{createObjectURL(blob){blobs.push(blob);return "blob:test";},revokeObjectURL(){}},
  setTimeout(fn){timers.set(++tick,fn);return tick;},clearTimeout(id){timers.delete(id);}});
 for(const file of [...(missingData?[]:["market.js"]),"model.js","app.js"])vm.runInContext(read(file),context,{filename:file});
 const change=(id,value)=>{const node=document.getElementById(id);node.value=value;node.dispatchEvent({type:node.tagName==="SELECT"?"change":"input",bubbles:true});};
 const flush=()=>{const current=[...timers.values()];timers.clear();current.forEach(fn=>fn());};
 if(!missingData)assert.deepEqual(errors,[]);
 return {document,context,change,flush,errors,blobs,timers};
}

test("manual quotes survive a winter change, while reset restores the default curve",()=>{
 const {document,change}=boot();change("quote","manual");change("manual","4.25");change("season","2024");
 assert.equal(document.getElementById("quote").value,"manual");assert.equal(document.getElementById("manual").value,"4.25");
 document.getElementById("reset").dispatchEvent({type:"click"});
 assert.equal(document.getElementById("quote").value,"2025-09-30");
});

test("zero fixed share needs no unused manual price and exports no applied fixed quote",async()=>{
 const {document,change,blobs}=boot();change("quote","manual");change("manual","");
 assert.equal(document.getElementById("output").hidden,true);
 change("share","0");
 assert.equal(document.getElementById("output").hidden,false);
 assert.equal(document.getElementById("manual").disabled,true);
 assert.equal(document.getElementById("deltaTotal").textContent,"$0.00");
 assert.equal(document.getElementById("deltaSub").textContent,"Same seasonal cost");
 document.getElementById("export").dispatchEvent({type:"click"});
 assert.match(await blobs[0].text(),/Not applied \(0% fixed\)/);
});

test("sub-dollar and sub-cent effects have consistent monetary labels",()=>{
 const {document,context,change}=boot();change("quote","manual");
 for(let i=0;i<5;i++)document.getElementById("qty"+i).value=i===0?"1":"0";
 const spot=context.GAS_COST_MARKET.spot["2025-11"];
 change("manual",String(spot+.4));
 assert.equal(document.getElementById("deltaTotal").textContent,"$0.20");
 assert.equal(document.getElementById("deltaSub").textContent,"Higher seasonal cost");
 change("manual",String(spot+.002));
 assert.equal(document.getElementById("deltaSub").textContent,"Difference below $0.01");
});

test("invalid inputs are linked to their error and valid corrections clear the invalid state",()=>{
 const {document,change}=boot();change("qty2","-1");const input=document.getElementById("qty2");
 assert.equal(input.getAttribute("aria-invalid"),"true");assert.equal(input.getAttribute("aria-describedby"),"error");
 assert.match(document.getElementById("error").textContent,/consumption/);
 assert.equal(document.getElementById("export").disabled,true);
 change("qty2","4000");assert.equal(input.getAttribute("aria-invalid"),null);
 assert.equal(document.getElementById("output").hidden,false);
  change("quote","manual");change("manual","");
  assert.equal(document.getElementById("manual").getAttribute("aria-describedby"),"price-note error");
  change("manual","3.5");assert.equal(document.getElementById("manual").getAttribute("aria-describedby"),"price-note");
});

test("budget changes announce one concise result and monthly inputs identify their units",()=>{
 const {document,change,flush,timers}=boot();change("share","25");change("share","30");
 assert.equal(timers.size,1);flush();
 assert.match(document.getElementById("result-status").textContent,/Budget updated.*All variable.*fixed share/);
 assert.match(document.getElementById("qty2").getAttribute("aria-label"),/Jan.*26 consumption in MMBtu/);
 assert.equal(document.getElementById("breakdown").children[0].children[0].scope,"row");
});

test("missing assets produce an actionable load error and prevent empty exports",()=>{
 const {document,errors}=boot({missingData:true});
 assert.equal(errors.length,1);assert.match(document.getElementById("load-status").textContent,/could not load.*README/);
 assert.equal(document.getElementById("output").hidden,true);assert.equal(document.getElementById("export").disabled,true);
});
