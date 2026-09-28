// ================= 1.28 : identité visuelle =================
// Le logo de Zeste : une coupe dont le verre est une demi-rondelle d'agrume (le « zeste »), sur un fond ambré
// qui reprend la teinte de l'app. Une seule source SVG sert à l'écran de lancement, aux réglages, à « À propos »
// et à la carte Rewind ; l'icône d'écran d'accueil (apple-touch-icon.png) en est un rendu à 180 px.
const ZESTE_BRAND={orange:"#E0701F",deep:"#9E3B13",light:"#F7A03A",cream:"#FFF6E3",fruit:"#FFD447"};
function zesteMark(opt={}){
  const id="zm"+(++GID), r=opt.round===false?0:230, cls=opt.cls||"";
  return `<svg class="zmark ${cls}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"${opt.label?` role="img" aria-label="${esc(opt.label)}"`:` aria-hidden="true"`}>
  <defs><linearGradient id="${id}b" x1=".15" y1="0" x2=".85" y2="1"><stop offset="0" stop-color="#F7A03A"/><stop offset=".58" stop-color="#D5661F"/><stop offset="1" stop-color="#9E3B13"/></linearGradient>
  <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE266"/><stop offset="1" stop-color="#FFC93A"/></linearGradient>
  <clipPath id="${id}c"><rect width="1024" height="1024" rx="${r}"/></clipPath></defs>
  <g clip-path="url(#${id}c)"><g class="zm-tile"><rect width="1024" height="1024" fill="url(#${id}b)"/><rect width="1024" height="1024" fill="url(#${id}s)"/></g>
  <g class="zm-slice" transform="translate(512 318)"><g class="zm-fill"><path d="M-306 0A306 306 0 0 0 306 0Z" fill="#FFF6E3"/><path d="M-266 0A266 266 0 0 0 266 0Z" fill="url(#${id}f)"/></g>
  <g class="zm-seg" stroke="#FFF6E3" stroke-width="17" stroke-linecap="round"><path d="M0 18V236" pathLength="1"/><path d="M-22 16L-182 170" pathLength="1"/><path d="M22 16L182 170" pathLength="1"/></g>
  <path class="zm-rim" d="M-326 0H326" stroke="#FFF6E3" stroke-width="30" stroke-linecap="round"/></g>
  <path class="zm-stem" d="M512 622V770" stroke="#FFF6E3" stroke-width="32" stroke-linecap="round"/>
  <path class="zm-foot" d="M392 792H632" stroke="#FFF6E3" stroke-width="38" stroke-linecap="round"/>${opt.sheen?`<rect class="zm-sheen" x="-400" y="-100" width="260" height="1300" fill="#fff" opacity=".22" transform="skewX(-18)"/>`:""}</g></svg>`;
}
// Écran de lancement : le logo se construit (verre, agrume, pied), puis le nom apparaît.
function splash(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
  const el=document.createElement("div"); el.id="splash"; el.style.setProperty("--c",ZESTE_BRAND.orange);
  el.innerHTML=`<div class="sp-glow"></div><div class="sp-stage"><div class="sp-logo">${zesteMark({cls:"sp-mark",sheen:true})}</div><div class="sp-title">${"Zeste".split("").map((ch,k)=>`<span style="animation-delay:${.95+k*.06}s">${ch}</span>`).join("")}</div><div class="sp-sub">Ton bar, tes cocktails</div></div>`;
  document.body.appendChild(el);
  let gone=false;
  if(typeof SND!=="undefined") SND.jingleSplash(()=>!gone);
  const T=2200;
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
