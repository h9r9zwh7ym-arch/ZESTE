// ================= ZESTE 1.52 : fiche recette — doublons retirés, structure, en-tête (rendu seulement) =================
function divEnd(h,start){ let i=start, d=0; const re=/<div\b|<\/div>/g; re.lastIndex=start;
  for(let m;(m=re.exec(h));){ if(m[0]==="</div>"){ d--; if(d===0) return m.index+6; } else d++; } return -1; }
function recPolish(o){ let b=o.body; const id=(b.match(/data-a="rate" data-id="([^"]+)"/)||[])[1], r=id&&RMAP[id]; if(!r) return o;
  // le manque se lit sur la ligne de l'ingrédient (pastille « Manque ») : pas de bannière en plus
  b=b.replace(/<div class="status no">[\s\S]*?<\/span><\/div>/,"");
  b=b.replace(/<span class="badge red">Manque<\/span>/g,'<span class="badge warn">Manque</span>');
  // « N % pour toi » en tête du bandeau (à la place du verre), et plus sous les étoiles
  if(hasTaste()){ const pct=`<div><b>${matchPct(r)} %</b><span>pour toi</span></div>`;
    b=b.replace(/<div class="facts">([\s\S]*?)<div><b>[^<]*<\/b><span>verre<\/span><\/div><\/div>/,(m,rest)=>`<div class="facts">${pct}${rest}</div>`);
    b=b.replace(/<b style="color:var\(--tint\);font-family:var\(--rounded\);font-size:calc\(17rem \/ 17\)">\d+ %<\/b><br>pour toi/,"Pas encore noté"); }
  // ingrédients : une ligne par ingrédient, sans en-têtes de catégorie
  b=b.replace(/<div class="ing-sec">[\s\S]*?<\/div>/g,"");
  // Ta version : sans sous-titre ; « Modifier dans le labo » en dernière ligne de la carte
  b=b.replace(/<div class="sh-sub">Les quantités suivent[^<]*<\/div>/,"");
  const lab=b.match(/<div class="sp16"><\/div><div class="group">(<button class="row tap" data-a="tolab"[\s\S]*?<\/button>)<\/div>/), a0=b.indexOf('<div class="card adj">');
  if(lab&&a0>=0){ b=b.replace(lab[0],""); const e=divEnd(b,a0); if(e>0) b=b.slice(0,e-6)+lab[1].replace('class="row tap"','class="row tap adj-lab"')+b.slice(e-6); }
  // profil de goût : une mini-légende au lieu de la phrase
  b=b.replace(/<div style="margin-top:8px;font-size:calc\(12rem \/ 17\)">La ligne pointillée montre la moyenne de la carte\.<\/div>/,
    '<div class="rad-key"><svg width="22" height="6" aria-hidden="true"><line x1="1" y1="3" x2="21" y2="3" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 3"/></svg>Moyenne</div>');
  // quelle bouteille choisir : lignes dans une carte blanche
  b=b.replace('<h2 class="sh">Quelle bouteille choisir</h2><div class="group open">','<h2 class="sh">Quelle bouteille choisir</h2><div class="group tips-card">');
  // (1.53) étoiles sans libellé à droite ; pas de bannière « Tu as tout » ; sous-titre de réglage seulement s'il change
  b=b.replace(/<span class="muted" style="font-size:calc\(14rem \/ 17\);text-align:right;line-height:1.2">[\s\S]*?<\/span><\/div>/,"</div>");
  b=b.replace(/<div class="status ok">[\s\S]*?<\/span><\/div>/,"");
  b=b.replace(/(<div class="adj-l"><b>[^<]*<\/b>)<span>Comme l’original<\/span>/g,'$1<span class="adj-same" aria-hidden="true">Comme l’original</span>');
  // astuce : une ampoule
  b=b.replace(/(<span style="color:var\(--tint\);flex:none">)<svg[\s\S]*?<\/svg>(<\/span><span>)/,(m,a,c)=>a+lu("lightbulb").replace("<svg",'<svg width="20" height="20"')+c);
  // étapes : seulement la première occurrence de chaque terme est soulignée
  b=b.replace(/<ol class="steps[\s\S]*?<\/ol>/,ol=>{ const seen=new Set(); return ol.replace(/<span class="term"[^>]*data-k="([^"]+)"[^>]*>([^<]*)<\/span>/g,(m,k,t)=>{ if(seen.has(k)) return t; seen.add(k); return m; }); });
  b=b.replace('placeholder="Ce que tu as changé, ce que tu referais…"','placeholder="Ajouter une note"');
  o.body=b; return o; }
{ const _os=openSheet;
  openSheet=function(render,opt){ if(NEXT_SHEET_XFORM===recOpen) NEXT_SHEET_XFORM=o=>recPolish(recOpen(o)); return _os(render,opt); }; }
// barre réduite : le nom du cocktail en titre, seulement quand le grand titre est sorti de l'écran
function recTitle(body){ const sh=body&&body.closest(".sheet"), h1=body&&body.querySelector(".dhero h1"); if(!sh||!h1) return;
  const hd=sh.querySelector(".sheet-head"), st=hd&&hd.querySelector(".st"); if(!st) return;
  if(!st.textContent) { st.textContent=h1.textContent; st.classList.add("rec-t"); }
  const on=h1.getBoundingClientRect().bottom<hd.getBoundingClientRect().bottom; hd.classList.toggle("rec-t-on",on);
  st.setAttribute("aria-hidden",String(!on)); }   // caché tant que le grand titre est visible (pas de double lecture)
document.addEventListener("scroll",e=>{ const t=e.target; if(t&&t.classList&&t.classList.contains("sheet-body")) recTitle(t); },true);
{ const _ps=paintSheet; paintSheet=function(sh){ const r=_ps.apply(this,arguments); try{ recTitle(sh&&sh.el&&sh.el.querySelector(".sheet-body")); }catch(_){} return r; }; }
