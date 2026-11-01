// ================= ZESTE 1.67 : Labo — conseils vérifiés par la note ; plafonds adoucis ; prédiction — créations enregistrées =================
// Mesure (1.66, tests/m10.js) : le bouton « Ajouter X de Y » des conseils venait de l'ancien analyseur et faisait baisser la note du
// barème v3 dans 19 % des cas sur les recettes, 7,5 % sur les recettes dégradées, 18,5 % sur des mélanges au hasard (pire : −100).
// Désormais chaque correction proposée est notée par le vrai barème avant d'être affichée : un conseil chiffré fait toujours monter la note.

// ---------- notes d'un mélange candidat (sans toucher au mélange en cours) ----------
let LAB_EVAL=0;
function labEvalItems(items){ const bk=S.mix.items; S.mix.items=items; LAB_EVAL++;
  try{ const A=analyze(); if(!A) return null; const SC=labScore(A); return SC.none? null : {s:SC.score,raw:SC.raw}; }
  finally{ S.mix.items=bk; LAB_EVAL--; } }
const LAB_ACIDS=["citron_vert","citron"], LAB_LONG=["eau_gazeuse","soda","tonic","ginger_beer","ginger_ale"];
const r25=x=>Math.round(x/2.5)*2.5;
// corrections candidates : ajouter un acide, un sucre, la base, un allongeur (styles longs) ; réduire un ingrédient
function labFixCands(A){ const M=mixState(), it=M.items, st=A.st, base=baseOf(A.items), C=[];
  const inMix=f=>it.filter(i=>ING[i.id]&&f(ING[i.id],i.id)).map(i=>i.id);
  const pick=(own,pref)=>own[0]||pref.find(has)||pref[pref.length-1];
  const acid=pick(inMix((I,id)=>LAB_ACIDS.includes(id)),LAB_ACIDS.slice().sort((a,b)=>has(b)-has(a)));
  const sweet=pick(inMix(I=>I.cat==="sirop"),["sirop_sucre"]);
  [5,10,15,20].forEach(q=>C.push({k:"acid",id:acid,add:q}));
  [5,10,15].forEach(q=>C.push({k:"sweet",id:sweet,add:q}));
  if(base&&unitOf(base)==="ml") [10,15,20].forEach(q=>C.push({k:"base",id:base,add:q}));
  if(st==="long"||st==="spritz"){ const fz=pick(inMix(I=>I.fizz),LAB_LONG); [30,60,100].forEach(q=>C.push({k:"long",id:fz,add:q})); }
  it.forEach(i=>{ if(unitOf(i.id)!=="ml"||i.q<10) return; [0.75,0.5].forEach(f=>{ const q=Math.max(2.5,r25(i.q*f)); if(q<i.q) C.push({k:"less",id:i.id,set:q}); }); });
  return C.filter(c=>ING[c.id]); }
const applyFix=(items,c)=>{ const ex=items.find(i=>i.id===c.id);
  if(c.set!=null) return items.map(i=>i.id===c.id?{id:i.id,q:c.set}:i);
  return ex? items.map(i=>i===ex?{id:i.id,q:Math.round((i.q+c.add)*100)/100}:i) : items.concat([{id:c.id,q:c.add}]); };
let LAB_FIX={k:"",v:[]};
function labBestFixes(A){ const M=mixState();
  const key=JSON.stringify([M.items,M.m,M.g,M.gUser,M.ice,M.t]); if(LAB_FIX.k===key) return LAB_FIX.v;
  let out=[]; if(A){ const cur=labEvalItems(M.items.map(i=>({id:i.id,q:i.q})));
    if(cur&&cur.s<100){ const seen={};
      labFixCands(A).forEach(c=>{ const items=applyFix(M.items.map(i=>({id:i.id,q:i.q})),c);
        if(c.set==null&&!labFitsStrict(items)) return; const v=labEvalItems(items); if(!v) return;
        const g=v.s-cur.s; if(g<3) return; const k=c.k+c.id;
        if(!seen[k]||g>seen[k].g||(g===seen[k].g&&(c.add||0)<(seen[k].add||0))) seen[k]=Object.assign({},c,{g,s:v.s}); });
      out=Object.values(seen).sort((a,b)=>b.g-a.g||b.s-a.s).slice(0,2); } }
  LAB_FIX={k:key,v:out}; return out; }
const FIX_T={acid:"Plus d’acidité",sweet:"Un peu plus de sucre",base:"Renforce la base",long:"Allonge un peu",less:"Allège"};
const FIX_WHY={acid:"L’agrume réveille le mélange et équilibre le sucre.",sweet:"Une touche de sucre arrondit l’acidité.",base:"Le spiritueux se perd : renforce-le.",long:"Plus de bulles pour la fraîcheur.",less:"Cet ingrédient prend le dessus."};
// un conseil de réduction passe par mixfix avec une quantité négative (« Réduire à … » : q = nouvelle − actuelle)
function fixToDiag(c){ const ex=(S.mix.items.find(i=>i.id===c.id)||{q:0}).q; return {warn:1,t:FIX_T[c.k],why:FIX_WHY[c.k],fix:{id:c.id,q:c.set!=null? Math.round((c.set-ex)*100)/100 : c.add},gain:c.g}; }

// ---------- analyze : les conseils chiffrés de l'ancien analyseur sont remplacés par les corrections vérifiées ----------
{ const _an=analyze;
  analyze=function(){ const A=_an(); if(!A||LAB_EVAL||typeof labScore!=="function") return A;
    const F=labBestFixes(A), keep=A.diag.filter(d=>d.warn&&!d.fix);   // avertissements sans bouton : texte seul (ex. « Très fort »)
    const SC=labScore(A), ok=SC&&!SC.none&&SC.score>=85;
    const diag=F.map(fixToDiag).concat(ok? [] : keep).slice(0,2);
    A.diag=diag.length? diag : [{warn:0,t:"Bien équilibré",why:"Ton mélange tombe dans les proportions des recettes du même style."}];
    return A; }; }
// « Réduire » : quantité négative → nouvelle quantité (jamais sous 2,5 ml) ; « Ajouter » : versement normal (labPour)
{ const _fx=ACT.mixfix; ACT.mixfix=(d,t)=>{ const q=+d.q; if(!(q<0)) return _fx(d,t);
    const it=S.mix.items.find(i=>i.id===d.id); if(!it) return; it.q=Math.max(2.5,Math.round((it.q+q)*100)/100); LAB_SERVE=null; changed(); }; }
// rendu : le conseil de réduction s'affiche « Réduire le sirop à 10 ml » avec un « − »
if(typeof vCompose==="function"){ const _vc=vCompose; vCompose=function(){ let h=_vc();
  return h.replace(/(<div class="tip-r tip-one[^"]*">[\s\S]*?<span class="tip-t">)([^<]*)(<\/span><button class="btn small sec tip-b"[^>]*data-a="mixfix" data-id="([\w]+)" data-q="(-[\d.]+)"[^>]*>)[\s\S]*?(<\/button>)/g,(m,a,t,b,id,q,e)=>{
    const it=S.mix.items.find(i=>i.id===id); if(!it) return m; const nq=Math.max(2.5,Math.round((it.q+ +q)*100)/100);
    return a+esc("Réduire "+lcArt(id)+" à "+fmtQ({q:nq,u:unitOf(id)}))+b.replace(/aria-label="[^"]*"/,'aria-label="Réduire"')+lu("minus")+e; }); }; }
// fiche « Équilibre / Force » : mêmes corrections vérifiées (jamais un bouton qui fait baisser la note)
if(typeof goalAdvice==="function"){ const _ga=goalAdvice; goalAdvice=function(k){ const a=_ga(k); if(a.ok||(k!=="bal"&&k!=="abv")) return a;
  const F=labBestFixes(analyze());
  a.acts=F.map(c=>{ const d=fixToDiag(c), lab=d.fix.q<0? "Réduire "+lcArt(c.id)+" à "+fmtQ({q:c.set,u:unitOf(c.id)}) : "Ajouter "+fmtQ({q:c.add,u:unitOf(c.id)})+" "+de(lc(shortN(c.id))).replace(/^de /,"de ");
    return [lab,()=>ACT.mixfix({id:c.id,q:String(d.fix.q)})]; });
  return a; }; }

// ---------- plafonds d'équilibre adoucis (sauts ≥ 20 points à ±5 ml, verre non débordant : 0,6 % → 0,4 %) ----------
// Équilibre < 0,27 → 39 ; 0,27–0,33 → de 39 à 70 ; 0,33–0,55 → 70 ; 0,55–0,65 → de 70 à sans plafond. Débordement, éthanol et
// « sec sans alcool » gardent le plafond net de 39 (sécurité) (un verre ne déborde pas en versant : labPour s’arrête au bord).
{ const _ls=labScore; labScore=function(A){ const SC=_ls(A); if(!SC||SC.none||SC.Q==null) return SC;
  const bal=SC.goals[0][2], hard=(SC.why||[]).some(w=>w!=="équilibre"), u=SC.Q*SC.T, P=L3;
  let cap= bal<0.27? P.capR : bal<0.33? P.capR+(P.capB-P.capR)*(bal-0.27)/0.06 : bal<0.55? P.capB : bal<0.65? P.capB+(100-P.capB)*(bal-0.55)/0.10 : 100;
  if(hard) cap=Math.min(cap,P.capR);
  const raw=Math.min(u,cap); return Object.assign(SC,{raw, score: raw>=98-1e-9? 100 : Math.floor(raw+1e-9)}); }; }

// ---------- prédiction : une création enregistrée (non notée) est un signal de goût, et part avec le bonus d'un classique ----------
// réglé sur tests/m7.js CREA=1 (graine 1), validé graine 2 : NDCG à 3 notes 0,776 → 0,831, top 10 aimés 7,55 → 8,15 ; 30 notes : 0,949 → 0,951.
// Reste sous un favori (1,3 / 0,7) ; une note posée sur la création la remplace.
const CREA_SIG={v:1.0,w:0.5};
{ const _ts=trainSet; trainSet=function(){ const T=_ts();
    (S.custom||[]).forEach(c=>{ if(RMAP[c.id]&&!T[c.id]) T[c.id]={v:CREA_SIG.v,w:CREA_SIG.w}; }); return T; }; }
{ const _pr=predict; predict=function(r){ const v=_pr(r); if(!r||!r.mine||S.ratings[r.id]) return v;
    const M=getModel(); return Math.max(v+((M.ids.length||M.Q)? 0.11 : 0.22), 3+0.6*CREA_SIG.v); }; }   // plancher 3,6 : tu l'as gardée
