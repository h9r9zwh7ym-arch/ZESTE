// ================= MOTEUR =================
const ING = {};
ING_RAW.forEach(([id,n,cat,abv,sug,ac,fl,x])=>{
  const f={}; (fl.match(/[a-z]\d/g)||[]).forEach(p=>f[p[0]]=+p[1]);
  ING[id]=Object.assign({id,n,cat,abv,sug,ac,f},x||{});
});
BASICS.forEach(id=>{ if(ING[id]) ING[id].basic=1; });
const SEGS=[["spirit","Spiritueux"],["liq","Liqueurs & amers"],["vin","Vins & vermouths"],["sirop","Sirops"],["soft","Softs & jus"],["add","Additionnel"]];
const SEGCOL={spirit:"#C98A2E",liq:"#B8452E",vin:"#8A2A4A",sirop:"#D8A840",soft:"#3A8AC0",add:"#6A9A4A"};
function segOf(id){ const i=ING[id]; if(i.basic||i.cat==="frais") return "add"; return {spirit:"spirit",liqueur:"liq",amaro:"liq",bitters:"liq",vin:"vin",sirop:"sirop",soft:"soft",jus:"soft"}[i.cat]; }
const DEFCOL={spirit:"#D9A55A",liqueur:"#E0B060",amaro:"#B03020",vin:"#8A2A2A",bitters:"#7A2A14",sirop:"#EED8A0",jus:"#EEF0B0",soft:"#EEF3F2",frais:"#F2EEE2"};
const JCOL={citron:"#F4EFA8",citron_vert:"#E4EDB0",orange:"#F5A93A",pamplemousse:"#F4B8A0",ananas:"#F5DB7A",canneberge:"#C8284A",pomme:"#E8C070",tomate:"#C0392B",ginger_beer:"#E8DDB0",ginger_ale:"#E8D8A8",cola:"#3A1E12",rivella:"#E8C890",soda_pamplemousse:"#F4C8B8",creme:"#F6F0E6",blanc_oeuf:"#F4F0E0",espresso:"#2A160C",cafe:"#3A2418",menthe:"#8CC870",basilic:"#6AAA50",creme_coco:"#F6F2EA",marmelade:"#E89A30"};
const colOf = id => ING[id].col || JCOL[id] || DEFCOL[ING[id].cat];
const tracked = id => !!CATS[ING[id].cat].track;
const LVLN = ["Vide","¼","½","¾","Pleine"];

function unitOf(id){
  const i=ING[id]; if(i.u) return i.u; if(i.cat==="bitters"||["fleur_oranger","tabasco","worcestershire"].includes(id)) return "d";
  if(id==="menthe"||id==="basilic") return "f"; if(id==="sucre"||id==="oeuf"||id==="concombre"||id==="piment") return "u"; if(id==="marmelade") return "bs"; return "ml";
}
function mlOf(it){ const u=it.u||"ml", I=ING[it.id]||{}; if(it.r==="rinse") return 1; if(it.id==="oeuf") return it.q*45; if(u==="d") return it.q*0.8; if(u==="gt") return it.q*0.05; if(u==="u") return it.q*(I.yml||0); if(u==="f"||u==="br") return 0; if(u==="bs") return it.q*(I.bsml||5); return it.q; }
if(!("sucre" in ING)) {}

// Recettes
let RECS=[], RMAP={};
function buildRecipes(custom){
  RECS = REC_RAW.map(([id,n,fam,m,g,ice,col,ing,gar,x])=>Object.assign({id,n,fam,m,g,ice,col,gar,
    ing:ing.map(([iid,q,u,r])=>({id:iid,q,u:u||"ml",r:r||""}))},x||{}));
  (custom||[]).forEach(c=>RECS.push(Object.assign({},c,{mine:1,ing:c.ing.map(i=>Object.assign({},i))})));
  RMAP={}; RECS.forEach(r=>{RMAP[r.id]=r; r.v=(r.v||[]).slice();});
  RECS.forEach(r=>r.v.forEach(v=>{ if(RMAP[v] && !RMAP[v].v.includes(r.id)) RMAP[v].v.push(r.id); }));
  AVGP=null; MODEL=null; STC={}; MEMO={}; THUMB={}; GFULL={}; RECS.forEach(r=>{ r.v=r.v.filter(v=>RMAP[v]); delete r._sh; delete r._p; delete r._m; delete r._fv; r.base=baseOf(r.ing); });
  computeZones();
}

// ---------- Calcul de l'équilibre ----------
function dilution(method, A, ice){
  if(method==="shake"||method==="mshake") return 1.567*A*A+1.742*A+0.203;
  if(method==="stir") return Math.max(0,-1.21*A*A+1.246*A+0.145);
  if(method==="build"||method==="mbuild") return ice==="pilee"?0.4:ice==="none"?0:0.22;
  return 0;
}
function calc(items, method, ice){
  let V=0,alc=0,sug=0,ac=0,Vt=0,alct=0,sugt=0,act=0;
  items.forEach(it=>{
    const i=ING[it.id]; if(!i) return; const ml=mlOf(it);
    const s = it.id==="sucre" ? it.q*4 : ml*i.sug/100;
    if(it.r==="top"||it.r==="float"){ Vt+=ml; alct+=ml*i.abv/100; sugt+=s; act+=ml*i.ac/100; }
    else { V+=ml; alc+=ml*i.abv/100; sug+=s; ac+=ml*i.ac/100; }
  });
  const A = V? alc/V : 0, d = dilution(method, A, ice);
  const vol = V*(1+d)+Vt, tot = vol||1;
  return {vol, pre:V+Vt, abv:(alc+alct)/tot*100, sug:(sug+sugt)/tot*100, acid:(ac+act)/tot*100, d};
}
const clamp01=x=>Math.max(0,Math.min(1,x));
const DIMS=["Sucré","Acide","Amer","Fort","Fruité","Herbacé","Épicé","Boisé"];
function profileOf(items, m){
  const acc={f:0,h:0,e:0,w:0,b:0,k:0};
  items.forEach(it=>{ const i=ING[it.id]; if(!i) return;
    let ml = mlOf(it); if(it.u==="f") ml = it.q*4; if(it.u==="br") ml = it.q*12; if(it.r==="rinse") ml=2;
    const ref = i.ref || ((it.r==="top"||i.fizz)?90:30), fac=Math.min(1.3, ml/ref);
    for(const L in i.f){ const w=i.f[L]/3*fac*1.2;
      if(L==="l") acc.h+=w*.7; else if(L==="m") acc.w+=w; else acc[L]+=w; }
  });
  const t=x=>1-Math.exp(-x);
  return [clamp01(m.sug/15), clamp01(m.acid/1.1), t(acc.b), clamp01(m.abv/30), t(acc.f), t(acc.h), t(acc.e), t(acc.w), t(acc.k)];
}
// ---- Recettes ajustées : ta version d’un cocktail ----
const ADJ_SWEET=["sucre","sucre_poudre","sucre_vanille","miel"], ADJ_ACID=["citron","citron_vert","pamplemousse","citron_vert_fr"];
function getAdj(id){ const a=(S.adj||{})[id]; return a&&(a.s||a.a||a.f)?a:null; }
function adjItems(r, a){
  a=a||getAdj(r.id); if(!a) return r.ing;
  const clampF=f=>Math.max(0.4,Math.min(1.8,f)), base=r.base;
  return r.ing.map(it=>{ const i=ING[it.id]; let f=1;
    if(a.s && (i.cat==="sirop"||ADJ_SWEET.includes(it.id)||(i.cat==="liqueur"&&i.sug>=20&&it.id!==base))) f*=clampF(1+0.2*a.s);
    if(a.a && ADJ_ACID.includes(it.id)) f*=clampF(1+0.2*a.a);
    if(a.f){ if(i.cat==="spirit"&&it.r!=="rinse") f*=clampF(1+0.15*a.f); else if(it.r==="top"&&i.fizz) f*=clampF(1-0.12*a.f); }
    if(f===1) return it;
    const u=it.u||"ml"; let q=it.q*f; q = u==="ml"? Math.max(2.5,Math.round(q/2.5)*2.5) : u==="bs"? Math.max(0.5,Math.round(q*2)/2) : Math.max(1,Math.round(q));
    return Object.assign({},it,{q,orig:it.q}); });
}
function metricsR(r){ return r._m || (r._m = calc(r.ing, r.m, r.ice)); }
function profileR(r){ return r._p || (r._p = profileOf(r.ing, metricsR(r))); }

function baseOf(ing){
  let best=null,bm=-1;
  ing.forEach(it=>{ const i=ING[it.id]; if(!i||it.r==="rinse") return; const ml=mlOf(it);
    const pr = i.cat==="spirit"?3: (i.abv>0?1:0); const sc = pr*1000+ml; if(pr>0 && sc>bm){bm=sc;best=it.id;} });
  return best;
}
const BASE_LABEL={rhum:"Rhum",gin:"Gin",agave:"Tequila & mezcal",whisky:"Whisky",vodka:"Vodka",brandy:"Cognac & brandy",eaux:"Eaux-de-vie",amer:"Amers",autre:"Autres"};
function baseGroup(r){ const b=r.base; if(!b) return "autre"; if(b==="absinthe"||b==="pastis") return "eaux"; if(SPIRIT_GROUP[b]) return SPIRIT_GROUP[b]==="gingembre"?"autre":SPIRIT_GROUP[b]; return "autre"; }

// Style d'un mélange (pour le labo)
function styleOf(items, method){
  let V=0,fz=0,wine=0,cream=0,acid=0;
  items.forEach(it=>{ const i=ING[it.id]; const ml=mlOf(it); V+=ml; if(i.fizz){fz+=ml; if(i.cat==="vin") wine+=ml;}
    if(it.id==="creme"||it.id==="creme_coco") cream+=ml; acid+=ml*i.ac/100; });
  if(!V) return "sour";
  if(fz/V>0.33) return wine>fz/2?"spritz":"long";
  const wv=items.filter(it=>ING[it.id].cat==="vin"&&ING[it.id].abv<14&&!ING[it.id].fizz).reduce((a,it)=>a+mlOf(it),0); if(wv/V>0.5) return "spritz";
  if(items.some(it=>it.id==="espresso"||it.id==="cafe")) return "cremeux";
  if(V>150 || (method==="build" && V>120)) return "long";
  if(method==="hot") return "cremeux";
  if(cream/V>0.15) return "cremeux";
  const pa = acid/V*100;
  if(method==="stir" || pa<0.3) return "stirred";
  return "sour";
}
const STYLE_N={sour:"sour (acide et frais)",stirred:"cocktail sec et puissant",long:"long drink pétillant",spritz:"spritz",cremeux:"cocktail crémeux"};
let ZONES={};
function q(arr,p){ const a=arr.slice().sort((x,y)=>x-y); const k=(a.length-1)*p, f=Math.floor(k); return a[f]+(a[Math.min(a.length-1,f+1)]-a[f])*(k-f); }
function computeZones(){
  const by={};
  RECS.filter(r=>!r.mine).forEach(r=>{ const st=styleOf(r.ing, r.m); const m=metricsR(r);
    (by[st]=by[st]||[]).push({abv:m.abv,sug:m.sug,acid:m.acid,ratio:m.sug/Math.max(.05,m.acid*10)}); });
  ZONES={};
  for(const st in by){ const L=by[st]; const z={n:L.length};
    ["abv","sug","acid","ratio"].forEach(k=>{ const v=L.map(x=>x[k]); z[k]=[q(v,.12),q(v,.5),q(v,.88)]; });
    ZONES[st]=z; }
}

// ---------- Disponibilité ----------
let S; // état
function prepActive(id){ return (S.preps||[]).some(p=>{ const t=PREP_TPL.find(x=>x[0]===p.tpl); return t && t[2]===id && daysLeft(p)>=0; }); }
function has(id){ const i=ING[id]; if(!i) return false; if(i.basic) return !((S.settings&&S.settings.nobasic)||[]).includes(id); if(prepActive(id)) return true;
  const v=S.stock[id]; return tracked(id)? (v||0)>0 : v===1; }
function inBar(id){ return S.stock[id]!==undefined; }
let STC={}, MEMO={};
function memo(k,f){ return k in MEMO? MEMO[k] : (MEMO[k]=f()); }
function status(r){
  if(STC[r.id]) return STC[r.id];
  const miss=[], subs={};
  r.ing.forEach(it=>{ if(it.r==="opt"||it.r==="rinse") return; if(!has(it.id)){ miss.push(it.id); const s=(ING[it.id].subs||[]).find(has); if(s) subs[it.id]=s; } });
  const uniq=[...new Set(miss)];
  return STC[r.id]={ok:!uniq.length, miss:uniq, subs, subOk: uniq.length>0 && uniq.every(m=>subs[m])};
}
function daysLeft(p){ const t=PREP_TPL.find(x=>x[0]===p.tpl); const life=p.life||(t?t[3]:30); return Math.floor((new Date(p.d).getTime()+life*864e5-Date.now())/864e5); }

// ---------- Goûts et suggestions ----------
const FAMK=Object.keys(FAMILIES), BASEK=Object.keys(BASE_LABEL);
function fvec(r){ if(r._fv) return r._fv; const p=profileR(r);
  const v=p.slice(); FAMK.forEach(f=>v.push(r.fam===f?.45:0)); const bg=baseGroup(r); BASEK.forEach(b=>v.push(bg===b?.6:0));
  return r._fv=v; }
function cos(a,b){ let d=0,x=0,y=0; for(let i=0;i<a.length;i++){d+=a[i]*b[i];x+=a[i]*a[i];y+=b[i]*b[i];} return d/Math.sqrt(x*y||1); }
function rated(){ return Object.entries(S.ratings).filter(([id])=>RMAP[id]); }
let AVGP=null; function avgProfile(){ if(AVGP) return AVGP; const a=Array(8).fill(0); RECS.forEach(r=>profileR(r).slice(0,8).forEach((v,i)=>a[i]+=v/RECS.length)); return AVGP=a; }
// ---- Modèle hybride : voisins + ingrédients + familles + profil de goût + signaux implicites ----
let MODEL=null, MKEY="";
function shares(r){ if(r._sh) return r._sh; const w={}; let t=0;
  r.ing.forEach(it=>{ const i=ING[it.id]; if(!i||i.basic||it.id==="eau_gazeuse"||it.id==="eau") return; const e=Math.min(1.5, Math.max(mlOf(it),0.5)/(i.ref||30)); w[it.id]=(w[it.id]||0)+e; t+=e; });
  for(const k in w) w[k]/=t||1; return r._sh=w; }
function trainSet(){
  const T={};
  const now=Date.now(), RT=S.rt||{};
  Object.entries(S.ratings).forEach(([id,rt])=>{ if(RMAP[id]){ const age=RT[id]?(now-RT[id])/864e5:0; T[id]={v:rt-3,w:Math.max(0.45,Math.pow(0.5,age/365))}; } });
  S.fav.forEach(id=>{ if(RMAP[id]&&!T[id]) T[id]={v:1.3,w:.7}; });
  const cnt={}; S.hist.forEach(h=>cnt[h.id]=(cnt[h.id]||0)+1);
  Object.entries(cnt).forEach(([id,n])=>{ if(RMAP[id]&&!T[id]) T[id]={v:0.45+Math.min(n-1,3)*0.2,w:0.3+Math.min(n,4)*0.1}; });
  Object.entries(S.opens||{}).forEach(([id,n])=>{ if(RMAP[id]&&!T[id]&&n>=2) T[id]={v:0.3,w:Math.min(0.25,0.08*n)}; });
  return T;
}
function getModel(){
  const k=JSON.stringify(S.ratings)+"|"+S.hist.length+"|"+S.fav.join(",")+"|"+RECS.length+"|"+JSON.stringify(S.quiz||0)+"|"+JSON.stringify(S.adj||0)+"|"+JSON.stringify(S.mw||0)+"|"+Object.keys(S.opens||{}).length;
  if(MODEL&&MKEY===k) return MODEL; MKEY=k;
  const T=trainSet(), ids=Object.keys(T), n=ids.reduce((a,id)=>a+T[id].w,0);
  const ia={},iw={}, fa={},fw={}, ba={},bw={};
  ids.forEach(id=>{ const r=RMAP[id], t=T[id], sh=shares(r);
    for(const i in sh){ ia[i]=(ia[i]||0)+t.v*t.w*sh[i]; iw[i]=(iw[i]||0)+t.w*sh[i]; }
    fa[r.fam]=(fa[r.fam]||0)+t.v*t.w; fw[r.fam]=(fw[r.fam]||0)+t.w;
    const b=baseGroup(r); ba[b]=(ba[b]||0)+t.v*t.w; bw[b]=(bw[b]||0)+t.w; });
  const Q=quizPrior();
  if(Q){ for(const f in Q.fam){ fa[f]=(fa[f]||0)+Q.fam[f]*2.4; fw[f]=(fw[f]||0)+1.6; } for(const b in Q.base){ ba[b]=(ba[b]||0)+Q.base[b]*2.4; bw[b]=(bw[b]||0)+1.6; } }
  const IA={},FA={},BA={}; for(const i in ia) IA[i]=ia[i]/(iw[i]+0.7); for(const f in fa) FA[f]=fa[f]/(fw[f]+1.5); for(const b in ba) BA[b]=ba[b]/(bw[b]+1.5);
  const av=avgProfile(), dir=Array(8).fill(0); let dw=0;
  ids.forEach(id=>{ const p=profileR(RMAP[id]), t=T[id]; dw+=t.w; for(let i=0;i<8;i++) dir[i]+=t.v*t.w*(p[i]-av[i]); });
  const qW=Q?3:0; const DIR=dir.map((x,i)=>(x+(Q?Q.dir[i]*1.7*qW:0))/(dw+1+qW));
  Object.values(S.adj||{}).forEach(a=>{ DIR[0]+=0.02*(a.s||0); DIR[1]+=0.02*(a.a||0); DIR[3]+=0.02*(a.f||0); });
  MODEL={T,ids,n:n+(Q?3:0),Q,IA,FA,BA,DIR,P:{},W:{}}; return MODEL;
}
function predict(r){
  const M=getModel(); if(M.P[r.id]!=null) return M.P[r.id];
  const pp=(typeof POPIDX!=="undefined"&&POPIDX[r.id]!=null)?1-POPIDX[r.id]/POPULAR.length:0;
  const prior=(r.c?0.22:0)+(r.s?0.08:0)+pp*0.4/(1+M.n/3);
  if(!M.ids.length && !M.Q){ M.W[r.id]=null; return M.P[r.id]=3+prior; }
  const fv=fvec(r); let sw=0,sv=0,best=null,bs=0;
  M.ids.forEach(id=>{ if(id===r.id) return; const t=M.T[id]; const s=cos(fv,fvec(RMAP[id])); const w=Math.pow(Math.max(0,s-0.5),2)*t.w; sw+=w; sv+=w*t.v; if(t.v>0.8 && s>bs){ bs=s; best=id; } });
  const knn=sw?sv/sw:0, kc=Math.min(1,sw*4);
  const sh=shares(r); let ing=0, topI=null, topV=0, lowI=null, lowV=0;
  for(const i in sh){ const a=M.IA[i]||0; ing+=sh[i]*a; if(a*sh[i]>topV){topV=a*sh[i];topI=i;} if(a*sh[i]<lowV){lowV=a*sh[i];lowI=i;} }
  const fam=M.FA[r.fam]||0, base=M.BA[baseGroup(r)]||0;
  const p=profileR(r), av=avgProfile(); let dims=0; for(let i=0;i<8;i++) dims+=M.DIR[i]*(p[i]-av[i]); dims*=4;
  if(M.Q&&M.Q.cream) dims+=M.Q.cream*((p[8]||0)-0.15)*1.6;   // goût déclaré pour les textures onctueuses
  const MW=mWeights(), hasIng=Object.keys(sh).some(i=>M.IA[i]!=null), wk=MW.knn*kc, wi=hasIng?MW.ing:0;
  const famb=0.55*fam+0.45*base*1.1;
  let vb=0, vbest=null; M.ids.forEach(id=>{ const t=M.T[id]; if(t.v>0.8&&RMAP[id].v.includes(r.id)){ vb+=t.v*t.w*0.4; if(!vbest||t.v>M.T[vbest].v) vbest=id; } }); vb=Math.min(0.8,vb);
  const dev=(wk*knn+wi*ing+MW.fam*famb+MW.dims*dims)/(wk+wi+MW.fam+MW.dims)*0.75+0.25*vb, conf=0.35+0.65*M.n/(M.n+4);
  let pred=3+1.85*Math.tanh(dev*1.15*conf)+prior*0.5;
  const RW=ridgeOf(M); if(RW){ const x=fvec(r); let s=0; for(let i=0;i<x.length;i++) s+=RW.W[i]*(x[i]-RW.mean[i]); pred=0.3*pred+0.7*(3+1.85*Math.tanh(s*1.1)); }
  const parts=[["knn",wk*knn],["ing",wi*ing],["fam",MW.fam*famb],["dims",MW.dims*dims],["var",0.25*vb*1.6]].sort((a,b)=>b[1]-a[1]);
  M.W[r.id]={top:parts[0][0],v:parts[0][1],best:bs>0.72?best:null,topI:(M.IA[topI]||0)>0.35?topI:null,lowI:(M.IA[lowI]||0)<-0.5?lowI:null,vbest,raw:{knn:kc>0.05?knn:0,ing:hasIng?ing:0,fam:famb,dims}};
  return M.P[r.id]=pred;
}
// Régression ridge sur le vecteur de goût (profil + famille + alcool de base), pondérée comme les notes.
// Réglée avec tests/m6.js (graine 1 : λ = 1,5, part 0,7) puis validée sur les graines 2 et 3.
let FVMEAN=null, FVMEAN_N=0;
function ridgeOf(M){ if(M.RW!==undefined) return M.RW; const ids=M.ids; if(ids.length<2||rated().length<2) return M.RW=null;
  if(!FVMEAN||FVMEAN_N!==RECS.length){ const d0=fvec(RECS[0]).length; FVMEAN=Array(d0).fill(0); RECS.forEach(r=>fvec(r).forEach((v,i)=>FVMEAN[i]+=v/RECS.length)); FVMEAN_N=RECS.length; }
  const mean=FVMEAN, d=mean.length, L=1.5, A=[], b=Array(d).fill(0);
  for(let i=0;i<d;i++){ A.push(Array(d).fill(0)); A[i][i]=L; }
  ids.forEach(id=>{ const t=M.T[id], x=fvec(RMAP[id]).map((v,i)=>v-mean[i]); for(let i=0;i<d;i++){ if(!x[i]) continue; b[i]+=t.w*x[i]*t.v; for(let j=0;j<d;j++) A[i][j]+=t.w*x[i]*x[j]; } });
  for(let i=0;i<d;i++){ let p=i; for(let k=i+1;k<d;k++) if(Math.abs(A[k][i])>Math.abs(A[p][i])) p=k; [A[i],A[p]]=[A[p],A[i]]; [b[i],b[p]]=[b[p],b[i]];
    for(let k=0;k<d;k++){ if(k===i) continue; const f=A[k][i]/A[i][i]; if(!f) continue; for(let c=i;c<d;c++) A[k][c]-=f*A[i][c]; b[k]-=f*b[i]; } }
  return M.RW={W:b.map((v,i)=>v/A[i][i]),mean}; }
// Poids des signaux, ajustés à chaque note : les signaux qui avaient vu juste gagnent en importance
function mWeights(){ return Object.assign({knn:.4,ing:.3,fam:.22,dims:.15},S.mw||{}); }
function learnFrom(id, rating){
  const r=RMAP[id]; if(!r) return; const M=getModel(); if(!M.ids.filter(x=>x!==id).length) return;
  delete M.P[id]; predict(r); const W=M.W[id]; if(!W||!W.raw) return;
  const t=(rating-3)/2, mw=mWeights(), lr=0.08;
  for(const k of ["knn","ing","fam","dims"]){ const x=Math.max(-1,Math.min(1,W.raw[k]*1.5)); if(Math.abs(x)<0.03) continue; mw[k]=Math.max(0.05,Math.min(0.8,mw[k]+lr*t*x)); }
  const sum=mw.knn+mw.ing+mw.fam+mw.dims; for(const k in mw) mw[k]=Math.max(0.05,Math.min(0.7,mw[k]*1.07/sum));
  S.mw=mw; S.mwN=(S.mwN||0)+1; MODEL=null;
}
function score(r){ return S.ratings[r.id] ? S.ratings[r.id]+0.01 : predict(r); }
function matchPct(r){ const x=score(r); return Math.round(Math.max(5,Math.min(98, 50+ (x-3)*28 ))); }
function hasTaste(){ return getModel().n>=2; }
function ctxInfo(){ const h=new Date().getHours(), m=new Date().getMonth()+1;
  const moment= momentForHour(h);
  const saison= [12,1,2].includes(m)?"hiver":[11,3].includes(m)?"frais":[6,7,8].includes(m)?"ete":"doux";
  return {moment,saison,label:{matin:"Pour ce matin",aprem:"Pour cet après-midi",apero:"Pour l’apéro",soir:"Pour ce soir",nuit:"Pour finir la soirée"}[moment]}; }
function ctxBonus(r, c){ c=c||ctxInfo(); const m=metricsR(r), f=r.fam; let b=0;
  if(c.moment==="apero"){ if((f==="bulles"||f==="highball")&&m.abv<14) b+=0.3; if(f==="dessert"||f==="chaud") b-=0.3; }
  if(c.moment==="soir"){ if(f==="stirred"||f==="sour"||f==="tiki") b+=0.15; }
  if(c.moment==="nuit"){ if(f==="stirred"||f==="dessert"||f==="chaud") b+=0.25; if(f==="bulles") b-=0.1; }
  if(c.moment==="matin"||c.moment==="aprem"){ if(m.abv<11) b+=0.15; if(m.abv>22) b-=0.3; }
  if(c.saison==="hiver"){ if(f==="chaud") b+=0.4; if(f==="tiki"||f==="bulles") b-=0.1; }
  if(c.saison==="frais"){ if(f==="chaud") b+=0.2; }
  if(c.saison==="ete"){ if(["highball","bulles","tiki","herbes"].includes(f)) b+=0.2; if(f==="chaud") b-=0.6; if(f==="dessert") b-=0.1; }
  if((r.se||[]).includes(new Date().getMonth()+1)) b+=0.2;
  const wd=new Date().getDay(), ef=effort(r), weekend=(wd===5||wd===6)&&(c.moment==="soir"||c.moment==="apero"||c.moment==="nuit")||wd===0&&c.moment!=="nuit";
  if(!weekend&&(c.moment==="soir"||c.moment==="apero")){ if(ef<=3) b+=0.15; else if(ef>=6) b-=0.1; }
  if(weekend&&ef>=5) b+=0.12;
  return b; }
function effort(r){ return r.ing.filter(i=>!ING[i.id].basic&&i.r!=="opt").length+(["shake","stir","mshake"].includes(r.m)?1:0)+(r.fam==="tiki"?1:0); }
function reasons(r){
  const rt=S.ratings[r.id]; if(rt>=5) return "Un de tes coups de cœur"; if(rt===4) return "Tu l’as beaucoup aimé";
  const fb=freshBottle(r); if(fb){ const n=lc(shortN(fb)); return "Pour étrenner "+(/^[aeiouyéèêàâîïôœ]/i.test(n)?"ton ":FEM.test(n)?"ta ":"ton ")+n; }
  if(EXPLORE.has(r.id)) return "Pour sortir un peu de ta zone de confort";
  predict(r); const M=getModel(), W=M.W[r.id];
  if(W){ if(W.top==="var"&&W.vbest) return "Une variante du "+RMAP[W.vbest].n+", que tu adores";
    if(W.top==="knn"&&W.best) return "Parce que tu as aimé "+RMAP[W.best].n;
    if(W.top==="ing"&&W.topI) return "Tu aimes "+lcArt(W.topI)+", et il y en a dedans";
    if(W.best) return "Proche de "+RMAP[W.best].n+", que tu as aimé";
    if(W.topI) return "Avec "+lcArt(W.topI)+", que tu apprécies"; }
  const p=profileR(r), av=avgProfile(); const top=p.slice(0,8).map((v,i)=>[v-av[i],i]).sort((a,b)=>b[0]-a[0]).slice(0,2).map(x=>DIMS[x[1]].toLowerCase());
  if(r.s&&r.cr) return "Une création suisse à tester, "+top.join(" et ");
  if(r.c) return "Un grand classique, "+top.join(" et ");
  return "Profil "+top.join(" et ");
}
function lcArt(id){ const n=lc(shortN(id)); if(/^[aeiouyéèêàâîïôœ]/i.test(n)) return "l’"+n; const fem=/^(Suze|Chartreuse|Bénédictine|crème|liqueur|grappa|vodka|tequila|cachaça|menthe|bière|sauce|marmelade|limonade|ginger|eau)/i.test(n); return (fem?"la ":"le ")+n; }
function madeCount(id){ return S.hist.filter(h=>h.id===id).length; }
function lastMade(id){ const h=S.hist.filter(x=>x.id===id); return h.length? h[h.length-1].t : 0; }
function daySeed(){ const d=new Date(); return d.getFullYear()*1e4+(d.getMonth()+1)*100+d.getDate(); }
function hrand(s){ let h=2166136261; for(const c of s){h^=c.charCodeAt(0); h=Math.imul(h,16777619);} return ((h>>>0)%10000)/10000; }
function freshBottle(r){ const T=S.stockT||{}, now=Date.now(); let best=null;
  r.ing.forEach(i=>{ const t=T[i.id]; if(t&&now-t<10*864e5&&tracked(i.id)&&has(i.id)&&!ING[i.id].basic&&(!best||t>T[best])) best=i.id; }); return best; }
let EXPLORE=new Set();
function tonight(){ return memo("tonight"+currentMomentKey(),tonightRaw); }
function currentMomentKey(){ return ctxInfo().moment+daySeed(); }
function tonightRaw(){
  const now=Date.now(), c=ctxInfo(), seed=daySeed()+"-"+c.moment, EX=S.settings.explore!=null?S.settings.explore:1, useCtx=S.settings.ctx!==false;
  const NOV=[0.05,0.25,0.5][EX], RND=[0.3,0.5,0.75][EX], SK=S.skips||{};
  const naOk=S.settings.na||rated().some(([id,rt])=>RMAP[id].na&&rt>=4);
  const cand=RECS.filter(r=>status(r).ok&&(naOk||!r.na)).map(r=>{ const lm=lastMade(r.id), rt=S.ratings[r.id];
    const hl=(S.heroLog||[]).filter(h=>h.id===r.id), today=daySeed(), recentHero=hl.some(h=>h.d!==today&&h.d>=today-2), fatigue=hl.length>=3&&!(S.opens||{})[r.id]&&!madeCount(r.id);
    const sk=SK[r.id]&&now-SK[r.id].t<14*864e5?Math.min(0.45,0.15*SK[r.id].n):0;
    let sc=(rt? rt-(EX===0?0.2:0.45) : predict(r))+(useCtx?ctxBonus(r,c):0)+hrand(r.id+seed)*RND+(madeCount(r.id)?0:NOV)-sk-(now-lm<3*864e5?1.2:0)-(rt&&rt<=2?1.5:0)+(freshBottle(r)?0.3:0)+(typeof perishing==="function"?(p=>p?(p[2]<=4?0.45:0.18):0)(perishing(r)):0)-(recentHero?0.35:0)-(fatigue?0.3:0);
    return [r,sc]; }).sort((a,b)=>b[1]-a[1]);
  const pool=cand.slice(0,40), out=[];
  while(pool.length && out.length<14){ let bi=0,bv=-1e9;
    pool.forEach(([r,sc],k)=>{ const red=out.length? Math.max(...out.map(o=>cos(fvec(r),fvec(o)))) : 0; const v=sc-3.2*Math.max(0,red-0.62); if(v>bv){bv=v;bi=k;} });
    out.push(pool.splice(bi,1)[0][0]); }
  EXPLORE=new Set(); const M=getModel();
  const slots=[[],[3],[2,5]][EX];
  if(M.ids.length>=2 && out.length>=6 && slots.length){ const known=M.ids.map(id=>fvec(RMAP[id]));
    const exs=cand.map(x=>x[0]).filter(r=>!out.slice(0,2).includes(r)&&!madeCount(r.id)&&!S.ratings[r.id]&&predict(r)>=2.9).map(r=>[r,Math.max(...known.map(k=>cos(fvec(r),k)))]).filter(x=>x[1]<0.72).sort((a,b)=>predict(b[0])-predict(a[0]));
    slots.forEach((pos,k)=>{ const ex=exs[k]; if(!ex) return; const i=out.indexOf(ex[0]); if(i>=0) out.splice(i,1); out.splice(pos,0,ex[0]); EXPLORE.add(ex[0].id); }); }
  return out.concat(pool.map(x=>x[0]), cand.slice(40).map(x=>x[0]));
}
function almost(){ return RECS.map(r=>[r,status(r)]).filter(([r,s])=>!s.ok && s.miss.length===1).sort((a,b)=>score(b[0])-score(a[0])); }
function bottleRecs(){ return memo("bottles",bottleRecsRaw); }
function bottleRecsRaw(){
  const cand={};
  RECS.forEach(r=>{ const st=status(r); if(st.miss.length===1){ const m=st.miss[0]; (cand[m]=cand[m]||[]).push(r); } });
  return Object.entries(cand).map(([id,rs])=>{ const v=rs.reduce((a,r)=>a+Math.pow(Math.max(0.3,predict(r)-2.4),1.5),0)+(getModel().IA[id]||0)*1.5;
    return {id, rs:rs.sort((a,b)=>predict(b)-predict(a)), v}; }).sort((a,b)=>b.v-a.v);
}
// ---- Quiz de goût : un a priori qui s’efface à mesure que tu notes ----
const QUIZ=[
 {id:"amer",q:"Face à un Campari, tu es plutôt…",o:[["love","J’adore l’amertume","negroni"],["ok","Un peu, ça passe","americano"],["no","Trop amer pour moi","hugo"]]},
 {id:"acide",q:"Et le citron dans un cocktail ?",o:[["vif","Bien acidulé et vif","daiquiri"],["rond","Équilibré","whisky_sour"],["doux","Plutôt doux et rond","pina_colada"]]},
 {id:"force",q:"Côté force, tu préfères…",o:[["leger","Léger, pour l’apéro","aperol_spritz"],["moyen","Entre les deux","margarita"],["fort","Puissant, le spiritueux devant","old_fashioned"]]},
 {id:"bulles",q:"Des bulles ?",o:[["oui","Oui, j’adore pétiller","french75"],["egal","Peu importe","mojito"],["non","Plutôt sans","manhattan"]]},
 {id:"aromes",multi:1,q:"Les arômes qui te font envie",sub:"Choisis-en autant que tu veux",o:[["fruit","Agrumes et fruits","bramble"],["herbe","Herbes et fleurs","last_word"],["epice","Épices","penicillin"],["bois","Boisé et fumé","oaxaca_of"],["creme","Café et gourmand","espresso_martini"]]},
 {id:"alcools",multi:1,q:"Tes alcools préférés",sub:"Choisis-en autant que tu veux",o:[["gin","Gin","gin_tonic"],["rhum","Rhum","mai_tai"],["whisky","Whisky","whisky_sour"],["agave","Tequila et mezcal","paloma"],["vodka","Vodka","moscow_mule"],["eaux","Eaux-de-vie","kirsch_sour"],["amer","Amers et apéritifs","suze_tonic"]]}
];
function quizPrior(){ const A=S.quiz; if(!A) return null; const d=Array(8).fill(0), fam={}, base={};
  const add=(i,v)=>d[i]+=v, F=(f,v)=>fam[f]=(fam[f]||0)+v, B=(b,v)=>base[b]=(base[b]||0)+v;
  ({love:()=>{add(2,.22);add(0,-.06);B("amer",.8);},ok:()=>add(2,.06),no:()=>{add(2,-.22);add(0,.06);B("amer",-.6);}})[A.amer]?.();
  ({vif:()=>{add(1,.16);F("sour",.4);},rond:()=>{},doux:()=>{add(1,-.12);add(0,.1);F("tiki",.3);F("dessert",.3);}})[A.acide]?.();
  ({leger:()=>{add(3,-.2);F("bulles",.5);F("highball",.3);F("stirred",-.4);},moyen:()=>{},fort:()=>{add(3,.2);F("stirred",.6);F("bulles",-.3);}})[A.force]?.();
  ({oui:()=>{F("bulles",.6);F("highball",.4);},egal:()=>{},non:()=>{F("bulles",-.5);F("highball",-.3);}})[A.bulles]?.();
  (A.aromes||[]).forEach(a=>({fruit:()=>add(4,.14),herbe:()=>{add(5,.14);F("herbes",.3);},epice:()=>add(6,.14),bois:()=>add(7,.14),creme:()=>{add(0,.06);F("dessert",.7);}})[a]?.());
  (A.alcools||[]).forEach(a=>B(a,.9));
  return {dir:d,fam,base}; }
function tasteStyle(){ const M=getModel(); if(M.n<2) return null;
  const d=M.DIR.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]); const N=["Gourmand","Fan d’acidité","Amateur d’amers","Amateur de spiritueux","Fruité","Herboriste","Épicé","Boisé"];
  const A=["gourmand","acidulé","amer","puissant","fruité","herbacé","épicé","boisé"];
  if(d[0][0]<0.005) return null; return N[d[0][1]]+(d[1][0]>0.005?", tendance "+A[d[1][1]]:""); }
function tasteVector(){
  const R=rated(); if(R.length<3) return null; const avg=Array(8).fill(0);
  RECS.forEach(r=>profileR(r).slice(0,8).forEach((v,i)=>avg[i]+=v/RECS.length));
  const t=Array(8).fill(0); let w=0;
  R.forEach(([id,rt])=>{ const p=profileR(RMAP[id]); const k=rt-2.5; w+=Math.abs(k); p.slice(0,8).forEach((v,i)=>t[i]+=k*(v-avg[i])); });
  const liked=Array(8).fill(0); let lw=0;
  R.forEach(([id,rt])=>{ if(rt>=4){ const p=profileR(RMAP[id]); lw+=rt-3; p.slice(0,8).forEach((v,i)=>liked[i]+=(rt-3)*v); } });
  return {dir:t.map(x=>x/(w||1)), liked: lw? liked.map(x=>x/lw) : null};
}
function tasteSentence(){
  const tv=tasteVector(); if(!tv) return "";
  const s=tv.dir.map((v,i)=>[v,DIMS[i].toLowerCase()]).sort((a,b)=>b[0]-a[0]);
  const plus=s.filter(x=>x[0]>0.03).slice(0,3).map(x=>x[1]), minus=s.filter(x=>x[0]<-0.03).slice(-2).reverse().map(x=>x[1]);
  let out=""; if(plus.length) out+="Tu aimes ce qui est "+joinFr(plus); if(minus.length) out+=(out?", un peu moins ce qui est ":"Tu aimes moins ce qui est ")+joinFr(minus);
  return out? out+".":"";
}
function joinFr(a){ return a.length<2? a.join("") : a.slice(0,-1).join(", ")+" et "+a[a.length-1]; }

// ---------- Mise en forme ----------
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function num(x){ return (Math.round(x*100)/100).toString().replace(".",","); }
function fmtQ(it, mult=1){
  const q=it.q*mult, u=it.u||"ml";
  if(it.r==="rinse") return "Quelques gouttes";
  if(u==="d"){ const n=Math.round(q); return n+(n>1?" traits":" trait"); }
  if(u==="f") return Math.round(q)+" feuilles";
  if(u==="br"){ const n=Math.round(q); return n+(n>1?" brins":" brin"); }
  if(u==="gt"){ const n=Math.round(q); return n+(n>1?" gouttes":" goutte"); }
  if(u==="u"){ const n=Math.max(1,Math.round(q)), L=ING[it.id]&&ING[it.id].uL; if(L) return n+" "+(n>1?L[1]:L[0]); if(it.id==="oeuf") return n+(n>1?" œufs":" œuf"); if(it.id==="concombre"||it.id==="piment") return n+(n>1?" rondelles":" rondelle"); return n+(n>1?" morceaux":" morceau"); }
  if(u==="bs") return num(q)+" c. à café";
  if(S.settings.unit==="ml") return num(Math.round(q*2)/2)+" ml";
  return num(Math.round(q/10*100)/100)+" cl";
}
function fmtMl(ml){ return S.settings.unit==="ml"? Math.round(ml)+" ml" : num(Math.round(ml/10*10)/10)+" cl"; }
function lc(n){ return /^(Suze|Pimm|Picon|Amer Picon|Jägermeister|Malibu|Passoã|Licor|Drambuie|Galliano|Cynar|Baileys|Southern|Tennessee|Campari|Aperol|Fernet|Lillet|Angostura|Peychaud|Bénédictine|Chartreuse|Rivella|Tabasco|Cointreau|Grand Marnier|Appenzeller|Williamine|Prosecco|Champagne|Old Tom)/.test(n)? n : n.charAt(0).toLowerCase()+n.slice(1); }
function ingList(r){ return r.ing.filter(i=>i.r!=="rinse"&&i.r!=="opt"&&!ING[i.id].basic&&(ING[i.id].abv>0||ING[i.id].cat==="sirop"||ING[i.id].cat==="soft")).slice(0,3).map(i=>shortN(i.id)).join(", "); }
function shortN(id){ return ING[id].n.replace(/ \(.*\)/,""); }

// ---------- Étapes ----------
const FEM=/^(grenadine|vodka|tequila|cachaça|suze|chartreuse|bénédictine|liqueur|crème|grappa|williamine|bière|limonade|ginger beer|menthe|sauce|marmelade|purée|saumure|boisson|cerise|glace)/i;
function art(id){ const n=lc(shortN(id)); if(/^[aeiouyéèêàâîïôœ]/i.test(n)) return "l’"+n; return (FEM.test(n)?"la ":"le ")+n; }
function listN(items){ return joinFr(items.map(i=>art(i.id))); }
const GNAME_SHORT={coupe:"coupe",flute:"flûte",martini:"verre",rocks:"verre",highball:"verre",vin:"verre",tasse:"verre",shot:"verre"};
function buildSteps(r){
  const g=GLASSES[r.g]||"le verre", S2=[];
  const main=r.ing.filter(i=>!["top","float","rinse"].includes(i.r)), top=r.ing.filter(i=>i.r==="top"), flo=r.ing.filter(i=>i.r==="float"), rinse=r.ing.filter(i=>i.r==="rinse");
  if(r.st){ const L=r.st.map(s=>Array.isArray(s)?{t:s[0],timer:s[1]}:{t:s});
    if(r.gar && r.gar!=="Aucune") L.push({t:"Décore : "+lc(r.gar)+"."}); return L; }
  const herbs=main.filter(i=>i.u==="f"||i.u==="br"), liquids=main.filter(i=>i.u!=="f"&&i.u!=="br");
  const powder=liquids.some(i=>ING[i.id].bsml&&ING[i.id].cat==="frais");
  const egg=main.some(i=>i.id==="blanc_oeuf"||i.id==="creme"&&r.id==="ramos");
  const up=r.ice==="none";
  const serve= up? "dans "+g+" refroidi"+(["coupe","flute"].includes(r.g)?"e":"") : r.ice==="pilee"? "sur de la glace pilée, dans "+g : r.ice==="big"? "sur un gros glaçon, dans "+g : "sur de la glace fraîche, dans "+g;
  const fg=["coupe","flute"].includes(r.g); if(up && ["shake","stir","mshake"].includes(r.m)) S2.push({t:"Mets "+g+" au congélateur quelques minutes, ou remplis-"+(fg?"la":"le")+" de glace pour "+(fg?"la":"le")+" refroidir."});
  if(rinse.length) S2.push({t:(has(rinse[0].id)?"Rince ":"Si tu en as, rince ")+""+(up&&["shake","stir","mshake"].includes(r.m)?(fg?"la ":"le ")+(GNAME_SHORT[r.g]||"verre"):g)+" avec quelques gouttes "+de(lc(shortN(rinse[0].id)))+", puis jette l’excédent."});
  if(r.m==="shake"||r.m==="mshake"){
    if(r.m==="mshake"&&herbs.length) S2.push({t:"Écrase délicatement "+listN(herbs)+" au fond du shaker avec le sirop, sans trop insister."});
    S2.push({t:"Verse dans le shaker "+listN(liquids)+"."});
    if(powder) S2.push({t:"Remue sans glace jusqu’à ce que le sucre soit dissous."});
    if(egg) S2.push({t:"Ferme et secoue sans glace pour monter la mousse.",timer:10});
    S2.push({t:"Ajoute beaucoup de glace et secoue vigoureusement.",timer:r.id==="ramos"?60:12});
    S2.push({t:"Filtre "+serve+(up?", à travers une petite passoire pour une texture fine.":".")});
  } else if(r.m==="stir"){
    S2.push({t:"Verse dans un verre à mélange "+listN(liquids)+"."});
    S2.push({t:"Ajoute beaucoup de glace et remue doucement avec une cuillère de bar.",timer:30});
    S2.push({t:"Filtre "+serve+"."});
  } else if(r.m==="build"){
    if(!up) S2.push({t:"Remplis "+g+" de glace"+(r.ice==="pilee"?" pilée":"")+"."});
    S2.push({t:"Verse "+(up?"dans "+g+" ":"")+listN(liquids)+"."});
    if(!top.length&&!flo.length) S2.push({t:"Remue brièvement pour mélanger."});
  } else if(r.m==="mbuild"){
    S2.push({t:"Écrase délicatement "+(herbs.length?listN(herbs)+" ":"")+"au fond "+de(g)+" avec le sirop et le jus d’agrumes."});
    { const rest=liquids.filter(i=>ING[i.id].cat!=="sirop"&&ING[i.id].cat!=="jus"); S2.push({t:(rest.length?"Ajoute "+listN(rest)+", puis remplis":"Remplis")+" de glace pilée."}); }
    S2.push({t:"Remue avec une cuillère de bar en faisant remonter les herbes."});
  } else if(r.m==="hot"){
    S2.push({t:"Réchauffe "+g+" avec de l’eau chaude, puis vide-le."});
    const base=liquids.slice().sort((x,y)=>mlOf(y)-mlOf(x))[0], coffee=liquids.some(i=>i.id==="cafe"||i.id==="espresso");
    if(coffee){ S2.push({t:"Verse le café chaud et le sucre, puis remue pour dissoudre."}); }
    else if(base&&base.id==="eau"){ S2.push({t:"Verse l’eau très chaude sur "+listN(liquids.filter(i=>i.id!=="eau"&&!ING[i.id].abv))+", puis remue."}); }
    else if(base){ const oth=liquids.filter(i=>i!==base&&!ING[i.id].abv); S2.push({t:"Chauffe doucement "+art(base.id)+(oth.length?" avec "+listN(oth):"")+", sans faire bouillir, puis verse dans le verre."}); }
    const alc=liquids.filter(i=>ING[i.id].abv>0&&i!==base);
    if(alc.length) S2.push({t:"Ajoute "+listN(alc)+", puis remue doucement."});
  } else if(r.m==="louche"){
    S2.push({t:"Verse l’absinthe dans "+g+"."});
    S2.push({t:"Pose éventuellement un morceau de sucre sur une cuillère à absinthe, au-dessus du verre."});
    S2.push({t:"Fais couler l’eau glacée très lentement, goutte à goutte, jusqu’à ce que l’absinthe se trouble."});
  }
  if(top.length) S2.push({t:"Complète avec "+listN(top)+(top.some(i=>ING[i.id].fizz)?", puis remue une seule fois pour garder les bulles.":".")});
  flo.forEach((i,k)=>{ const I=ING[i.id], last=k===flo.length-1;
    if(I.cat==="bitters") S2.push({t:"Dépose quelques gouttes "+de(lc(shortN(i.id)))+" sur le dessus."});
    else if(I.sug>=40) S2.push({t:"Termine en versant "+art(i.id)+" en filet : "+(FEM.test(lc(shortN(i.id)))?"elle":"il")+" coule doucement dans le verre et dessine un dégradé."});
    else S2.push({t:(last?"Termine avec ":"Verse ensuite ")+art(i.id)+", versé"+(FEM.test(lc(shortN(i.id)))?"e":"")+" doucement sur le dos d’une cuillère pour "+(i.id==="creme"?"qu’elle flotte":"rester en surface")+"."}); });
  if(r.gar && r.gar!=="Aucune" && !(/gouttes/i.test(r.gar)&&flo.some(i=>ING[i.id].cat==="bitters"))) S2.push({t:"Décore : "+lc(r.gar)+"."});
  return S2;
}
function de(n){ return /^[aeiouyéèêàâîïôhœ]/i.test(n)? "d’"+n : "de "+n; }

// ---------- SVG ----------
let GID=0;
function mix(c1,c2,t){ const a=parseInt(c1.slice(1),16),b=parseInt(c2.slice(1),16);
  const r=Math.round(((a>>16)&255)*(1-t)+((b>>16)&255)*t), g=Math.round(((a>>8)&255)*(1-t)+((b>>8)&255)*t), bl=Math.round((a&255)*(1-t)+(b&255)*t);
  return "#"+((1<<24)+(r<<16)+(g<<8)+bl).toString(16).slice(1); }
const GLASS_SHAPES={
  coupe:{o:"M9 16H55C55 34 45 41 32 41C19 41 9 34 9 16Z",y:21,stem:[41,69],base:[21,43],rim:[9,55,16],hl:"M13.5 20.5Q15 30 22 35",bot:37},
  martini:{o:"M8 12H56L32 40Z",y:16,stem:[40,69],base:[21,43],rim:[8,56,12],hl:"M14 16L23.5 27",bot:36},
  rocks:{o:"M13 30H51L49 70Q48.6 73 45.6 73H18.4Q15.4 73 15 70Z",y:38,rim:[13,51,30],hl:"M17.5 35L19 66",bot:70,ice:{cubes:[[18,43,15,14,-8],[31,46,15,14,10]],big:[[20,42,24,23,-3]]}},
  highball:{o:"M17 6H47L45 73Q44.8 75 42.8 75H21.2Q19.2 75 19 73Z",y:15,rim:[17,47,6],hl:"M21.5 11L23 68",bot:72,ice:{cubes:[[23,20,14,13,-7],[27,36,14,13,9],[22,52,14,13,-5]]}},
  flute:{o:"M24 5H40C41 26 39 40 32 44C25 40 23 26 24 5Z",y:11,stem:[44,71],base:[23,41],rim:[24,40,5],hl:"M27.3 9Q26.8 25 29.5 36",bot:40},
  vin:{o:"M15 8H49C50 30 44 43 32 43C20 43 14 30 15 8Z",y:19,stem:[43,71],base:[21,43],rim:[15,49,8],hl:"M19 12Q18.5 29 25 38",bot:40,ice:{cubes:[[20,21,12,11,-9],[32,23,12,11,11],[25.5,30,11,10,3]]}},
  tasse:{o:"M17 14H47L44 52Q43.6 56 39.6 56H24.4Q20.4 56 20 52Z",y:19,stem:[56,70],base:[22,42],handle:"M46.2 22Q54 22 53 32Q52 42 44.8 42",rim:[17,47,14],hl:"M21 18L23 49",bot:53},
  shot:{o:"M21 34H43L40.5 72Q40.2 74.5 37.7 74.5H26.3Q23.8 74.5 23.5 72Z",y:40,rim:[21,43,34],hl:"M24.8 38L26.3 69",bot:72},
  mug:{mug:1}
};
function citrusCol(t){ return /vert/.test(t)?"#9CCB4A":/orange/.test(t)?"#F29A30":/pamplemousse/.test(t)?"#F2A38A":"#F2D84A"; }
function garnishSVG(r, sh, g){
  const t=(r.gar||"").toLowerCase().split(/ ou |, et une| si tu/)[0]; if(!t||/^aucune|^la mousse/.test(t)) return "";
  const [L,R,Y]=sh.rim, mid=(L+R)/2; let s="";
  const has=re=>re.test(t);
  const segs=t.split(/,| et /).map(x=>x.trim()).filter(Boolean);
  // emplacements réservés : le bord droit va d'abord aux agrumes, puis aux fruits
  const citWheel=segs.filter(x=>/citron|orange|pamplemousse/.test(x)&&(/rondelle|roue|tranche|demi|quartier/.test(x)||/^(du |le |un )?(citron vert|citron|orange|pamplemousse)$/.test(x)));
  const citTwist=segs.filter(x=>/citron|orange|pamplemousse/.test(x)&&/zeste|ruban|spirale/.test(x));
  const longSpiral=has(/très long zeste|spirale|en spirale/)&&has(/citron|orange/);
  const rightTaken=citWheel.length>0||(citTwist.length>0&&!longSpiral)||has(/ananas/);
  // bord de sel ou de sucre
  if(has(/bord (de sel|sucré|de sel fumé)|sel au céleri/)){ const half=has(/moitié/); for(let x=L+1;x<=(half?mid:R-1);x+=1.9) s+=`<circle cx="${x.toFixed(1)}" cy="${(Y-0.6+((x*7)%3)*0.25).toFixed(2)}" r=".85" fill="#FFFFFF" stroke="rgba(0,0,0,.18)" stroke-width=".3"/>`; }
  // céleri
  if(has(/céleri/)&&!has(/sel au céleri/)) s+=`<path d="M${mid-2} ${Y+30}L${mid-8} ${Y-12}" stroke="#8CC050" stroke-width="3.4" stroke-linecap="round"/><path d="M${mid-8} ${Y-12}l-3 -4M${mid-8} ${Y-12}l1 -5M${mid-8} ${Y-12}l4 -3" stroke="#6AA83A" stroke-width="1.6" stroke-linecap="round"/>`;
  // herbes : menthe (petites feuilles dentelées, vert tendre) et basilic (grandes feuilles lisses et bombées, vert profond)
  const mint=has(/menthe/), basil=has(/basilic/), rose=has(/romarin|thym/);
  const hx=g==="highball"?mid-3:g==="rocks"?mid-4:mid-2;
  const mintAt=(x,y)=>{ const c="#6CC04A"; return `<path d="M${x} ${y+4}C${x-7} ${y-2} ${x-5} ${y-10} ${x+1} ${y-9}C${x+2} ${y-3} ${x+1} ${y+1} ${x} ${y+4}Z" fill="${c}"/><path d="M${x+1} ${y+3}C${x+9} ${y} ${x+10} ${y-7} ${x+5} ${y-9}C${x+2} ${y-6} ${x} ${y} ${x+1} ${y+3}Z" fill="${mix(c,"#ffffff",.2)}"/><path d="M${x-2} ${y-6}l-1.2 -.8M${x-3} ${y-3}l-1.2 -.4M${x+6} ${y-7}l1.1 -.9M${x+7} ${y-4}l1.2 -.4" stroke="${mix(c,"#000000",.2)}" stroke-width=".5"/><path d="M${x} ${y+3}L${x+2} ${y-6}" stroke="${mix(c,"#000000",.25)}" stroke-width=".6"/>`; };
  const basilAt=(x,y)=>{ const c="#2F8F3A", l=mix(c,"#ffffff",.25); return `<path d="M${x} ${y+4}C${x-9} ${y+1} ${x-10} ${y-9} ${x-2} ${y-11}C${x+1} ${y-6} ${x+1} ${y} ${x} ${y+4}Z" fill="${c}"/><path d="M${x} ${y+4}C${x+9} ${y+2} ${x+11} ${y-8} ${x+4} ${y-11}C${x+1} ${y-6} ${x} ${y} ${x} ${y+4}Z" fill="${l}"/><path d="M${x+1} ${y-4}C${x-3} ${y-8} ${x-1} ${y-15} ${x+3} ${y-15}C${x+5} ${y-11} ${x+4} ${y-7} ${x+1} ${y-4}Z" fill="${mix(c,"#ffffff",.12)}"/><path d="M${x} ${y+3}Q${x-3} ${y-3} ${x-2} ${y-10}M${x} ${y+3}Q${x+3} ${y-3} ${x+4} ${y-10}" stroke="${mix(c,"#000000",.3)}" stroke-width=".55" fill="none"/><path d="M${x-5} ${y-6}C${x-6} ${y-8} ${x-4} ${y-10} ${x-2} ${y-9}" stroke="#fff" stroke-opacity=".35" stroke-width=".7" fill="none"/>`; };
  if(rose&&!mint&&!basil){ const c="#5A8A4A", x=hx, y=Y-1; s+=`<path d="M${x} ${y+4}L${x+3} ${y-12}" stroke="${c}" stroke-width="1.2"/>`+[0,1,2,3,4].map(k=>`<path d="M${x+0.6*k} ${y+2-3.2*k}l-3 -1.5M${x+0.6*k} ${y+2-3.2*k}l3 -2" stroke="${c}" stroke-width="1.1" stroke-linecap="round"/>`).join(""); }
  if(mint&&basil){ s+=mintAt(hx-4,Y-1)+basilAt(hx+5,Y-1); }
  else if(mint) s+=mintAt(hx,Y-1);
  else if(basil) s+=basilAt(hx,Y-1);
  // long zeste en spirale (Horse’s Neck) : il s’enroule contre la paroi intérieure et dépasse du bord
  if(longSpiral){ const c=citrusCol(t), x0=R-3, bot=sh.bot-8; let d=`M${R+2} ${Y-4}Q${R} ${Y-6} ${x0} ${Y+1}`; let y=Y+1, side=1; while(y<bot){ const y2=Math.min(bot,y+7); d+=`Q${side>0?L+4:x0} ${y+3.5} ${side>0?L+5:x0} ${y2}`; y=y2; side=-side; }
    s+=`<path d="${d}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity=".95"/><path d="${d}" fill="none" stroke="#fff" stroke-width=".6" stroke-linecap="round" opacity=".45"/>`; }
  // agrumes : rondelle ou quartier au bord droit ; un zeste va au bord gauche si le droit est déjà pris
  const wheel=(seg,x,y)=>{ const c=citrusCol(seg);
    if(/quartier/.test(seg)) return `<path d="M${x-6} ${y}A6.5 6.5 0 0 0 ${x+7} ${y}Z" fill="${c}" stroke="${mix(c,"#000000",.25)}" stroke-width="1"/><path d="M${x-4} ${y}A4.4 4.4 0 0 0 ${x+5} ${y}Z" fill="${mix(c,"#ffffff",.45)}"/>`;
    return `<circle cx="${x}" cy="${y}" r="6" fill="${c}" stroke="${mix(c,"#000000",.22)}" stroke-width="1"/><circle cx="${x}" cy="${y}" r="4.3" fill="${mix(c,"#ffffff",.5)}"/>`+[0,1,2,3,4,5].map(k=>{ const a=k*Math.PI/3; return `<path d="M${x} ${y}L${(x+Math.cos(a)*4.1).toFixed(2)} ${(y+Math.sin(a)*4.1).toFixed(2)}" stroke="${mix(c,"#ffffff",.15)}" stroke-width=".7"/>`; }).join(""); };
  const twist=(seg,x,y,flip)=>{ const c=citrusCol(seg); return flip?`<path d="M${x+3} ${y}c-3 -5 -9 -3 -7 2c2 5 8 3 6 -1c-2 -3 -6 -2 -6 1" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`:`<path d="M${x-3} ${y}c3 -5 9 -3 7 2c-2 5 -8 3 -6 -1c2 -3 6 -2 6 1" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`; };
  if(g!=="shot"&&g!=="tasse"){ citWheel.slice(0,2).forEach((seg,i)=>{ s+=wheel(seg,R-1-i*9,Y-1+i*1.5); }); }
  if(!longSpiral) citTwist.slice(0,1).forEach(seg=>{ s+= citWheel.length? twist(seg,L+4,Y-1,true) : twist(seg,R,Y-1); });
  // concombre (bord gauche)
  const cucLeft=has(/concombre/);
  if(cucLeft) s+=`<circle cx="${L+3}" cy="${Y-1}" r="5.5" fill="#6AA84A"/><circle cx="${L+3}" cy="${Y-1}" r="4.3" fill="#DDEFC0"/><circle cx="${L+3}" cy="${Y-1}" r="1.6" fill="#C0DC98"/>`;
  // ananas
  if(has(/ananas/)){ const x=citWheel.length?L+2:R; s+=`<path d="M${x-4} ${Y+2}L${x+7} ${Y+2}L${x+1} ${Y-8}Z" fill="#F5D24A" stroke="#C8A020" stroke-width=".8"/><path d="M${x+1} ${Y-8}l-3 -6M${x+1} ${Y-8}l1 -7M${x+1} ${Y-8}l4 -5" stroke="#6AA83A" stroke-width="1.6" stroke-linecap="round"/>`; }
  // fraise (vraie forme) ou petites baies ; elles vont à gauche si le bord droit est pris
  const fx=rightTaken?(cucLeft?mid+5:L+3):R-1, fy=Y-2;
  if(has(/fraise/)&&!has(/framboise|mûre/)) s+=`<path d="M${fx} ${fy+6}C${fx-6} ${fy+2} ${fx-5} ${fy-4} ${fx} ${fy-3}C${fx+5} ${fy-4} ${fx+6} ${fy+2} ${fx} ${fy+6}Z" fill="#E0283A"/>`+[[-2,0],[1.5,-.5],[0,2.5],[-2.5,-2.2],[2.6,1.5]].map(([dx,dy])=>`<ellipse cx="${fx+dx}" cy="${fy+dy}" rx=".35" ry=".55" fill="#FFE68A"/>`).join("")+`<path d="M${fx-3} ${fy-3.3}L${fx} ${fy-1.6}L${fx+3} ${fy-3.3}L${fx+1} ${fy-4.5}L${fx} ${fy-6.2}L${fx-1} ${fy-4.5}Z" fill="#4A9A32"/>`;
  else if(has(/framboise|mûre|fruits rouges|fraise/)){ const c=has(/mûre/)?"#4A1438":"#D8284A"; s+=[[fx-1,fy],[fx+3.5,fy-1.5],[fx+1.5,fy+2.8]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.6" fill="${c}"/><circle cx="${x-0.8}" cy="${y-0.8}" r=".7" fill="#fff" opacity=".45"/>`).join(""); }
  // olive ou oignons sur pique
  if(has(/olive|oignon/)){ const x0=L+8, y0=Y-10, x1=mid+2, y1=sh.y+10, on=has(/oignon/);
    s+=`<path d="M${x0} ${y0}L${x1} ${y1}" stroke="#B89060" stroke-width="1.2" stroke-linecap="round"/>`;
    [0.55,0.8].forEach(k=>{ const x=x0+(x1-x0)*k, y=y0+(y1-y0)*k; s+= on? `<circle cx="${x}" cy="${y}" r="3.2" fill="#F4F0E4" stroke="#D8D0B8" stroke-width=".6"/>` : `<ellipse cx="${x}" cy="${y}" rx="3.8" ry="3" fill="#8AA83A" stroke="#6A8A2A" stroke-width=".6"/><circle cx="${x+1.6}" cy="${y-0.3}" r="1.1" fill="#D8403A"/>`; }); }
  // cerise
  if(has(/cerise/)&&!has(/olive/)){ const hb=g==="highball"||g==="mug", x=hb?(rightTaken?L+5:R-4):mid+2, y=hb?Y+2:(sh.bot-5); s+=`<path d="M${x} ${y-2}Q${x+3} ${y-10} ${x+8} ${y-12}" stroke="#5A7A2A" stroke-width="1.1" fill="none"/><circle cx="${x}" cy="${y}" r="3.6" fill="#B0102A"/><circle cx="${x-1.2}" cy="${y-1.2}" r="1" fill="#fff" opacity=".5"/>`; }
  // grains de café
  if(has(/grains de café/)) s+=[-5,0,5].map(dx=>`<ellipse cx="${mid+dx}" cy="${sh.y+1.4}" rx="2" ry="1.4" fill="#3A1E10"/><path d="M${mid+dx-1.4} ${sh.y+1.4}H${mid+dx+1.4}" stroke="#6A4028" stroke-width=".4"/>`).join("");
  // muscade, cannelle, chocolat râpés
  if(has(/muscade|copeaux|cannelle.*bord/)) for(let k=0;k<12;k++){ const x=mid-9+hrand("n"+k)*18, y=sh.y+0.6+hrand("m"+k)*1.8; s+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r=".6" fill="#6A3A1A" opacity=".8"/>`; }
  // fleur
  if(has(/fleur/)){ const x=R-2, y=Y-2; s+=[0,1,2,3,4].map(k=>{ const a=k*Math.PI*2/5-Math.PI/2; return `<ellipse cx="${(x+Math.cos(a)*2.6).toFixed(2)}" cy="${(y+Math.sin(a)*2.6).toFixed(2)}" rx="2.2" ry="1.5" transform="rotate(${k*72} ${(x+Math.cos(a)*2.6).toFixed(2)} ${(y+Math.sin(a)*2.6).toFixed(2)})" fill="${has(/sureau/)?"#FFF8E0":"#F2A8C8"}"/>`; }).join("")+`<circle cx="${x}" cy="${y}" r="1.4" fill="#F2C94C"/>`; }
  // bâton de cannelle
  if(has(/bâton de cannelle|cannelle,/)&&!has(/bord/)) s+=`<path d="M${mid+4} ${Y+18}L${R+3} ${Y-10}" stroke="#8A4A1E" stroke-width="3" stroke-linecap="round"/><path d="M${mid+4} ${Y+18}L${R+3} ${Y-10}" stroke="#B8703A" stroke-width="1" stroke-linecap="round"/>`;
  return s;
}
let THUMB={};
function glassThumb(r){ return THUMB[r.id]||(THUMB[r.id]=glassSVG(r,{garnish:false})); }
let GFULL={};
function glassSVG(r, opt={}){
  if(r&&r.id&&RMAP[r.id]===r){ let plain=true; for(const k in opt){ plain=false; break; } if(plain) return GFULL[r.id]||(GFULL[r.id]=glassSVGRaw(r,opt)); }
  return glassSVGRaw(r,opt); }
function glassSVGRaw(r, opt={}){
  if(typeof FX==="function"&&(opt.live||opt.stream)){ opt=Object.assign({},opt); if(!FX("live")) opt.live=0; if(!FX("stream")) opt.stream=0; }
  const g=r.g||"rocks", col=r.col||"#D9A55A", id="g"+(++GID); let sh=GLASS_SHAPES[g]||GLASS_SHAPES.rocks;
  if(opt.fill!=null&&!sh.mug){ const f=Math.max(0,Math.min(1,opt.fill)); sh=Object.assign({},sh,{y:sh.bot-f*(sh.bot-(sh.rim[2]+1.8))}); }
  const light=mix(col,"#ffffff",.22), deep=mix(col,"#000000",.1);
  const fizz=r.ing&&r.ing.some(i=>ING[i.id]&&ING[i.id].fizz), cream=r.ing&&r.ing.some(i=>(i.id==="creme"&&i.r==="float"));
  const foam=r.ing&&r.ing.some(i=>i.id==="blanc_oeuf"||i.id==="oeuf")&&r.m!=="build";
  const pour=(opt.pour||opt.live)?` class="${opt.pour?"pour ":""}${opt.live?"live ":""}${opt.stream?"streaming":""}"`:"";
  let s=`<svg viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" overflow="visible" style="overflow:visible"${pour}><defs><linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${deep}"/></linearGradient>`;
  if(sh.mug){
    s+=`<linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B8683A"/><stop offset=".45" stop-color="#E8A878"/><stop offset="1" stop-color="#9A5028"/></linearGradient><clipPath id="${id}m"><ellipse cx="30" cy="20.5" rx="16" ry="2.6"/></clipPath></defs>`;
    s+=`<path d="M46 30H51Q55 30 55 34V52Q55 56 51 56H46" fill="none" stroke="#A85A30" stroke-width="3.2" stroke-linecap="round"/>`;
    s+=`<path d="M14 20H46V67Q46 72 41 72H19Q14 72 14 67Z" fill="url(#${id}c)"/><g clip-path="url(#${id}m)"><g class="liq"><rect x="12" y="17" width="36" height="8" fill="${col}"/></g></g><g class="ice"><rect x="19" y="15.5" width="9" height="7" rx="2" fill="#fff" fill-opacity=".55" transform="rotate(-10 23 19)"/><rect x="29" y="16" width="8" height="6.5" rx="2" fill="#fff" fill-opacity=".45" transform="rotate(12 33 19)"/></g><ellipse cx="30" cy="20.5" rx="16" ry="2.6" fill="none" stroke="#C07848" stroke-width="1.2"/>`;
    s+=`<rect x="18" y="26" width="3" height="38" rx="1.5" fill="#fff" opacity=".28"/><g class="garn">${opt.garnish===false?"":garnishSVG(Object.assign({},r,{gar:(r.garList&&r.garList.length?r.garList.join(", "):r.gar)||"Rondelle de citron vert"}),{rim:[16,44,20],y:20.5,bot:70},"mug")}</g>`;
    return s+`</svg>`;
  }
  s+=`<clipPath id="${id}k"><path d="${sh.o}"/></clipPath></defs>`;
  if(sh.handle) s+=`<path d="${sh.handle}" fill="none" stroke="var(--glass-stroke)" stroke-width="1.6" stroke-linecap="round"/>`;
  s+=`<path d="${sh.o}" fill="var(--glass-fill)"/>`;
  if(opt.stream){ const mx=(sh.rim[0]+sh.rim[1])/2+2; s+=`<path class="stream" d="M${mx} -42V${sh.y+6}" stroke="${light}" stroke-width="3.2" stroke-linecap="round" pathLength="100"/>`; }
  s+=`<g clip-path="url(#${id}k)"><g class="tiltfix"><g class="liq"${opt.smilFrom!=null?` transform="translate(0 ${opt.smilFrom.toFixed(1)})"`:""}>${opt.smilFrom!=null?`<animateTransform class="smil" attributeName="transform" type="translate" from="0 ${opt.smilFrom.toFixed(1)}" to="0 0" dur="${opt.smilDur||1.1}s" begin="indefinite" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.25 0.8 0.3 1"/>`:""}<rect x="-40" y="${sh.y}" width="144" height="110" fill="url(#${id}l)" opacity=".96"/>${opt.live?`<path class="wave" d="M-64 ${sh.y+0.6}${" q4 -1.4 8 0 t8 0".repeat(24)}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.3"/>`:`<rect x="-40" y="${sh.y}" width="144" height="1.3" fill="#fff" opacity=".5"/>`}<rect x="-40" y="${sh.y+1.3}" width="144" height="5" fill="#fff" opacity=".08"/>`;
  // couches : les ingrédients versés en surface flottent, les liqueurs très sucrées coulent au fond
  const main=r.ing?r.ing.filter(i=>i.r!=="float"&&i.r!=="rinse").reduce((a,i)=>a+mlOf(i),0):0, flo=r.ing?r.ing.filter(i=>i.r==="float"&&i.id!=="creme"&&ING[i.id]&&(mlOf(i)>=5||ING[i.id].cat==="bitters")):[];
  if(flo.length&&main>0){ const H=sh.bot-sh.y, tot=main+flo.reduce((a,i)=>a+mlOf(i),0); let top=sh.y, bot=sh.bot;
    flo.slice().reverse().forEach(i=>{ const h=Math.max(4,H*mlOf(i)/tot), cc=colOf(i.id), sink=ING[i.id].sug>=40;
      if(sink){ bot-=h; s+=`<rect x="-40" y="${bot}" width="144" height="${h+30}" fill="${cc}" opacity=".92"/><rect x="-40" y="${bot-4}" width="144" height="4" fill="${cc}" opacity=".35"/>`; }
      else if(ING[i.id].cat==="bitters"){ s+=`<linearGradient id="${id}b${top|0}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cc}" stop-opacity=".85"/><stop offset="1" stop-color="${cc}" stop-opacity="0"/></linearGradient><rect x="-40" y="${top}" width="144" height="14" fill="url(#${id}b${top|0})"/>`; }
      else { s+=`<rect x="-40" y="${top}" width="144" height="${h}" fill="${cc}" opacity=".95"/><rect x="-40" y="${top+h}" width="144" height="3" fill="${cc}" opacity=".35"/><rect x="-40" y="${top}" width="144" height="1.3" fill="#fff" opacity=".45"/>`; top+=h; } }); }
  if(foam) s+=`<rect x="-40" y="${sh.y-1.5}" width="144" height="5.5" fill="#FBF6EA" opacity=".94"/>`;
  if(cream) s+=`<rect x="-40" y="${sh.y-1}" width="144" height="8" fill="#FBF6EC"/>`;
  s+=`</g><g class="ice">`;
  const ice=r.ice; let cubes=sh.ice&&sh.ice[ice==="big"?"big":"cubes"];
  if(!cubes&&(ice==="cubes"||ice==="big")){ // placement générique pour les verres sans positions prévues
    const [L,R,Y]=sh.rim, w=R-L, top=Math.max(Y+3,sh.y-2), h=sh.bot-top, cx=(L+R)/2;
    if(ice==="big"){ const s=Math.max(8,Math.min(w*0.55,h*0.8)), hh=g==="highball"?Math.min(h*0.72,s*2.6):s; cubes=[[cx-s/2,Math.min(sh.bot-hh-1.5,top+h*0.1),s,hh,-3]]; }
    else { const s=Math.max(6,Math.min(w*0.32,h*0.45)); cubes=[[cx-s*1.05,top+h*0.12,s,s*0.92,-9],[cx+s*0.05,top+h*0.2,s,s*0.92,10]]; if(h>s*2.2) cubes.push([cx-s/2,top+h*0.5,s*0.95,s*0.9,4]); }
  }
  if((ice==="cubes"||ice==="big")&&cubes) cubes.forEach(([x,y,w,h,a],k)=>{ s+=`<g class="cube" style="--d:${(0.72+k*0.09).toFixed(2)}s;--b:${(k*0.7).toFixed(1)}s"><g transform="rotate(${a} ${x+w/2} ${y+h/2})"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w,h)*0.24}" fill="#fff" fill-opacity=".26" stroke="#fff" stroke-opacity=".62" stroke-width="1"/><path d="M${x+2.5} ${y+h*0.35}V${y+2.5}H${x+w*0.45}" stroke="#fff" stroke-opacity=".75" stroke-width="1.1" fill="none" stroke-linecap="round"/></g></g>`; });
  else if(ice==="pilee"){ for(let k=0;k<24;k++){ const x=12+hrand(r.id+k)*40, y=sh.y+2+hrand(k+r.id)*46; s+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.5+hrand("z"+k)*2.1).toFixed(1)}" fill="#fff" fill-opacity=".4"/>`; } }
  s+=`</g><g class="fz">`;
  if(fizz){ for(let k=0;k<9;k++){ const x=(sh.rim[0]+5)+hrand("b"+k+r.id)*(sh.rim[1]-sh.rim[0]-10), y=sh.y+5+hrand("y"+k+r.id)*Math.max(10,(sh.bot-sh.y-8)); s+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r=".9" fill="#fff" opacity=".8"/>`; } }
  const straw=(g==="highball"&&(r.ice==="pilee"||r.fam==="tiki"))||/paille/i.test((r.garList||[r.gar||""]).join(" "));
  const [sL,sR,sY]=sh.rim, sx0=(sL+sR)/2+1, sy0=sh.bot-6, sx1=sR+3, sy1=sY-13;
  if(straw&&opt.garnish!==false) s+=`<g opacity=".55"><path d="M${sx0} ${sy0}L${sx1} ${sy1}" stroke="#E8584A" stroke-width="2.6" stroke-linecap="round"/><path d="M${sx0} ${sy0}L${sx1} ${sy1}" stroke="#fff" stroke-width="2.6" stroke-dasharray="2.5 3" opacity=".85"/></g>`;
  s+=`</g></g></g>`;
  if(straw&&opt.garnish!==false){ const k=(sY-sy0)/(sy1-sy0), xr=sx0+(sx1-sx0)*k; s+=`<g class="garn"><path d="M${xr.toFixed(2)} ${sY}L${sx1} ${sy1}" stroke="#E8584A" stroke-width="2.6" stroke-linecap="round"/><path d="M${xr.toFixed(2)} ${sY}L${sx1} ${sy1}" stroke="#fff" stroke-width="2.6" stroke-dasharray="2.5 3" opacity=".85"/></g>`; }
  s+=`<path d="${sh.o}" fill="none" stroke="var(--glass-stroke)" stroke-width="1.6" stroke-linejoin="round"/>`;
  s+=`<path d="${sh.hl}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>`;
  if(sh.stem) s+=`<path d="M32 ${sh.stem[0]}V${sh.stem[1]}" stroke="var(--glass-stroke)" stroke-width="1.8"/><path d="M${sh.base[0]} ${sh.stem[1]+1}H${sh.base[1]}" stroke="var(--glass-stroke)" stroke-width="2.4" stroke-linecap="round"/>`;
  const GTXT=r.garList&&r.garList.length? r.garList.join(", ") : r.gar;
  s+=`<g class="garn">${opt.garnish===false?"":garnishSVG(Object.assign({},r,{gar:GTXT}),sh,g)}</g>`;
  return s+`</svg>`;
}
function bottleSVG(id, level, big, shine){
  const i=ING[id], col=colOf(id), k="b"+(++GID);
  const lv= level==null?4:level, y=36-(lv/4)*21;
  const shapeByCat={bitters:"M10 3H14V10Q17 12 17 16V36Q17 38 15 38H9Q7 38 7 36V16Q7 12 10 10Z",sirop:"M9 3H15V8Q19 10 19 15V36Q19 38 17 38H7Q5 38 5 36V15Q5 10 9 8Z",vin:"M10 2H14V11Q18 14 18 19V36Q18 38 16 38H8Q6 38 6 36V19Q6 14 10 11Z"};
  const d=shapeByCat[i.cat]||"M9.5 2H14.5V9Q19 11.5 19 16V36Q19 38 17 38H7Q5 38 5 36V16Q5 11.5 9.5 9Z";
  return `<svg viewBox="0 0 24 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><clipPath id="${k}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="var(--glass-fill)"/><g clip-path="url(#${k})"><g class="bl" style="transform:translateY(${(y-15).toFixed(2)}px)"><rect x="0" y="15" width="24" height="40" fill="${col}" opacity=".92"/><rect x="0" y="15" width="24" height="1.2" fill="#fff" opacity=".45"/></g>${shine?`<g transform="translate(-14 0)"><animateTransform attributeName="transform" type="translate" values="-14 0;-14 0;34 0" keyTimes="0;0.82;1" dur="7s" begin="${shine}s" repeatCount="indefinite"/><rect x="0" y="-4" width="6" height="48" fill="#fff" opacity=".32" transform="skewX(-18)"/><rect x="7" y="-4" width="2" height="48" fill="#fff" opacity=".18" transform="skewX(-18)"/></g>`:""}</g><path d="${d}" fill="none" stroke="var(--glass-stroke)" stroke-width="1.2" stroke-linejoin="round"/><rect x="9.5" y="1" width="5" height="3" rx="1" fill="var(--label3)"/><rect x="7.2" y="17" width="1.4" height="14" rx=".7" fill="#fff" opacity=".4"/></svg>`;
}
function radarSVG(vals, cmp, size=150){
  const n=8,c=size/2,R=size/2-24; const pt=(i,v)=>[c+Math.sin(i/n*2*Math.PI)*R*v, c-Math.cos(i/n*2*Math.PI)*R*v];
  const lvl=v=>v>=0.66?"marqué":v>=0.33?"moyen":"léger", desc=DIMS.map((d,i)=>d.toLowerCase()+" "+lvl(vals[i]||0)).join(", ");
  let s=`<svg class="radar" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Profil de goût : ${desc}">`;
  [0.33,0.66,1].forEach(r=>s+=`<polygon points="${[...Array(n)].map((_,i)=>pt(i,r).join(",")).join(" ")}" fill="none" stroke="var(--sep)" stroke-width="1"/>`);
  for(let i=0;i<n;i++){ const [x,y]=pt(i,1); s+=`<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" stroke="var(--sep)" stroke-width=".7"/>`;
    const [lx,ly]=pt(i,1.24); s+=`<text x="${lx}" y="${ly+3.5}" text-anchor="middle" font-size="9.5" fill="var(--label2)" font-family="-apple-system,sans-serif">${DIMS[i]}</text>`; }
  if(cmp) s+=`<polygon points="${cmp.slice(0,8).map((v,i)=>pt(i,Math.max(.04,v)).join(",")).join(" ")}" fill="none" stroke="var(--label3)" stroke-width="1.2" stroke-dasharray="3 3"/>`;
  s+=`<polygon points="${vals.slice(0,8).map((v,i)=>pt(i,Math.max(.04,v)).join(",")).join(" ")}" fill="var(--tint)" fill-opacity=".22" stroke="var(--tint)" stroke-width="1.8" stroke-linejoin="round"/>`;
  return s+`</svg>`;
}
const IC={
  chev:`<svg class="chev" viewBox="0 0 8 13"><path d="M1.5 1.5L6.5 6.5L1.5 11.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  x:`<svg viewBox="0 0 12 12"><path d="M1.5 1.5L10.5 10.5M10.5 1.5L1.5 10.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  plus:`<svg viewBox="0 0 24 24"><path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  minus:`<svg viewBox="0 0 24 24"><path d="M5 12H19" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  star:`<svg viewBox="0 0 24 24"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" fill="currentColor"/></svg>`,
  heart:`<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.9 3.8 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.4 0 5.6 3.4 4.4 6.7-1.7 4.7-9.2 9.3-9.2 9.3z" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
  heartf:`<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.9 3.8 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.4 0 5.6 3.4 4.4 6.7-1.7 4.7-9.2 9.3-9.2 9.3z" fill="currentColor"/></svg>`,
  check:`<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  checkc:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  warn:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 7v6" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="16.8" r="1.4" fill="#fff"/></svg>`,
  search:`<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15.5 15.5L20 20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  dice:`<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.5" fill="currentColor"/></svg>`,
  play:`<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>`,
  copy:`<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
  share:`<svg viewBox="0 0 24 24"><path d="M12 3v12M7.5 7.5L12 3l4.5 4.5M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  flask:`<svg viewBox="0 0 24 24"><path d="M9 3h6M10 3v6l-5.5 9.8A1.8 1.8 0 0 0 6.1 21.5h11.8a1.8 1.8 0 0 0 1.6-2.7L14 9V3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path class="fillme" d="M7.2 15h9.6l2.7 4.8a1.2 1.2 0 0 1-1 1.7H5.5a1.2 1.2 0 0 1-1-1.7z" fill="none"/></svg>`,
  bottle:`<svg viewBox="0 0 24 24"><path class="fillme" d="M10 2.5h4v4.2l2.2 3.1c.5.7.8 1.5.8 2.4v8.3a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-8.3c0-.9.3-1.7.8-2.4L10 6.7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M7.5 13h9" stroke="currentColor" stroke-width="1.6"/></svg>`,
  coupe:`<svg viewBox="0 0 24 24"><path class="fillme" d="M3.5 5h17c0 4.4-3.7 7-8.5 7S3.5 9.4 3.5 5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 12v8M8 20.5h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  sparkle:`<svg viewBox="0 0 24 24"><path class="fillme" d="M12 2.5l2 6.2 6.5 2.3-6.5 2.3-2 6.2-2-6.2L3.5 11 10 8.7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M19 16.5l.8 2 2 .7-2 .7-.8 2-.8-2-2-.7 2-.7z" fill="currentColor"/></svg>`,
  trophy:`<svg viewBox="0 0 24 24"><path class="fillme" d="M7 3.5h10v5.5a5 5 0 0 1-10 0z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M7 5.5H4.2a3.2 3.2 0 0 0 3.3 4.3M17 5.5h2.8a3.2 3.2 0 0 1-3.3 4.3M12 14v4M8 20.5h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  map:`<svg viewBox="0 0 24 24"><circle cx="7" cy="8" r="2" fill="currentColor"/><circle cx="16" cy="6" r="2" fill="currentColor"/><circle cx="12" cy="14" r="2" fill="currentColor"/><circle cx="18" cy="17" r="2" fill="currentColor"/><circle cx="6" cy="18" r="2" fill="currentColor"/></svg>`,
  shaker:`<svg viewBox="0 0 24 24"><path d="M9 2.5h6l-.4 2.5H9.4z" fill="currentColor"/><path d="M8.5 6h7l-1 3h-5z" fill="currentColor" opacity=".7"/><path d="M8 10h8l-1.4 11a1 1 0 0 1-1 .9h-3.2a1 1 0 0 1-1-.9z" fill="currentColor"/></svg>`,
  gear:`<svg viewBox="0 0 24 24"><path d="M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19.4 13.5c.1-.5.1-1 .1-1.5s0-1-.1-1.5l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A7.6 7.6 0 0 0 7 6.5l-2.4-1-2 3.4 2 1.6c-.1.5-.1 1-.1 1.5s0 1 .1 1.5l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.6 7.6 0 0 0 2.6-1.5l2.4 1 2-3.4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  coin:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14.8 9.2c-.5-.9-1.6-1.4-2.8-1.4-1.6 0-2.8.8-2.8 2.1 0 2.9 5.8 1.6 5.8 4.3 0 1.3-1.3 2.1-3 2.1-1.3 0-2.4-.6-2.9-1.5M12 6v1.8M12 16.3V18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  filter:`<svg viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  book:`<svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 21H20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`
};
function starsSm(n){ let s='<span class="stars sm">'; for(let i=1;i<=5;i++) s+=`<span class="${i<=n?"on":""}">${IC.star}</span>`; return s+"</span>"; }

// ================= COÛT PAR VERRE =================
const DEFVOL={spirit:700,liqueur:700,amaro:700,vin:750,bitters:200,sirop:700,soft:1000,jus:1000,frais:500};
// estimation des basiques, en CHF par unité (ml, trait, feuille ou pièce)
const BASIC_COST={sucre_poudre:0.01,miel:0.03,sel:0,citron_vert_fr:0.6,citron_fr:0.1,jaune_oeuf:0.03,citron:0.02,citron_vert:0.025,sirop_sucre:0.002,sirop_miel:0.02,blanc_oeuf:0.017,oeuf:0.5,creme:0.008,lait:0.0016,menthe:0.04,basilic:0.05,concombre:0.08,cafe:0.004,espresso:0.012,fleur_oranger:0.02,marmelade:0.1,worcestershire:0.02,tabasco:0.02,sucre:0.02,eau:0};
function hasPrices(){ return Object.values(S.price||{}).some(p=>p&&p.p>0); }
function unitPrice(id){ const p=(S.price||{})[id]; if(!p||!p.p) return null; return p.p/(p.v||DEFVOL[ING[id].cat]||700); }
function costOf(items, mult=1){
  let tot=0, est=0; const miss=[];
  items.forEach(it=>{ const i=ING[it.id]; if(!i||it.r==="rinse") return;
    if(i.basic){ const u=BASIC_COST[it.id]||0; const q=(it.u==="f"||it.u==="u"||it.u==="d"||it.u==="gt"||it.u==="bs")?it.q:it.u==="br"?it.q*3:mlOf(it); est+=u*q*mult; return; }
    const up=unitPrice(it.id); if(up==null){ if(it.r!=="opt") miss.push(it.id); return; } tot+=up*mlOf(it)*mult; });
  return {tot:tot+est, est, miss:[...new Set(miss)]};
}
function chf(x){ const c=(S.settings&&S.settings.cur)||"CHF"; return (c==="CHF"?(Math.round(x*20)/20):Math.round(x*100)/100).toFixed(2).replace(".",",")+" "+(c==="EUR"?"€":"CHF"); }
function barValue(){ let v=0; Object.entries(S.stock).forEach(([id,l])=>{ const p=(S.price||{})[id]; if(p&&p.p&&tracked(id)&&l>0) v+=p.p*l/4; }); return v; }

// ================= ACCORDS METS ET COCKTAILS =================
function pairFeatures(r){ const p=profileR(r), av=avgProfile(), m=metricsR(r);
  const fz=r.ing.some(i=>ING[i.id].fizz)?1:0;
  return {sweet:p[0]-av[0],acid:p[1]-av[1],bitter:p[2]-av[2],strong:p[3]-av[3],fruity:p[4]-av[4],herbal:p[5]-av[5],spicy:p[6]-av[6],woody:p[7]-av[7],cream:(p[8]||0)-0.15,fizz:fz-0.35,light:m.abv<10?1:0}; }
function dishPicks(d){
  const out=RECS.filter(r=>!r.mine).map(r=>{ const f=pairFeatures(r); let s=0, best=null, bv=0;
    for(const k in d.want){ const v=d.want[k]*(f[k]||0); s+=v*2.2; if(v>bv){bv=v;best=k;} }
    const pk=d.picks.indexOf(r.id); if(pk>=0) s+=3-pk*0.25;
    if(d.base.includes(baseGroup(r))) s+=0.4;
    if(status(r).ok) s+=0.7; s+=(predict(r)-3)*0.35; if(r.na&&!S.settings.na) s-=1.2;
    let why=best?PAIR_WHY[best]:PAIR_WHY.light; if((d.id==="fondue"||d.id==="raclette")&&["kirsch","williamine","pflumli","abricotine","trasch","genepi"].includes(r.base)) why=PAIR_WHY.trad;
    return {r,s,why}; }).sort((a,b)=>b.s-a.s);
  const res=[]; for(const x of out){ if(res.length>=7) break; if(res.some(y=>cos(fvec(y.r),fvec(x.r))>0.97)) continue; res.push(x); } return res;
}

// ================= MOMENT DE LA JOURNÉE =================
const MOMENTS={matin:{n:"Ce matin",k:"Bonne matinée"},aprem:{n:"Cet après-midi",k:"Bel après-midi"},apero:{n:"L’heure de l’apéro",k:"C’est l’heure dorée"},soir:{n:"Ce soir",k:"Belle soirée"},nuit:{n:"Tard dans la nuit",k:"Pour les noctambules"}};
// Plages horaires explicites, sur l’heure locale de l’appareil (Date#getHours)
function momentForHour(h){ if(h>=5&&h<12) return "matin"; if(h>=12&&h<17) return "aprem"; if(h>=17&&h<20) return "apero"; if(h>=20&&h<23) return "soir"; return "nuit"; }
function currentMoment(){ const m=S.settings&&S.settings.moment; return m&&m!=="auto"?m:ctxInfo().moment; }
