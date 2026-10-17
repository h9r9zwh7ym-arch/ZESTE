// ================= 1.61 (B) : score du Labo =================
// « Modifier dans le labo » recopiait la quantité sans son unité : 2 cuillères de sirop de miel devenaient 2 ml.
// labQ convertit une dose de recette dans l'unité qu'utilise le Labo pour cet ingrédient.
function labQ(i){ const u=i.u||"ml", lu=unitOf(i.id); if(u===lu) return i.q;
  if(lu==="ml"){ const ml=mlOf(i); return ml>0? Math.max(0.5,Math.round(ml*2)/2) : i.q; }
  if(lu==="d"){ const ml=mlOf(i); return ml>0? Math.max(1,Math.round(ml/0.8)) : i.q; }
  if(lu==="f"&&u==="br") return i.q*6;
  return i.q; }
{ const _t=ACT.tolab; ACT.tolab=(d)=>{ _t(d); const r=RMAP[d.id]; if(!r) return; const M=mixState();
    M.items=r.ing.filter(i=>i.r!=="rinse"&&i.r!=="opt"&&ING[i.id]).map(i=>({id:i.id,q:labQ(i)})); changed(); }; }

// ---------- Score : qualité d'équilibre par rapport aux recettes du même style ----------
// Quatre sous-scores continus (Équilibre, Force, Remplissage, Glace), moyenne pondérée, plafond si un critère est rédhibitoire.
// Référence : les recettes de l'app préparées comme « Modifier dans le labo », regroupées par style.
//  · Équilibre : écart du sucre à ce qu'appellent l'acidité et l'amertume du style (résidu d'une régression), plus le manque d'acidité
//    pour les styles acides ; pénalité continue exp(-½·d^γ), sans plateau, donc 100 reste rare.
//  · Force : écart du degré à la médiane du style (plus de tolérance côté fort).
//  · Remplissage : verre presque vide ou trop plein ; au-delà de 135 % de la contenance du verre, le total est plafonné.
//  · Glace : glaçons dans un verre à pied, long drink sans glace, cocktail court sans glace dans un grand verre.
// Le décor reste un bonus affiché, hors note. La ressemblance à un classique reste une information à part (« Ça ressemble à »).
// Réglé sur tests/m9.js (graine 1), validé sur la graine 2.
const LSP={tb:11,tf:4,gam:0.8,wa:0.3,dry:2,strong:1.6,flo:0.2,slo:0.1,fhi:1.1,shi:0.5,ov:1.35,lni:0.5,cap:35,W:{bal:45,abv:25,fill:10,ice:20}};
const LAB_TFAM={sour:"court",stirred:"sec",highball:"long",bulles:"spritz",shot:"shot"}, LAB_ACID=new Set(["sour","long","spritz"]);
function labPrep(r){ return {items:r.ing.filter(i=>i.r!=="opt"&&i.r!=="rinse"&&ING[i.id]).map(i=>({id:i.id,q:labQ(i)})),
  m:({shake:"shake",mshake:"shake",stir:"stir"})[r.m]||"build", g:LCAP[r.g]?r.g:"rocks", ice:r.ice||"none", t:LAB_TFAM[r.fam]||"auto"}; }
function labStyleT(items,m,t){ const guess=styleOf(items,m);
  if(t==="sec") return "stirred"; if(t==="long") return "long"; if(t==="spritz") return "spritz";
  if(t==="court") return guess==="long"||guess==="spritz"? "sour" : guess; return guess; }
function labFeat(st,met,amer){ const ls=Math.log(met.sug+0.5), la=Math.log(met.acid+0.05);
  return {ls, la2:Math.log(met.acid+0.3), X: LAB_ACID.has(st)? [1,la,amer,met.abv/10] : [1,amer,met.abv/10]}; }
function lsq(X,y){ const n=X.length?X[0].length:0, A=Array.from({length:n},()=>new Array(n).fill(0)), b=new Array(n).fill(0);
  X.forEach((x,k)=>{ for(let i=0;i<n;i++){ b[i]+=x[i]*y[k]; for(let j=0;j<n;j++) A[i][j]+=x[i]*x[j]; } });
  for(let i=0;i<n;i++){ let p=i; for(let k=i+1;k<n;k++) if(Math.abs(A[k][i])>Math.abs(A[p][i])) p=k; [A[i],A[p]]=[A[p],A[i]]; [b[i],b[p]]=[b[p],b[i]];
    if(Math.abs(A[i][i])<1e-12){ const w=new Array(n).fill(0); w[0]=y.length?y.reduce((a,v)=>a+v,0)/y.length:0; return w; }
    for(let k=i+1;k<n;k++){ const f=A[k][i]/A[i][i]; for(let j=i;j<n;j++) A[k][j]-=f*A[i][j]; b[k]-=f*b[i]; } }
  const w=new Array(n).fill(0); for(let i=n-1;i>=0;i--){ let s=b[i]; for(let j=i+1;j<n;j++) s-=A[i][j]*w[j]; w[i]=s/A[i][i]; } return w; }
const dot=(w,x)=>w.reduce((a,v,i)=>a+v*x[i],0);
let LAB_REF=null, LAB_REF_FOR=null;
function labRef(){ if(LAB_REF&&LAB_REF_FOR===RECS) return LAB_REF;
  const by={}; RECS.filter(r=>!r.mine&&r.m!=="hot").forEach(r=>{ const P=labPrep(r);
    const items=P.items.map(it=>({id:it.id,q:it.q,u:unitOf(it.id),r:ING[it.id].fizz&&P.m!=="build"?"top":""})); if(!items.length) return;
    const met=calc(items,P.m,P.ice), st=labStyleT(items,P.m,P.t); (by[st]=by[st]||[]).push(Object.assign({abv:met.abv},labFeat(st,met,profileOf(items,met)[2]))); });
  const rq=v=>v.length? [q(v,.5),(q(v,.9)-q(v,.1))/2.56||1] : [0,1], R={};
  for(const st in by){ const L=by[st], w=lsq(L.map(f=>f.X),L.map(f=>f.ls)), res=L.map(f=>f.ls-dot(w,f.X));
    R[st]={la2:rq(L.map(f=>f.la2)), abv:rq(L.filter(f=>f.abv>=0.5).map(f=>f.abv)), w, sr:(q(res,.9)-q(res,.1))/2.56||1}; }
  LAB_REF_FOR=RECS; return LAB_REF=R; }
function labGarS(items,gar){ const sug=labSuggestGar(items); return {sug, v:!gar.length?0:gar.some(x=>sug.includes(x))?1:0.5}; }
labScore=function(A){
  const M=mixState(), {g,ice}=labGlass(), items=mixItems(), st=A.st, met=A.met, P=LSP, Rf=labRef(), r=Rf[st]||Rf.sour;
  const avail=labAvail(g,ice), fill=met.vol/avail, ov=met.vol/capOf(g), shot=M.t==="shot", alc=met.abv>=0.5, acid=LAB_ACID.has(st);
  const F=labFeat(st,met,profileOf(items,met)[2]), zr=(F.ls-dot(r.w,F.X))/r.sr, za=(F.la2-r.la2[0])/r.la2[1], zf=(met.abv-r.abv[0])/r.abv[1];
  const sh=shot?2:1, e1=zr>0? zr/(P.tb*sh) : -zr/(P.tb*sh*(acid?1:P.dry)), e2=acid? Math.max(0,-za/P.tb) : 0;
  const bal=Math.exp(-0.5*Math.pow(e1*e1+P.wa*e2*e2,P.gam/2));
  let abv= alc? Math.exp(-0.5*Math.pow(zf>0? zf/(P.tf*P.strong) : -zf/P.tf, P.gam)) : st==="stirred"? 0 : 1; if(shot) abv=1;
  const fillS= fill<P.flo? Math.exp(-0.5*Math.pow((P.flo-fill)/P.slo,2)) : fill>P.fhi? Math.exp(-0.5*Math.pow((fill-P.fhi)/P.shi,2)) : 1;
  let iceS=1; if(ice!=="none"&&["coupe","martini","flute","shot"].includes(g)) iceS=0.3; if(st==="long"&&ice==="none") iceS=P.lni;
  if(["sour","stirred","cremeux"].includes(st)&&["highball","vin","mug"].includes(g)&&ice==="none") iceS=0.4; if(shot) iceS=g==="shot"&&ice==="none"?1:0.3;
  const red=(st==="stirred"&&!alc&&!shot)||ov>P.ov, G=labGarS(items,M.gar);
  const goals=[["bal","Équilibre",bal,P.W.bal],["abv","Force",abv,P.W.abv],["fill","Remplissage",fillS,P.W.fill],["ice","Glace",iceS,P.W.ice],["gar","Décor (bonus)",G.v,0]];
  const Wt=goals.reduce((a,x)=>a+x[3],0); let raw=100*goals.reduce((a,x)=>a+x[2]*x[3],0)/Wt; if(red) raw=Math.min(raw,P.cap);
  return {score: raw>=98-1e-9? 100 : Math.floor(raw+1e-9), raw, red, goals, fill, avail, sug:G.sug}; };

// ---------- Affichage : un mot pour le score, les quatre sous-scores dans l'analyse détaillée ----------
labGrade=function(s){ return s>=90?["Proche d’un classique","trophy"]:s>=70?["Réussi","medal"]:s>=40?["Buvable","thumbs-up"]:["Déséquilibré","wrench"]; };
{ const _vc=vCompose; vCompose=function(){ let h=_vc(); const M=mixState(); if(!M.items.length) return h;
    const A=analyze(); if(!A) return h; const SC=labScore(A); if(SC.none) return h; // (1.64) sans note : pas de sous-scores (ni « 0 »)
    const rows=SC.goals.filter(g=>g[0]!=="gar").map(([k,n,v])=>{ const p=Math.round(v*100);
      return `<div class="lab-sub-s"><span>${esc(n)}</span><div class="ls-bar" role="img" aria-label="${esc(n)} : ${p} sur 100"><i class="${v>=0.85?"ok":v>=0.5?"mid":"ko"}" style="width:${p}%"></i></div><b>${p}</b></div>`; }).join("");
    return h.replace(/(<details class="lab-more"><summary>[\s\S]*?<\/summary><div class="card"[^>]*>)/,`$1<div class="lab-subs">${rows}</div><div class="sp16"></div>`); }; }

// ---------- Seuils qui dépendent du score (recalés sur la nouvelle échelle, mesurée par tests/m9.js) ----------
// Défis : niveau 1 ≈ la moitié des mélanges plausibles, niveau 2 ≈ un quart, niveau 3 ≈ un sur six, « La perfection » ≈ un sur douze.
// Les défis déjà réussis gardent leur score (S.chal) ; les trophées obtenus restent (S.tro, S.troT, S.tierSeen) ; S.labBest n'est pas recalculé.
const CHAL_MIN={ing:93,mini:94,long:93,light:93,swiss:94,red:94,zero:95,deco:95,bitter:95,strong:95,bubbles:95,mystery:96,five:96,perfect:97};
CHAL_T.forEach(t=>{ const mk=t.make; t.make=w=>{ const c=mk(w); if(CHAL_MIN[t.id]!=null) c.min=CHAL_MIN[t.id]; return c; }; });
{ const T=TROPHIES.find(t=>t[0]==="labpro"); if(T){ T[2]="Obtiens 96/100 au labo"; T[3]=96; } }
let LAB_FETE=95; // confettis et fanfare au service (avant : 85)
