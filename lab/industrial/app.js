(() => {
  "use strict";
  try {
  const data = globalThis.GAS_COST_MARKET;
  const model = globalThis.GasCostModel;
  const $ = id => document.getElementById(id);
  const money = new Intl.NumberFormat("en-US",{style:"currency", currency:"USD", minimumFractionDigits:2, maximumFractionDigits:2});
  const units = new Intl.NumberFormat("en-US",{maximumFractionDigits:2});
  const chartScale = new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",notation:"compact",maximumFractionDigits:2});
  const monthName = m => new Date(m+"-01T12:00:00Z").toLocaleDateString("en-US",{month:"short",year:"2-digit",timeZone:"UTC"});
  const longDate = d => new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"});
  const profiles = {mill:[9000,9600,9900,9300,9100],factory:[4100,4700,5200,4600,4200]};
  const years = model.availableSeasons(data);
  if(!years.length)throw Error("The bundled data contains no complete winter.");
  let current = null;
  let announcement;
  function option(select,value,label){select.add(new Option(label,value));}
  function inputValue(input,label,min=-Infinity,max=Infinity) {
    const value=input.valueAsNumber;
    if (!Number.isFinite(value)||value<min||value>max){
      input.setAttribute("aria-invalid","true");
      input.setAttribute("aria-describedby",[...new Set([...(input.getAttribute("aria-describedby")||"").split(/\s+/).filter(Boolean),"error"])].join(" "));
      throw Error(label+" needs a valid number"+(min===-Infinity?".":min===0 && max===100?" from 0 to 100.":" of zero or more."));
    }
    return value;
  }
  function setProfile(name) {
    if(name==="custom")return;
    profiles[name].forEach((q,i)=>{$("qty"+i).value=q;});
  }
  function configureSeason(reset=false) {
    const year=Number($("season").value);
    model.months(year).forEach((m,i)=>{$("month"+i).textContent=monthName(m);$("qty"+i).setAttribute("aria-label",monthName(m)+" consumption in MMBtu");});
    const curves=model.eligibleCurves(data,year);
    const select=$("quote");
    const previous=select.value;
    select.replaceChildren();
    curves.forEach(d=>option(select,d,longDate(d)+" curve"));
    option(select,"manual","Assumed flat quote");
    select.value=!reset&&(previous==="manual"||curves.includes(previous))?previous:curves[0]||"manual";
  }
  function assumptions() {
    const year=Number($("season").value);
    const months=model.months(year);
    const source=$("quote").value;
    const manual=source==="manual";
    const share=inputValue($("share"),"Fixed share",0,100)/100;
    const quantities=months.map((m,i)=> inputValue($("qty"+i),monthName(m)+" consumption",0));
    const fx=manual&&share>0?inputValue($("manual"),"Assumed fixed price"):0;
    const spots=months.map(m=>data.spot[m]);
    const forwards=months.map(m=>manual?fx:data.curves[source].prices[m]);
    return {months,year,source,manual,quantities,spots,forwards,share,
      basis:inputValue($("basis"),"Basis differential"),delivery:inputValue($("delivery"),"Delivery tariff",0),
      monthlyFee:inputValue($("fee"),"Service charge",0)};
  }
  function displayNotes() {
    const source=$("quote").value, isManual=source==="manual";
    $("manualWrap").hidden=!isManual;
    $("manual").disabled=$("share").valueAsNumber===0;
    $("price-note").textContent=$("share").valueAsNumber===0?"At 0% fixed, no fixed-price quote is applied; both plans use monthly cash prices.":isManual?
      "The same assumed fixed quote applies to each delivery month. Enter a documented historical quote or use this as a sensitivity scenario.":
      "Fixed prices use the "+longDate(source)+" pre-winter curve. These exchange marks were reconstructed later from fund holdings. Executable plant quotes can differ.";
    const note=$("snapshot-notes");
    note.textContent="Fixed-price references come from U.S. 12 Month Natural Gas Fund SEC holdings. For an NYMEX contract, (original notional + signed unrealized gain/loss) ÷ (contracts × 10,000 MMBtu) gives the price, rounded to $0.001. The observation precedes winter; the filing was published later. ";
    if(!isManual){
      const link=document.createElement("a"); link.href=data.curves[source].source;link.textContent="Selected SEC filing";note.append(link,document.createTextNode(". "));
    }
    const audit=document.createElement("a");audit.href="forward-audit.csv";audit.textContent="Download position audit";note.append(audit,document.createTextNode("."));
  }
  function appendCell(tr,text,css="",rowHeader=false) {
    const cell=document.createElement(rowHeader?"th":"td");if(rowHeader)cell.scope="row";cell.textContent=text;cell.className=css;tr.appendChild(cell);
  }
  function chart(result,a) {
    const root=$("chart");root.replaceChildren();
    const min=Math.min(0,...result.rows.flatMap(r=>[r.variable,r.mixed]));
    const max=Math.max(0,...result.rows.flatMap(r=>[r.variable,r.mixed]));
    const range=max-min || 1;
    const zero=(0-min)/range*100;
    result.rows.forEach((row,i)=>{
      const block=document.createElement("div");block.className="plot-row";
      const label=document.createElement("span");label.textContent=monthName(a.months[i]);
      const bars=document.createElement("div");bars.className="bars";
      for(const [key,amount] of [["variable",row.variable],["mixed",row.mixed]]){
        const track=document.createElement("div");track.className="track";
        const z=document.createElement("i");z.className="zero-line";z.style.left=zero+"%";
        const bar=document.createElement("div");bar.className="bar "+key;
        bar.style.left=((Math.min(0,amount)-min)/range*100)+"%";bar.style.width=(Math.abs(amount)/range*100)+"%";
        track.title=(key==="variable"?"All variable: ":"Fixed share: ")+money.format(amount);
        track.append(z,bar);bars.append(track);
      }
      block.append(label,bars);root.append(block);
    });
    $("chart-note").textContent="Shared monthly scale: "+chartScale.format(min)+" to "+chartScale.format(max)+". Winter volume: "+
      units.format(result.quantity)+" MMBtu. Local basis, delivery and service charges: "+money.format(result.local)+" in either budget.";
  }
  function render() {
    clearTimeout(announcement);
    document.querySelectorAll('[aria-invalid="true"]').forEach(input=>{
      input.removeAttribute("aria-invalid");
      const remaining=(input.getAttribute("aria-describedby")||"").split(/\s+/).filter(id=>id&&id!=="error").join(" ");
      if(remaining)input.setAttribute("aria-describedby",remaining);else input.removeAttribute("aria-describedby");
    });
    try {
      displayNotes();
      const a=assumptions(),r=model.calculate(a), absolute=Math.abs(r.difference);
      if (![r.quantity,r.variable,r.mixed,r.difference,r.local].every(Number.isFinite)) throw Error("These values exceed the supported calculation range.");
      current={a,r};$("error").hidden=true;$("output").hidden=false;$("export").disabled=false;
      $("varTotal").textContent=money.format(r.variable);$("mixTotal").textContent=money.format(r.mixed);
      $("mixSub").textContent=units.format(100*a.share)+"% fixed · "+units.format(100*(1-a.share))+"% at cash";
      $("deltaTotal").textContent=money.format(absolute);
      $("deltaSub").textContent=absolute===0?"Same seasonal cost":absolute<.005?"Difference below $0.01":r.difference<0?"Lower seasonal cost":"Higher seasonal cost";
      $("deltaTotal").parentNode.classList.toggle("expensive",r.difference>=.005);
      chart(r,a);
      const body=$("breakdown");body.replaceChildren();
      r.rows.forEach((row,i)=>{
        const tr=document.createElement("tr");
        [monthName(a.months[i]),units.format(row.q),row.spot.toFixed(2),a.share===0?"Not applied":row.forward.toFixed(3),
          money.format(row.local),money.format(row.variable),money.format(row.mixed)].forEach((v,i)=>appendCell(tr,v,"",i===0));
        appendCell(tr,money.format(row.difference),row.difference<0?"saving":row.difference>0?"more":""); body.append(tr);
      });
      const tr=document.createElement("tr");
      ["Winter",units.format(r.quantity),"—","—",money.format(r.local),money.format(r.variable),money.format(r.mixed),money.format(r.difference)].forEach((v,i)=>appendCell(tr,v,"",i===0));
      $("totals").replaceChildren(tr);
      announcement=setTimeout(()=>{$("result-status").textContent="Budget updated. All variable "+money.format(r.variable)+"; fixed share "+money.format(r.mixed)+". "+$("deltaSub").textContent+": "+money.format(absolute)+".";},350);
    } catch(e) {
      $("result-status").textContent="";
      current=null;$("error").textContent=e.message;$("error").hidden=false;$("output").hidden=true;$("export").disabled=true;
    }
  }
  function download() {
    if(!current)return;
    const {a,r}=current;
    const headers=["delivery_month","volume_MMBtu","fixed_share_pct","fixed_volume_MMBtu","floating_volume_MMBtu","cash_USD_per_MMBtu","fixed_USD_per_MMBtu","basis_USD_per_MMBtu","delivery_USD_per_MMBtu","service_charge_USD","basis_total_USD","delivery_total_USD","local_total_USD","all_variable_hub_cost_USD","fixed_leg_cost_USD","floating_leg_cost_USD","all_variable_delivered_USD","fixed_share_delivered_USD","mixed_minus_variable_USD","fixed_price_origin","fixed_mark_date","EIA_source","fixed_price_source"];
    const lines=r.rows.map((row,i)=>[a.months[i],row.q,a.share*100,row.fixedVolume,row.openVolume,row.spot,a.share===0?"":row.forward,a.basis,a.delivery,a.monthlyFee,row.basisCost,row.transport,row.local,row.physical,row.fixedCost,row.openCost,row.variable,row.mixed,row.difference,a.share===0?"Not applied (0% fixed)":a.manual?"User assumed flat quote":"Reconstructed pre-winter NYMEX mark",a.manual?"":a.source,data.spotUrl,a.manual?"User input":data.curves[a.source].source]);
    const csv=[headers,...lines].map(line=>line.map(v=>typeof v==="number"?String(+v.toFixed(6)):'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\r\n")+"\r\n";
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    const link=document.createElement("a");link.href=url;link.download="industrial-gas-budget-"+a.year+"-"+(a.year+1)+".csv";
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
  }
  function initial() {
    $("season").value=years[0];$("profile").value="mill";$("share").value=50;$("manual").value="3.50";
    $("basis").value=".20";$("delivery").value=".35";$("fee").value=0;setProfile("mill");configureSeason(true);render();
  }
  years.forEach(y=>option($("season"),y,y+"–"+(y+1)));
  for(let i=0;i<5;i++){
    const label=document.createElement("label");const span=document.createElement("span");span.id="month"+i;
    const input=document.createElement("input");input.id="qty"+i;input.type="number";input.min=0;input.step="any";
    label.append(span,input);$("volumes").append(label);
  }
  const range=Object.keys(data.spot).sort();
  $("coverage").textContent="EIA cash archive "+range[0]+" through "+range.at(-1)+" · EIA release "+longDate(data.eiaRelease)+
    " · "+years.length+" complete winters. Earlier winters without archived pre-season marks use the assumed flat quote.";
  $("snapshot-status").textContent="Historical snapshot · cash observations through "+range.at(-1)+" · EIA release "+longDate(data.eiaRelease)+" · no live feed or automatic updates";
  $("assumptions").addEventListener("submit",e=>e.preventDefault());
  $("assumptions").addEventListener("input",e=>{
    if(e.target.tagName==="SELECT")return;
    if(e.target.id.startsWith("qty"))$("profile").value="custom";render();
  });
  $("assumptions").addEventListener("change",e=>{
    if(e.target.tagName!=="SELECT")return;
    if(e.target.id==="season")configureSeason();
    if(e.target.id==="profile")setProfile(e.target.value);
    render();
  });
  $("export").addEventListener("click",download);$("reset").addEventListener("click",initial);initial();
  $("load-status").hidden=true;
  } catch(error) {
    const status=document.getElementById("load-status");
    status.textContent="The simulator could not load its bundled data. Reload the page or consult the project README for local-server instructions.";
    const guide=document.createElement("a");guide.href="../../README.md";guide.textContent=" Read setup instructions.";status.append(guide);
    status.setAttribute("role","alert");status.hidden=false;
    document.getElementById("output").hidden=true;
    document.getElementById("export").disabled=true;
    console.error(error);
  }
})();
