/* Physical procurement at a monthly cash index, with a matched-volume fixed-price leg. */
(() => {
  "use strict";
  function months(year) {
    return [year+"-11",year+"-12",(year+1)+"-01",(year+1)+"-02",(year+1)+"-03"];
  }
  function availableSeasons(data) {
    const years = [...new Set(Object.keys(data.spot).map(m=>Number(m.slice(0,4))))];
    return years.filter(y=>months(y).every(m=>Number.isFinite(data.spot[m]))).sort((a,b)=>b-a);
  }
  function eligibleCurves(data, year) {
    const deliveries = months(year);
    return Object.keys(data.curves).filter(date=> date < deliveries[0]+"-01" &&
      deliveries.every(m=>Number.isFinite(data.curves[date].prices[m]))).sort().reverse();
  }
  function calculate({quantities, spots, forwards, share, basis, delivery, monthlyFee}) {
    const scalar = [share,basis,delivery,monthlyFee];
    if(!scalar.every(Number.isFinite)||share<0||share>1||delivery<0||monthlyFee<0) throw Error("Check your purchase assumptions.");
    if([quantities,spots,forwards].some(a=>!Array.isArray(a)||a.length!==5||!a.every(Number.isFinite))||
      quantities.some(q=>q<0)) throw Error("All five monthly quantities and prices must be valid.");
    const rows=quantities.map((q,i)=>{
      const physical=q*spots[i], fixedVolume=q*share, openVolume=q-fixedVolume;
      const localBasis=q*basis, transport=q*delivery, local=localBasis+transport+monthlyFee;
      const fixedCost=fixedVolume*forwards[i], openCost=openVolume*spots[i];
      const variable=physical+local, mixed=fixedCost+openCost+local;
      return {q, spot:spots[i], forward:forwards[i], fixedVolume, openVolume, physical, fixedCost, openCost,
        basisCost:localBasis,transport,monthlyFee,local,variable,mixed,difference:mixed-variable};
    });
    function sum(key){return rows.reduce((acc,row)=>acc+row[key],0);}
    return {rows, quantity:sum("q"), variable:sum("variable"), mixed:sum("mixed"), difference:sum("difference"), local:sum("local")};
  }
  globalThis.GasCostModel = {months, availableSeasons, eligibleCurves, calculate};
  if(typeof module==="object" && typeof module.exports==="object") module.exports=globalThis.GasCostModel;
})();
