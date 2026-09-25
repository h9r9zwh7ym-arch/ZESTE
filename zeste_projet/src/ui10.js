// ================= V10 =================
const DEFAULT_HOME=[["suggest",1],["duo",1],["table",1],["rewind",1],["na",1],["disc",1],["season",1],["prep",1]];
const HOME_N={suggest:"Aussi pour toi",duo:"Surprends-moi et achat malin",table:"À table : accords mets",rewind:"Ton Zeste Rewind",na:"Sans alcool",disc:"Le saviez-vous ?",season:"De saison",prep:"Préparations à surveiller"};
function fixState(){
  S.settings=Object.assign({unit:"cl",nobasic:[],na:false,wow:true,splash:true,ambiance:true,moment:"auto"},S.settings||{});
  if(!Array.isArray(S.settings.nobasic)) S.settings.nobasic=[];
  let H=Array.isArray(S.settings.home)?S.settings.home.filter(x=>HOME_N[x[0]]):[];
  DEFAULT_HOME.forEach(d=>{ if(!H.some(x=>x[0]===d[0])) H.push(d.slice()); }); S.settings.home=H;
  S.price=S.price||{};
}
function WOW(){ return FX("stream"); }
function ctxInfo(){ const h=new Date().getHours(), m=new Date().getMonth()+1;
  const auto= momentForHour(h);
  const f=S.settings&&S.settings.moment; const moment=f&&f!=="auto"?f:auto;
  const saison= [12,1,2].includes(m)?"hiver":[11,3].includes(m)?"frais":[6,7,8].includes(m)?"ete":"doux";
  return {moment,saison,label:{matin:"Pour ce matin",aprem:"Pour cet après-midi",apero:"Pour l’apéro",soir:"Pour ce soir",nuit:"Pour finir la soirée"}[moment]}; }

// ---------- Ambiance selon l'heure ----------
const MO_IC={
 matin:`<svg viewBox="0 0 24 24"><path d="M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M7 18a5 5 0 0 1 10 0" fill="currentColor" opacity=".9"/><g class="rays" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 7v2"/><path d="M5.6 10.6l1.4 1.4"/><path d="M18.4 10.6L17 12"/></g></svg>`,
 aprem:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><g class="rays" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></g></svg>`,
 apero:`<svg viewBox="0 0 24 24"><path d="M2.5 17.5h19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6 17.5a6 6 0 0 1 12 0" fill="currentColor"/><path d="M5 20.5h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".5"/></svg>`,
 soir:`<svg viewBox="0 0 24 24"><path d="M15.5 3.5a8.5 8.5 0 1 0 5 13.6A7 7 0 0 1 15.5 3.5z" fill="currentColor"/></svg>`,
 nuit:`<svg viewBox="0 0 24 24"><path d="M14 4a7.5 7.5 0 1 0 6 11.5A6 6 0 0 1 14 4z" fill="currentColor"/><path class="tw" d="M19 3l.6 1.4L21 5l-1.4.6L19 7l-.6-1.4L17 5l1.4-.6z" fill="currentColor"/><path class="tw t2" d="M21.5 9l.4.9.9.4-.9.4-.4.9-.4-.9-.9-.4.9-.4z" fill="currentColor"/></svg>`
};
let AMB_M=null;
function applyAmbient(){
  const on=S.settings.ambiance!==false, m=currentMoment();
  if(on) document.documentElement.dataset.moment=m; else delete document.documentElement.dataset.moment;
  let a=document.getElementById("ambient");
  if(!a){ a=document.createElement("div"); a.id="ambient"; a.setAttribute("aria-hidden","true");
    a.innerHTML=`<div class="amb-sky"></div><div class="amb-sun"></div><div class="amb-stars">${[...Array(46)].map((_,k)=>`<i style="left:${(hrand("x"+k)*100).toFixed(1)}%;top:${(hrand("y"+k)*48).toFixed(1)}%;--s:${(0.6+hrand("s"+k)*1.6).toFixed(1)}px;animation-delay:${(hrand("d"+k)*4).toFixed(2)}s"></i>`).join("")}<b class="shoot"></b></div><div class="amb-dust">${[...Array(18)].map((_,k)=>`<i style="left:${(hrand("dx"+k)*100).toFixed(1)}%;top:${(8+hrand("dy"+k)*40).toFixed(1)}%;animation-delay:${(hrand("dd"+k)*9).toFixed(2)}s;animation-duration:${(8+hrand("du"+k)*7).toFixed(1)}s"></i>`).join("")}</div>`;
    document.body.prepend(a); }
  a.style.display=on?"":"none";
  if(AMB_M!==null&&AMB_M!==m){ dirty.today=1; if(TAB==="today") renderView("today"); }
  AMB_M=m;
}
setInterval(()=>{ if(S&&S.settings) applyAmbient(); },60000);

// ---------- Accueil personnalisable ----------
function vToday(){
  const c=ctxInfo(), mo=c.moment, h=new Date().getHours(), nm=(S.settings.name||"").trim();
  const title= nm? ({matin:"Bonjour ",aprem:"Salut ",apero:"Santé ",soir:"Bonsoir ",nuit:"Bonne nuit "}[mo])+nm : (h>=17||h<5? "Ce soir" : "Aujourd’hui");
  const list=tonight(), empty=!barCount(), taste=hasTaste();
  let o=nav(title)+`<div class="content"><div class="eyebrow mo-eyebrow"><span class="mo-ic mo-${mo}">${MO_IC[mo]}</span>${dateLabel()}<span class="mo-k">${esc(MOMENTS[mo].k)}</span></div><h1 class="lt">${esc(title)}</h1>`;
  if(empty){
    o+=`<div class="hero"><div class="glow" style="background:radial-gradient(circle at 50% 40%, #E8A84A44, transparent 65%)"></div><div class="hg" data-a="jiggle">${glassSVG(RMAP.negroni,{pour:HERO_LAST!=="_w",live:1,stream:HERO_LAST!=="_w"&&WOW()})}</div><div class="hn">Bienvenue au bar</div><div class="hr">Dis-moi quelles bouteilles tu as. Sucre, œufs, agrumes et autres basiques sont déjà comptés.</div><div class="btn-row"><button class="btn" data-a="quickadd">Remplir mon bar</button></div></div>`;
    HERO_LAST="_w";
  } else if(list.length){
    const r=list[0], anim=HERO_LAST!==r.id; HERO_LAST=r.id; const m=metricsR(r);
    S.heroLog=S.heroLog||[]; const dsd=daySeed(); if(!S.heroLog.some(x=>x.id===r.id&&x.d===dsd)){ S.heroLog.push({id:r.id,d:dsd}); S.heroLog=S.heroLog.slice(-30); try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} }
    o+=`<div class="hero ${anim?"":"still"}"><div class="glow" style="background:radial-gradient(circle at 50% 36%, ${r.col}70, transparent 62%)"></div><div class="hg" data-a="jiggle">${glassSVG(r,{pour:anim,live:1,stream:anim&&WOW()})}</div><div class="kick">${esc(c.label)}</div><div class="hn">${esc(r.n)}</div><div class="hr">${esc(reasons(r))}</div><div class="pills">${S.ratings[r.id]?`<span class="pill match">Noté ${S.ratings[r.id]} sur 5</span>`:taste&&matchPct(r)>=62?`<span class="pill match">${matchPct(r)} % pour toi</span>`:`<span class="pill">${esc(FAMILIES[r.fam])}</span>`}<span class="pill">${Math.round(m.abv)} % d’alcool</span>${hasPrices()&&!costOf(r.ing).miss.length?`<span class="pill">${chf(costOf(r.ing).tot)}</span>`:""}</div><div class="btn-row"><button class="btn sec" data-a="rec" data-id="${r.id}">Voir la recette</button><button class="btn" data-a="barmode" data-id="${r.id}">${IC.play}Préparer</button></div></div>`;
  } else {
    o+=`<div class="hero"><div class="hg">${glassSVG({g:"coupe",col:"#D8D0C0",ing:[]})}</div><div class="hn">Presque !</div><div class="hr">Rien n’est encore faisable avec ton bar, mais il manque souvent une seule bouteille.</div><div class="btn-row"><button class="btn sec" data-a="tab" data-t="bar">Voir les achats malins</button></div></div>`;
  }
  o+=remindCard();
  const ctx={list,empty};
  S.settings.home.forEach(([k,on])=>{ if(on&&HOME_SEC[k]) o+=HOME_SEC[k](ctx); });
  o+=`<div class="sp24"></div><div class="btn-row"><button class="btn gray home-edit" data-a="homeedit">${IC.filter}Personnaliser l’accueil</button></div>`;
  return o+`<div class="sp24"></div></div>`;
}
const HOME_SEC={
  suggest:({list})=> list.length>1? `<h2 class="sh">Aussi pour toi<button class="more" data-a="tab" data-t="cocktails" data-f="ok">Tout voir</button></h2><div class="sh-sub">${list.length} cocktails possibles, variés et classés selon tes goûts</div><div class="scroller stag">${list.slice(1,12).map(r=>tile(r)).join("")}</div>` : "",
  duo:({list,empty})=>{ const br=!empty&&(bottleRecs().find(b=>tracked(b.id))||bottleRecs()[0]);
    return `<div class="duo"><button class="duo-c" data-a="roulette"><div class="di">${IC.dice}</div><div class="dt">Surprends-moi</div><div class="ds">${list.length?list.length+" possibles":"Toute la carte"}</div></button>${br?`<button class="duo-c" data-a="ing" data-id="${br.id}"><div class="db">${bottleSVG(br.id,4)}</div><div class="dt">${esc(shortN(br.id))}</div><div class="ds">+${br.rs.length} cocktail${br.rs.length>1?"s":""} si tu l’achètes</div></button>`:`<button class="duo-c" data-a="tab" data-t="labo"><div class="di">${IC.flask}</div><div class="dt">Le labo</div><div class="ds">Compose ta création</div></button>`}</div>`; },
  table:()=>`<h2 class="sh">À table</h2><div class="sh-sub">Tu manges quoi ? Je te dis quoi boire avec</div><div class="dishes">${DISHES.map((d,k)=>`<button class="dish" data-a="dish" data-id="${d.id}" style="animation-delay:${k*25}ms"><span class="de">${d.e}</span><span class="dn">${esc(d.n)}</span></button>`).join("")}</div>`,
  rewind:()=> rewindEligible()? `<button class="rw-card" data-a="rewind"><div class="rw-bg"></div><div class="rw-in"><div class="rw-k">${IC.sparkle}Zeste Rewind</div><div class="rw-t">Ton année en cocktails</div><div class="rw-s">${rewindData().count} verres, ${rewindData().distinct} recettes. Revis tout ça en quelques histoires.</div></div><div class="rw-play">${IC.play}</div></button>` : "",
  na:()=>{ const naL=RECS.filter(r=>r.na&&status(r).ok).sort((a,b)=>score(b)-score(a)).slice(0,8);
    return naL.length? `<h2 class="sh">Sans alcool<button class="more" data-a="nafilter">Tout voir</button></h2><div class="sh-sub">Tout le plaisir, zéro degré</div><div class="scroller">${naL.map(r=>tile(r)).join("")}</div>` : ""; },
  disc:()=>discoveryCard(),
  season:()=>{ const mo=new Date().getMonth()+1, se=SEASON[mo];
    return `<h2 class="sh">De saison</h2><div class="sh-sub">${esc(se.p.charAt(0).toUpperCase()+se.p.slice(1))}</div><div class="card season"><div class="sp">${esc(se.t)}</div><div class="mini-list">${se.r.map(id=>RMAP[id]).filter(Boolean).map(r=>`<button class="mini" data-a="rec" data-id="${r.id}">${glassSVG(r)}<div class="mn">${esc(r.n)}</div></button>`).join("")}</div></div>`; },
  prep:()=>{ const exp=(S.preps||[]).filter(p=>daysLeft(p)<=3); return exp.length? `<h2 class="sh">À surveiller</h2><div class="sh-sub">Préparations maison bientôt périmées</div><div class="group">${exp.map(p=>prepRow(p)).join("")}</div>` : ""; }
};
function homeSheet(){
  const sh=openSheet(()=>({title:"Personnaliser l’accueil",right:`<button class="link" data-a="closesheet" style="font-weight:600">OK</button>`,
    body:`<p class="body" style="margin-bottom:12px">Choisis les sections et leur ordre. La suggestion du soir reste toujours en haut.</p><div class="group home-list">${S.settings.home.map(([k,on],i,A)=>`<div class="row home-row" data-hk="${k}"><button class="hm" data-a="homemv" data-k="${k}" data-d="-1" ${i===0?"disabled":""} aria-label="Monter">${IC.chev.replace('class="chev"','class="chev up"')}</button><button class="hm" data-a="homemv" data-k="${k}" data-d="1" ${i===A.length-1?"disabled":""} aria-label="Descendre">${IC.chev.replace('class="chev"','class="chev down"')}</button><div class="grow ${on?"":"muted"}">${esc(HOME_N[k])}</div><button class="switch ${on?"on":""}" data-a="homeon" data-k="${k}" aria-label="${esc(HOME_N[k])}"></button></div>`).join("")}</div><div class="sp16"></div><div class="btn-row"><button class="btn danger" data-a="homereset">Rétablir l’ordre par défaut</button></div>`}));
  sh.isHome=1;
}
function flipRows(sh, mutate){
  const before={}; sh.el.querySelectorAll(".home-row").forEach(r=>before[r.dataset.hk]=r.getBoundingClientRect().top);
  mutate(); paintSheet(sh);
  sh.el.querySelectorAll(".home-row").forEach(r=>{ const b=before[r.dataset.hk]; if(b==null) return; const d=b-r.getBoundingClientRect().top; if(!d) return;
    r.style.transition="none"; r.style.transform=`translateY(${d}px)`; r.style.zIndex=2; void r.offsetWidth; r.style.transition="transform .38s cubic-bezier(.3,1.25,.5,1)"; r.style.transform=""; setTimeout(()=>{ r.style.zIndex=""; },400); });
}

// ---------- Accords mets ----------
function dishSheet(id){
  const d=DISHES.find(x=>x.id===id);
  openSheet(()=>{ const P=dishPicks(d);
    return {title:"",body:`<div class="dish-hero"><div class="dish-e">${d.e}</div><h1>${esc(d.n)}</h1><p>${esc(d.why)}</p></div><h2 class="sh">Ce qui va bien avec</h2><div class="sp8"></div><div class="group">${P.map(x=>recRow(x.r,x.why)).join("")}</div><div class="gf">Classés selon l’accord, ton bar et tes goûts. Point vert : tu peux le faire maintenant.</div>`}; });
}

// ---------- Coût par verre ----------
function costLine(items, mult, id){
  if(!hasPrices()) return "";
  const c=costOf(items,mult);
  if(!c.miss.length) return `<div class="cost ok"><span class="cost-ic">${IC.coin}</span><div class="grow"><b>${chf(c.tot)}</b><span>${mult>1?"pour "+mult+" verres":"le verre"}${c.est>0.01?", basiques estimés compris":""}</span></div></div>`;
  return `<div class="cost"><span class="cost-ic">${IC.coin}</span><div class="grow"><b>Coût partiel${c.tot>0.01?" : "+chf(c.tot):""}</b><span>Prix à renseigner : ${c.miss.map(x=>`<button class="link" data-a="ing" data-id="${x}">${esc(shortN(x))}</button>`).join(", ")}</span></div></div>`;
}
function priceBlock(id){
  const i=ING[id]; if(i.basic) return `<div class="gf">Coût estimé automatiquement (environ ${chf((BASIC_COST[id]||0)*(["menthe","basilic","oeuf","sucre","concombre","worcestershire","tabasco","fleur_oranger","marmelade"].includes(id)?1:10))} ${["menthe","basilic"].includes(id)?"la feuille":id==="oeuf"?"l’œuf":id==="sucre"?"le morceau":id==="concombre"?"la rondelle":["worcestershire","tabasco","fleur_oranger"].includes(id)?"le trait":id==="marmelade"?"la cuillère":"les 10 ml"}).</div>`;
  const p=(S.price||{})[id]||{}, v=p.v||DEFVOL[i.cat]||700, sizes=i.cat==="bitters"?[100,200,500]:[200,500,700,750,1000];
  const up=unitPrice(id);
  return `<div class="gh">Prix</div><div class="group"><label class="row"><div class="grow">Prix de la bouteille</div><input class="price-in" type="number" inputmode="decimal" step="0.05" min="0" data-price="${id}" value="${p.p!=null?p.p:""}" placeholder="0,00"><span class="muted">CHF</span></label><div class="row"><div class="grow">Contenance</div><div class="seg" data-k="vol" style="margin:0;width:${sizes.length*50}px">${sizes.map(s=>`<button class="${v===s?"on":""}" data-a="setvol" data-id="${id}" data-v="${s}">${s>=1000?"1 l":s/10}</button>`).join("")}</div></div></div><div class="gf">${up!=null?`Soit ${chf(up*10)} le cl. `:""}Sert à calculer le coût de chaque cocktail et la valeur de ton bar.</div>`;
}

// ---------- Zeste Rewind ----------
function rewindData(){ return memo("rewind",rewindDataRaw); }
function rewindDataRaw(){
  const now=Date.now(), H=S.hist.filter(h=>now-h.t<365*864e5&&RMAP[h.id]);
  const cnt={}; H.forEach(h=>cnt[h.id]=(cnt[h.id]||0)+1);
  const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]||((S.ratings[b[0]]||0)-(S.ratings[a[0]]||0)))[0];
  const bases={}; H.forEach(h=>{ const b=BASE_LABEL[baseGroup(RMAP[h.id])]; bases[b]=(bases[b]||0)+1; });
  const fams=new Set(H.map(h=>RMAP[h.id].fam));
  const months=Array(12).fill(0); const m0=new Date().getMonth(); H.forEach(h=>{ const d=new Date(h.t); const k=(d.getMonth()-(m0+1)+24)%12; months[k]++; });
  const monthNames=[...Array(12)].map((_,k)=>monthName(((m0+1+k)%12)+1));
  const best=Object.keys(cnt).filter(id=>S.ratings[id]).sort((a,b)=>S.ratings[b]-S.ratings[a]||cnt[b]-cnt[a])[0];
  let spent=0, priced=0; H.forEach(h=>{ const c=costOf(adjItems(RMAP[h.id])); if(!c.miss.length){ spent+=c.tot; priced++; } });
  const topMonth=months.indexOf(Math.max(...months));
  return {count:H.length,distinct:Object.keys(cnt).length,top:top&&{id:top[0],n:top[1]},bases:Object.entries(bases).sort((a,b)=>b[1]-a[1]),fams:[...fams],months,monthNames,topMonth,best,avgCost:priced?spent/priced:null,priced,style:tasteStyle(),tro:(S.tro||[]).length,crea:(S.custom||[]).length};
}
function rewindEligible(){ return S.hist.filter(h=>RMAP[h.id]).length>=3; }
let RW=null;
function openRewind(){
  const D=rewindData(), top=D.top&&RMAP[D.top.id], best=D.best&&RMAP[D.best];
  const col=top?top.col:"#E8A84A";
  const slides=[];
  slides.push({c:[col,"#1A1020"],h:`<div class="rw-small">Ton année Zeste</div><div class="rw-big" data-count="${D.count}">0</div><div class="rw-mid">cocktails préparés</div><div class="rw-note">dont ${D.distinct} recettes différentes</div>`});
  if(top) slides.push({c:[top.col,mix(top.col,"#000000",.6)],h:`<div class="rw-small">Ton cocktail de l’année</div><div class="rw-glass">${glassSVG(top,{pour:true,live:1})}</div><div class="rw-name">${esc(top.n)}</div><div class="rw-note">préparé ${D.top.n} fois${S.ratings[top.id]?", noté "+S.ratings[top.id]+" sur 5":""}</div>`});
  if(D.bases.length){ const mx=D.bases[0][1]; slides.push({c:["#C98A2E","#2A1606"],h:`<div class="rw-small">Ton alcool fétiche</div><div class="rw-name">${esc(D.bases[0][0])}</div><div class="rw-bars">${D.bases.slice(0,5).map(([n,v],k)=>`<div class="rw-bar"><span>${esc(n)}</span><i style="--w:${Math.round(v/mx*100)}%;animation-delay:${0.3+k*0.12}s"></i><b>${v}</b></div>`).join("")}</div>`}); }
  slides.push({c:["#6A9A4A","#0E1A0A"],h:`<div class="rw-small">Tu as exploré</div><div class="rw-big" data-count="${D.fams.length}">0</div><div class="rw-mid">famille${D.fams.length>1?"s":""} de cocktails sur ${Object.keys(FAMILIES).length}</div><div class="rw-chips">${Object.keys(FAMILIES).map((f,k)=>`<span class="${D.fams.includes(f)?"on":""}" style="animation-delay:${0.4+k*0.06}s">${esc(FAMILIES[f])}</span>`).join("")}</div>`});
  if(D.count>=3){ const mx=Math.max(...D.months,1); slides.push({c:["#3A6AC0","#08102A"],h:`<div class="rw-small">Ton mois le plus festif</div><div class="rw-name">${esc(D.monthNames[D.topMonth].charAt(0).toUpperCase()+D.monthNames[D.topMonth].slice(1))}</div><div class="rw-months">${D.months.map((v,k)=>`<div class="rw-m ${k===D.topMonth?"top":""}"><i style="--h:${Math.round(v/mx*100)}%;animation-delay:${0.2+k*0.05}s"></i><span>${esc(D.monthNames[k].slice(0,1).toUpperCase())}</span></div>`).join("")}</div>`}); }
  if(best&&best!==top) slides.push({c:[best.col,mix(best.col,"#000000",.6)],h:`<div class="rw-small">Ton coup de cœur</div><div class="rw-glass">${glassSVG(best,{pour:true,live:1})}</div><div class="rw-name">${esc(best.n)}</div><div class="rw-stars">${[1,2,3,4,5].map(k=>`<span class="${k<=S.ratings[best.id]?"on":""}" style="animation-delay:${0.5+k*0.1}s">${IC.star}</span>`).join("")}</div>`});
  if(D.style){ const tv=tasteVector(); slides.push({c:["#8A4AB8","#140820"],h:`<div class="rw-small">Ton style</div><div class="rw-name">${esc(D.style)}</div>${tv&&tv.liked?`<div class="rw-radar">${radarSVG(tv.liked)}</div>`:""}`}); }
  if(D.avgCost!=null&&D.priced>=2) slides.push({c:["#C8A020","#1A1404"],h:`<div class="rw-small">Côté porte-monnaie</div><div class="rw-big money">${chf(D.avgCost)}</div><div class="rw-mid">le verre en moyenne</div><div class="rw-note">Au bar, compte plutôt entre 14 et 20 CHF. Ton bar à la maison est rentable.</div>`});
  slides.push({c:[col,"#100A14"],end:1,h:`<div class="rw-small">C’était ton année</div><div class="rw-sum"><div><b>${D.count}</b><span>verres</span></div><div><b>${D.distinct}</b><span>recettes</span></div><div><b>${D.fams.length}</b><span>familles</span></div><div><b>${D.tro}</b><span>trophées</span></div></div>${top?`<div class="rw-note">Cocktail de l’année : <b>${esc(top.n)}</b></div>`:""}<div class="rw-actions"><button class="btn" data-a="rwsave">${IC.share}Enregistrer ma carte</button><button class="btn gray" data-a="rwclose">Terminer</button></div>`});
  RW={i:0,slides,D,t0:0,timer:null,paused:false};
  let el=document.getElementById("rewind"); if(!el){ el=document.createElement("div"); el.id="rewind"; document.body.appendChild(el); }
  el.innerHTML=`<div class="rw-prog">${slides.map(()=>`<i><b></b></i>`).join("")}</div><button class="close-x rw-x" data-a="rwclose" aria-label="Fermer">${IC.x}</button><div class="rw-stage"></div><div class="rw-tap l"></div><div class="rw-tap r"></div>`;
  el.classList.add("open");
  el.querySelector(".rw-tap.l").onclick=()=>rwGo(-1); el.querySelector(".rw-tap.r").onclick=()=>rwGo(1);
  const st=el.querySelector(".rw-stage"); st.onpointerdown=()=>{ RW&&(RW.paused=true); }; st.onpointerup=()=>{ RW&&(RW.paused=false); };
  rwShow(0);
}
function rwShow(i){
  if(!RW) return; RW.i=i; const el=document.getElementById("rewind"), s=RW.slides[i]; el.classList.toggle("end",!!s.end);
  el.style.setProperty("--a",s.c[0]); el.style.setProperty("--b",s.c[1]);
  el.querySelectorAll(".rw-prog i").forEach((p,k)=>{ p.className=k<i?"done":k===i?"now":""; p.querySelector("b").style.width=k<i?"100%":"0%"; });
  const stg=el.querySelector(".rw-stage"); stg.innerHTML=`<div class="rw-slide">${s.h}</div>`;
  stg.querySelectorAll("[data-count]").forEach(n=>{ const v=+n.dataset.count, t0=performance.now(); const step=t=>{ const k=Math.min(1,(t-t0)/1100), e=1-Math.pow(1-k,3); n.textContent=Math.round(v*e); if(k<1) requestAnimationFrame(step); }; requestAnimationFrame(step); });
  if(i===RW.slides.length-1||(s.h.includes("rw-big")&&i===0)) setTimeout(()=>{ const b=stg.getBoundingClientRect(); if(i===RW.slides.length-1||WOW()) confetti(b.left+b.width/2,b.top+b.height*0.35,s.c[0]); },500);
  cancelAnimationFrame(RW.timer); const dur=s.end?0:5200; let acc=0, last=performance.now();
  const bar=el.querySelectorAll(".rw-prog i b")[i];
  if(!dur){ bar.style.width="100%"; return; }
  const tick=t=>{ if(!RW) return; const dt=t-last; last=t; if(!RW.paused) acc+=dt; bar.style.width=Math.min(100,acc/dur*100)+"%"; if(acc>=dur) rwGo(1); else RW.timer=requestAnimationFrame(tick); };
  RW.timer=requestAnimationFrame(tick);
}
function rwGo(d){ if(!RW) return; const n=RW.i+d; if(n<0) return rwShow(0); if(n>=RW.slides.length) return; rwShow(n); }
function rwClose(){ if(RW) cancelAnimationFrame(RW.timer); RW=null; const el=document.getElementById("rewind"); if(el){ el.classList.remove("open"); setTimeout(()=>{ el.innerHTML=""; },350); } }
function svgStandalone(s){ return s.replace(/var\(--glass-stroke\)/g,"rgba(255,245,230,.7)").replace(/var\(--glass-fill\)/g,"rgba(255,255,255,.08)").replace(/ class="[^"]*"/g,"").replace(/ style="[^"]*"/g,""); }
async function rwSave(){
  const D=RW&&RW.D; if(!D) return; const top=D.top&&RMAP[D.top.id], col=top?top.col:"#E8A84A";
  const W=1080,H=1350; const g=top? svgStandalone(glassSVG(top)).replace("<svg",`<svg x="340" y="300" width="400" height="500"`) : "";
  const st=(x,y,v,l)=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="92" fill="#fff">${v}</text><text x="${x}" y="${y+48}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="32" fill="rgba(255,255,255,.72)">${l}</text>`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><radialGradient id="bg" cx="50%" cy="32%" r="80%"><stop offset="0" stop-color="${col}"/><stop offset=".55" stop-color="${mix(col,"#000000",.65)}"/><stop offset="1" stop-color="#0C0810"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#bg)"/>
    <text x="540" y="150" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-weight="700" font-size="40" letter-spacing="3" fill="rgba(255,255,255,.8)">MON ZESTE REWIND</text>
    <text x="540" y="240" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="76" fill="#fff">${new Date().getFullYear()}</text>${g}
    ${top?`<text x="540" y="880" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="66" fill="#fff">${esc(top.n)}</text><text x="540" y="935" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="32" fill="rgba(255,255,255,.72)">mon cocktail de l’année</text>`:""}
    ${st(200,1110,D.count,"verres")}${st(420,1110,D.distinct,"recettes")}${st(640,1110,D.fams.length,"familles")}${st(860,1110,D.tro,"trophées")}
    <text x="540" y="1270" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="44" fill="rgba(255,255,255,.9)">Zeste</text></svg>`;
  try{
    const img=new Image(); img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg); await img.decode();
    const cv=document.createElement("canvas"); cv.width=W; cv.height=H; cv.getContext("2d").drawImage(img,0,0);
    const blob=await new Promise(r=>cv.toBlob(r,"image/png"));
    try{ const dl=window.claude&&await claude.use("downloads"); if(dl){ await dl.save({filename:"zeste-rewind.png",data:blob}); return; } }catch(e){ if(e&&e.code==="declined") return; }
    try{ const f=new File([blob],"zeste-rewind.png",{type:"image/png"}); if(navigator.canShare&&navigator.canShare({files:[f]})){ await navigator.share({files:[f]}); return; } }catch(e){ return; }
    const url=URL.createObjectURL(blob); rwClose(); openSheet(()=>({title:"Ta carte",body:`<p class="body" style="margin-bottom:12px">Appuie longuement sur l’image pour l’enregistrer.</p><div style="padding:0 16px"><img src="${url}" alt="Carte Zeste Rewind" style="width:100%;border-radius:16px"></div>`}));
  }catch(e){ toast("Impossible de créer l’image ici"); }
}

// ---------- Animations spectaculaires ----------
function clink(r){
  if(!FX("clink")) return;
  const el=document.createElement("div"); el.className="clink"; const gl=glassSVG(r);
  el.innerHTML=`<div class="ck-l">${gl}</div><div class="ck-r">${gl}</div><div class="ck-burst"></div><div class="ck-drops">${[...Array(12)].map((_,k)=>`<i style="--a:${k*30}deg;--c:${r.col}"></i>`).join("")}</div><div class="ck-txt">Santé !</div>`;
  document.body.appendChild(el); setTimeout(()=>el.remove(),1900);
}
let TILT=null, TILT_CLICK=0;
document.addEventListener("pointerdown",e=>{ if(!FX("tilt")) return; const h=e.target.closest(".hg,.dg"); if(!h) return; TILT={h,x:e.clientX,y:e.clientY,a:0,drag:false}; },{passive:true});
document.addEventListener("pointermove",e=>{ if(!TILT) return; const dx=e.clientX-TILT.x, dy=e.clientY-TILT.y;
  if(!TILT.drag){ if(Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)){ TILT.drag=true; TILT.h.classList.add("tilting"); } else if(Math.abs(dy)>10){ TILT=null; return; } else return; }
  const a=Math.max(-32,Math.min(32,dx*0.22)); TILT.a=a; TILT.h.style.rotate=a+"deg"; const tf=TILT.h.querySelector(".tiltfix"); if(tf) tf.style.transform=`rotate(${-a}deg)`; },{passive:true});
function tiltEnd(){ if(!TILT) return; const {h,drag,a}=TILT; TILT=null; if(!drag) return; TILT_CLICK=Date.now();
  h.classList.remove("tilting"); h.classList.add("tilt-back"); h.style.rotate=""; const tf=h.querySelector(".tiltfix"); if(tf){ tf.style.transform=""; tf.classList.remove("slosh"); void tf.getBoundingClientRect(); tf.style.setProperty("--sl",(a>0?-1:1)*Math.min(9,Math.abs(a)/3)+"deg"); tf.classList.add("slosh"); }
  if(Math.abs(a)>14){ const b=h.getBoundingClientRect(); bubbles(b.left+b.width/2+(a>0?30:-30),b.top+b.height*0.3); }
  setTimeout(()=>h.classList.remove("tilt-back"),700); }
document.addEventListener("pointerup",tiltEnd,{passive:true}); document.addEventListener("pointercancel",tiltEnd,{passive:true});
document.addEventListener("click",e=>{ if(Date.now()-TILT_CLICK<250&&e.target.closest(".hg,.dg")){ e.stopPropagation(); e.preventDefault(); } },true);
function applyWowClass(){ document.body.classList.toggle("wow",WOW()); }

// ---------- Actions ----------
Object.assign(ACT,{
  homeedit:()=>homeSheet(),
  homemv:(d)=>{ const sh=SHEETS[SHEETS.length-1]; const H=S.settings.home, i=H.findIndex(x=>x[0]===d.k), j=i+(+d.d); if(j<0||j>=H.length) return; flipRows(sh,()=>{ [H[i],H[j]]=[H[j],H[i]]; }); homeChanged(); },
  homeon:(d)=>{ const x=S.settings.home.find(x=>x[0]===d.k); x[1]=x[1]?0:1; const sh=SHEETS[SHEETS.length-1]; sh&&paintSheet(sh); homeChanged(); },
  homereset:()=>{ S.settings.home=DEFAULT_HOME.map(x=>x.slice()); const sh=SHEETS[SHEETS.length-1]; sh&&flipRows(sh,()=>{}); homeChanged(); },
  dish:(d)=>dishSheet(d.id),
  rewind:()=>openRewind(), rwclose:()=>rwClose(), rwsave:()=>rwSave(),
  setvol:(d)=>{ S.price=S.price||{}; S.price[d.id]=Object.assign({},S.price[d.id]||{},{v:+d.v}); changed(); },
  setamb:()=>{ S.settings.ambiance=S.settings.ambiance===false; save(); applyAmbient(); changed(); },
  setmoment:(d)=>{ S.settings.moment=d.v; save(); applyAmbient(); HERO_LAST=null; changed(); },
  setwow:()=>{ S.settings.wow=!WOW(); applyWowClass(); changed(); },
  setsplash:()=>{ S.settings.splash=S.settings.splash===false; changed(); }
});
const _made=ACT.made; ACT.made=(d,t)=>{ _made(d,t); clink(RMAP[d.id]); };
const _bmf=ACT.bmfinish; ACT.bmfinish=(d,t)=>{ const r=BM&&BM.r; _bmf(d,t); if(r) setTimeout(()=>clink(r),120); };
document.addEventListener("change",e=>{ const t=e.target; if(t.dataset&&t.dataset.price){ const id=t.dataset.price, v=parseFloat(String(t.value).replace(",",".")); S.price=S.price||{}; const p=S.price[id]=Object.assign({v:DEFVOL[ING[id].cat]||700},S.price[id]||{}); if(isFinite(v)&&v>0) p.p=Math.round(v*100)/100; else delete p.p; changed(); } });

