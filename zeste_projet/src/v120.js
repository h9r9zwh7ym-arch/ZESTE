// ================= ZESTE 1.20 =================

// ---------- 1. Sauvegarde : import robuste, réinitialisation confirmée dans l'app ----------
// Les boîtes confirm()/alert() du navigateur sont bloquées dans le cadre sécurisé où tourne l'app :
// la confirmation se fait donc dans une feuille de l'app.
function confirmSheet(o){
  const sh=openSheet(()=>({title:"",body:`<div class="cf-box"><div class="cf-ic ${o.danger?"danger":""}">${o.icon||IC.warn}</div><h2>${esc(o.title)}</h2><p>${o.html||esc(o.text||"")}</p><div class="cf-btns"><button class="btn ${o.danger?"danger-fill":""}" data-a="cfok">${esc(o.ok||"Confirmer")}</button><button class="btn gray" data-a="closesheet">${esc(o.cancel||"Annuler")}</button></div></div>`}),{short:true});
  sh.onOk=o.onOk;
}
ACT.cfok=()=>{ const sh=SHEETS[SHEETS.length-1]; const f=sh&&sh.onOk; closeSheet(); if(f) setTimeout(f,120); };
ACT.reset=()=>confirmSheet({title:"Tout réinitialiser ?",danger:true,icon:ICS.trash[1].replace(/#fff/g,"currentColor"),html:"Ton bar, tes notes, ton historique, tes créations et tes trophées seront effacés. <b>Cette action est définitive.</b> Pense à exporter une sauvegarde avant.",ok:"Tout effacer",onOk:()=>{ const u=S.settings.unit, nm=S.settings.name; S=DEF(); S.settings.unit=u; S.settings.name=nm; S.quizSkip=1; fixState(); buildRecipes([]); MODEL=null; closeAll(); changed(); toast("Tout a été réinitialisé"); }});
// Nettoyage d'une sauvegarde : on ne garde que des données du bon type, sans planter sur un fichier abîmé
function sanitizeBackup(d){
  if(!d||typeof d!=="object"||Array.isArray(d)) return null;
  const isObj=x=>x&&typeof x==="object"&&!Array.isArray(x), num=x=>typeof x==="number"&&isFinite(x);
  if(!isObj(d.stock)) return null;
  const out=DEF();
  Object.entries(d.stock).forEach(([id,v])=>{ if(ING[id]&&num(v)) out.stock[id]=Math.max(0,Math.min(4,Math.round(v))); });
  if(isObj(d.ratings)) Object.entries(d.ratings).forEach(([id,v])=>{ if(num(v)&&v>=1&&v<=5) out.ratings[id]=Math.round(v); });
  if(Array.isArray(d.hist)) out.hist=d.hist.filter(h=>h&&typeof h.id==="string"&&num(h.t)).map(h=>({id:h.id,t:h.t}));
  if(Array.isArray(d.fav)) out.fav=d.fav.filter(x=>typeof x==="string");
  if(Array.isArray(d.custom)) out.custom=d.custom.filter(r=>r&&typeof r.id==="string"&&typeof r.n==="string"&&Array.isArray(r.ing)&&r.ing.every(i=>i&&ING[i.id]&&num(i.q)));
  if(isObj(d.settings)) out.settings=Object.assign({},out.settings,d.settings);
  // champs simples conservés tels quels s'ils ont le bon type
  ["quiz","adj","notes","price","stockT","opened","opens","mw","skips","chal","dishes","troT","rt","mix","heroLog"].forEach(k=>{ if(isObj(d[k])) out[k]=d[k]; });
  ["tro","preps","citiesSeen","linSeen","drinks"].forEach(k=>{ if(Array.isArray(d[k])) out[k]=d[k]; });
  ["quizSkip","roul","labBest","labServes","mwN","prepCount","bmDone","chalHard"].forEach(k=>{ if(num(d[k])||typeof d[k]==="boolean") out[k]=d[k]; });
  return out;
}
function importData(){
  let inp=document.getElementById("zeste-import");
  if(!inp){ inp=document.createElement("input"); inp.type="file"; inp.id="zeste-import"; inp.accept=".json,application/json,text/plain"; inp.style.cssText="position:fixed;left:-9999px;opacity:0"; document.body.appendChild(inp); } // Safari iOS : le champ doit être dans la page
  inp.value="";
  inp.onchange=()=>{ const f=inp.files&&inp.files[0]; if(!f) return;
    if(f.size>8e6){ toast("Fichier trop volumineux pour être une sauvegarde Zeste"); return; }
    const rd=new FileReader();
    rd.onerror=()=>toast("Impossible de lire ce fichier");
    rd.onload=()=>{ let d=null; try{ d=JSON.parse(String(rd.result).replace(/^\uFEFF/,"")); }catch(e){ toast("Ce fichier n’est pas une sauvegarde Zeste valide"); return; }
      const clean=sanitizeBackup(d); if(!clean){ toast("Ce fichier n’est pas une sauvegarde Zeste valide"); return; }
      const nb=Object.values(clean.stock).filter(v=>v>0).length, nr=Object.keys(clean.ratings).length, nh=clean.hist.length;
      confirmSheet({title:"Restaurer cette sauvegarde ?",icon:ICS.down[1].replace(/#fff/g,"currentColor"),html:`Elle contient <b>${nb} bouteille${nb>1?"s":""}</b>, <b>${nr} note${nr>1?"s":""}</b> et <b>${nh} cocktail${nh>1?"s":""} préparé${nh>1?"s":""}</b>. Tes données actuelles seront remplacées.`,ok:"Restaurer",
        onOk:()=>{ try{ S=clean; fixState(); buildRecipes(S.custom||[]); MODEL=null; closeAll(); Object.keys(dirty).forEach(k=>dirty[k]=1); changed(); toast("Sauvegarde restaurée"); }catch(e){ toast("La restauration a échoué, tes données n’ont pas été modifiées"); } } }); };
    rd.readAsText(f); };
  inp.click();
}

// ---------- 2. Réglages utiles ----------
// Écran allumé pendant le mode barman (Screen Wake Lock API, Safari 16.4+) : on garde les mains libres en préparant
let WAKE=null;
async function wakeOn(){ if(S.settings.wake===false||!("wakeLock" in navigator)) return; try{ WAKE=await navigator.wakeLock.request("screen"); }catch(e){ WAKE=null; } }
function wakeOff(){ try{ WAKE&&WAKE.release(); }catch(e){} WAKE=null; }
const _barMode=barMode; barMode=function(id){ _barMode(id); if(typeof BM!=="undefined"&&BM) BM.mult=S.settings.glasses||1; if(typeof paintBM==="function"&&BM) paintBM(); wakeOn(); };
const _closeOverlay=closeOverlay; closeOverlay=function(){ wakeOff(); return _closeOverlay(); };
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible"&&document.getElementById("overlay")?.classList.contains("open")&&BM) wakeOn(); applyAmbient(); });
// Rappel de note désactivable
const _pending=pendingRatings; pendingRatings=function(){ return S.settings.remind===false?[]:_pending(); };
// Créations suisses non testées : incluses ou non dans les suggestions
const _tonightRaw=tonightRaw; tonightRaw=function(){ const L=_tonightRaw(); return S.settings.untested===false? L.filter(r=>!r.cr) : L; };
// Nombre de verres par défaut dans les fiches
const _recSheet=recSheet; recSheet=function(id){ const sh=_recSheet(id); return sh; };
(function(){ const f=ACT.mult; })();

// ---------- 3. Trophées cachés ----------
const HIDDEN=new Set();
function hid(k,n,d,g,f,tier,glyph){ TROPHIES.push([k,n,d,g,f]); HIDDEN.add(k); TIER_OF[k]=tier; TRO_GLYPH[k]=glyph; }
hid("early","Lève-tôt","Un cocktail préparé entre 5 h et 9 h du matin",1,()=>S.hist.some(h=>{ const x=new Date(h.t).getHours(); return x>=5&&x<9; })?1:0,"silver","cal");
hid("globe","Globe-trotter","Découvre 10 villes sur la carte du monde",10,()=>(S.citiesSeen||[]).length,"silver","fork");
hid("genealogy","Généalogiste","Explore toutes les lignées de cocktails",LINEAGES.length,()=>(S.linSeen||[]).length,"gold","book");
hid("handsfree","Mains dans le shaker","Termine 3 préparations en mode barman",3,()=>S.bmDone||0,"bronze","glass");
hid("second","Seconde chance","Passe la note d’un cocktail de 2 étoiles ou moins à 5 étoiles",1,()=>S.secondChance?1:0,"gold","star");
hid("fate","Coup du destin","Donne 5 étoiles à un cocktail tiré par la roulette",1,()=>S.fate?1:0,"silver","dice");
hid("bubbles","Pas une bulle de perdue","Termine une bouteille pétillante dans les jours qui suivent son ouverture",1,()=>S.bubbleSaved?1:0,"silver","bottle");
hid("sober","Soirée zéro degré","Prépare 3 recettes sans alcool différentes le même jour",3,()=>{ const by={}; S.hist.forEach(h=>{ const r=RMAP[h.id]; if(r&&r.na){ const k=new Date(h.t).toDateString(); (by[k]=by[k]||new Set()).add(h.id); } }); return Math.max(0,...Object.values(by).map(s=>s.size)); },"silver","leaf");
// suivi des actions réelles
(function(){
  const W=(k,f,before)=>{ const g=ACT[k]; if(!g) return; ACT[k]=(d,t)=>{ let b; try{ b=before&&before(d||{}); }catch(e){} const r=g(d,t); try{ f(d||{},b); }catch(e){} return r; }; };
  W("rate",(d,b)=>{ if(b!=null&&b<=2&&+d.n===5){ S.secondChance=1; save(); checkTrophies(); } },(d)=>S.ratings[d.id]);
  W("bmfinish",(d,b)=>{ S.bmDone=(S.bmDone||0)+1; if(b&&b.roul&&b.rate===5) S.fate=1; save(); checkTrophies(); },()=>({roul:BM&&BM.fromRoul,rate:BM&&BM.rate}));
  W("lineage",(d)=>{ S.linSeen=S.linSeen||[]; if(!S.linSeen.includes(+d.i)) { S.linSeen.push(+d.i); save(); checkTrophies(); } });
  W("cmode2",(d)=>{ if(d.v==="tree"){ S.linSeen=S.linSeen||[]; if(!S.linSeen.includes(TREE_I)){ S.linSeen.push(TREE_I); save(); } } });
  const seeCity=i=>{ S.citiesSeen=S.citiesSeen||[]; if(!S.citiesSeen.includes(i)){ S.citiesSeen.push(i); save(); checkTrophies(); } };
  W("city",(d)=>seeCity(+d.i));
  const _mfs=mfSelect; mfSelect=function(i){ _mfs(i); seeCity(i); };
  const lv=(d,b)=>{ if(PERISH[d.id]&&S.stock[d.id]===0&&b&&b.op&&(Date.now()-b.op)/864e5<=PERISH[d.id][1]+1){ S.bubbleSaved=1; save(); checkTrophies(); } };
  W("lvl",lv,(d)=>({op:(S.opened||{})[d.id]})); W("setlvl",lv,(d)=>({op:(S.opened||{})[d.id]}));
})();
// affichage : un trophée caché non débloqué ne révèle ni son nom, ni sa condition
const _medal=medal; medal=function(k,on,prog){ if(HIDDEN.has(k)&&!on){ return `<svg viewBox="0 0 80 88" class="medal off secret"><circle cx="40" cy="40" r="28" fill="#D6D2CC"/><circle cx="40" cy="40" r="22.5" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.6" stroke-dasharray="3 3"/><text x="40" y="49" text-anchor="middle" font-size="26" font-weight="800" fill="#fff" font-family="-apple-system,sans-serif">?</text></svg>`; } return _medal(k,on,prog); };
trophyGrid=function(){
  const got=S.tro||[], vis=TROPHIES.filter(t=>!HIDDEN.has(t[0])||got.includes(t[0])), sec=TROPHIES.filter(t=>HIDDEN.has(t[0])&&!got.includes(t[0]));
  const order=vis.slice().sort((a,b)=>(got.includes(b[0])-got.includes(a[0]))||(TIER_RANK[tierOf(a[0])]-TIER_RANK[tierOf(b[0])]));
  const cnt=t=>TROPHIES.filter(x=>tierOf(x[0])===t&&got.includes(x[0])).length+"/"+TROPHIES.filter(x=>tierOf(x[0])===t).length;
  return `<h2 class="sh">Trophées<span class="more" style="color:var(--label2)">${got.length} sur ${TROPHIES.length}</span></h2><div class="tro-tiers">${Object.entries(TIERS).map(([t,v])=>`<span class="tt t-${t}"><i style="background:linear-gradient(135deg,${v.c[0]},${v.c[2]})"></i>${v.n} ${cnt(t)}</span>`).join("")}</div>
  <div class="trophies">${order.map(([k,n,d,g])=>{ const on=got.includes(k), [v,G]=troProgress(k); return `<button class="trophy ${on?"":"locked"} t-${tierOf(k)}" data-a="trophy" data-k="${k}">${medal(k,on,on?null:v/G)}<div class="tn">${esc(n)}</div><div class="tp">${on?(HIDDEN.has(k)?"Secret · ":"")+TIERS[tierOf(k)].n:v+" / "+g}</div></button>`; }).join("")}${sec.map(([k])=>`<button class="trophy locked secret" data-a="trophy" data-k="${k}">${medal(k,false)}<div class="tn">Trophée secret</div><div class="tp">À découvrir</div></button>`).join("")}</div>`;
};
const _trophySheet=trophySheet; trophySheet=function(k){ if(HIDDEN.has(k)&&!(S.tro||[]).includes(k)){ openSheet(()=>({title:"",body:`<div class="ts-hero"><div class="ts-m">${medal(k,false)}</div><span class="tp-tier">Secret</span><h1>Trophée secret</h1><p>Ce trophée se débloque en faisant quelque chose de précis dans Zeste. Continue d’explorer l’app pour le découvrir.</p></div>`}),{short:true}); return; } _trophySheet(k); };

// ---------- 4. Zeste Rewind : annuel en décembre, et un récap par mois ----------
const MOIS=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
function monthRange(y,m){ return [new Date(y,m,1).getTime(), new Date(y,m+1,1).getTime()]; }
function rewindRange(from,to){
  const H=S.hist.filter(h=>h.t>=from&&h.t<to&&RMAP[h.id]);
  const cnt={}; H.forEach(h=>cnt[h.id]=(cnt[h.id]||0)+1);
  const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]||((S.ratings[b[0]]||0)-(S.ratings[a[0]]||0)))[0];
  const bases={}; H.forEach(h=>{ const b=BASE_LABEL[baseGroup(RMAP[h.id])]; bases[b]=(bases[b]||0)+1; });
  const fams=[...new Set(H.map(h=>RMAP[h.id].fam))];
  const firstEver={}; S.hist.forEach(h=>{ if(firstEver[h.id]==null||h.t<firstEver[h.id]) firstEver[h.id]=h.t; });
  const discoveries=Object.keys(cnt).filter(id=>firstEver[id]>=from&&firstEver[id]<to);
  const hours=Array(24).fill(0), days=Array(7).fill(0); H.forEach(h=>{ const d=new Date(h.t); hours[d.getHours()]++; days[d.getDay()]++; });
  // tranche de 3 h la plus chargée (en cas d'égalité, la plus tardive, puisque la plupart des cocktails se boivent le soir)
  const buckets=[...Array(8)].map((_,k)=>hours[k*3]+hours[k*3+1]+hours[k*3+2]); let pb=0; buckets.forEach((v,k)=>{ if(v>=buckets[pb]) pb=k; });
  const peakH=pb*3, peakD=days.indexOf(Math.max(...days));
  const RT=S.rt||{}; const best=Object.keys(cnt).filter(id=>S.ratings[id]).sort((a,b)=>S.ratings[b]-S.ratings[a]||cnt[b]-cnt[a])[0];
  let spent=0, priced=0; H.forEach(h=>{ const c=costOf(adjItems(RMAP[h.id])); if(!c.miss.length){ spent+=c.tot; priced++; } });
  return {H,count:H.length,distinct:Object.keys(cnt).length,top:top&&{id:top[0],n:top[1]},bases:Object.entries(bases).sort((a,b)=>b[1]-a[1]),fams,discoveries,hours,days,peakH,peakD,best,avgCost:priced?spent/priced:null,priced,na:H.filter(h=>RMAP[h.id].na).length};
}
const JOURS=["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
function momentOfHour(h){ return ({matin:"le matin",aprem:"l’après-midi",apero:"à l’heure de l’apéro",soir:"en soirée",nuit:"tard dans la nuit"})[momentForHour(h+1)]; }
function openMonthRewind(y,m){
  const [from,to]=monthRange(y,m), D=rewindRange(from,to), top=D.top&&RMAP[D.top.id], best=D.best&&RMAP[D.best], col=top?top.col:"#E8A84A", label=MOIS[m]+" "+y;
  const slides=[];
  slides.push({c:[col,"#1A1020"],h:`<div class="rw-small">Ton mois de ${esc(label)}</div><div class="rw-big" data-count="${D.count}">0</div><div class="rw-mid">cocktail${D.count>1?"s":""} préparé${D.count>1?"s":""}</div><div class="rw-note">${D.distinct} recette${D.distinct>1?"s":""} différente${D.distinct>1?"s":""}${D.discoveries.length?`, dont ${D.discoveries.length} découverte${D.discoveries.length>1?"s":""}`:""}</div>`});
  if(top) slides.push({c:[top.col,mix(top.col,"#000000",.6)],h:`<div class="rw-small">Ton cocktail du mois</div><div class="rw-glass">${glassSVG(top,{pour:true,live:1})}</div><div class="rw-name">${esc(top.n)}</div><div class="rw-note">préparé ${D.top.n} fois</div>`});
  if(D.count>=2){ const mx=Math.max(...D.hours,1); const bars=[...Array(8)].map((_,k)=>{ const v=D.hours.slice(k*3,k*3+3).reduce((a,b)=>a+b,0); return v; }); const bm=Math.max(...bars,1);
    slides.push({c:["#3A6AC0","#08102A"],h:`<div class="rw-small">Ton moment préféré</div><div class="rw-name">${esc(momentOfHour(D.peakH).replace(/^./,c=>c.toUpperCase()))}</div><div class="rw-note">Surtout entre ${D.peakH} h et ${D.peakH+3} h${Math.max(...D.days)>1?`, et le ${JOURS[D.peakD]} est ton jour favori`:""}.</div><div class="rw-months">${bars.map((v,k)=>`<div class="rw-m ${v===bm?"top":""}"><i style="--h:${Math.round(v/bm*100)}%;animation-delay:${0.2+k*0.06}s"></i><span>${k*3}h</span></div>`).join("")}</div>`}); }
  if(D.bases.length){ const mx=D.bases[0][1]; slides.push({c:["#C98A2E","#2A1606"],h:`<div class="rw-small">Ton alcool du mois</div><div class="rw-name">${esc(D.bases[0][0])}</div><div class="rw-bars">${D.bases.slice(0,4).map(([n,v],k)=>`<div class="rw-bar"><span>${esc(n)}</span><i style="--w:${Math.round(v/mx*100)}%;animation-delay:${0.3+k*0.12}s"></i><b>${v}</b></div>`).join("")}</div>`}); }
  if(best&&best!==top) slides.push({c:[best.col,mix(best.col,"#000000",.6)],h:`<div class="rw-small">Ton coup de cœur</div><div class="rw-glass">${glassSVG(best,{pour:true,live:1})}</div><div class="rw-name">${esc(best.n)}</div><div class="rw-stars">${[1,2,3,4,5].map(k=>`<span class="${k<=S.ratings[best.id]?"on":""}" style="animation-delay:${0.5+k*0.1}s">${IC.star}</span>`).join("")}</div>`});
  if(D.avgCost!=null&&D.priced>=2) slides.push({c:["#C8A020","#1A1404"],h:`<div class="rw-small">Côté porte-monnaie</div><div class="rw-big money">${chf(D.avgCost)}</div><div class="rw-mid">le verre en moyenne ce mois-ci</div>`});
  slides.push({c:[col,"#100A14"],end:1,h:`<div class="rw-small">C’était ${esc(label)}</div><div class="rw-sum"><div><b>${D.count}</b><span>verres</span></div><div><b>${D.distinct}</b><span>recettes</span></div><div><b>${D.fams.length}</b><span>familles</span></div><div><b>${D.discoveries.length}</b><span>découvertes</span></div></div>${D.na?`<div class="rw-note">dont ${D.na} sans alcool</div>`:""}<div class="rw-actions"><button class="btn gray" data-a="rwclose">Terminer</button></div>`});
  RW={i:0,slides,D:Object.assign({},D,{tro:(S.tro||[]).length}),timer:null,paused:false};
  let el=document.getElementById("rewind"); if(!el){ el=document.createElement("div"); el.id="rewind"; document.body.appendChild(el); }
  el.innerHTML=`<div class="rw-prog">${slides.map(()=>`<i><b></b></i>`).join("")}</div><button class="close-x rw-x" data-a="rwclose" aria-label="Fermer">${IC.x}</button><div class="rw-stage"></div><div class="rw-tap l"></div><div class="rw-tap r"></div>`;
  el.classList.add("open"); el.querySelector(".rw-tap.l").onclick=()=>rwGo(-1); el.querySelector(".rw-tap.r").onclick=()=>rwGo(1);
  const st=el.querySelector(".rw-stage"); st.onpointerdown=()=>{ RW&&(RW.paused=true); }; st.onpointerup=()=>{ RW&&(RW.paused=false); };
  rwShow(0);
}
// quels récaps proposer, d'après les vraies dates enregistrées
function availableMonths(){ const set=new Map(); S.hist.forEach(h=>{ if(!RMAP[h.id]) return; const d=new Date(h.t), k=d.getFullYear()*12+d.getMonth(); set.set(k,(set.get(k)||0)+1); }); return [...set.entries()].sort((a,b)=>b[0]-a[0]).map(([k,n])=>({y:Math.floor(k/12),m:k%12,n})); }
function rewindCards(){
  const now=new Date(), y=now.getFullYear(), m=now.getMonth(), d=now.getDate(), cards=[];
  const cur=availableMonths().find(x=>x.y===y&&x.m===m), prevY=m?y:y-1, prevM=m?m-1:11, prev=availableMonths().find(x=>x.y===prevY&&x.m===prevM);
  if(m===11&&rewindEligible()) cards.push(`<button class="rw-card" data-a="rewind"><div class="rw-bg"></div><div class="rw-in"><div class="rw-k">${IC.sparkle}Zeste Rewind ${y}</div><div class="rw-t">Ton année en cocktails</div><div class="rw-s">Revis toute ton année en quelques histoires.</div></div><div class="rw-play">${IC.play}</div></button>`);
  if(prev&&d<=10) cards.push(`<button class="rw-card month" data-a="rwmonth" data-y="${prevY}" data-m="${prevM}"><div class="rw-bg"></div><div class="rw-in"><div class="rw-k">${IC.sparkle}Récap du mois</div><div class="rw-t">Ton mois de ${MOIS[prevM]}</div><div class="rw-s">${prev.n} cocktail${prev.n>1?"s":""} préparé${prev.n>1?"s":""}. Revis ton mois en quelques histoires.</div></div><div class="rw-play">${IC.play}</div></button>`);
  else if(cur&&cur.n>=3) cards.push(`<button class="rw-card month" data-a="rwmonth" data-y="${y}" data-m="${m}"><div class="rw-bg"></div><div class="rw-in"><div class="rw-k">${IC.sparkle}Ton mois en cours</div><div class="rw-t">${MOIS[m].replace(/^./,c=>c.toUpperCase())}, jusqu’ici</div><div class="rw-s">${cur.n} cocktails depuis le 1er ${MOIS[m]}.</div></div><div class="rw-play">${IC.play}</div></button>`);
  return cards.join("");
}
// Rewind dans « Pour toi » (sous les suggestions), et plus comme section séparée
delete HOME_N.rewind; HOME_SEC.rewind=()=>""; { const i=DEFAULT_HOME.findIndex(x=>x[0]==="rewind"); if(i>=0) DEFAULT_HOME.splice(i,1); }
const _suggest=HOME_SEC.suggest; HOME_SEC.suggest=(ctx)=>{ const h=_suggest(ctx), rc=rewindCards(); return h+(rc?`<div class="rw-in-foryou">${rc}</div>`:""); };
Object.assign(ACT,{ rwmonth:(d)=>openMonthRewind(+d.y,+d.m) });

// ---------- 6. Labo : le décor ne compte plus dans la note ----------
const _labScore=labScore; labScore=function(A){ const R=_labScore(A); const W={bal:28,abv:22,fill:17,glass:17,ice:16,gar:0};
  R.goals=R.goals.map(g=>[g[0],g[0]==="gar"?"Décor (bonus)":g[1],g[0]==="gar"?Math.max(g[2],0):g[2],W[g[0]]]); R.score=Math.round(R.goals.reduce((a,g)=>a+g[2]*g[3],0)); return R; };
const _labSummary=labSummary; labSummary=function(A,SC){ const S2=Object.assign({},SC,{goals:SC.goals.filter(g=>g[0]!=="gar")}); return _labSummary(A,S2); };

// ---------- 7. Mon bar : les bouteilles presque vides ----------
function lowView(ids){
  const LV=["Vides","Environ ¼","Environ ½"], L=ids.filter(id=>tracked(id)&&S.stock[id]<=2).sort((a,b)=>S.stock[a]-S.stock[b]||ING[a].n.localeCompare(ING[b].n,"fr"));
  if(!L.length) return `<div class="empty-low"><div class="el-ic">${bottleSVG("gin",4)}</div><b>Tout va bien</b><span>Aucune bouteille n’est à moitié vide ou moins.</span></div>`;
  let o="";
  [0,1,2].forEach(lv=>{ const G=L.filter(id=>S.stock[id]===lv); if(!G.length) return;
    o+=`<div class="list-h"><b>${LV[lv]}</b><span>${G.length}</span></div><div class="group">${G.map(id=>`<div class="row low-row"><button class="low-b" data-a="ing" data-id="${id}"><span class="low-svg">${bottleSVG(id,lv)}</span><span class="grow"><b>${esc(ING[id].n)}</b><span>${(()=>{ const n=RECS.filter(r=>r.ing.some(i=>i.id===id&&i.r!=="opt")).length; return n+" recette"+(n>1?"s":"")+" l’utilisent"; })()}</span></span></button>${lv===0?`<button class="btn small" data-a="refill" data-id="${id}">Racheté</button>`:`<span class="low-l l${lv}">${["","¼","½"][lv]}</span>`}</div>`).join("")}</div>`; });
  return o+`<div class="gf">Les bouteilles au-dessus de la moitié ne sont pas affichées ici.</div>`;
}

// ---------- 8. Environnement selon l'heure locale de l'appareil ----------
// Le moment choisi dans les réglages n'est plus qu'un aperçu temporaire : au prochain lancement, l'app suit à nouveau l'heure du téléphone.
if(S.settings&&S.settings.moment&&S.settings.moment!=="auto"){ S.settings.moment="auto"; }
window.addEventListener("focus",()=>applyAmbient());

// ---------- 10. Test initial étendu ----------
// Principes suivis : une seule notion par question, options équilibrées, une porte de sortie « je ne sais pas »
// (règles de rédaction de questionnaires, Pew Research Center), et, pour le démarrage à froid, faire évaluer
// quelques cocktails connus ET discriminants (stratégie popularité × information de Rashid et al., IUI 2002).
(function(){
  const nsp=["nsp","Je ne sais pas","gin_tonic"];
  ["amer","acide","force","bulles"].forEach(id=>{ const q=QUIZ.find(x=>x.id===id); if(q&&!q.o.some(o=>o[0]==="nsp")) q.o.push(nsp); });
  const at=QUIZ.findIndex(x=>x.id==="aromes");
  QUIZ.splice(at,0,
    {id:"sucre",q:"Et côté sucre ?",o:[["doux","Plutôt doux","pina_colada"],["juste","Juste ce qu’il faut","whisky_sour"],["sec","Le plus sec possible","martini"],nsp]},
    {id:"texture",q:"Les textures onctueuses : crème, blanc d’œuf, coco ?",o:[["oui","J’aime beaucoup","pisco_sour"],["egal","Pourquoi pas","whisky_sour"],["non","Pas pour moi","daiquiri"],nsp]}
  );
  // Cocktails choisis par calcul parmi les plus connus : popularité² × écart au profil moyen, avec diversité (voir notes de version)
  QUIZ.push({id:"items",type:"items",q:"Tu as déjà goûté ceux-là ?",sub:"Dis ce que tu en as pensé. Passe ceux que tu ne connais pas : ça n’a aucun effet.",items:["negroni","mojito","old_fashioned","pina_colada","aperol_spritz","espresso_martini","moscow_mule","whisky_sour"]});
})();
// Poids réglé par simulation (réglage sur un groupe d’utilisateurs simulés, validation sur deux autres) : un souvenir compte moins qu’une vraie note
const QITEM={love:[1.5,0.35],bof:[0,0.25],no:[-1.5,0.35]};
const _paintQuiz=paintQuiz; paintQuiz=function(){
  const q=QUIZ[QZ.i]; if(!q||q.type!=="items") return _paintQuiz();
  const n=QUIZ.length, cur=QZ.a.items||{}, ov=$("#overlay");
  ov.innerHTML=`<div class="ov-top"><button class="close-x" data-a="qzskip" aria-label="Passer">${IC.x}</button><div class="qz-prog">${QUIZ.map((_,k)=>`<i class="${k<QZ.i?"done":k===QZ.i?"now":""}"></i>`).join("")}</div><button class="link" data-a="qzskip" style="font-size:calc(15rem / 17)">Passer</button></div>
  <div class="ov-body qz ${QZ.dir}"><div class="bm-count">Question ${QZ.i+1} sur ${n}</div><div class="qz-q">${esc(q.q)}</div><div class="muted" style="margin-top:6px">${esc(q.sub)}</div>
  <div class="qz-items">${q.items.map((id,k)=>{ const r=RMAP[id], v=cur[id]; return `<div class="qzi" style="animation-delay:${60+k*40}ms"><span class="qzi-g">${glassThumb(r)}</span><b>${esc(r.n)}</b><div class="qzi-b">${[["love","J’aime"],["bof","Bof"],["no","Pas pour moi"]].map(([k2,l])=>`<button class="${v===k2?"on "+k2:""}" data-a="qzitem" data-id="${id}" data-v="${k2}">${l}</button>`).join("")}</div></div>`; }).join("")}</div></div>
  <div class="ov-bottom">${QZ.i>0?`<button class="btn gray" data-a="qznav" data-d="-1" style="flex:0 0 34%">Retour</button>`:""}<button class="btn" data-a="qznav" data-d="1">${Object.keys(cur).length?"Terminer":"Je n’en connais aucun"}</button></div>`;
  QZ.dir="";
};
ACT.qzitem=(d)=>{ QZ.a.items=QZ.a.items||{}; if(QZ.a.items[d.id]===d.v) delete QZ.a.items[d.id]; else QZ.a.items[d.id]=d.v; paintQuiz(); };
const _quizPrior=quizPrior; quizPrior=function(){ const P=_quizPrior(); if(!P) return P; const A=S.quiz||{};
  ({doux:()=>{P.dir[0]+=.16;},sec:()=>{P.dir[0]-=.18;P.dir[3]+=.04;}})[A.sucre]?.();
  P.cream=({oui:1,egal:0,non:-1})[A.texture]||0; return P; };
// Les cocktails évalués dans le quiz deviennent de vraies notes pour le modèle (poids un peu réduit : c'est un souvenir, pas une dégustation)
const _trainSet=trainSet; trainSet=function(){ const T=_trainSet(); const I=(S.quiz&&S.quiz.items)||{};
  Object.entries(I).forEach(([id,v])=>{ if(RMAP[id]&&!T[id]&&QITEM[v]) T[id]={v:QITEM[v][0],w:QITEM[v][1]}; }); return T; };

// les trophées (y compris cachés) sont vérifiés dès l'ouverture, d'après les données déjà enregistrées
setTimeout(()=>{ try{ checkTrophies(); }catch(e){} },2800);
