// ================= VERSION FINALE =================
const FX_LIST=[
 ["splash","Animation de lancement","Le verre qui se dessine et se remplit à l’ouverture"],
 ["sky","Ciel animé","Soleil, étoiles et poussières dorées qui bougent selon l’heure"],
 ["live","Verres vivants","Vagues, bulles qui montent et glaçons qui flottent"],
 ["stream","Jet de versement","Le cocktail coule dans le verre avant de le remplir"],
 ["tilt","Verre inclinable","Fais pencher le verre du bout du doigt, le liquide reste à niveau"],
 ["clink","Trinquer","Deux verres qui trinquent quand tu indiques avoir préparé un cocktail"],
 ["confetti","Confettis et cœurs","Pour les coups de cœur, les favoris et les trophées"],
 ["slide","Transitions directionnelles","Les onglets glissent dans le sens de ta navigation"],
 ["reveal","Apparition au défilement","Les sections arrivent en douceur quand tu changes d’onglet"],
 ["pull","Tirer pour une surprise","Tire l’accueil vers le bas pour lancer la roulette"]
];
const FX_PRESETS={complet:{},standard:{stream:false,tilt:false,clink:false,slide:false,pull:false},reduit:Object.fromEntries(FX_LIST.map(x=>[x[0],false]))};
const REDUCED=matchMedia("(prefers-reduced-motion: reduce)");
function FX(k){ if(REDUCED.matches) return false; const f=(S.settings&&S.settings.fx)||{}; return f[k]!==false; }
function fxPreset(){ const f=S.settings.fx||{}; for(const [n,p] of Object.entries(FX_PRESETS)){ if(FX_LIST.every(([k])=>(f[k]!==false)===(p[k]!==false))) return n; } return "perso"; }
// Recettes fusionnées : les anciens identifiants sont reportés sur ceux qu'on garde
const ID_ALIAS={airmail:"air_mail",harvey_wallbanger:"harvey"};
function migrateIds(){ const t=JSON.stringify(S); let n=t; for(const a in ID_ALIAS) n=n.split('"'+a+'"').join('"'+ID_ALIAS[a]+'"');
  if(n!==t){ S=JSON.parse(n); if(Array.isArray(S.fav)) S.fav=[...new Set(S.fav)]; } }
function fixState(){
  migrateIds();
  S.settings=Object.assign({unit:"cl",nobasic:[],na:false,ambiance:true,moment:"auto",theme:"auto",cur:"CHF",explore:1,ctx:true},S.settings||{});
  if(!Array.isArray(S.settings.nobasic)) S.settings.nobasic=[];
  let H=Array.isArray(S.settings.home)?S.settings.home.filter(x=>HOME_N[x[0]]):[];
  DEFAULT_HOME.forEach(d=>{ if(!H.some(x=>x[0]===d[0])) H.push(d.slice()); }); S.settings.home=H;
  if(!S.settings.fx){ S.settings.fx={}; if(S.settings.wow===false) ["stream","tilt","clink","slide"].forEach(k=>S.settings.fx[k]=false); if(S.settings.splash===false) S.settings.fx.splash=false; }
  S.price=S.price||{};
}
function applyTheme(){ const t=S.settings.theme; if(t==="light"||t==="dark") document.documentElement.dataset.theme=t; else delete document.documentElement.dataset.theme; }
function applyFx(){ document.body.classList.toggle("no-sky",!FX("sky")); document.body.classList.toggle("wow",FX("stream")||FX("tilt")); }
function homeChanged(){ save(); dirty.today=1; if(TAB==="today") renderView("today"); }

// ---------- Paramètres ----------
const ICS={ // pastilles de couleur façon réglages iOS
 user:["#FF9500",`<svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="4" fill="#fff"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0z" fill="#fff"/></svg>`],
 quiz:["#AF52DE",IC.sparkle],
 txt:["#8E8E93",`<svg viewBox="0 0 24 24"><text x="3" y="17" font-size="11" font-weight="700" fill="#fff" font-family="-apple-system,sans-serif">A</text><text x="10" y="18" font-size="15" font-weight="700" fill="#fff" font-family="-apple-system,sans-serif">A</text></svg>`],
 theme:["#5856D6",`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 4a8 8 0 0 1 0 16z" fill="#fff"/></svg>`],
 sky:["#FF9F0A",`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="#fff"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`],
 clock:["#34C759",`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 7.5V12l3 2" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`],
 snd:["#FF3B30",`<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="#fff"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`],
 anim:["#FF2D55",`<svg viewBox="0 0 24 24"><path d="M12 3l2 6.2 6.5 2.3-6.5 2.3L12 20l-2-6.2L3.5 11.5 10 9.2z" fill="#fff"/></svg>`],
 home:["#007AFF",`<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" fill="#fff"/></svg>`],
 reco:["#FF9500",IC.dice],
 ctx:["#5AC8FA",`<svg viewBox="0 0 24 24"><path d="M15.5 3.5a8.5 8.5 0 1 0 5 13.6A7 7 0 0 1 15.5 3.5z" fill="#fff"/></svg>`],
 na:["#30D158",`<svg viewBox="0 0 24 24"><path d="M6 4h12l-1.5 16h-9z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M7 9h10" stroke="#fff" stroke-width="2"/></svg>`],
 brain:["#8E8E93",`<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`],
 unit:["#FF6B35",`<svg viewBox="0 0 24 24"><path d="M7 3h10l-1 18H8z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M7.5 9h4M7.8 13h3M8.1 17h4" stroke="#fff" stroke-width="1.8"/></svg>`],
 money:["#FFCC00",IC.coin],
 basics:["#34C759",`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="#fff"/><circle cx="12" cy="12" r="4.8" fill="none" stroke="#34C759" stroke-width="1.2"/><path d="M12 7.2v9.6M7.2 12h9.6M8.6 8.6l6.8 6.8M15.4 8.6l-6.8 6.8" stroke="#34C759" stroke-width="1"/></svg>`],
 up:["#007AFF",`<svg viewBox="0 0 24 24"><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`],
 down:["#007AFF",`<svg viewBox="0 0 24 24"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`],
 trash:["#FF3B30",`<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`],
 star:["#FFCC00",IC.star],
 info:["#8E8E93",`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 11v6" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="7.8" r="1.3" fill="#fff"/></svg>`]
};
const sic=k=>`<span class="set-ic" style="background:${ICS[k][0]}">${ICS[k][1]}</span>`;
const srow=(k,label,right,act,extra="")=>`<${act?`button class="row tap" data-a="${act}" ${extra}`:`div class="row" ${extra}`} style="--inset:58px">${sic(k)}<div class="grow">${label}</div>${right||""}${act?IC.chev:""}</${act?"button":"div"}>`;
const sw=(on,act,label,extra="")=>`<button class="switch ${on?"on":""}" data-a="${act}" ${extra} role="switch" aria-checked="${on}" aria-label="${esc(label)}"></button>`;
const sseg=(key,cur,opts,act)=>`<div class="seg set-seg" data-k="${key}">${opts.map(([v,n])=>`<button class="${cur===v?"on":""}" data-a="${act}" data-v="${v}">${n}</button>`).join("")}</div>`;
function settingsSheet(){
  openSheet(()=>{ const s=S.settings, MN={auto:"Automatique",matin:"Matin",aprem:"Après-midi",apero:"Apéro",soir:"Soir",nuit:"Nuit"}, PN={complet:"Complet",standard:"Standard",reduit:"Réduit",perso:"Personnalisé"};
    let b=`<div class="set-hero"><div class="set-logo">${glassSVG(RMAP.negroni)}</div><div><b>Zeste</b><span>${RECS.filter(r=>!r.mine).length} recettes, ton bar, tes goûts</span></div></div>`;
    b+=`<div class="gh">Toi</div><div class="group">${srow("user","Prénom",`<input id="uname" class="set-in" value="${esc(s.name||"")}" placeholder="Facultatif" maxlength="20" autocomplete="given-name">`)}${srow("quiz",S.quiz?"Refaire le quiz de goût":"Faire le quiz de goût",`<span class="val">${S.quiz?"Fait":""}</span>`,"quiz")}</div>`;
    b+=`<div class="gh">Apparence</div><div class="group">${srow("theme","Thème","")}<div class="row set-sub">${sseg("theme",s.theme||"auto",[["auto","Système"],["light","Clair"],["dark","Sombre"]],"settheme")}</div>${srow("txt","Taille du texte","")}<div class="row set-sub">${sseg("txt",String(s.txt||"auto"),[["auto","Système"],["1","Standard"],["1.15","Grand"],["1.3","Très grand"]],"settxt")}</div>${srow("sky","Ambiance selon l’heure",sw(s.ambiance!==false,"setamb","Ambiance selon l’heure"))}${s.ambiance!==false?srow("clock","Aperçu d’un moment",`<span class="val">${(s.moment||"auto")==="auto"?"Heure du téléphone":MN[s.moment]}</span>`,"momentsheet"):""}</div><div class="gf">Le ciel de l’accueil suit l’heure de ton téléphone : matin, après-midi, heure de l’apéro, soirée et nuit. Un aperçu choisi ici ne dure que jusqu’à la prochaine ouverture de l’app.</div>`;
    b+=`<div class="gh">Sons</div><div class="group">${srow("snd","Sons",sw(s.sound!==false,"setsound","Sons"))}${s.sound!==false?`${srow("snd","Volume","")}<div class="row set-sub">${sseg("vol",String(s.vol??0.7),[["0.35","Doux"],["0.7","Normal"],["1","Fort"]],"sndvol")}</div><button class="row tap" data-a="soundtest" style="--inset:58px">${sic("snd")}<div class="grow">Écouter un exemple</div></button>`:""}</div><div class="gf">Glaçons, shaker, versement, trophées… Si ton iPhone est en mode silencieux, les sons restent coupés.</div>`;
    b+=`<div class="gh">Animations</div><div class="group">${srow("anim","Niveau","")}<div class="row set-sub">${sseg("fxp",fxPreset(),[["complet","Complet"],["standard","Standard"],["reduit","Réduit"]],"setfxp")}</div>${srow("anim","Réglages détaillés",`<span class="val">${PN[fxPreset()]}</span>`,"fxsheet")}</div>${REDUCED.matches?`<div class="gf">Ton iPhone demande de réduire les animations : Zeste s’y conforme.</div>`:""}`;
    b+=`<div class="gh">Accueil</div><div class="group">${srow("home","Sections et ordre",`<span class="val">${s.home.filter(x=>x[1]).length} actives</span>`,"homeedit")}</div>`;
    b+=`<div class="gh">Suggestions</div><div class="group">${srow("reco","Style","")}<div class="row set-sub">${sseg("explore",String(s.explore),[["0","Valeurs sûres"],["1","Équilibré"],["2","Aventurier"]],"setexplore")}</div>${srow("ctx","Selon le moment",sw(s.ctx!==false,"setctx","Suggestions selon le moment"))}${srow("na","Inclure le sans alcool",sw(!!s.na,"setna","Inclure le sans alcool"))}${srow("star","Rappels « Alors, ce … ? »",sw(s.remind!==false,"setremind","Rappels de note"))}${srow("quiz","Inclure les créations à tester",sw(s.untested!==false,"setuntested","Inclure les créations à tester"))}${srow("brain","Réinitialiser l’apprentissage","","resetlearn")}</div><div class="gf">${["Valeurs sûres : surtout des cocktails proches de ce que tu aimes déjà.","Équilibré : tes favoris, avec une découverte de temps en temps.","Aventurier : davantage de découvertes hors de tes habitudes."][s.explore]} « Selon le moment » favorise l’apéro, les cocktails chauds en hiver ou les recettes rapides en semaine.</div>`;
    b+=`<div class="gh">Bar et recettes</div><div class="group">${srow("unit","Unités","")}<div class="row set-sub">${sseg("unit",s.unit,[["cl","Centilitres"],["ml","Millilitres"]],"unit2")}</div>${srow("money","Devise","")}<div class="row set-sub">${sseg("cur",s.cur||"CHF",[["CHF","Franc suisse"],["EUR","Euro"]],"setcur")}</div>${srow("unit","Verres par défaut","")}<div class="row set-sub">${sseg("glasses",String(s.glasses||1),[["1","1 verre"],["2","2 verres"],["4","4 verres"]],"setglasses")}</div>${srow("clock","Écran allumé en préparation",sw(s.wake!==false,"setwake","Écran allumé en préparation"))}${srow("basics","Contenu additionnel",`<span class="val">${BASICS.filter(has).length} basiques</span>`,"basics")}</div>`;
    b+=`<div class="gh">Données</div><div class="group">${srow("up","Exporter une sauvegarde","","export")}${srow("down","Importer une sauvegarde","","import")}${srow("trash",`<span style="color:var(--red)">Tout réinitialiser</span>`,"","reset")}</div><div class="gf">Ton bar, tes notes et ton historique se synchronisent avec ton compte quand c’est possible, et restent aussi sur cet appareil.</div>`;
    b+=`<div class="gh">À propos</div><div class="group">${srow("info","Version",`<span class="val">${APP_VERSION}</span>`)}${srow("info","Recettes",`<span class="val">${RECS.filter(r=>!r.mine).length}, dont ${RECS.filter(r=>r.na).length} sans alcool</span>`)}</div><div class="about-foot"><div class="af-logo">${glassSVG(RMAP.negroni)}</div><b>Zeste ${APP_VERSION}</b><span>${esc(COPYRIGHT)}</span><span>À consommer avec modération. Santé !</span></div>`;
    return {title:"Paramètres",right:`<button class="link" data-a="closesheet" style="font-weight:600">OK</button>`,body:b};
  });
}
function fxSheet(){
  openSheet(()=>({title:"Animations",body:`<p class="body" style="margin-bottom:12px">Active ou coupe chaque animation. Les petites animations essentielles restent toujours là.</p><div class="group">${FX_LIST.map(([k,n,d])=>`<div class="row fx-row"><div class="grow"><div class="t">${esc(n)}</div><div class="s" style="white-space:normal">${esc(d)}</div></div>${sw(FX(k),"setfx",n,`data-k="${k}"`)}</div>`).join("")}</div><div class="sp16"></div><div class="btn-row"><button class="btn gray" data-a="fxpreview">${IC.play}Voir un aperçu</button></div>`}));
}
function momentSheet(){
  const L=[["auto","Automatique","Suit l’heure réelle"],["matin","Matin","Aube pêche et soleil levant"],["aprem","Après-midi","Ciel bleu et plein soleil"],["apero","Apéro","L’heure dorée"],["soir","Soir","Mauve et premières étoiles"],["nuit","Nuit","Ciel étoilé et étoiles filantes"]];
  openSheet(()=>({title:"Moment affiché",body:`<div class="group">${L.map(([k,n,d])=>`<button class="row tap" data-a="setmoment" data-v="${k}"><span class="mo-ic mo-${k==="auto"?ctxInfo().moment:k}" style="width:24px;height:24px">${MO_IC[k==="auto"?(()=>{ const h=new Date().getHours(); return momentForHour(h); })():k]}</span><div class="grow"><div class="t">${n}</div><div class="s">${d}</div></div>${(S.settings.moment||"auto")===k?`<span style="color:var(--tint);width:22px;height:22px;display:grid">${IC.check}</span>`:""}</button>`).join("")}</div>`}),{short:true});
}

// ---------- Tirer pour une surprise ----------
let PULL=null;
(function(){ const pull=document.createElement("div"); pull.id="pull"; pull.innerHTML=`<span>${IC.dice}</span>`; document.body.appendChild(pull); })();
document.addEventListener("touchstart",e=>{ if(!FX("pull")||TAB!=="today"||SHEETS.length) return; const v=e.target.closest("#v-today"); if(!v||v.scrollTop>0) return; PULL={y:e.touches[0].clientY,d:0}; },{passive:true});
document.addEventListener("touchmove",e=>{ if(!PULL) return; const d=e.touches[0].clientY-PULL.y; PULL.d=d; const p=$("#pull"); if(d<=4){ p.style.opacity=0; return; }
  const k=Math.min(1,d/110); p.style.opacity=Math.min(1,d/40); p.style.transform=`translate(-50%,${Math.min(d*0.55,72)}px) rotate(${d*2.4}deg) scale(${0.6+0.4*k})`; p.classList.toggle("armed",d>110); },{passive:true});
document.addEventListener("touchend",()=>{ if(!PULL) return; const armed=PULL.d>110; PULL=null; const p=$("#pull"); p.classList.remove("armed"); p.style.opacity=0; p.style.transform=""; if(armed) setTimeout(roulette,120); },{passive:true});

// ---------- Apparition au défilement ----------
let RIO=null;
function revealIn(v){
  if(!FX("reveal")||!("IntersectionObserver" in window)) return;
  if(!RIO) RIO=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); RIO.unobserve(e.target); } }),{threshold:0.08});
  // #cx-res (résultats de la recherche cocktails) est un niveau plus profond que .content : mêmes classes, ciblées aussi à cet endroit.
  v.querySelectorAll(".content > h2.sh, .content > .sh-sub, .content > .scroller, .content > .card, .content > .group, .content > .duo, .content > .dishes, .content > .rw-card, .content > .disc, .content > .stat-grid, .content > .trophies, .content > .remind, #cx-res > h2.sh, #cx-res > .sh-sub, #cx-res > .group").forEach((el,i)=>{ el.classList.remove("in"); el.classList.add("rv"); el.style.setProperty("--rd",Math.min(i,6)*40+"ms"); RIO.observe(el); });
}

// ---------- Verre du labo ----------
function mixGlass(A){
  const items=A.items; let V=0,rr=0,gg=0,bb=0; items.forEach(i=>{ const ml=Math.max(mlOf(i),1), c=colOf(i.id); V+=ml; rr+=parseInt(c.slice(1,3),16)*ml; gg+=parseInt(c.slice(3,5),16)*ml; bb+=parseInt(c.slice(5,7),16)*ml; });
  const col="#"+[rr,gg,bb].map(x=>Math.round(x/(V||1)).toString(16).padStart(2,"0")).join("");
  const st=A.st, m=S.mix.m, g= st==="stirred"?"rocks": st==="long"?"highball": st==="spritz"?"vin": m==="build"?"rocks":"coupe";
  const ice= st==="stirred"?"big": (st==="long"||st==="spritz"||m==="build")?"cubes":"none";
  return glassSVG({id:"mix"+items.length,g,col,ice,ing:items,gar:""},{live:1});
}

// ---------- Cœurs ----------
function hearts(x,y){ if(!FX("confetti")) return; const box=document.createElement("div"); box.className="hearts"; document.body.appendChild(box);
  for(let k=0;k<9;k++){ const s=document.createElement("i"); s.innerHTML=IC.heartf; s.style.cssText=`left:${x}px;top:${y}px;--dx:${(Math.random()-.5)*90}px;--r:${(Math.random()-.5)*50}deg;--s:${0.6+Math.random()*0.7};animation-delay:${k*40}ms`; box.appendChild(s); }
  setTimeout(()=>box.remove(),1500); }

// ---------- Actions ----------
Object.assign(ACT,{
  setglasses:(d)=>{ S.settings.glasses=+d.v; changed(); },
  setwake:()=>{ S.settings.wake=S.settings.wake===false; changed(); },
  setremind:()=>{ S.settings.remind=S.settings.remind===false; changed(); },
  setuntested:()=>{ S.settings.untested=S.settings.untested===false; MEMO={}; changed(); },
  settings:()=>settingsSheet(), fxsheet:()=>fxSheet(), momentsheet:()=>momentSheet(),
  settheme:(d)=>{ S.settings.theme=d.v; applyTheme(); changed(); },
  setfxp:(d)=>{ S.settings.fx=Object.assign({},FX_PRESETS[d.v]); applyFx(); changed(); toast("Animations : "+{complet:"complètes",standard:"standard",reduit:"réduites"}[d.v]); },
  setfx:(d)=>{ S.settings.fx=S.settings.fx||{}; S.settings.fx[d.k]=!FX(d.k); if(S.settings.fx[d.k]) delete S.settings.fx[d.k]; applyFx(); changed(); },
  fxpreview:()=>{ closeAll(); setTimeout(()=>{ switchTab("today"); HERO_LAST=null; renderView("today"); if(FX("clink")) setTimeout(()=>clink(tonight()[0]||RMAP.negroni),1500); },450); },
  setexplore:(d)=>{ S.settings.explore=+d.v; changed(); },
  setctx:()=>{ S.settings.ctx=S.settings.ctx===false; changed(); },
  setcur:(d)=>{ S.settings.cur=d.v; changed(); },
  unit2:(d)=>{ S.settings.unit=d.v; changed(); },
  resetlearn:()=>{ const bak={mw:S.mw,mwN:S.mwN,skips:S.skips,opens:S.opens,heroLog:S.heroLog}; delete S.mw; delete S.mwN; delete S.skips; delete S.opens; delete S.heroLog; MODEL=null; changed(); toast("Apprentissage réinitialisé, tes notes sont conservées",{action:{label:"Annuler",fn:()=>{ Object.assign(S,bak); MODEL=null; changed(); }}}); },
  setmoment:(d)=>{ S.settings.moment=d.v; save(); applyAmbient(); HERO_LAST=null; changed(); if(SHEETS.length&&SHEETS[SHEETS.length-1].el.querySelector('[data-a="setmoment"][data-v]')&&SHEETS.length>1) closeSheet(); }
});
const _setamb=ACT.setamb; ACT.setamb=(d,t)=>{ _setamb(d,t); applyFx(); };
const _fav=ACT.fav; ACT.fav=(d,t)=>{ const adding=!S.fav.includes(d.id); _fav(d,t); if(adding&&t){ const b=t.getBoundingClientRect(); hearts(b.left+b.width/2,b.top); } };
const _rlagain=ACT.rlagain; ACT.rlagain=(d,t)=>{ if(RL&&RL.pick){ S.skips=S.skips||{}; const x=S.skips[RL.pick.id]||{n:0}; S.skips[RL.pick.id]={n:x.n+1,t:Date.now()}; save(); } _rlagain(d,t); };
const _switchTab=switchTab;
switchTab=function(t){ const prev=TAB; _switchTab(t); if(prev!==t) revealIn($("#v-"+t)); };
ACT.tab=(d)=>{ if(d.f){ CF.main=d.f; } dirty.cocktails=1; switchTab(d.t); };
REDUCED.addEventListener&&REDUCED.addEventListener("change",()=>{ applyFx(); renderAll(); });

fixState(); applyTheme();
init();
applyFx(); window.__ZT=performance.now();
