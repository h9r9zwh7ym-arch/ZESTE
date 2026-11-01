// ================= 1.29 : identité visuelle « le ruban » =================
// Le logo de Zeste : un ruban d'écorce levé d'un geste, qui dessine un Z. Il se vrille à chaque angle et montre sa
// face intérieure, couleur citron ; un liseré clair sous l'écorce rappelle l'épaisseur du zeste. Une seule source
// sert à l'écran de lancement, aux réglages, à « À propos », à l'accueil du premier lancement et à la carte Rewind ;
// assets/zeste-logo.svg et les icônes PNG en sont des rendus.
const ZESTE_BRAND={leaf:"#1F5A3D",leafDeep:"#174731",zest:"#F5C518",cream:"#F7F1E3",ink:"#1F2A22"};
const ZR={
  top:"M15.1 30.2C22 28.2 29.2 30.2 36 31.3C43.9 32.2 51.7 33.7 59.6 33.6C68.2 33.4 77.1 30.9 83.5 24.9L82.5 23.1C75.3 24.6 67.9 22.8 60.8 21.5C52.9 20.2 44.9 18.9 36.9 18.9C28.5 19.3 19.9 22.9 14.9 29.8Z",
  dia:"M82.4 23.5C74.3 26 67.1 31.2 59.8 35.4C51.4 40.6 43.4 46.3 35.9 52.7C28.8 59.3 20.9 66.2 17.4 75.4L18.6 76.6C27.3 73.5 35.2 67.9 43.2 63.3C51.6 58.1 59.7 52.4 67.1 45.9C73.5 39.8 81.1 33.4 83.6 24.5Z",
  bot:"M18.5 76.9C25.6 75.1 32.9 76.6 39.9 78C47.4 79.4 55 80.8 62.6 80.8C71.1 80.6 79.6 76.8 85.1 70.2L84.9 69.8C77.8 71.7 70.6 69.8 63.7 68.5C56.2 67.5 48.7 65.9 41.2 66C32.5 66.1 23.8 69.1 17.5 75.1Z"
};
// Le ruban seul (sans fond), à placer dans un viewBox 0 0 100 100. `pith:false` retire le liseré (petites tailles).
function zesteRibbon(bar,diag,pith){
  return `${pith===false?"":`<g class="zr-pith" transform="translate(.6 1.8)" fill="${pith||diag}"><path d="${ZR.top}"/><path d="${ZR.bot}"/></g>`}<path class="zr-top" d="${ZR.top}" fill="${bar}"/><path class="zr-bot" d="${ZR.bot}" fill="${bar}"/><path class="zr-dia" d="${ZR.dia}" fill="${diag}"/>`;
}
// zesteMark : l'icône (carré vert arrondi) ou, avec {bare:true}, le ruban seul.
function zesteMark(opt={}){
  const id="zm"+(++GID), cls=opt.cls||"", a=opt.label?` role="img" aria-label="${esc(opt.label)}"`:` aria-hidden="true"`;
  if(opt.bare) return `<svg class="zmark bare ${cls}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"${a}>${zesteRibbon(opt.bar||ZESTE_BRAND.cream,ZESTE_BRAND.zest,opt.pith)}</svg>`;
  const r=opt.round===false?0:22.4;
  return `<svg class="zmark ${cls}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"${a}><defs><linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#236846"/><stop offset="1" stop-color="${ZESTE_BRAND.leafDeep}"/></linearGradient></defs><rect width="100" height="100" rx="${r}" fill="url(#${id}b)"/><g transform="translate(50 50) scale(.82) translate(-50 -50)">${zesteRibbon(ZESTE_BRAND.cream,ZESTE_BRAND.zest)}</g></svg>`;
}
// Écran de lancement : sur le vert de la marque, la barre du haut se déroule, la diagonale se retourne,
// la barre du bas se pose, puis le nom apparaît.
function splash(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
  const el=document.createElement("div"); el.id="splash";
  el.innerHTML=`<div class="sp-stage"><div class="sp-logo">${zesteMark({bare:true,cls:"sp-mark"})}</div><div class="sp-title">${"zeste".split("").map((ch,k)=>`<span style="animation-delay:${.72+k*.06}s">${ch}</span>`).join("")}</div><div class="sp-sub">Ton bar, tes cocktails</div></div>`;
  document.body.appendChild(el);
  let gone=false;
  if(typeof SND!=="undefined") SND.jingleSplash(()=>!gone);
  const T=2000;
  const out=()=>{ if(gone) return; gone=true; el.classList.add("out"); HERO_LAST=null; dirty.today=1; if(TAB==="today") renderView("today"); setTimeout(()=>el.remove(),600); };
  el.addEventListener("click",out); setTimeout(out,T); return T;
}

// ---------- Premier lancement : un vrai accueil avant le quiz ----------
const _openQuizIntro=openQuiz;
openQuiz=function(){ _openQuizIntro(); if(!S.quiz&&!S.quizIntro){ QZ.i=-1; paintQuiz(); } };
const _paintQuizIntro=paintQuiz;
paintQuiz=function(){
  if(!QZ||QZ.i!==-1) return _paintQuizIntro();
  const pts=[[IC.coupe,"Des recettes vérifiées","Plus de 360 cocktails, avec ce que tu as vraiment chez toi."],[IC.sparkle,"Des idées qui te ressemblent","Chaque note affine les suggestions."],[IC.flask,"Un labo pour créer","Compose, goûte, ajuste : l’app t’aide à équilibrer."]];
  $("#overlay").innerHTML=`<div class="ov-top"><div></div><div></div><button class="link" data-a="qzskip" style="font-size:calc(15rem / 17)">Passer</button></div>
  <div class="ov-body qz-intro"><div class="qi-logo">${zesteMark({label:"Logo Zeste"})}</div><h1 class="qi-t">Bienvenue dans Zeste</h1><p class="qi-s">Ton bar, tes cocktails.</p>
  <div class="qi-pts">${pts.map(([ic,t,d],k)=>`<div class="qi-pt" style="animation-delay:${.25+k*.1}s"><span class="qi-ic">${ic}</span><div><b>${t}</b><span>${d}</span></div></div>`).join("")}</div></div>
  <div class="ov-bottom"><button class="btn" data-a="qzintro">Faire connaissance</button></div><p class="qi-f">9 questions, environ une minute</p>`;
};
Object.assign(ACT,{ qzintro:()=>{ S.quizIntro=1; QZ.i=0; QZ.dir="fwd"; paintQuiz(); } });
