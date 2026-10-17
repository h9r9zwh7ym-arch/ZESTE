// ================= ZESTE 1.60 (B) : intelligence — duels de goût, signaux implicites, recherche en langage courant, précision mesurée =================
// Réglé sur la graine 1 (tests/m7.js, tests/m8.js), validé sur la graine 2 ; tout reste local.
const RECO2={duelV:0.8, duelW:0.5, duelOn:1, prepV:0.6, prepW:0.35, rejV:0.4, rejW:0.15, sel:{by:"mix",ku:0.5,kc:1,ks:3,kd:1,kg:0.5}};   // sélection : m8 graine 2 (150 utilisateurs), NDCG +0,019 en moyenne contre des paires au hasard
if(typeof process!=="undefined"&&process.env&&process.env.RECO2) Object.assign(RECO2,JSON.parse(process.env.RECO2));   // banc de réglage uniquement
// --- duels : préférence par paires (le gagnant +v, le perdant −v, poids plus faible qu'une note) ---
{ const _ts=trainSet; trainSet=function(){ const T=_ts(); if(!RECO2.duelOn) return T; const acc={};
    (S.duels||[]).forEach(d=>{ [[d.w,1],[d.w===d.a?d.b:d.a,-1]].forEach(([id,s])=>{ if(!RMAP[id]||S.ratings[id]) return; const a=acc[id]=acc[id]||{v:0,n:0}; a.v+=s; a.n++; }); });
    for(const id in acc){ const a=acc[id], v=RECO2.duelV*a.v/a.n, w=Math.min(0.9,RECO2.duelW*Math.sqrt(a.n));
      if(T[id]) { const t=T[id], W=t.w+w; T[id]={v:(t.v*t.w+v*w)/W,w:W,duel:1}; } else T[id]={v,w,duel:1}; }
    return T; }; }
// paire la plus informative : critère réglé dans tests/m8.js (incertitude, prédiction, différence entre les deux, couverture des zones déjà vues)
function duelPair(){ const seen=new Set((S.duels||[]).flatMap(d=>[d.a,d.b])), past=[...seen].map(id=>RMAP[id]).filter(Boolean).concat(rated().map(([id])=>RMAP[id]));
  const Q=Object.assign({ku:1,kp:0,kd:0,kc:0,ks:0,n:40,by:"unc"},RECO2.sel||{});
  const dens=r=>{ if(r._dn==null){ const P=RECS.filter((x,i)=>i%3===0); r._dn=P.reduce((a,x)=>a+recSim(r,x),0)/P.length; } return r._dn; };
  let C=RECS.filter(r=>!r.na&&!r.mine&&!S.ratings[r.id]&&!seen.has(r.id)).map(r=>{ const p=likeProb(r), cov=past.length?1-Math.max(...past.map(x=>recSim(r,x))):1; return {r,u:1-Math.abs(2*p-1),p:predict(r),cov,dn:dens(r)}; });
  C=C.sort((a,b)=>Q.by==="pred"?b.p-a.p:Q.by==="cov"?b.cov-a.cov:Q.by==="mix"?(Q.kc*b.cov+Q.ks*b.dn+Q.ku*b.u)-(Q.kc*a.cov+Q.ks*a.dn+Q.ku*a.u):b.u-a.u).slice(0,Q.n);
  let best=null, bv=-1e9; for(let i=0;i<C.length;i++) for(let j=i+1;j<C.length;j++){ const A=C[i],B=C[j], sim=recSim(A.r,B.r); if(sim>=0.4) continue;
    const v=Q.ku*(A.u+B.u)+Q.kp*(A.p+B.p-6)+Q.kd*(1-sim)+Q.kc*(A.cov+B.cov)+Q.ks*(A.dn+B.dn)-Math.abs(A.p-B.p)*(Q.kg||1); if(v>bv){ bv=v; best=[A.r,B.r]; } }
  return best; }
function duelPairRandom(rnd){ const seen=new Set((S.duels||[]).flatMap(d=>[d.a,d.b])); const C=RECS.filter(r=>!r.na&&!r.mine&&!S.ratings[r.id]&&!seen.has(r.id)); const a=C[Math.floor(rnd()*C.length)]; let b=C[Math.floor(rnd()*C.length)]; while(b===a) b=C[Math.floor(rnd()*C.length)]; return [a,b]; }
// --- feuille « Affiner mon goût » : deux cocktails côte à côte, un toucher choisit (haptique comme une note), fin après 10 duels ou « Terminer » ---
if(typeof HAPTIC!=="undefined") HAPTIC.add("duel");
let DUEL_N=0, DUEL_P=null;
function duelCard(r){ return `<button class="duel-c" data-a="duel" data-w="${r.id}" aria-label="${esc(r.n)}"><span class="duel-g">${glassSVG(r)}</span><b>${esc(r.n)}</b><span class="duel-s">${esc(r.base?shortN(r.base):(FAMILIES[r.fam]||{}).n||"")}</span></button>`; }
function duelSheet(){ DUEL_N=0; DUEL_P=duelPair(); if(!DUEL_P) return;
  openSheet(()=>{ const P=DUEL_P; if(!P) return {title:"Affiner mon goût",body:""};
    return {title:"Affiner mon goût", right:`<button class="link" data-a="closesheet">Terminer</button>`, body:`<div class="duel">${duelCard(P[0])}${duelCard(P[1])}</div><div class="duel-dots" aria-hidden="true">${[...Array(10)].map((_,i)=>`<i class="${i<DUEL_N?"on":""}"></i>`).join("")}</div>`}; },{short:true}); }
Object.assign(ACT,{
  duels:()=>duelSheet(),
  duel:(d)=>{ const P=DUEL_P; if(!P) return; const w=d.w; if(w!==P[0].id&&w!==P[1].id) return;
    S.duels=(S.duels||[]).concat([{a:P[0].id,b:P[1].id,w,t:Date.now()}]).slice(-300); DUEL_N++; MODEL=null;
    if(DUEL_N>=10){ DUEL_P=null; changed(); closeSheet(); return; }
    DUEL_P=duelPair(); if(!DUEL_P){ changed(); closeSheet(); return; } changed(); }
});
// ligne dans Profil > Ton carnet
{ const _vp=vProfil; vProfil=function(){ return _vp().replace('<h2 class="sh">Ton carnet</h2><div class="group">',m=>m+prow("wand-sparkles","Affiner mon goût","",(S.duels||[]).length?(S.duels||[]).length:"","duels")); }; }
// état : duels valides seulement
function cleanDuels(x){ return Array.isArray(x)? x.filter(d=>d&&typeof d==="object"&&RMAP[d.a]&&RMAP[d.b]&&(d.w===d.a||d.w===d.b)&&d.a!==d.b).slice(-300).map(d=>({a:d.a,b:d.b,w:d.w,t:typeof d.t==="number"&&isFinite(d.t)?d.t:0})) : []; }
{ const _hs=healState; healState=function(){ const r=_hs.apply(this,arguments); if(S){ S.duels=cleanDuels(S.duels); } return r; };
  const _sb=sanitizeBackup; sanitizeBackup=function(d){ const out=_sb(d); if(out){ const c=cleanDuels(d&&d.duels); if(c.length) out.duels=c; else delete out.duels; } return out; }; }
// --- signaux implicites (S.sig) : fiche ouverte puis « Préparer » (+), « Surprends-moi » écarté tout de suite (− faible) ; jamais plus fort qu'une note ---
{ const _ts=trainSet; trainSet=function(){ const T=_ts(), G=S.sig||{};
    Object.entries(G.p||{}).forEach(([id,n])=>{ if(RMAP[id]&&!T[id]) T[id]={v:Math.min(1,RECO2.prepV*(1+0.25*Math.min(n-1,2))),w:Math.min(0.5,RECO2.prepW),sig:"p"}; });
    Object.entries(G.r||{}).forEach(([id,n])=>{ if(RMAP[id]&&!T[id]) T[id]={v:-Math.min(1,RECO2.rejV*Math.min(n,2)),w:Math.min(0.4,RECO2.rejW*Math.min(n,2)),sig:"r"}; });
    return T; }; }
function sigAdd(k,id){ S.sig=S.sig||{}; const m=S.sig[k]=S.sig[k]||{}; m[id]=Math.min(9,(m[id]||0)+1); MODEL=null; save(); }
{ const _bm=ACT.barmode; ACT.barmode=function(d,t){ if(t&&t.closest&&t.closest(".sheet")&&d&&d.id&&RMAP[d.id]) sigAdd("p",d.id); return _bm.apply(this,arguments); };
  let RL_T=0; const _sp=spin; spin=function(){ RL_T=Date.now(); return _sp.apply(this,arguments); };
  const _bc=ACT.bmclose; ACT.bmclose=function(){ if(typeof RL!=="undefined"&&RL&&RL.pick&&Date.now()-RL_T<10000) sigAdd("r",RL.pick.id); return _bc.apply(this,arguments); }; }
function cleanSig(x){ const out={}; if(x&&typeof x==="object") for(const k of ["p","r"]){ const m=x[k]; if(m&&typeof m==="object"){ const o={}; for(const id in m) if(RMAP[id]&&typeof m[id]==="number"&&m[id]>0) o[id]=Math.min(9,Math.round(m[id])); if(Object.keys(o).length) out[k]=o; } } return out; }
{ const _hs=healState; healState=function(){ const r=_hs.apply(this,arguments); if(S){ const c=cleanSig(S.sig); if(Object.keys(c).length) S.sig=c; else delete S.sig; } return r; };
  const _sb=sanitizeBackup; sanitizeBackup=function(d){ const out=_sb(d); if(out){ const c=cleanSig(d&&d.sig); if(Object.keys(c).length) out.sig=c; else delete out.sig; } return out; }; }
// --- recherche en langage courant (Cocktails) : « frais et pas trop fort avec du gin », « amer sans alcool », « léger apéro faisable » ---
// Analyse locale et déterministe : mots de goût → axes, contraintes (sans alcool, faisable, avec / sans X), moments, fautes de frappe (Levenshtein).
const NL_AX={doux:[[0,1]],sucre:[[0,1]],gourmand:[[0,1]],sec:[[0,-1]],acide:[[1,1]],acidule:[[1,1]],citronne:[[1,1]],vif:[[1,1]],amer:[[2,1]],amertume:[[2,1]],
  fort:[[3,1]],puissant:[[3,1]],costaud:[[3,1]],corse:[[3,1]],leger:[[3,-1]],light:[[3,-1]],fruite:[[4,1]],fruit:[[4,1]],fruits:[[4,1]],herbace:[[5,1]],herbes:[[5,1]],vegetal:[[5,1]],
  epice:[[6,1]],epices:[[6,1]],boise:[[7,1]],fume:[[7,1]],tourbe:[[7,1]],frais:[[1,1],[5,0.6],[3,-0.6]],fraiche:[[1,1],[5,0.6],[3,-0.6]],fraiches:[[1,1],[5,0.6],[3,-0.6]],fraicheur:[[1,1],[5,0.6],[3,-0.6]],rafraichissant:[[1,1],[5,0.6],[3,-0.6]]};
const NL_AXN={frais:"Frais",fraiche:"Frais",fraiches:"Frais",fraicheur:"Frais",rafraichissant:"Frais",leger:"Léger",light:"Léger",fort:"Fort",puissant:"Fort",costaud:"Fort",corse:"Fort"};
const NL_MOM={apero:"apero",aperitif:"apero",digestif:"digestif",digeo:"digestif",brunch:"brunch",matin:"brunch"}, NL_MOMN={apero:"Apéro",digestif:"Digestif",brunch:"Brunch"};
const NL_OK=new Set(["faisable","faisables","dispo","disponible","disponibles"]), NL_NA=new Set(["mocktail","mocktails","virgin","zero"]);
const NL_STOP=new Set(["de","du","des","d","le","la","les","l","un","une","et","ou","a","au","aux","pour","qui","est","bien","tres","plutot","un","quelque","chose","cocktail","cocktails","boisson","envie","je","veux","j","me","mon","ma","mes","un","truc","en","avec","ce","soir","peu"]);
const NL_BASE={gin:"gin",rhum:"rhum",rum:"rhum",vodka:"vodka",tequila:"agave",mezcal:"agave",whisky:"whisky",whiskey:"whisky",cognac:"brandy",brandy:"brandy",armagnac:"brandy"};
function lev(a,b){ if(Math.abs(a.length-b.length)>2) return 9; const d=[...Array(b.length+1).keys()]; for(let i=1;i<=a.length;i++){ let p=d[0]; d[0]=i; for(let j=1;j<=b.length;j++){ const t=d[j]; d[j]=Math.min(d[j]+1,d[j-1]+1,p+(a[i-1]===b[j-1]?0:1)); p=t; } } return d[b.length]; }
function nlFuzzy(w,keys){ if(keys.includes(w)) return w; if(w.length<4) return null; const lim=w.length>=7?2:1; let best=null,bd=9; for(const k of keys){ if(k.length<4) continue; const d=lev(w,k); if(d<bd){ bd=d; best=k; } } return bd<=lim?best:null; }
function nlIng(w){ const b=nlFuzzy(w,Object.keys(NL_BASE)); if(b) return {g:NL_BASE[b],n:BASE_LABEL[NL_BASE[b]].split(" &")[0]};
  if(w.length<3) return null; let best=null,bn=-1; for(const id in ING){ const ws=norm(ING[id].n).split(/[^a-z0-9]+/); if(ws.includes(w)||ws.some(x=>x.length>=5&&lev(x,w)<=1)){ const n=RECS.filter(r=>r.ing.some(i=>i.id===id)).length; if(n>bn){ bn=n; best=id; } } }
  return best? {id:best,n:shortN(best)} : null; }
let NLQ=null, NLP=null;
function nlParse(q){ if(q===NLQ) return NLP; NLQ=q; const raw=String(q||"").trim().split(/\s+/).filter(Boolean), W=raw.map(x=>norm(x).replace(/[^a-z0-9%]/g,"")); const T=[], left=[]; let neg=false, negSrc=[];
  const skip=i=>{ while(i<W.length&&(NL_STOP.has(W[i])||!W[i])) i++; return i; };
  for(let i=0;i<W.length;i++){ const w=W[i]; if(!w) continue;
    if(w==="pas"||w==="moins"||(w==="peu"&&!neg)){ neg=true; negSrc.push(raw[i]); if(W[i+1]==="trop"){ negSrc.push(raw[i+1]); i++; } continue; }
    if(w==="sans"){ const j=skip(i+1); if(j<W.length){ const src=raw.slice(i,j+1).join(" "); if(nlFuzzy(W[j],["alcool","alcools"])){ T.push({k:"na",n:"Sans alcool",src}); i=j; continue; } const g=nlIng(W[j]); if(g){ T.push({k:"without",g,n:"Sans "+lc(g.n),src}); i=j; continue; } } }
    if(w==="0%"||w==="0"||NL_NA.has(w)){ T.push({k:"na",n:"Sans alcool",src:raw[i]}); continue; }
    if(NL_OK.has(w)||nlFuzzy(w,["faisable"])){ T.push({k:"ok",n:"Faisable",src:raw[i]}); continue; }
    if(w==="avec"){ const j=skip(i+1); if(W[j]==="bar"||(W[j-1]==="mon"&&W[j]==="bar")){ T.push({k:"ok",n:"Faisable",src:raw.slice(i,j+1).join(" ")}); i=j; continue; } if(j<W.length){ const g=nlIng(W[j]); if(g){ T.push({k:"with",g,n:"Avec "+lc(g.n),src:raw.slice(i,j+1).join(" ")}); i=j; continue; } } }
    const ax=nlFuzzy(w,Object.keys(NL_AX)); if(ax&&!(w==="sec"&&neg)){ const s=neg?-1:1, src=negSrc.concat([raw[i]]).join(" "); let n=NL_AXN[ax]||DIMS[NL_AX[ax][0][0]]; if(neg) n=ax==="fort"||ax==="puissant"?"Léger":ax==="leger"?"Fort":"Peu "+lc(n); T.push({k:"ax",ax:NL_AX[ax].map(([a,v])=>[a,v*s]),n,src}); neg=false; negSrc=[]; continue; }
    const mo=nlFuzzy(w,Object.keys(NL_MOM)); if(mo){ T.push({k:"mo",m:NL_MOM[mo],n:NL_MOMN[NL_MOM[mo]],src:raw[i]}); continue; }
    if(!NL_STOP.has(w)){ const g=nlFuzzy(w,Object.keys(NL_BASE))? nlIng(w) : null; if(g){ T.push({k:"with",g,n:"Avec "+lc(g.n),src:raw[i]}); continue; } left.push(raw[i]); }
    neg=false; negSrc=[]; }
  const strong=T.some(t=>t.k!=="with")||T.length>=2;   // un nom ou un spiritueux seul : recherche classique
  return NLP= strong&&T.length? {T,left} : null; }
function nlHas(r,g){ return g.g? baseGroup(r)===g.g||r.ing.some(i=>{ const I=ING[i.id]; return I&&norm(I.n).split(" ")[0]===g.g; }) : r.ing.some(i=>i.id===g.id||ING[i.id].al===g.id); }
function nlScore(r,P){ const p=profileR(r), av=avgProfile(), abv=metricsR(r).abv; let m=0;
  P.T.forEach(t=>{ if(t.k==="ax") t.ax.forEach(([a,v])=>{ m+=v*((p[a]||0)-av[a])*4; if(a===3) m+=v*(abv-15)/25; });
    if(t.k==="mo"){ if(t.m==="apero") m+=((r.fam==="bulles"||r.fam==="highball")?0.4:0)+(abv<14?0.3:-0.2)+((p[2]||0)-av[2]); if(t.m==="digestif") m+=((r.fam==="stirred"||r.fam==="dessert")?0.4:0)+(abv>20?0.3:-0.2); if(t.m==="brunch") m+=abv<12?0.5:-0.4; } });
  return m; }
{ const _f=filtered; filtered=function(ig){ const P=nlParse(CF.q); if(!P) return _f(ig); const q=CF.q; let L; CF.q=""; try{ L=_f(ig); } finally{ CF.q=q; }
    P.T.forEach(t=>{ if(t.k==="na") L=L.filter(r=>r.na||metricsR(r).abv<0.5); if(t.k==="ok") L=L.filter(r=>status(r).ok); if(t.k==="with") L=L.filter(r=>nlHas(r,t.g)); if(t.k==="without") L=L.filter(r=>!nlHas(r,t.g)); });
    const soft=P.T.some(t=>t.k==="ax"||t.k==="mo"), sc={}; L.forEach(r=>sc[r.id]=nlScore(r,P)+0.6*likeProb(r));
    if(soft){ const keep=L.filter(r=>nlScore(r,P)>0); if(keep.length>=10) L=keep; }
    L.sort((a,b)=>sc[b.id]-sc[a.id]);
    // le nom exact reste prioritaire
    const qq=norm(q); const exact=RECS.filter(r=>qq.includes(norm(r.n))&&norm(r.n).length>=4); if(exact.length) L=exact.concat(L.filter(r=>!exact.includes(r)));
    return L; };
  const _cr=cocktailsResults; cocktailsResults=function(){ let h=_cr(); const P=nlParse(CF.q); if(!P) return h;
    const chips=`<div class="active-f nl-f">${P.T.map((t,i)=>`<button data-a="nlrm" data-i="${i}" aria-label="Retirer ${esc(t.n)}">${esc(t.n)}${IC.x}</button>`).join("")}</div>`;
    const k=h.indexOf('</button></div>',h.indexOf('class="fbtn"')); return k>=0? h.slice(0,k+15)+chips+h.slice(k+15) : chips+h; };
  ACT.nlrm=d=>{ const P=nlParse(CF.q); if(!P) return; const t=P.T[+d.i]; if(!t) return; CF.q=P.T.filter(x=>x!==t).map(x=>x.src).concat(P.left).join(" ");
    const el=document.getElementById("cq"); if(el) el.value=CF.q; const res=document.getElementById("cx-res"); if(res&&TAB==="cocktails"){ res.innerHTML=cocktailsResults(); if(typeof animateSegs==="function") animateSegs(res); } else renderView("cocktails"); }; }
// --- précision mesurée sur ses vraies notes (À propos, dès 10 notes) : validation croisée en laissant chaque note de côté,
// calculée en différé une fois par état (SREV), jamais pendant l'affichage ---
let ACC=null, ACC_REV=-1, ACC_T=0;
function looAccuracy(){ const R=rated().slice(-80); if(R.length<10) return null; const keep=S.ratings, mw=S.mw; let ok=0;
  try{ for(const [id,rt] of R){ const o=Object.assign({},keep); delete o[id]; S.ratings=o; MODEL=null; MKEY=""; const p=predict(RMAP[id]); if(Math.abs(Math.round(p)-rt)<=1) ok++; } }
  finally{ S.ratings=keep; S.mw=mw; MODEL=null; MKEY=""; }
  return Math.round(100*ok/R.length); }
{ const _ab=aboutBody; aboutBody=function(){ let h=_ab(); if(rated().length<10) return h;
    if(ACC_REV===SREV&&ACC!=null) return h.replace(/(<div class="about-hero">[\s\S]*?<\/span>)/,`$1<span class="about-acc">Zeste a deviné ${ACC} % de tes notes à une étoile près</span>`);
    if(ACC_REV!==SREV){ const rev=SREV; clearTimeout(ACC_T); ACC_T=setTimeout(()=>{ if(SREV!==rev) return; ACC=looAccuracy(); ACC_REV=rev; if(typeof refreshSheets==="function") refreshSheets(); },120); }
    return h; }; }
// --- explications : même principe (contribution réelle la plus forte) ; on dit d'où vient le voisin dominant s'il n'est pas noté ---
{ const _rs=reasons; reasons=function(r){ const t=_rs(r); const m=/^Parce que tu as aimé (.+)$/.exec(t); if(!m) return t;
    const W=getModel().W[r.id], id=W&&W.best, T=id&&getModel().T[id]; if(!T||S.ratings[id]) return t; const n=RMAP[id].n;
    if(T.duel) return "Proche de "+n+", choisi dans tes duels";
    if(T.sig==="p") return "Proche de "+n+", que tu voulais préparer";
    if(madeCount(id)>=2) return "Proche de "+n+", que tu refais souvent";
    if(S.fav.includes(id)) return "Proche de "+n+", un de tes favoris";
    return t; }; }
