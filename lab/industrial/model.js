/* Physical procurement at a monthly cash index, with a matched-volume fixed-price leg. */
(() => {
  "use strict";
  function months(year) {
    const y=Number(year);
    if(!Number.isInteger(y)||y<1||y>9998) throw Error("Choose a winter start year from 1 to 9998.");
    const current=String(y).padStart(4,"0"), next=String(y+1).padStart(4,"0");
    return [current+"-11",current+"-12",next+"-01",next+"-02",next+"-03"];
  }
  function availableSeasons(data) {
    const years = [...new Set(Object.keys(data.spot).map(m=>Number(m.slice(0,4))))];
    return years.filter(y=>y>=1&&y<=9998&&months(y).every(m=>Number.isFinite(data.spot[m]))).sort((a,b)=>b-a);
  }
  function eligibleCurves(data, year) {
    const deliveries = months(year);
    return Object.keys(data.curves).filter(date=> date < deliveries[0]+"-01" &&
      deliveries.every(m=>Number.isFinite(data.curves[date].prices[m]))).sort().reverse();
  }
  function calculate({quantities, spots, forwards, share, basis, delivery, monthlyFee}) {
    const scalar = [share,basis,delivery,monthlyFee];
    if(!scalar.every(Number.isFinite)||share<0||share>1||delivery<0||monthlyFee<0) throw Error("Check your purchase assumptions.");
    if([quantities,spots,forwards].some(a=>!Array.isArray(a)||a.length!==5||!Array.from(a).every(Number.isFinite))||
      quantities.some(q=>q<0)) throw Error("All five monthly quantities and prices must be valid.");
    const rows=quantities.map((q,i)=>{
      const physical=q*spots[i], fixedVolume=q*share, openVolume=q-fixedVolume;
      const localBasis=q*basis, transport=q*delivery, local=localBasis+transport+monthlyFee;
      const fixedCost=fixedVolume*forwards[i], openCost=openVolume*spots[i];
      const variable=physical+local, mixed=fixedCost+openCost+local;
      const difference=fixedVolume===0?0:fixedVolume*(forwards[i]-spots[i]);
      return {q, spot:spots[i], forward:forwards[i], fixedVolume, openVolume, physical, fixedCost, openCost,
        basisCost:localBasis,transport,monthlyFee,local,variable,mixed,difference};
    });
    function sum(key){return rows.reduce((acc,row)=>acc+row[key],0);}
    const result={rows, quantity:sum("q"), variable:sum("variable"), mixed:sum("mixed"), difference:sum("difference"), local:sum("local")};
    const costs=rows.flatMap(row=>[row.variable,row.mixed]);
    const range=Math.max(0,...costs)-Math.min(0,...costs);
    if(!rows.every(row=>Object.values(row).every(Number.isFinite))||
       ![result.quantity,result.variable,result.mixed,result.difference,result.local,range].every(Number.isFinite)) {
      throw Error("These values exceed the supported calculation range. Reduce the quantities or prices.");
    }
    return result;
  }
  globalThis.GasCostModel = {months, availableSeasons, eligibleCurves, calculate};
  if(typeof module==="object" && typeof module.exports==="object") module.exports=globalThis.GasCostModel;
})();
