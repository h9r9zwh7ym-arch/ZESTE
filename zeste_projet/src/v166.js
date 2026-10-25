// ================= 1.62 (B) : barème du Labo v3 =================
// Équilibre et Force portent la qualité : Q = 100·(0,6·Équilibre + 0,4·Force).
// Remplissage et Glace ne font que réduire : T = (0,8 + 0,2·Remplissage)·(0,75 + 0,25·Glace), entre 0,6 et 1. Score = Q·T.
// Équilibre : distance hors de la plage du style (P10–P90 des recettes de l'app) pour le sucre, l'acidité et le sucre attendu
//   d'après l'acidité, l'amertume et le degré ; distance en demi-largeurs de plage, exp(-½·d²) : à 3 écarts, ≈ 0.
// Force : distance du degré à la plage du style, et dose d'éthanol pur par verre au-delà du 95e centile des recettes IBA.
// Rédhibitoires (total sous 40) : Équilibre < 0,30, volume au-delà de 135 % de la contenance effective, éthanol > 1,5 × P95 IBA.
// Équilibre < 0,60 : 70 au plus. Moins de deux rôles différents (base, acide, sucre, mélangeur, amer, liqueur) : pas de note.
// Réglé sur tests/m9.js (graine 1), validé sur la graine 2.
const ETH_IBA={med:23.7,p95:32.6};   // éthanol pur par verre (ml) sur les recettes IBA, mesuré par tests/m9.js
const L3={tol:0.25,sb:1.1,wRes:0.5,wS:1,wA:0.5,wAbv:0.25,wBit:1,wSt:1,st0:3,st1:0,bitH:0.02,sf:1.5,se:0.5,flo:0.25,slo:0.12,ovf:1.35,capR:39,capB:70,wQ:0.6};
function labRole(id){ const i=ING[id]; if(!i) return null;
  if(i.cat==="spirit") return "base"; if(i.ac>3) return "acide";
  if(i.cat==="sirop"||(i.cat==="frais"&&i.sug>=40)||["sucre","sucre_poudre","sucre_vanille","miel"].includes(id)) return "sucre";
  if(i.cat==="amaro"||i.cat==="bitters"||["espresso","cafe","crodino","sanbitter"].includes(id)) return "amer";
  if(i.cat==="liqueur"||i.cat==="vin") return "liqueur";
  if(i.cat==="soft"||i.cat==="jus"||["eau","lait","creme","the_froid","saumure","tomate"].includes(id)) return "melangeur";
  return null; }
// rôles pour « au moins deux rôles » : sans spiritueux, l'ingrédient alcoolisé le plus abondant tient lieu de base (Kir, Panaché, B52)
// un mélangeur sous 15 % du volume ne compte pas comme rôle (1 cl de jus dans 10 cl de whisky)
function labRoles(items){ const V=items.reduce((a,i)=>a+mlOf(i),0)||1; const r=items.map(i=>{ const x=labRole(i.id); return x==="melangeur"&&mlOf(i)<0.15*V? null : x; });
  if(!r.includes("base")){ let k=-1,mx=0; items.forEach((it,j)=>{ const v=mlOf(it); if((ING[it.id].abv||0)>0&&v>mx){ mx=v; k=j; } }); if(k>=0) r[k]="base"; }
  return new Set(r.filter(Boolean)); }
function labRoleKey(items){ return [...new Set(items.map(i=>labRole(i.id)).filter(Boolean))].sort().join("+"); }
function labBitShare(items,pre){ return items.filter(i=>ING[i.id].cat==="bitters").reduce((a,i)=>a+mlOf(i),0)/Math.max(1,pre); }
function labEthanol(items){ return items.reduce((a,it)=>a+mlOf(it)*(ING[it.id].abv||0)/100,0); }
let LAB_REF3=null, LAB_REF3_FOR=null;
function labRef3(){ if(LAB_REF3&&LAB_REF3_FOR===RECS) return LAB_REF3;
  const R0=labRef(), by={};
  RECS.filter(r=>!r.mine&&r.m!=="hot").forEach(r=>{ const P=labPrep(r);
    const items=P.items.map(it=>({id:it.id,q:it.q,u:unitOf(it.id),r:ING[it.id].fizz&&P.m!=="build"?"top":""})); if(!items.length) return;
    const met=calc(items,P.m,P.ice), st=labStyleT(items,P.m,P.t), F=labFeat(st,met,profileOf(items,met)[2]), w=R0[st].w;
    (by[st]=by[st]||[]).push({ls:F.ls,la:Math.log(met.acid+0.05),res:F.ls-dot(w,F.X),abv:met.abv,bit:labBitShare(items,met.pre),rk:labRoleKey(items)}); });
  const pl=v=>v.length? [q(v,.1),q(v,.9)] : [0,1], R={};
  for(const st in by){ const L=by[st]; const rk={}; L.forEach(f=>{ rk[f.rk]=(rk[f.rk]||0)+1; });
    R[st]={ls:pl(L.map(f=>f.ls)),la:pl(L.map(f=>f.la)),res:pl(L.map(f=>f.res)),abv:pl(L.filter(f=>f.abv>=0.5).map(f=>f.abv)),bit:[0,q(L.map(f=>f.bit),.9)],rk}; }
  LAB_REF3_FOR=RECS; return LAB_REF3=R; }
// distance hors plage, en demi-largeurs de plage (0 dans la plage)
function plageD(x,p){ const h=Math.max((p[1]-p[0])/2,1e-3); return x<p[0]? (p[0]-x)/h : x>p[1]? (x-p[1])/h : 0; }
labScore=function(A){
  const M=mixState(), {g,ice}=labGlass(), items=mixItems(), st=A.st, met=A.met, roles=labRoles(items), G0=labGarS(items,M.gar);
  const avail=labAvail(g,ice), fill=met.vol/avail, shot=M.t==="shot";
  if(roles.size<2) return {none:true, score:null, raw:0, red:false, goals:[["bal","Équilibre",0,0],["abv","Force",0,0],["fill","Remplissage",1,0],["ice","Glace",1,0],["gar","Décor (bonus)",G0.v,0]], fill, avail, sug:G0.sug, eth:labEthanol(items)};
  const R0=labRef(), R3=labRef3(), r0=R0[st]||R0.sour, r3=R3[st]||R3.sour, acid=LAB_ACID.has(st), P=L3;
  const F=labFeat(st,met,profileOf(items,met)[2]), res=F.ls-dot(r0.w,F.X), la=Math.log(met.acid+0.05);
  // (1.70) highball ou spritz sec (allongé surtout au pétillant, sucre sous la plage : Whisky highball, Gin rickey, Ranch water, Gespritzter) :
  // le manque de sucre n'est pas un déséquilibre ; l'excès d'acidité reste compté (dA)
  const fzV=items.filter(i=>ING[i.id].fizz).reduce((a,i)=>a+mlOf(i),0), dryLong=(st==="long"||st==="spritz")&&fzV>=0.5*(met.pre||1)&&F.ls<r3.ls[0];
  const dRes=dryLong?0:plageD(res,r3.res), dS=dryLong?0:plageD(F.ls,r3.ls), dA=acid? plageD(la,r3.la) : Math.max(0,la-r3.la[1])/Math.max((r3.la[1]-r3.la[0])/2,1e-3);
  const alc0=met.abv>=0.5, dAbv=alc0? plageD(met.abv,r3.abv) : 0, bit=labBitShare(items,met.pre), dBit=Math.max(0,bit-r3.bit[1])/P.bitH;
  const nk=r3.rk[labRoleKey(items)]||0, dSt= nk>=2? 0 : nk===1? P.st1 : P.st0;
  const t=x=>Math.max(0,x-P.tol), D2=P.wRes*t(dRes)**2+P.wS*t(dS)**2+P.wA*t(dA)**2+P.wAbv*t(dAbv)**2+P.wBit*dBit*dBit+P.wSt*dSt*dSt, bal=Math.exp(-0.5*D2/(P.sb*P.sb));
  const alc=met.abv>=0.5, eth=labEthanol(items);
  let abv; if(shot) abv=1; else if(!alc) abv= st==="stirred"? 0 : 1;
  else { const dF=Math.max(0,plageD(met.abv,r3.abv)-P.tol), x=Math.max(0,eth-ETH_IBA.p95)/(0.5*ETH_IBA.p95); abv=Math.exp(-0.5*(dF/P.sf)*(dF/P.sf))*Math.exp(-0.5*(x/P.se)*(x/P.se)); }
  const fillS= fill>P.ovf? 0 : fill>1+1e-6? Math.max(0,1-(fill-1)/(P.ovf-1)*0.6) : fill<P.flo? Math.exp(-0.5*Math.pow((P.flo-fill)/P.slo,2)) : 1;
  let iceS=1; if(ice!=="none"&&["coupe","martini","flute","shot"].includes(g)) iceS=0.3; if(st==="long"&&ice==="none") iceS=0.5;
  if(["sour","stirred","cremeux"].includes(st)&&["highball","vin","mug"].includes(g)&&ice==="none") iceS=0.4; if(shot) iceS=g==="shot"&&ice==="none"?1:0.3;
  const Q=100*(P.wQ*bal+(1-P.wQ)*abv), T=(0.8+0.2*fillS)*(0.75+0.25*iceS); let raw=Q*T;
  const why=[]; if(bal<0.30) why.push("équilibre"); if(fill>P.ovf) why.push("débordement"); if(eth>1.5*ETH_IBA.p95) why.push("éthanol"); if(st==="stirred"&&!alc&&!shot) why.push("sans alcool");
  if(why.length) raw=Math.min(raw,P.capR); else if(bal<0.60) raw=Math.min(raw,P.capB);
  const goals=[["bal","Équilibre",bal,60],["abv","Force",abv,40],["fill","Remplissage",fillS,0],["ice","Glace",iceS,0],["gar","Décor (bonus)",G0.v,0]];
  return {score: raw>=98-1e-9? 100 : Math.floor(raw+1e-9), raw, red:why.length>0, why, goals, fill, avail, sug:G0.sug, eth, Q, T, dbg:{res:dRes,s:dS,a:dA,abvD:dAbv,bit:dBit,stD:dSt,nk,iceS,fillS,fill,eth,alc,shot,acid,ov:fill>P.ovf}}; };

// ---------- Cohérence (5) : jauge de remplissage = sous-score Remplissage ; verdict = sous-scores ----------
// Jauge : verte si Remplissage ≥ 0,70, orange entre 0,40 et 0,70, rouge sous 0,40 (au-delà de 135 % : débordement).
// Le rouge « refusé » d'un versement impossible (.shake-no) ne dure que le temps de l'animation.
function labFillClass(v){ return v>=0.7? "" : v>=0.4? "mid" : "bad"; }
{ const _vc=vCompose; vCompose=function(){ let h=_vc(); const M=mixState(); if(!M.items.length) return h;
    const A=analyze(); if(!A) return h; const SC=labScore(A), f=SC.goals.find(g=>g[0]==="fill"), v=SC.none? 1 : f[2];
    h=h.replace('class="lab-stage over','class="lab-stage');
    if(!SC.none&&SC.fill>L3.ovf) h=h.replace('class="lab-stage','class="lab-stage over');
    return h.replace(/<div class="lab-gbar"><i /,`<div class="lab-gbar"><i class="${labFillClass(v)}" `); }; }
{ const clear=()=>setTimeout(()=>{ const el=document.querySelector(".lab-stage"); if(el) el.classList.remove("shake-no"); },600);
  const _o=labOverflow; labOverflow=function(){ const r=_o.apply(this,arguments); clear(); return r; };
  const _n=labNope; labNope=function(){ const r=_n.apply(this,arguments); clear(); return r; }; }
// Verdict : « À améliorer » = les sous-scores sous 70 (Équilibre, Force, Remplissage, Glace), rien d'autre
labSummary=function(A,SC){ const p=profileOf(A.items,A.met), av=avgProfile();
  const top=p.slice(0,8).map((v,i)=>[v-av[i],i]).sort((a,b)=>b[0]-a[0]).slice(0,2).map(x=>DIMS[x[1]].toLowerCase());
  const weak=(SC.goals||[]).filter(x=>x[0]!=="gar"&&x[2]<0.7).map(x=>x[1].toLowerCase());
  return "Plutôt "+joinFr(top)+"."+(weak.length?" À améliorer : "+joinFr(weak)+".":""); };
// Pas de note sans deux rôles : on ne sert pas, on le dit
{ const _s=ACT.mixserve; ACT.mixserve=(d,t)=>{ const M=mixState(); if(M.items.length){ const A=analyze(); if(A&&labScore(A).none){ toast("Ajoute un second ingrédient"); return; } } return _s(d,t); }; }
{ const _c=chalCheck; chalCheck=function(c,A,SC){ return _c(c,A,SC&&SC.none? Object.assign({},SC,{score:-1}) : SC); }; }
