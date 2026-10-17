// 1.61 (A) : verser dans le Labo quand il reste peu de place. Verre Highball (contenance effective), place restante 9, 5, 1,
// 0,5 et 0,1 cl ; pour un ingrédient de chaque catégorie (dont le tonic) et par chaque chemin (tuile, « + » du stepper,
// « + » d'un conseil, ajout direct, « Autre » [1.63]) : on verse min(dose prévue, place), arrondi au 0,05 cl, sans jamais déborder ;
// refus seulement à 0 cl, avec un seul message. « Ajuster au verre » remplit la contenance effective sans la dépasser.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ if(!localStorage.getItem("zeste.v1")) localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false}},stock:{gin:3,tonic:1}})); });
  await p.goto(APP); await p.waitForTimeout(2500);
  const r=await p.evaluate(()=>{ const out=[]; const cats=["spirit","liqueur","amaro","vin","sirop","jus","frais","bitters"]; const ids=["tonic","soda","ginger_beer"].filter(x=>ING[x]);
    cats.forEach(c=>{ const id=Object.keys(ING).find(k=>ING[k].cat===c&&k!=="gin"&&!ING[k].al); if(id&&!ids.includes(id)) ids.push(id); });
    LT="compose"; switchTab("labo");
    const avail=()=>{ const {g,ice}=labGlass(); return labAvail(g,ice); };
    const vol=()=>labVol(S.mix.items.map(it=>({id:it.id,q:it.q,u:unitOf(it.id),r:ING[it.id].fizz&&S.mix.m!=="build"?"top":""})),S.mix.m,labGlass().ice);
    // remplit avec du gin (et éventuellement l'ingrédient testé déjà présent) pour laisser « space » ml
    const setup=(space,withId,m)=>{ S.mix=Object.assign(S.mix,{m:m||"build",g:"highball",gUser:1,ice:"cubes",gar:[],items:[{id:"gin",q:10}].concat(withId?[{id:withId,q:unitOf(withId)==="ml"?10:2}]:[])});
      let lo=0,hi=2000; for(let k=0;k<60;k++){ const mid=(lo+hi)/2; S.mix.items[0].q=mid; if(vol()<=avail()-space) lo=mid; else hi=mid; } S.mix.items[0].q=lo; STC={}; MEMO={}; };
    const toastN=()=>{ const t=document.getElementById('toast'); return t&&t.classList.contains('show')&&/Plus de place/.test(t.textContent)?1:0; };
    const q=id=>(S.mix.items.find(i=>i.id===id)||{q:0}).q;
    for(const m of ["build","shake"]) for(const id of ids) for(const space of [90,50,10,5,1,0]){
      const ml=unitOf(id)==="ml";
      for(const path of ["tuile","stepper","conseil","ajout","autre"]){
        setup(space,path==="stepper"?id:null,m); const before=q(id), v0=vol(), snap=JSON.stringify(S.mix.items); document.getElementById('toast')&&document.getElementById('toast').classList.remove('show');
        try{ if(path==="tuile") ACT.mixpour({id}); if(path==="stepper") ACT.mixq({k:S.mix.items.findIndex(i=>i.id===id),d:1}); if(path==="conseil") ACT.mixfix({id,q:defaultQ(id)}); if(path==="ajout") ACT.mixadd1({id}); if(path==="autre"){ const pk=pickIngSheet; pickIngSheet=cb=>cb(id); try{ ACT.mixadd({}); } finally{ pickIngSheet=pk; } } }catch(e){ out.push([m,id,space,path,"erreur "+e.message]); continue; }
        const added=Math.round((q(id)-before)*100)/100, v1=vol(), A=avail(), over=v1>A+1e-6&&v1>v0+1e-6, t=toastN(), after=JSON.stringify(S.mix.items);
        // place réelle : au moins 0,05 cl de cet ingrédient tient-il ? (au shaker, l'alcool ajouté augmente aussi la dilution de tout le mélange)
        const ex=S.mix.items.find(i=>i.id===id); S.mix.items=JSON.parse(snap); const half=(()=>{ const bk=S.mix.items; const e=bk.find(i=>i.id===id); S.mix.items=e? bk.map(i=>i===e?Object.assign({},i,{q:i.q+0.5}):i) : bk.concat([{id,q:0.5}]); const ok=vol()<=avail()+1e-6; S.mix.items=bk; return ok; })(); if(ex) S.mix.items=JSON.parse(after);
        if(space>0&&ml&&half&&added<=0) out.push([m,id,space,path,"rien versé alors que 0,05 cl tient"]);
        if(over) out.push([m,id,space,path,"déborde : "+v1.toFixed(1)+" > "+A.toFixed(1)]);
        if(space===0&&added>0) out.push([m,id,space,path,"versé alors que le verre est plein"]);
        if(space===0&&ml&&t!==1) out.push([m,id,space,path,"pas de message unique de refus ("+t+")"]);
        if(ml&&added>0&&Math.abs(added*20-Math.round(added*20))>1e-6) out.push([m,id,space,path,"dose non arrondie au 0,05 cl : "+added]); } }
    // « Ajuster au verre » : remplit la contenance effective sans la dépasser
    setup(150,"tonic","build"); ACT.mixfit(); const f=vol()/avail(); if(!(f>=0.97&&f<=1+1e-6)) out.push(["build","tonic",150,"ajuster","remplissage "+f.toFixed(3)]);
    return out; });
  if(r.length) fail.push(r.length+' cas : '+r.slice(0,12).map(x=>x.join(" / ")).join(" ¦ "));
  if(errs.length) fail.push('erreurs JS : '+[...new Set(errs)].join(' | '));
  console.log(fail.length?'ÉCHEC versement : '+fail.join(' ; '):'Versement : min(dose, place) au 0,05 cl près pour toutes les catégories et tous les chemins, jamais de débordement, refus seulement verre plein avec un seul message ; « Ajuster au verre » remplit la contenance.');
  await b.close(); process.exit(fail.length?1:0); })();
