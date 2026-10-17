// ================= ZESTE 1.40 : hiérarchie « app pro », typographie unique, animations signées =================
// Repères (apps de référence) : les compteurs sont des chiffres posés sur le fond (Untappd, Apple Forme) ; ce qu'on possède
// reste en cartes (Vivino, Cartes) ; un grand visuel focal puis des listes, l'annexe en liens (Musique, Airbnb) ;
// un seul bloc de couleur pour un résumé personnel (Apple Forme) : la carte verte du profil de goût, et seulement là.

// ---------- Chiffres qui défilent (une fois par valeur, chasse fixe ; coupés par « Réduire les animations ») ----------
const COUNT_SEEN={};
function countUps(root){
  (root||document).querySelectorAll("[data-ck]").forEach(el=>{ const k=el.dataset.ck, v=+el.dataset.v, prev=COUNT_SEEN[k];
    COUNT_SEEN[k]=v; if(prev===v||!isFinite(v)) return;
    if(!FX("reveal")||REDUCED.matches||v<2){ el.textContent=v; return; }
    const from=prev==null?0:prev, t0=performance.now(), D=Math.min(900,420+Math.abs(v-from)*25);
    const step=t=>{ const p=Math.min(1,(t-t0)/D), e=1-Math.pow(1-p,3); el.textContent=Math.round(from+(v-from)*e); if(p<1) requestAnimationFrame(step); };
    el.textContent=from; requestAnimationFrame(step); });
}
const ck=(key,v)=>`data-ck="${key}" data-v="${v}"`;

// ---------- Mon bar : compteurs posés sur le fond, les bouteilles en cartes, l'annexe en liens ----------
function buySheet(){
  openSheet(()=>{ const br=bottleRecs().slice(0,8);
    return {title:"Achats malins",body:`<p class="body" style="margin-bottom:var(--z-s2)">Les bouteilles qui t’ouvriraient le plus de cocktails à ton goût.</p><div class="group">${br.map(b=>`<button class="row tap" data-a="ing" data-id="${b.id}" style="--inset:58px"><div class="thumb" style="width:30px;height:44px">${bottleSVG(b.id,4)}</div><div class="grow"><div class="t">${esc(ING[b.id].n)}</div><div class="s">+${b.rs.length} : ${esc(b.rs.slice(0,3).map(r=>r.n).join(", "))}</div></div>${IC.chev}</button>`).join("")}</div>`}; });
}
Object.assign(ACT,{ buysheet:()=>buySheet() });
{ const _vb=vBar;
  vBar=function(){ let h=_vb();
    // compteurs : « 10 bouteilles ouvertes » en grand, « 19 cocktails faisables › » qui mène à la liste
    h=h.replace(/<div class="stat-grid"[^>]*><div class="stat"><b id="st-b">(\d+)<\/b><span>[^<]*<\/span><\/div><button class="stat t" data-a="gofaisables"><b id="st-m">(\d+)<\/b><span>[^<]*<\/span><\/button><\/div>/,
      (m,a,b)=>`<div class="bar-head"><div class="bh"><b id="st-b" ${ck("bar-b",a)}>${a}</b><span>bouteille${+a>1?"s":""} ouverte${+a>1?"s":""}</span></div><button class="bh go" data-a="gofaisables"><b id="st-m" ${ck("bar-m",b)}>${b}</b><span>cocktail${+b>1?"s":""} faisable${+b>1?"s":""} ›</span></button></div>`);
    h=h.replace(/<div class="group low-link">[\s\S]*?<\/button><\/div><div class="sp8"><\/div>/,"");
    let nb=null;
    h=h.replace(/<div class="list-h cat-h"><b>Additionnel<\/b><span><\/span><\/div><div class="group"><button class="row tap" data-a="basics"[\s\S]*?<span class="val">(\d+)<\/span>[\s\S]*?<\/button><\/div>(<div class="sp8"><\/div><div class="group">)?/,
      (m,n,extra)=>{ nb=+n; return extra? `<div class="list-h cat-h"><b>Additionnel</b><span></span></div>`+extra : ""; });
    let buy=false; h=h.replace(/<h2 class="sh">Achats malins<\/h2><div class="sh-sub">[^<]*<\/div><div class="group">[\s\S]*?<\/div>(?=<div class="sp24"><\/div>)/,()=>{ buy=true; return ""; });
    const at=h.indexOf('<div class="sp24"></div><div class="btn-row"><button class="btn sec" data-a="addsheet">');
    if(at>=0&&(S.settings.barView||"list")==="list"){ const n=lowCount(), all=buy?bottleRecs():[], br=all.slice(0,1), nbuy=Math.min(all.length,8);
      const links=[ n?`<button class="open-link" data-a="lowsheet"><span class="ol-dot"></span><span class="grow">${n} bouteille${n>1?"s":""} presque vide${n>1?"s":""}</span>${IC.chev}</button>`:"",
        br.length?`<button class="open-link" data-a="buysheet"><span class="grow">Achats malins : ${esc(shortN(br[0].id))} (+${br[0].rs.length})${nbuy>1?` et ${nbuy-1} autre${nbuy>2?"s":""}`:""}</span>${IC.chev}</button>`:"",
        nb!=null?`<button class="open-link" data-a="basics"><span class="grow">+ ${nb} basiques toujours disponibles</span><span class="ol-act">Modifier</span></button>`:"" ].join("");
      if(links) h=h.slice(0,at)+`<div class="open-links">${links}</div>`+h.slice(at); }
    return h; };
}

// ---------- Profil : la carte verte « Ton profil de goût » (résumé personnel), le reste en cartes blanches ----------
let RADAR_PLAY=false;
function focalTaste(){
  const tv=tasteVector(), sty=tasteStyle(); let body;
  if(tv&&tv.liked) body=`<div class="prof">${radarSVG(tv.liked)}<div class="fc-txt">${esc(tasteSentence())||"Continue à noter pour affiner ton profil."}<span class="fc-note">D’après les cocktails notés 4 étoiles ou plus.</span></div></div>`;
  else if(S.quiz){ const Q=quizPrior(), av=avgProfile(); body=`<div class="prof">${radarSVG(av.map((v,i)=>clamp01(v+Q.dir[i]*2.2)))}<div class="fc-txt">D’après ton quiz</div></div>`; }
  else body=`<div class="fc-txt">Note au moins trois cocktails, dont un qui t’a plu, pour voir apparaître ton profil de goût.</div>`;
  const st=[[S.hist.length,"préparé","préparés","p"],[distinct().length,"recette","recettes","r"],[rated().length,"noté","notés","n"]];
  return `<div class="focal-card"><div class="fc-k">Ton profil de goût</div>${sty?`<div class="fc-t">${esc(sty)}</div>`:""}${body}<div class="fc-stats">${st.map(([v,a,b,k])=>`<div><b ${ck("prof-"+k,v)}>${v}</b><span>${v>1?b:a}</span></div>`).join("")}</div></div>`;
}
let TRO_SEEN=null; try{ TRO_SEEN=JSON.parse(localStorage.getItem("zeste.troSeen")||"null"); }catch(e){}
{ const _vp=vProfil;
  vProfil=function(){ let h=_vp();
    h=h.replace(/<div class="stat-grid"><div class="stat">[\s\S]*?<\/div><\/div>(?=<h2)/,"");
    const a=h.indexOf('<h2 class="sh">Ton profil de goût</h2>'), b=a<0?-1:h.indexOf('<h2 class="sh">',a+10);
    if(a>=0) h=h.slice(0,a)+focalTaste()+(b>=0?h.slice(b):"");
    // trophées : les médailles et « Tous les trophées » dans une seule carte blanche ; une médaille nouvelle rebondit
    h=h.replace(/<div class="trophies">([\s\S]*?)<\/div><div class="sp8"><\/div><div class="group">(<button class="row tap" data-a="alltro"[\s\S]*?<\/button>)<\/div>/,
      (m,tiles,row)=>`<div class="card tro-card"><div class="trophies">${tiles}</div>${row}</div>`);
    const got=S.tro||[]; if(TRO_SEEN) got.filter(k=>!TRO_SEEN.includes(k)).forEach(k=>{ h=h.replace(`data-a="trophy" data-k="${k}"`,`data-a="trophy" data-k="${k}" data-new="1"`); });
    TRO_SEEN=got.slice(); try{ localStorage.setItem("zeste.troSeen",JSON.stringify(TRO_SEEN)); }catch(e){}
    return h; };
}

// ---------- Labo : les liens d'action discrets sous « Servir » ----------
{ const _vc=vCompose; vCompose=function(){ return _vc().replace('<div class="btn-row"><button class="btn sec" data-a="mixsave">','<div class="btn-row lab-links"><button class="btn sec" data-a="mixsave">'); }; }

// ---------- Fiche recette : l'annexe (histoire, profil de goût, bouteilles) posée sur le fond ----------
// La retouche s'applique AVANT le premier dessin (un second dessin couperait l'animation du verre qui se remplit).
let NEXT_SHEET_XFORM=null;
{ const _os=openSheet; openSheet=function(render,opt){ const x=NEXT_SHEET_XFORM; NEXT_SHEET_XFORM=null; return _os(x?()=>x(render()):render,opt); }; }
const recOpen=o=>{ o.body=o.body
  .replace('<h2 class="sh">Histoire</h2><div class="sp8"></div><div class="card">','<h2 class="sh">Histoire</h2><div class="card open">')
  .replace('<h2 class="sh">Profil de goût</h2><div class="sp8"></div><div class="card">','<h2 class="sh">Profil de goût</h2><div class="card open">')
  .replace('<h2 class="sh">Quelle bouteille choisir</h2><div class="sp8"></div><div class="group">','<h2 class="sh">Quelle bouteille choisir</h2><div class="group open">'); return o; };
{ const _rs=recSheet; recSheet=function(id){ NEXT_SHEET_XFORM=recOpen; try{ return _rs(id); } finally { NEXT_SHEET_XFORM=null; } }; }

// ---------- Après chaque rendu : chiffres, radar qui se déploie, médaille nouvelle ----------
{ const _rv=renderView;
  renderView=function(t){ const r=_rv.apply(this,arguments); try{ const v=document.getElementById("v-"+t); countUps(v);
      if(t==="profil"&&RADAR_PLAY){ RADAR_PLAY=false; const pg=v.querySelector(".focal-card svg.radar polygon:last-of-type");
        if(pg&&FX("reveal")&&!REDUCED.matches&&pg.animate) pg.animate([{transform:"scale(.15)",opacity:0},{transform:"scale(1)",opacity:1}],{duration:700,easing:"cubic-bezier(.2,.8,.2,1)"}); }
      if(t==="profil"&&FX("reveal")&&!REDUCED.matches) v.querySelectorAll('.trophy[data-new] svg').forEach(s=>s.animate&&s.animate([{transform:"scale(.6)"},{transform:"scale(1.12)",offset:.6},{transform:"scale(1)"}],{duration:650,delay:250,easing:"ease-out"}));
    }catch(e){} return r; };
  const _sw=switchTab; switchTab=function(t){ if(t==="profil"&&TAB!=="profil") RADAR_PLAY=true; return _sw.apply(this,arguments); };
}
// les nouveaux blocs entrent dans la cascade existante (« Apparition au défilement »)
{ const _ri=revealIn; revealIn=function(v){ _ri(v); if(!FX("reveal")||typeof RIO==="undefined"||!RIO) return;
    v.querySelectorAll(".content > .bar-head, .content > .focal-card, .content > .open-links, .content > .tro-card").forEach((el,i)=>{ el.classList.remove("in"); el.classList.add("rv"); el.style.setProperty("--rd",Math.min(i,4)*40+"ms"); RIO.observe(el); }); }; }
// les chiffres du bar suivent aussi les changements faits sans redessiner l'écran
{ const _ub=updateBarStats; updateBarStats=function(){ _ub(); [["st-b","bar-b",barCount()],["st-m","bar-m",makeable()]].forEach(([id,k,v])=>{ const el=document.getElementById(id); if(el){ el.dataset.v=v; COUNT_SEEN[k]=v; } }); }; }
