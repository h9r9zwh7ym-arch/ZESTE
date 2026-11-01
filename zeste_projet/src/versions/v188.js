// ================= ZESTE 1.86 : vague à « Préparer », paysage et encoche =================
// 1. Toucher « Préparer » : un liquide de la couleur du cocktail monte depuis le bas avec une surface ondulée (deux
//    vagues décalées), remplit l'écran, puis s'écoule par le haut en révélant le mode préparation. ~0,9 s au total ;
//    coupé par « Réduire les animations » (FX("live")). Le mode préparation s'ouvre pendant que l'écran est couvert.
// 2. Paysage : la scène du Labo se colle sous la barre de titre (et plus dessous) ; mode préparation, vues et
//    mini-verre respectent l'encoche sur les côtés (CSS, bloc « 1.86 »).
function waveSweep(col,mid){ if(!(typeof FX==="function"&&FX("live"))||REDUCED.matches){ mid(); return; }
  const light=mix(col,"#ffffff",.22);
  // une vague : surface ondulée sur 120 px (largeur 200 %, défilée en boucle), remplie jusqu'en bas du SVG
  const wave=(amp,len,y)=>{ let d=`M0 ${y}`; for(let x=0;x<2400;x+=len) d+=` q${len/4} ${-amp} ${len/2} 0 t${len/2} 0`; return d+` V120 H0Z`; };
  const svg=cls=>`<svg class="${cls}" viewBox="0 0 2400 120" preserveAspectRatio="none"><path class="w1" d="${wave(22,300,52)}" fill="${light}"/><path class="w2" d="${wave(30,400,66)}" fill="${col}"/></svg>`;
  const el=document.createElement("div"); el.className="wave-sweep"; el.setAttribute("aria-hidden","true");
  el.innerHTML=svg("ws-top")+`<div class="ws-body" style="background:${col}"></div>`+svg("ws-bot");
  document.body.appendChild(el);
  if(typeof SND!=="undefined"&&SND.pour) try{ SND.pour(0.9); }catch(e){}
  void el.getBoundingClientRect(); el.classList.add("up");
  // l'écran est couvert : on ouvre dessous, sans le fondu d'entrée habituel (la vague fait la transition)
  setTimeout(()=>{ const ov=document.getElementById("overlay"); if(ov) ov.classList.add("no-in"); try{ mid(); }catch(e){} el.classList.add("out"); setTimeout(()=>ov&&ov.classList.remove("no-in"),700); },540);
  setTimeout(()=>el.remove(),1250); }
{ const g=ACT.barmode; if(g) ACT.barmode=(d,t)=>{ const r=RMAP[d&&d.id]; if(!r) return g(d,t); if(document.querySelector(".wave-sweep")) return; /* double toucher : une seule vague */ closeAll(); waveSweep(/^#[0-9a-f]{6}$/i.test(r.col||"")?r.col:"#1F5A3D",()=>g(d,t)); }; }
