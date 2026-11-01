// ================= ZESTE 1.59 (G) : moteur de recommandation, réglé par simulation (tests/m6.js, tests/m7.js, tests/m5.js) =================
// Règle : réglé sur la graine 1, validé sur la graine 2 ; gardé seulement si la validation s'améliore sans dégrader le démarrage à froid (m5).
// RECO : réglages retenus (voir HANDOFF « Moteur de recommandation » pour les gains mesurés). Tout reste local, sans réseau.
const RECO={bias:0.5, biasK:5};
if(typeof process!=="undefined"&&process.env&&process.env.RECO) Object.assign(RECO,JSON.parse(process.env.RECO));   // banc de réglage uniquement
// --- prédiction : celle de core.js, avec la contribution réelle (explications) et le biais utilisateur ---
// Essayés et non retenus (aucun gain en validation, voir HANDOFF) : similarité IDF des ingrédients, ridge sur les ingrédients, centrage des notes.
predict=function(r){
  const M=getModel(); if(M.P[r.id]!=null) return M.P[r.id];
  const pp=(typeof POPIDX!=="undefined"&&POPIDX[r.id]!=null)?1-POPIDX[r.id]/POPULAR.length:0;
  const prior=(r.c?0.22:0)+(r.s?0.08:0)+pp*0.4/(1+M.n/3);
  if(!M.ids.length && !M.Q){ M.W[r.id]=null; return M.P[r.id]=3+prior; }
  let sw=0,sv=0,best=null,bc=0;
  M.ids.forEach(id=>{ if(id===r.id) return; const t=M.T[id]; const s=cos(fvec(r),fvec(RMAP[id])); const w=Math.pow(Math.max(0,s-0.5),2)*t.w; sw+=w; sv+=w*t.v; if(t.v>0.5&&w*t.v>bc){ bc=w*t.v; best=id; } });
  const knn=sw?sv/sw:0, kc=Math.min(1,sw*4);
  const sh=shares(r); let ing=0, topI=null, topV=0, lowI=null, lowV=0;
  for(const i in sh){ const a=M.IA[i]||0; ing+=sh[i]*a; if(a*sh[i]>topV){topV=a*sh[i];topI=i;} if(a*sh[i]<lowV){lowV=a*sh[i];lowI=i;} }
  const fam=M.FA[r.fam]||0, base=M.BA[baseGroup(r)]||0;
  const p=profileR(r), av=avgProfile(); let dims=0; for(let i=0;i<8;i++) dims+=M.DIR[i]*(p[i]-av[i]); dims*=4;
  if(M.Q&&M.Q.cream) dims+=M.Q.cream*((p[8]||0)-0.15)*1.6;
  const MW=mWeights(), hasIng=Object.keys(sh).some(i=>M.IA[i]!=null), wk=MW.knn*kc, wi=hasIng?MW.ing:0;
  const famb=0.55*fam+0.45*base*1.1;
  let vb=0, vbest=null; M.ids.forEach(id=>{ const t=M.T[id]; if(t.v>0.8&&RMAP[id].v.includes(r.id)){ vb+=t.v*t.w*0.4; if(!vbest||t.v>M.T[vbest].v) vbest=id; } }); vb=Math.min(0.8,vb);
  const den=wk+wi+MW.fam+MW.dims, dev=(wk*knn+wi*ing+MW.fam*famb+MW.dims*dims)/den*0.75+0.25*vb, conf=0.35+0.65*M.n/(M.n+4);
  let pred=3+1.85*Math.tanh(dev*1.15*conf)+prior*0.5;
  const RW=ridgeOf(M); if(RW){ const x=fvec(r); let s=0; for(let i=0;i<x.length;i++) s+=RW.W[i]*(x[i]-RW.mean[i]); pred=0.3*pred+0.7*(3+1.85*Math.tanh(s*1.1)); }
  // biais utilisateur (Koren 2009) : décalage de la moyenne de ses notes, rétrécie vers 3 (k pseudo-notes) ; MAE −0,010 à −0,022 en validation
  if(RECO.bias){ if(M.mu===undefined){ const R=rated(); M.nR=R.length; M.mu=R.length?(R.reduce((a,[,v])=>a+v,0)+RECO.biasK*3)/(R.length+RECO.biasK):3; } pred+=RECO.bias*(M.mu-3); }
  // contributions réelles, ramenées à la même échelle (pour l'explication « Parce que tu as aimé X »)
  const parts=[["knn",wk*knn/den*0.75],["ing",wi*ing/den*0.75],["fam",MW.fam*famb/den*0.75],["dims",MW.dims*dims/den*0.75],["var",0.25*vb]].sort((a,b)=>b[1]-a[1]);
  M.W[r.id]={top:parts[0][0],v:parts[0][1],best,topI:(M.IA[topI]||0)>0.35?topI:null,lowI:(M.IA[lowI]||0)<-0.5?lowI:null,vbest,raw:{knn:kc>0.05?knn:0,ing:hasIng?ing:0,fam:famb,dims}};
  return M.P[r.id]=pred;
};
// --- « N % pour toi » : probabilité d'aimer (≥ 4 étoiles), régression logistique sur la prédiction (Platt 1999),
// ajustée sur la graine 1 de tests/m7.js et validée sur la graine 2 : Brier 0,194 → 0,157, écart de calibration 0,175 → 0,009.
// Plafond 95 % tant qu'il y a moins de 15 notes, jamais 100 %.
const LIKE_W=[-0.99,1.731,0.18], LIKE_RATED={5:0.97,4:0.85,3:0.3,2:0.08,1:0.03};
function likeProb(r){ const M=getModel(); if(M.nR===undefined) M.nR=rated().length; const nR=M.nR, cap=nR<15?0.95:0.99, rt=S.ratings[r.id];
  if(rt) return Math.min(cap,LIKE_RATED[rt]||0.5);
  const d=predict(r)-3, n=nR+(S.quiz?3:0), z=LIKE_W[0]+LIKE_W[1]*d+LIKE_W[2]*d*Math.log1p(n);
  return Math.max(0.02,Math.min(cap,1/(1+Math.exp(-z)))); }
matchPct=function(r){ return Math.round(100*likeProb(r)); };
// --- listes (Aujourd'hui, Pour ce soir) : faisables d'abord, diversité MMR (Carbonell & Goldstein 1998) sur une distance
// ingrédients + famille + spiritueux de base, pénalité sur les 3 derniers préparés, créneau découverte = incertain mais probablement aimé ---
const ingKeys=r=>r._ik||(r._ik=new Set(r.ing.filter(i=>!ING[i.id].basic).map(i=>i.id)));
function recSim(a,b){ const A=ingKeys(a),B=ingKeys(b); let n=0; A.forEach(x=>{ if(B.has(x)) n++; }); return 0.5*n/((A.size+B.size-n)||1)+0.25*(a.fam===b.fam?1:0)+0.25*((a._bg||(a._bg=baseGroup(a)))===(b._bg||(b._bg=baseGroup(b)))?1:0); }
// (1.60) fatigue : suggéré 3 fois sans être ouvert → pénalité 0,35 qui s'efface (demi-vie de 2 jours depuis la dernière apparition)
function fatigueOf(hl){ const d=Math.max(...hl.map(h=>h.d)), s=String(d), t=new Date(+s.slice(0,4),+s.slice(4,6)-1,+s.slice(6,8)).getTime(), days=Math.max(0,(Date.now()-t)/864e5); return 0.35*Math.pow(0.5,days/2); }
function lastMadeIds(k){ const out=[]; for(let i=S.hist.length-1;i>=0&&out.length<k;i--){ const id=S.hist[i].id; if(!out.includes(id)) out.push(id); } return out; }
if(RECO.mmr==null) RECO.mmr=0.75;
tonightRaw=function(){
  const now=Date.now(), c=ctxInfo(), seed=daySeed()+"-"+c.moment, EX=S.settings.explore!=null?S.settings.explore:1, useCtx=S.settings.ctx!==false;
  const NOV=[0.05,0.25,0.5][EX], RND=[0.3,0.5,0.75][EX], SK=S.skips||{}, last3=lastMadeIds(3);
  const naOk=S.settings.na||rated().some(([id,rt])=>RMAP[id].na&&rt>=4);
  const cand=RECS.filter(r=>status(r).ok&&(naOk||!r.na)).map(r=>{ const lm=lastMade(r.id), rt=S.ratings[r.id];
    const hl=(S.heroLog||[]).filter(h=>h.id===r.id), today=daySeed(), recentHero=hl.some(h=>h.d!==today&&h.d>=today-2), fatigue=hl.length>=3&&!(S.opens||{})[r.id]&&!madeCount(r.id)?fatigueOf(hl):0;
    const sk=SK[r.id]&&now-SK[r.id].t<14*864e5?Math.min(0.45,0.15*SK[r.id].n):0, rep=last3.includes(r.id)||now-lm<3*864e5;
    let sc=(rt? rt-(EX===0?0.2:0.45) : predict(r))+(useCtx?ctxBonus(r,c):0)+hrand(r.id+seed)*RND+(madeCount(r.id)?0:NOV)-sk-(rep?1.2:0)-(rt&&rt<=2?1.5:0)+(freshBottle(r)?0.3:0)+(typeof perishing==="function"?(p=>p?(p[2]<=4?0.45:0.18):0)(perishing(r)):0)-(recentHero?0.35:0)-fatigue;
    return [r,sc]; }).sort((a,b)=>b[1]-a[1]);
  const pool=cand.slice(0,40), out=[], L=RECO.mmr;
  while(pool.length && out.length<14){ let bi=0,bv=-1e9;
    pool.forEach(([r,sc],k)=>{ const red=out.length? Math.max(...out.map(o=>recSim(r,o))) : 0; const v=L*sc-(1-L)*4*red; if(v>bv){bv=v;bi=k;} });
    out.push(pool.splice(bi,1)[0][0]); }
  EXPLORE=new Set(); const M=getModel();
  const slots=[[],[3],[2,5]][EX];
  if(M.ids.length>=2 && out.length>=6 && slots.length){ const known=M.ids.map(id=>RMAP[id]);
    const exs=cand.map(x=>x[0]).filter(r=>!out.slice(0,2).includes(r)&&!madeCount(r.id)&&!S.ratings[r.id]&&likeProb(r)>=0.5).map(r=>{ const u=1-Math.max(...known.map(k=>recSim(r,k))); return [r,u,u*likeProb(r)]; }).filter(x=>x[1]>=0.45).sort((a,b)=>b[2]-a[2]);
    slots.forEach((pos,k)=>{ const ex=exs[k]; if(!ex) return; const i=out.indexOf(ex[0]); if(i>=0) out.splice(i,1); out.splice(pos,0,ex[0]); EXPLORE.add(ex[0].id); }); }
  return out.concat(pool.map(x=>x[0]), cand.slice(40).map(x=>x[0]));
};
// --- achats malins : classés par gain attendu = somme des probabilités d'aimer des cocktails que la bouteille rend faisables ---
if(RECO.buy==null) RECO.buy=1; if(RECO.buyE==null) RECO.buyE=2;   // somme des P(aimer)² : top 1 juste 0,533 → 0,567 en validation (somme simple : 0,517)
{ const _br=bottleRecsRaw; bottleRecsRaw=function(){ if(!RECO.buy) return _br();
  const cand={}; RECS.forEach(r=>{ const st=status(r); if(st.miss.length===1&&!(S.ratings[r.id]<=2)){ const m=st.miss[0]; (cand[m]=cand[m]||[]).push(r); } });
  return Object.entries(cand).map(([id,rs])=>({id, rs:rs.sort((a,b)=>likeProb(b)-likeProb(a)), v:rs.reduce((a,r)=>a+Math.pow(likeProb(r),RECO.buyE||1),0)})).sort((a,b)=>b.v-a.v); }; }
// --- « Surprends-moi » : tirage pondéré parmi les 15 meilleurs faisables non préparés récemment, jamais un cocktail noté 2 ou moins ---
function surprisePool(){ const now=Date.now(), last3=lastMadeIds(3), ok=r=>!(S.ratings[r.id]<=2)&&!last3.includes(r.id)&&now-lastMade(r.id)>=3*864e5;
  const L=tonight().filter(ok).slice(0,15); return L.length? L : RECS.filter(ok); }
roulette=function(){ RL={L:surprisePool(),pick:null}; $("#overlay").classList.add("open"); spin(); };
// --- explications : la contribution réelle la plus forte ; sous le seuil, aucune explication plutôt qu'une phrase générique ---
const WHY_MIN=0.1;
reasons=function(r){
  const rt=S.ratings[r.id]; if(rt>=5) return "Un de tes coups de cœur"; if(rt===4) return "Tu l’as beaucoup aimé";
  const fb=freshBottle(r); if(fb){ const n=lc(shortN(fb)); return "Pour étrenner "+(/^[aeiouyéèêàâîïôœ]/i.test(n)?"ton ":FEM.test(n)?"ta ":"ton ")+n; }
  if(EXPLORE.has(r.id)) return "Pour sortir un peu de ta zone de confort";
  predict(r); const W=getModel().W[r.id]; if(!W||W.v<WHY_MIN) return "";
  if(W.top==="var"&&W.vbest) return "Une variante du "+RMAP[W.vbest].n+", que tu adores";
  if(W.top==="knn"&&W.best) return "Parce que tu as aimé "+RMAP[W.best].n;
  if(W.top==="ing"&&W.topI) return "Tu aimes "+lcArt(W.topI)+", et il y en a dedans";
  return ""; };
// --- « bientôt à racheter » : autonomie de chaque bouteille, ≈ N verres (niveau × contenance ÷ dose moyenne), les plus urgentes d'abord ---
function glassesLeft(id){ const cap=((S.price||{})[id]&&S.price[id].v)||DEFVOL[ING[id].cat]||700; const d=[]; RECS.forEach(r=>r.ing.forEach(i=>{ if(i.id===id&&i.r!=="opt"){ const m=mlOf(i); if(m>0) d.push(m); } }));
  const dose=d.length? d.reduce((a,b)=>a+b,0)/d.length : 45; return Math.floor((S.stock[id]||0)/4*cap/dose); }
{ const _lv=lowView; lowView=function(ids){ let h=_lv(ids);
    h=h.replace(/(<button class="low-b" data-a="ing" data-id="([\w]+)">[\s\S]*?<b>[^<]*<\/b><span>)\d+ recettes? l’utilisen?t?(<\/span>)/g,(m,a,id,b)=>{ const n=glassesLeft(id); return a+(n>0?"≈ "+n+" verre"+(n>1?"s":""):"Plus de quoi faire un verre")+b; });
    // tri par urgence (moins de verres d'abord) à l'intérieur de chaque niveau
    return h.replace(/(<div class="group">)((?:<div class="row low-row">[\s\S]*?<\/div>)+)(<\/div>)/g,(m,a,rows,b)=>{ const R=rows.split(/(?=<div class="row low-row">)/); R.sort((x,y)=>glassesLeft(x.match(/data-id="([\w]+)"/)[1])-glassesLeft(y.match(/data-id="([\w]+)"/)[1])); return a+R.join("")+b; }); }; }
