// ================= LABO V2 : le jeu du barman =================
const LGLASS=[["coupe","Coupe",180],["martini","Martini",150],["rocks","Tumbler",300],["highball","Highball",350],["flute","Flûte",200],["vin","Verre à vin",450],["mug","Mug",400],["tasse","Irish coffee",250],["shot","Shot",50]];
const LCAP=Object.fromEntries(LGLASS.map(x=>[x[0],x[2]]));
const LICE=[["none","Sans",0],["cubes","Glaçons",0.35],["big","Gros glaçon",0.42],["pilee","Pilée",0.45]];
const ICESHARE=Object.fromEntries(LICE.map(x=>[x[0],x[2]]));
const LTYPE=[["auto","Je ne sais pas"],["court","Cocktail court"],["sec","Sec et fort"],["long","Long drink"],["spritz","Spritz"],["shot","Shot"]];
const LGAR=[["zeste_c","🍋","Zeste de citron"],["cv","🍈","Rondelle de citron vert"],["rc","🟡","Rondelle de citron"],["or","🍊","Rondelle d’orange"],["zo","🟠","Zeste d’orange"],["menthe","🌿","Branche de menthe"],["basilic","🌱","Feuille de basilic"],["olive","🫒","Olives vertes"],["cerise","🍒","Cerise"],["sel","🧂","Bord de sel"],["sucre","🍬","Bord sucré"],["concombre","🥒","Rondelle de concombre"],["fraise","🍓","Framboises"],["ananas","🍍","Quartier d’ananas"],["paille","🥤","Paille"],["cannelle","🪵","Bâton de cannelle"],["cafe","☕","Grains de café"],["muscade","🌰","Muscade râpée"]];
const LGARTXT=Object.fromEntries(LGAR.map(x=>[x[0],x[2]]));
function mixState(){ const M=S.mix; M.items=(M.items||[]).filter(i=>i&&ING[i.id]); M.t=M.t||"auto"; M.gar=Array.isArray(M.gar)?M.gar:[]; if(!M.m) M.m="shake"; return M; }
// Style réellement visé : celui choisi, ou deviné d'après le mélange
function labStyle(items,m){
  const t=(S.mix&&S.mix.t)||"auto", guess=styleOf(items,m);
  if(t==="sec") return "stirred"; if(t==="long") return "long"; if(t==="spritz") return "spritz";
  if(t==="court") return guess==="long"||guess==="spritz"? "sour" : guess;
  return guess;
}
// Recommandations du barman selon le style
function labReco(st, items){
  const acid=items.some(i=>["citron","citron_vert","pamplemousse","ananas"].includes(i.id)), egg=items.some(i=>["blanc_oeuf","oeuf","creme"].includes(i.id));
  const t=mixState().t;
  if(t==="shot") return {g:"shot",ice:"none",m:acid?"shake":"build"};
  if(st==="long") return {g:"highball",ice:"cubes",m:acid&&items.filter(i=>!ING[i.id].fizz).length>2?"shake":"build"};
  if(st==="spritz") return {g:"vin",ice:"cubes",m:"build"};
  if(st==="stirred"){ const ids=items.map(i=>i.id), grp=SPIRIT_GROUP[baseOf(items)];
    if(ids.some(i=>["vermouth_dry","lillet","vermouth_blanc"].includes(i))&&!ids.includes("campari")) return {g:"martini",ice:"none",m:"stir"};
    if(["whisky","brandy","rhum","agave","amer"].includes(grp)||ids.includes("campari")) return {g:"rocks",ice:"big",m:"stir"};
    return {g:"coupe",ice:"none",m:"stir"}; }
  if(st==="cremeux") return {g:"coupe",ice:"none",m:"shake"};
  return {g:"coupe",ice:"none",m:(acid||egg)?"shake":"stir"};
}
function labGlass(){ const M=mixState(), items=mixItems(); const st=items.length?labStyle(items,M.m):({long:"long",spritz:"spritz",sec:"stirred"}[M.t]||"sour"); const rec=labReco(st,items); return {g:M.g||rec.g, ice:M.ice||rec.ice, rec}; }
function mixIce(){ return labGlass().ice; }
function labAvail(g,ice){ return (LCAP[g]||250)*(1-(ICESHARE[ice]||0)); }
function labVol(items,m,ice){ return items.length? calc(items,m,ice).vol : 0; }
function labSuggestGar(items){
  const ids=items.map(i=>i.id), base=baseOf(items), grp=base&&SPIRIT_GROUP[base];
  if(ids.includes("gin")&&ids.includes("vermouth_dry")) return ["olive","zeste_c"];
  if(ids.includes("menthe")) return ["menthe","cv"];
  if(ids.includes("campari")||ids.includes("aperol")) return ["or","zo"];
  if(ids.includes("espresso")||ids.includes("kahlua")) return ["cafe"];
  if(ids.includes("creme")||ids.includes("creme_cacao")) return ["muscade"];
  if(ids.includes("creme_coco")||ids.includes("ananas")) return ["ananas","cerise","paille"];
  if(ids.includes("fraise_puree")||ids.includes("sirop_framboise")) return ["fraise"];
  return ({gin:["zeste_c","concombre"],agave:["sel","cv"],rhum:["cv","menthe"],whisky:["zo","cerise"],vodka:["cv","rc"],brandy:["zo","rc"],eaux:["zeste_c","rc"],amer:["or","zo"],gingembre:["cv","menthe"]})[grp]||["zeste_c","rc"];
}
// Score façon jeu : six objectifs
function labScore(A){
  const M=mixState(), {g,ice}=labGlass(), st=A.st, z=A.z, met=A.met, avail=labAvail(g,ice), fill=met.vol/avail;
  // dans la plage des classiques = plein score, puis ça décroît en s'éloignant
  const zone=(v,lo,hi,span)=>{ v=Math.max(v,1e-3); if(v>=lo&&v<=hi) return 1; const d=v<lo? Math.log(lo/v) : Math.log(v/hi); return Math.max(0,1-d/Math.log(span)); };
  let bal; if(st==="stirred"||st==="cremeux") bal=zone(met.sug,z.sug[0]*0.2,z.sug[2]*1.15,3); else bal=0.6*zone(A.ratio,z.ratio[0]*0.8,z.ratio[2]*1.2,2.2)+0.4*zone(met.acid,z.acid[0]*0.8,z.acid[2]*1.2,2.5);
  const abv=M.t==="shot"||met.abv<0.5?1:zone(met.abv,z.abv[0]*0.85,z.abv[2]*1.15,2);
  const fillS= fill>=0.6&&fill<=1.02?1: fill>=0.42?0.55: fill>1.02?0: 0.15;
  const iceOk={long:["cubes","pilee"],spritz:["cubes","big","none"],stirred:["big","none","cubes"],sour:["none","cubes","pilee"],cremeux:["none","cubes"]}[st]||["none","cubes","big","pilee"];
  const iceS= M.t==="shot"? (ice==="none"?1:0.2) : iceOk.includes(ice)?1:0.2;
  const glassOk={long:["highball","mug","vin","rocks"],spritz:["vin","flute","highball","coupe"],stirred:["rocks","coupe","martini"],sour:["coupe","martini","rocks"],cremeux:["coupe","martini","rocks","tasse"]}[st]||[];
  const glassS= M.t==="shot"? (g==="shot"?1:0.2) : glassOk.includes(g)?1:0.3;
  const sug=labSuggestGar(A.items), garS= !M.gar.length?0: M.gar.some(x=>sug.includes(x))?1:0.5;
  const goals=[["bal","Équilibre",bal,25],["abv","Force",abv,20],["fill","Remplissage",fillS,15],["glass","Verre",glassS,15],["ice","Glace",iceS,15],["gar","Décor",garS,10]];
  const score=Math.round(goals.reduce((a,x)=>a+x[2]*x[3],0));
  return {score,goals,fill,avail,sug};
}
function labGrade(s){ return s>=90?["Digne d’un chef de bar","🏆"]:s>=78?["Très bon","🥂"]:s>=60?["Pas mal du tout","👍"]:s>=40?["À retravailler","🔧"]:["Continue tes essais","🧪"]; }
let LAB_LASTY=null, LAB_SERVE=null;
function labBlendCol(items){ let V=0,rr=0,gg=0,bb=0; items.forEach(i=>{ if(i.u==="f"||i.u==="u"||i.u==="br") return; const ml=Math.max(mlOf(i),0.5), c=colOf(i.id); V+=ml; rr+=parseInt(c.slice(1,3),16)*ml; gg+=parseInt(c.slice(3,5),16)*ml; bb+=parseInt(c.slice(5,7),16)*ml; }); return V? "#"+[rr,gg,bb].map(x=>Math.round(x/V).toString(16).padStart(2,"0")).join("") : "#E8D8B0"; }
function labGlassSVG(big){
  const M=mixState(), items=mixItems(), {g,ice}=labGlass(), vol=labVol(items,M.m,ice), fill=vol/labAvail(g,ice);
  const r={id:"lab"+items.length+g+ice,g,col:labBlendCol(items),ice,ing:items,gar:"",garList:M.gar.map(k=>LGARTXT[k]),fam:""};
  const sh=GLASS_SHAPES[g]||GLASS_SHAPES.rocks, ly=sh.mug?null:sh.bot-Math.max(0,Math.min(1,fill))*(sh.bot-(sh.rim[2]+1.8));
  const from=LAB_LASTY!=null&&ly!=null&&Math.abs(LAB_LASTY-ly)>0.3?LAB_LASTY:null; if(big) LAB_LASTY=ly;
  if(big&&from!=null) requestAnimationFrame(()=>document.querySelectorAll(".lab-glass animateTransform.smil").forEach(a=>{ try{ a.beginElement(); }catch(e){} }));
  return glassSVG(r,{fill:Math.min(1,fill),live:1,smilFrom:big&&from!=null?Math.max(0,from-ly):null,smilDur:0.65});
}
function vCompose(){
  const M=mixState(), items=M.items, A=items.length?analyze():null, {g,ice,rec}=labGlass(), avail=labAvail(g,ice), vol=A?A.met.vol:0, fill=vol/avail;
  const SC=A?labScore(A):null, served=LAB_SERVE&&LAB_SERVE.key===JSON.stringify(M);
  let o=`<div class="sp16"></div>`;
  // ---- la scène ----
  o+=`<div class="lab-stage ${fill>1.02?"over":""}"><div class="lab-glow" style="background:radial-gradient(circle at 50% 55%, ${A?labBlendCol(mixItems()):"#E8D8B0"}66, transparent 62%)"></div>
    <div class="lab-top"><span class="lab-chip">${esc(LTYPE.find(x=>x[0]===M.t)[1]==="Je ne sais pas"?(A?"Style deviné : "+{sour:"cocktail court",stirred:"sec et fort",long:"long drink",spritz:"spritz",cremeux:"crémeux"}[A.st]:"Style libre"):LTYPE.find(x=>x[0]===M.t)[1])}</span>${SC?`<span class="lab-score ${served?"shown":""}" data-a="mixserve"><b>${served?SC.score:"?"}</b><i>/100</i></span>`:""}</div>
    <div class="lab-glass" data-a="jiggle">${labGlassSVG(true)}<div class="lab-tool"></div></div>
    <div class="lab-gauge"><div class="lab-gbar"><i style="width:${Math.min(100,fill*100).toFixed(0)}%"></i></div><span>${fmtMl(vol)} versés sur ${fmtMl(avail)} disponibles${ICESHARE[ice]?", glace déduite":""}</span></div>
    ${SC?`<div class="lab-goals">${SC.goals.map(([k,n,v])=>`<span class="goal ${v>=0.85?"ok":k==="gar"?"bonus":v>=0.5?"mid":""}"><i>${v>=0.85?IC.check:k==="gar"?"+":v>=0.5?"~":"·"}</i>${n}</span>`).join("")}</div>`:`<div class="lab-hint">Choisis un style, un verre, puis verse tes ingrédients.</div>`}
  </div>`;
  if(served&&SC){ const [gt,ge]=labGrade(SC.score); o+=`<div class="lab-verdict"><span class="lv-e">${ge}</span><div class="grow"><b>${esc(gt)}</b><span>${esc(labSummary(A,SC))}</span></div></div>`; }
  // ---- étape 1 : style ----
  o+=`<h2 class="sh lab-h"><span class="lab-n">1</span>Le style</h2><div class="chips lab-chips">${LTYPE.map(([k,n])=>`<button class="chip ${M.t===k?"on":""}" data-a="mixtype" data-v="${k}">${n}</button>`).join("")}</div>`;
  // ---- étape 2 : verre ----
  o+=`<h2 class="sh lab-h"><span class="lab-n">2</span>Le verre${!M.g?`<span class="more muted" style="font-size:14px">Choisi par le barman</span>`:`<button class="more" data-a="mixglassauto">Auto</button>`}</h2><div class="scroller lab-glasses">${LGLASS.map(([k,n,c])=>`<button class="lg ${g===k?"on":""} ${rec.g===k?"rec":""}" data-a="mixglass" data-v="${k}"><span class="lg-i">${glassSVG({id:"e"+k,g:k,col:"#E8D8B0",ing:[],ice:"none",gar:""},{fill:0,garnish:false})}</span><b>${n}</b><span>${fmtMl(c)}</span>${rec.g===k&&g!==k?`<em>Conseillé</em>`:""}</button>`).join("")}</div>`;
  // ---- étape 3 : ingrédients ----
  const shelf=Object.keys(S.stock).filter(id=>ING[id]&&has(id)&&!ING[id].basic).concat(["citron","citron_vert","sirop_sucre","sirop_miel","blanc_oeuf","menthe"]).filter((x,i,a)=>a.indexOf(x)===i);
  o+=`<h2 class="sh lab-h"><span class="lab-n">3</span>Les ingrédients${items.length?`<button class="more" data-a="mixfit">Ajuster au verre</button>`:""}</h2><div class="sh-sub">Touche une bouteille pour verser, ou choisis dans toute la carte.</div>
    <div class="scroller lab-shelf">${shelf.map(id=>{ const inMix=items.find(i=>i.id===id); return `<button class="shelf ${inMix?"in":""}" data-a="mixpour" data-id="${id}">${ING[id].basic&&!tracked(id)?`<span class="sh-ic" style="background:${colOf(id)}"></span>`:`<span class="sh-b">${bottleSVG(id,4)}</span>`}<span class="sh-n">${esc(shortN(id))}</span>${inMix?`<span class="sh-q">${esc(fmtQ({q:inMix.q,u:unitOf(id)}))}</span>`:""}</button>`; }).join("")}<button class="shelf more" data-a="mixadd"><span class="sh-plus">${IC.plus}</span><span class="sh-n">Autre</span></button></div>`;
  if(items.length) o+=`<div class="sp8"></div><div class="group">${items.map((it,k)=>`<div class="mix-row"><button class="rm" data-a="mixrm" data-k="${k}" aria-label="Retirer">${IC.x}</button><div class="n"><i style="display:inline-block;width:9px;height:9px;border-radius:5px;background:${colOf(it.id)};margin-right:9px;box-shadow:inset 0 0 0 .5px rgba(0,0,0,.2)"></i>${esc(ING[it.id].n)}</div><div class="stepper"><button data-a="mixq" data-k="${k}" data-d="-1" aria-label="Moins">${IC.minus}</button><span>${fmtQ({q:it.q,u:unitOf(it.id)}).replace(/ (traits?|feuilles|rondelles?|morceaux?)$/,"")}</span><button data-a="mixq" data-k="${k}" data-d="1" aria-label="Plus">${IC.plus}</button></div></div>`).join("")}</div>`;
  // ---- étape 4 : glace et décor ----
  o+=`<h2 class="sh lab-h"><span class="lab-n">4</span>Glace et décor</h2><div class="seg lab-ice" data-k="labice">${LICE.map(([k,n])=>`<button class="${ice===k?"on":""}" data-a="mixice" data-v="${k}">${n}</button>`).join("")}</div>
    <div class="sp8"></div><div class="lab-gars">${LGAR.map(([k,e,n])=>{ const on=M.gar.includes(k), sug=SC&&SC.sug.includes(k); return `<button class="lgar ${on?"on":""} ${sug&&!on?"sug":""}" data-a="mixgar" data-v="${k}"><span>${e}</span><b>${esc(n.replace(/^(Rondelle|Branche|Feuille|Quartier|Bâton|Grains) (de |d’)/,"").replace(/^Bord /,"Bord ").replace(/^./,c=>c.toUpperCase()))}</b></button>`; }).join("")}</div>`;
  // ---- étape 5 : méthode et service ----
  o+=`<h2 class="sh lab-h"><span class="lab-n">5</span>La méthode</h2><div class="seg" data-k="labm">${[["shake","Shaker"],["stir","Verre à mélange"],["build","Construit"]].map(([k,n])=>`<button class="${M.m===k?"on":""}" data-a="mm" data-m="${k}">${n}</button>`).join("")}</div>`;
  // ---- conseils ----
  if(A){ const tips=[];
    A.diag.filter(d=>d.warn).forEach(d=>tips.push(`<div class="tip-r">${IC.warn}<div class="grow"><b>${esc(d.t)}</b><span>${esc(d.why)}</span>${d.fix?`<button class="btn small sec" data-a="mixfix" data-id="${d.fix.id}" data-q="${d.fix.q}">Ajouter ${esc(fmtQ({q:d.fix.q,u:unitOf(d.fix.id)}))} ${esc(de(lc(shortN(d.fix.id))).replace(/^de /,"de "))}</button>`:""}</div></div>`));
    if(M.g&&M.g!==rec.g&&SC.goals.find(x=>x[0]==="glass")[2]<0.85) tips.push(`<div class="tip-r">${IC.sparkle}<div class="grow"><b>Un autre verre ?</b><span>Pour ce style, le barman te conseille ${esc(GLASSES[rec.g])}.</span><button class="btn small sec" data-a="mixglass" data-v="${rec.g}">Prendre ${esc(LGLASS.find(x=>x[0]===rec.g)[1].toLowerCase())}</button></div></div>`);
    if(SC.goals.find(x=>x[0]==="ice")[2]<0.85) tips.push(`<div class="tip-r">${IC.sparkle}<div class="grow"><b>Côté glace</b><span>${{long:"Un long drink se sert sur beaucoup de glaçons.",spritz:"Un spritz se sert sur des glaçons.",stirred:"Un cocktail sec se sert sur un gros glaçon, ou sans glace dans un verre refroidi.",sour:"Un cocktail court se sert plutôt sans glace, bien froid.",cremeux:"Plutôt sans glace."}[A.st]||"Adapte la glace au style."}</span><button class="btn small sec" data-a="mixice" data-v="${rec.ice}">${esc(LICE.find(x=>x[0]===rec.ice)[1])}</button></div></div>`);
    if(!M.gar.length) tips.push(`<div class="tip-r">${IC.sparkle}<div class="grow"><b>Un peu de décor ?</b><span>Avec ce mélange, ${esc(LGARTXT[SC.sug[0]].toLowerCase())} irait très bien.</span><button class="btn small sec" data-a="mixgar" data-v="${SC.sug[0]}">Ajouter</button></div></div>`);
    if(fill>1.02) tips.unshift(`<div class="tip-r bad">${IC.warn}<div class="grow"><b>Ça déborde !</b><span>Il faut environ ${fmtMl(vol-avail)} de place en plus.</span><button class="btn small sec" data-a="mixfit">Ajuster au verre</button></div></div>`);
    else if(fill<0.42) tips.push(`<div class="tip-r">${IC.warn}<div class="grow"><b>Le verre paraît vide</b><span>Ajoute du volume ou choisis un verre plus petit.</span><button class="btn small sec" data-a="mixfit">Ajuster au verre</button></div></div>`);
    if(tips.length) o+=`<h2 class="sh">Conseils du barman</h2><div class="group lab-tips">${tips.slice(0,4).join("")}</div>`;
    o+=`<div class="sp16"></div><div class="btn-row"><button class="btn lab-serve" data-a="mixserve">${M.m==="shake"?"🍸 Secouer et servir":M.m==="stir"?"🥄 Remuer et servir":"🥂 Servir"}</button></div>`;
    // ---- détails ----
    const p=profileOf(A.items,A.met), pa=pairings(A.items), nr=nearest(A.items);
    o+=`<details class="lab-more"><summary>Voir l’analyse détaillée${IC.chev}</summary><div class="card" style="margin-top:8px"><div class="metrics"><div class="metric"><b>${num(Math.round(A.met.abv*10)/10)} %</b><span>alcool</span>${zoneBar(A.met.abv,A.z.abv,40)}</div><div class="metric"><b>${num(Math.round(A.met.sug*10)/10)}</b><span>sucre g/100 ml</span>${zoneBar(A.met.sug,A.z.sug,16)}</div><div class="metric"><b>${num(Math.round(A.met.acid*100)/100)} %</b><span>acidité</span>${zoneBar(A.met.acid,A.z.acid,1.6)}</div></div><div class="sp16"></div><div class="prof">${radarSVG(p)}<div class="muted" style="font-size:14px">La zone verte montre la plage des classiques du même style.${hasPrices()?(()=>{ const c=costOf(A.items); return c.miss.length?"":" Coût : environ "+chf(c.tot)+"."; })():""}</div></div></div>
      ${pa.length?`<div class="gh">Pour aller plus loin</div><div class="group">${pa.map(id=>`<div class="pair"><div class="grow"><div class="pn">${esc(ING[id].n)} ${has(id)?`<span class="badge green">${ING[id].basic?"Toujours là":"Dans ton bar"}</span>`:`<span class="badge">À acheter</span>`}</div><div class="pr">Apporte ${esc(ROLE[id]||"de la complexité")}.</div></div><button class="btn small sec" data-a="mixadd1" data-id="${id}">Ajouter</button></div>`).join("")}</div>`:""}
      ${nr.length?`<div class="gh">Ça ressemble à</div><div class="group">${nr.map(([r,s])=>recRow(r, s>0.9?"Presque identique":"Proche à "+Math.round(s*100)+" %")).join("")}</div>`:""}</details>`;
    o+=`<div class="sp16"></div><div class="btn-row"><button class="btn sec" data-a="mixsave">Enregistrer</button><button class="btn gray" data-a="aiprompt">${IC.copy}Prompt IA</button></div><div class="sp8"></div><div class="btn-row"><button class="btn danger" data-a="mixclear">Recommencer à zéro</button></div>`;
  } else {
    o+=`<div class="sp16"></div><div class="card lab-start"><b>Besoin d’inspiration ?</b><span>Pars d’un classique et transforme-le.</span><div class="starter">${["daiquiri","negroni","moscow_mule","whisky_sour","aperol_spritz"].map(id=>`<button class="chip" data-a="tolab" data-id="${id}">${esc(RMAP[id].n)}</button>`).join("")}</div></div>`;
  }
  return o;
}
function labSummary(A,SC){
  const p=profileOf(A.items,A.met), av=avgProfile(); const top=p.slice(0,8).map((v,i)=>[v-av[i],i]).sort((a,b)=>b[0]-a[0]).slice(0,2).map(x=>DIMS[x[1]].toLowerCase());
  const weak=SC.goals.filter(x=>x[2]<0.6).map(x=>x[1].toLowerCase());
  return "Plutôt "+joinFr(top)+"."+(weak.length?" À améliorer : "+joinFr(weak)+".":" Tous les objectifs sont atteints !");
}
// ---- garde-fous de contenance ----
function labFits(items){ const M=mixState(), {g,ice}=labGlass(); return labVol(items.map(it=>({id:it.id,q:it.q,u:unitOf(it.id),r:ING[it.id].fizz&&M.m!=="build"?"top":""})),M.m,ice)<=labAvail(g,ice)*1.03; }
function labOverflow(){ const el=document.querySelector(".lab-stage"); if(el){ el.classList.remove("shake-no"); void el.offsetWidth; el.classList.add("shake-no"); } toast("Plus de place dans ce verre !",{action:{label:"Ajuster",fn:()=>ACT.mixfit()}}); }
function labTry(mut){ const before=JSON.stringify(S.mix.items); mut(); if(!labFits(S.mix.items)){ S.mix.items=JSON.parse(before); labOverflow(); return false; } LAB_SERVE=null; changed(); return true; }
const _mixq=ACT.mixq; ACT.mixq=(d)=>{ if(+d.d<0){ LAB_SERVE=null; return _mixq(d); } labTry(()=>{ const it=S.mix.items[+d.k]; it.q=stepQ(it.q,unitOf(it.id),+d.d); }); };
ACT.mixadd1=(d)=>{ labTry(()=>S.mix.items.push({id:d.id,q:defaultQ(d.id)})); };
ACT.mixfix=(d)=>{ labTry(()=>{ const ex=S.mix.items.find(i=>i.id===d.id); if(ex) ex.q=Math.round((ex.q+ +d.q)*10)/10; else S.mix.items.push({id:d.id,q:+d.q}); }); };
ACT.mixadd=()=>pickIngSheet(id=>{ labTry(()=>S.mix.items.push({id,q:defaultQ(id)})); });
const _mixrm=ACT.mixrm; ACT.mixrm=(d)=>{ LAB_SERVE=null; _mixrm(d); };
Object.assign(ACT,{
  mixtype:(d)=>{ mixState().t=d.v; LAB_SERVE=null; const rec=labGlass().rec; if(!S.mix.gUser){ S.mix.g=null; S.mix.ice=null; } if(!S.mix.mUser&&S.mix.items.length) S.mix.m=rec.m; changed(); },
  mixglass:(d)=>{ const M=mixState(), old=[M.g,M.gUser]; M.g=d.v; M.gUser=1; if(!labFits(M.items)){ toast("Ton mélange ne tient pas dans ce verre",{action:{label:"Ajuster",fn:()=>ACT.mixfit()}}); } LAB_SERVE=null; LAB_LASTY=null; changed(); },
  mixglassauto:()=>{ const M=mixState(); M.g=null; M.gUser=0; LAB_LASTY=null; changed(); },
  mixice:(d)=>{ const M=mixState(); M.ice=d.v; LAB_SERVE=null; if(!labFits(M.items)) toast("Avec cette glace, ça déborde un peu",{action:{label:"Ajuster",fn:()=>ACT.mixfit()}}); changed(); },
  mixgar:(d)=>{ const M=mixState(), i=M.gar.indexOf(d.v); if(i<0){ if(M.gar.length>=4){ toast("Quatre garnitures maximum, sinon on ne voit plus le cocktail"); return; } M.gar.push(d.v); } else M.gar.splice(i,1); LAB_SERVE=null; changed(); },
  mixpour:(d,t)=>{ if(t){ t.classList.remove("pour"); void t.offsetWidth; t.classList.add("pour"); } labTry(()=>{ const ex=S.mix.items.find(i=>i.id===d.id); if(ex) ex.q=stepQ(ex.q,unitOf(d.id),1); else S.mix.items.push({id:d.id,q:defaultQ(d.id)}); }); },
  mixfit:()=>{ const M=mixState(), {g,ice}=labGlass(), target=labAvail(g,ice)*0.9; const cur=labVol(mixItems(),M.m,ice); if(!cur) return; let k=target/cur;
    for(let it=0;it<3;it++){ const trial=M.items.map(i=>{ const u=unitOf(i.id); return Object.assign({},i,{q:u==="ml"?Math.max(2.5,Math.round(i.q*k/2.5)*2.5):i.q}); }); const v=labVol(trial.map(i=>({id:i.id,q:i.q,u:unitOf(i.id),r:ING[i.id].fizz&&M.m!=="build"?"top":""})),M.m,ice); if(v<=labAvail(g,ice)*1.02||it===2){ M.items=trial; break; } k*=0.95; }
    LAB_SERVE=null; changed(); toast("Quantités ajustées au verre"); },
  mixserve:()=>{ const M=mixState(); if(!M.items.length) return; const A=analyze(), SC=labScore(A); const st=document.querySelector(".lab-stage"), tool=st&&st.querySelector(".lab-tool");
    if(st){ st.classList.add("serving",M.m); if(tool) tool.innerHTML=M.m==="shake"?`<span class="shaker">${IC.shaker}</span>`:M.m==="stir"?`<span class="spoon"></span>`:""; }
    const wait=M.m==="build"?250:1300;
    setTimeout(()=>{ LAB_SERVE={key:JSON.stringify(M),t:Date.now()}; LAB_LASTY=null; S.labBest=Math.max(S.labBest||0,SC.score); S.labServes=(S.labServes||0)+1; changed();
      const sc=document.querySelector(".lab-score b"); if(sc){ const t0=performance.now(), v=SC.score; const step=t=>{ const k=Math.min(1,(t-t0)/900), e=1-Math.pow(1-k,3); sc.textContent=Math.round(v*e); if(k<1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
      document.querySelectorAll(".lab-goals .goal").forEach((gl,i)=>{ gl.style.animationDelay=(i*90)+"ms"; gl.classList.add("pop"); });
      if(SC.score>=85){ const b=document.querySelector(".lab-glass"); if(b){ const r=b.getBoundingClientRect(); setTimeout(()=>confetti(r.left+r.width/2,r.top+r.height*0.4,labBlendCol(mixItems())),500); } }
      const [gt]=labGrade(SC.score); toast(SC.score+"/100 : "+gt); },wait); },
});
// garnitures et verre repris quand on part d'un cocktail
const _tolab=ACT.tolab; ACT.tolab=(d)=>{ _tolab(d); const r=RMAP[d.id]; const M=mixState(); M.g=r.g; M.gUser=1; M.ice=r.ice; M.t={sour:"court",stirred:"sec",highball:"long",bulles:"spritz",herbes:"auto",tiki:"auto",dessert:"auto",chaud:"auto",shot:"shot",sansalcool:"auto"}[r.fam]||"auto";
  const low=(r.gar||"").toLowerCase(); M.gar=LGAR.filter(([k,,n])=>{ const w=n.toLowerCase(); return (k==="cv"&&/citron vert/.test(low))||(k==="zeste_c"&&/zeste de citron/.test(low))||(k==="rc"&&/(rondelle|roue|demi)[^,]*citron(?! vert)/.test(low))||(k==="or"&&/(rondelle|tranche|quartier)[^,]*orange/.test(low))||(k==="zo"&&/zeste d’orange/.test(low))||(["menthe","basilic","olive","cerise","concombre","ananas","paille","muscade"].includes(k)&&low.includes(w.split(" ").pop().replace(/s$/,"")))||(k==="sel"&&/sel/.test(low))||(k==="sucre"&&/bord sucré/.test(low))||(k==="cafe"&&/café/.test(low))||(k==="cannelle"&&/cannelle/.test(low))||(k==="fraise"&&/framboise|fraise|mûre/.test(low)); }).map(x=>x[0]).slice(0,4); LAB_SERVE=null; LAB_LASTY=null; changed(); };
const _mm=ACT.mm; ACT.mm=(d)=>{ S.mix.mUser=1; LAB_SERVE=null; _mm(d); };
const _mixclear=ACT.mixclear; ACT.mixclear=()=>{ const bak=JSON.stringify(S.mix); _mixclear(); S.mix={m:"shake",items:[],t:"auto",gar:[]}; LAB_SERVE=null; LAB_LASTY=null; changed(); toast("Labo remis à zéro",{action:{label:"Annuler",fn:()=>{ S.mix=JSON.parse(bak); changed(); }}}); };
TROPHIES.push(["labpro","Chef de bar","Obtiens 90/100 au labo",90,()=>S.labBest||0],["lab10","Apprenti mixologue","Sers 10 créations au labo",10,()=>S.labServes||0]);

// ================= FENÊTRE DE SERVICE =================
let SV=null;
function openServe(){
  const M=mixState(); if(!M.items.length) return; const A=analyze(), SC=labScore(A), items=mixItems(), {g,ice}=labGlass();
  const col=labBlendCol(items), [gt,ge]=labGrade(SC.score), prevBest=S.labBest||0, record=SC.score>prevBest&&S.labServes>0;
  LAB_SERVE={key:JSON.stringify(M),t:Date.now()}; S.labBest=Math.max(prevBest,SC.score); S.labServes=(S.labServes||0)+1; save();
  const r={id:"sv"+Date.now(),g,col,ice,ing:items,gar:"",garList:M.gar.map(k=>LGARTXT[k])};
  const fill=Math.min(1,A.met.vol/labAvail(g,ice)), C=2*Math.PI*52;
  const tool=M.m==="shake"?`<span class="sv-shaker">${IC.shaker}</span>`:M.m==="stir"?`<span class="sv-mix" style="--lc:${col}"><span class="sv-liq"><b class="c1"></b><b class="c2"></b><b class="c3"></b></span><span class="sv-sp"></span></span>`:"";
  const GL={bal:"Équilibre",abv:"Force",fill:"Remplissage",glass:"Verre",ice:"Glace",gar:"Décor (bonus)"};
  const el=document.createElement("div"); el.id="serve"; el.style.setProperty("--c",col);
  el.innerHTML=`<div class="sv-bg"></div><button class="close-x sv-x" data-a="svclose" aria-label="Fermer">${IC.x}</button>
   <div class="sv-in">
    <div class="sv-kick">${M.m==="shake"?"On secoue…":M.m==="stir"?"On remue…":"On sert…"}</div>
    <div class="sv-glass"><div class="sv-g">${glassSVG(r,{fill,smilFrom:Math.max(20,(GLASS_SHAPES[g]||GLASS_SHAPES.rocks).bot-8),smilDur:1.1})}</div><div class="sv-tool">${tool}</div></div>
    <div class="sv-res">
      <div class="sv-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="10"/><circle class="sv-arc" cx="60" cy="60" r="52" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-dasharray="0 ${C}" transform="rotate(-90 60 60)"/></svg><div class="sv-num"><b>0</b><span>/100</span></div></div>
      <div class="sv-grade"><span class="sv-e">${ge}</span><b>${esc(gt)}</b>${record?`<em>Nouveau record !</em>`:""}</div>
    </div>
    <div class="sv-goals">${SC.goals.map(([k,n,v],i)=>`<div class="sv-goal ${v>=0.85?"ok":k==="gar"?"bonus":v>=0.5?"mid":"ko"}" style="--i:${i}"><span class="sv-gi">${v>=0.85?IC.check:k==="gar"?"+":v>=0.5?"~":"!"}</span><div class="grow"><b>${GL[k]}</b><i><u style="--w:${Math.round(v*100)}%"></u></i></div></div>`).join("")}</div>
    <p class="sv-sum">${esc(labSummary(A,SC))}</p>
    <div class="sv-actions"><button class="btn sv-btn" data-a="svsave">Enregistrer ma création</button><div class="sv-row"><button class="btn sv-btn2" data-a="svtips">Conseils</button><button class="btn sv-btn2" data-a="svclose">Continuer</button></div></div>
   </div>`;
  document.body.appendChild(el); SV={el,score:SC.score,timers:[]};
  const T=(ms,f)=>SV.timers.push(setTimeout(f,ms));
  const tTool=M.m==="build"?150:1350, tPour=tTool+1100, tScore=tPour+150;
  requestAnimationFrame(()=>el.classList.add("open"));
  el.classList.add("p1");
  T(tTool,()=>{ el.classList.add("p2"); el.querySelector(".sv-kick").textContent="Et voilà ton cocktail"; el.querySelectorAll(".sv-g animateTransform.smil").forEach(a=>{ try{ a.beginElement(); }catch(e){} }); });
  T(tScore,()=>svScore());
  el.addEventListener("click",e=>{ if(e.target.closest("[data-a]")) return; svSkip(); });
}
function svScore(){
  if(!SV) return; const el=SV.el; el.classList.add("p3"); const v=SV.score, C=2*Math.PI*52, arc=el.querySelector(".sv-arc"), num=el.querySelector(".sv-num b"), t0=performance.now();
  const step=t=>{ if(!SV) return; const k=Math.min(1,(t-t0)/1100), e=1-Math.pow(1-k,3); num.textContent=Math.round(v*e); arc.setAttribute("stroke-dasharray",`${C*v/100*e} ${C}`); if(k<1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
  SV.timers.push(setTimeout(()=>{ if(!SV) return; el.classList.add("p4"); },900));
  SV.timers.push(setTimeout(()=>{ if(!SV) return; el.classList.add("p5"); if(v>=85){ const b=el.querySelector(".sv-ring").getBoundingClientRect(); confetti(b.left+b.width/2,b.top+b.height/2,getComputedStyle(el).getPropertyValue("--c")); } checkTrophies(); },1750));
}
function svSkip(){ if(!SV||SV.el.classList.contains("p5")) return; SV.timers.forEach(clearTimeout); SV.timers=[]; const el=SV.el;
  el.querySelectorAll(".sv-g animateTransform.smil").forEach(a=>{ const g=a.parentNode; a.remove(); g.setAttribute("transform","translate(0 0)"); }); el.classList.add("p2","p3","p4","p5","skip"); const C=2*Math.PI*52; el.querySelector(".sv-arc").setAttribute("stroke-dasharray",`${C*SV.score/100} ${C}`); el.querySelector(".sv-num b").textContent=SV.score; checkTrophies(); }
function svClose(then){ if(!SV) return; SV.timers.forEach(clearTimeout); const el=SV.el; SV=null; el.classList.remove("open"); el.classList.add("closing"); setTimeout(()=>el.remove(),380); LAB_LASTY=null; changed(); if(then) setTimeout(then,200); }
Object.assign(ACT,{
  mixserve:()=>openServe(),
  svclose:()=>svClose(),
  svsave:()=>svClose(()=>ACT.mixsave()),
  svtips:()=>svClose(()=>{ const t=document.querySelector(".lab-tips")||document.querySelector(".lab-more"); if(t) t.scrollIntoView({behavior:"smooth",block:"center"}); })
});
