// ================= ZESTE 1.42 : bar épuré, pictos du labo, Paramètres et À propos, nuit soignée =================

// ---------- Mon bar : une seule ligne en tête, l'inventaire, et le reste dans une section qu'on déplie ----------
// (l'étagère a été retirée : une seule vue ; l'eau gazeuse est un basique, voir data_more.js)
if(S.settings&&S.settings.barView&&S.settings.barView!=="list") S.settings.barView="list";
{ const _vb=vBar;
  vBar=function(){ if(S.settings.barView!=="list") S.settings.barView="list"; let h=_vb();
    // en tête : « 19 cocktails faisables › » seulement (les bouteilles ouvertes se voient dans la liste)
    h=h.replace(/<div class="bar-head"><div class="bh">[\s\S]*?<\/div>(<button class="bh go"[\s\S]*?<\/button>)<\/div>/,(m,go)=>{ const n=lowCount();
      return `<div class="bar-head one">${go}</div>${n?`<button class="low-line" data-a="lowsheet"><span class="ol-dot"></span>${n} bouteille${n>1?"s":""} bientôt à racheter${IC.chev}</button>`:""}`; });
    // basiques et achats malins : une petite section repliée en bas
    h=h.replace(/<div class="open-links">[\s\S]*?<\/div>(?=<div class="sp24"><\/div>)/,"");
    const at=h.indexOf('<div class="sp24"></div><div class="btn-row"><button class="btn sec" data-a="addsheet">');
    if(at>=0&&h.indexOf('class="bar-head one"')>=0){ const nb=BASICS.filter(id=>ING[id]&&!ING[id].al&&has(id)).length, br=bottleRecs();
      const names=BASICS.filter(id=>ING[id]&&!ING[id].al&&has(id)).slice(0,3).map(id=>shortN(id)).join(", ");
      const rows=`<button class="row tap" data-a="basics" style="--inset:20px"><div class="grow"><div class="t">Basiques toujours disponibles</div><div class="s">${esc(names)}…</div></div><span class="val">${nb}</span>${IC.chev}</button>`
        +(br.length?`<button class="row tap" data-a="buysheet" style="--inset:20px"><div class="grow"><div class="t">Achats malins</div><div class="s">${esc(shortN(br[0].id))} : +${br[0].rs.length} cocktail${br[0].rs.length>1?"s":""}</div></div>${IC.chev}</button>`:"");
      h=h.slice(0,at)+`<details class="bar-more"${BAR_MORE_OPEN?" open":""}><summary>Basiques et idées d’achat${IC.chev}</summary><div class="group">${rows}</div></details>`+h.slice(at); }
    return h; };
}
let BAR_MORE_OPEN=false;
document.addEventListener("toggle",e=>{ if(e.target&&e.target.classList&&e.target.classList.contains("bar-more")) BAR_MORE_OPEN=e.target.open; },true);

// ---------- Labo : un pictogramme pour les ingrédients frais (comme les décors), une bouteille pour les sirops ----------
const ING_PICTO={citron:"lemon",citron_vert:"citrus",menthe:"mint",blanc_oeuf:"egg",oeuf:"egg",concombre:"cucumber",basilic:"leaf",cafe:"bean",espresso:"bean"};
{ const _vc=vCompose;
  vCompose=function(){ return _vc().replace(/(<button class="shelf[^"]*" data-a="mixpour" data-id="([\w]+)">)<span class="sh-ic" style="background:[^"]*"><\/span>/g,(m,open,id)=>{
      if(ING[id]&&ING[id].cat==="sirop") return `${open}<span class="sh-b">${bottleSVG(id,4)}</span>`;
      const ic=ING_PICTO[id]; if(!ic) return m;
      return `${open}<span class="sh-pic" style="color:${mix(colOf(id),"#1F2A22",0.42)}">${lu(ic)}</span>`; }); };
}

// ---------- Paramètres : l'essentiel ; ce qui reste utile va dans « À propos » ----------
{ const strip=(fn,re)=>()=>fn().replace(re,"");
  SET_GROUPS.look[2]=strip(SET_GROUPS.look[2],/<div class="gf">Le ciel de l’accueil[^<]*<\/div>/);
  SET_GROUPS.snd[2]=strip(SET_GROUPS.snd[2],/<div class="gf">Glaçons, shaker[^<]*<\/div>/);
  const reco=SET_GROUPS.reco[2]; SET_GROUPS.reco[2]=()=>{ let b=reco(); const i=b.indexOf('<div class="gh">Ce qui guide'); if(i>=0) b=b.slice(0,i); return b.replace(/<div class="gf">[^<]*<\/div>/,""); };
  SET_GROUPS.data[2]=strip(SET_GROUPS.data[2],/<div class="gf">Ton bar, tes notes[^<]*<\/div>/);
}
{ const _ss=settingsSheet;
  settingsSheet=function(){ _ss(); const sh=SHEETS[SHEETS.length-1]; if(!sh) return; const r0=sh.render;
    sh.render=()=>{ const o=r0(); let b=o.body; const toi=b.indexOf('<div class="gh">Toi</div>'); if(toi>0) b=b.slice(toi);
      b=b.replace(/<div class="gf">Poids et sexe ne servent[^<]*<\/div>/,'<div class="gf">Poids et sexe servent seulement à estimer ton alcoolémie.</div>');
      const ab=b.indexOf('<div class="gh">À propos</div>'); if(ab>=0) b=b.slice(0,ab);
      o.body=b+`<div class="sp16"></div><div class="group"><button class="row tap" data-a="about" style="--inset:58px"><span class="set-ic" style="background:var(--tint-bg)">${lu("info")}</span><div class="grow">À propos</div>${IC.chev}</button></div>`;
      return o; };
    paintSheet(sh); };
}
function aboutBody(){
  const n=RECS.filter(r=>!r.mine).length, na=RECS.filter(r=>r.na).length, g=(typeof guideHTML==="function"?guideHTML():"");
  return `<div class="about-hero"><div class="af-logo brand">${zesteMark({label:"Logo Zeste"})}</div><b>Zeste ${APP_VERSION}</b><span>${n} recettes, dont ${na} sans alcool</span></div>`
    +(g? g.replace('<div class="gh">Ce qui guide tes suggestions</div>','<div class="gh">Comment Zeste te conseille</div>')
       : `<div class="gh">Comment Zeste te conseille</div><div class="card about-p">Zeste apprend de tes notes et de ce que tu prépares. Note quelques cocktails : tu verras ici ce qui guide ses suggestions.</div>`)
    +`<div class="gh">Ton alcoolémie</div><div class="card about-p">Une estimation (formule de Widmark) à partir de ton poids, de ton sexe et des verres que tu indiques. Ce n’est jamais une mesure : ne t’y fie pas pour prendre le volant.</div>`
    +`<div class="gh">Tes données</div><div class="card about-p">Sur claude.ai, ton bar, tes notes et ton historique se synchronisent avec ton compte. Ailleurs, ils restent sur cet appareil : pense à exporter une sauvegarde (Paramètres › Données).</div>`
    +`<div class="gh">Les recettes</div><div class="card about-p">Les 102 cocktails de la liste officielle de l’IBA sont vérifiés un à un, dosages compris.</div>`
    +`<div class="about-foot"><span>${esc(COPYRIGHT)}</span><span>À consommer avec modération. Santé !</span></div>`;
}
Object.assign(ACT,{ about:()=>subSheet("À propos",aboutBody) });
// réglages détaillés des animations : sans paragraphe d'introduction
{ const _fx=fxSheet; fxSheet=function(){ NEXT_SHEET_XFORM=o=>{ o.body=o.body.replace(/<p class="body"[^>]*>Active ou coupe[^<]*<\/p>/,""); return o; }; try{ return _fx(); } finally { NEXT_SHEET_XFORM=null; } }; }

// ---------- Nuit : une vraie lune, quelques étoiles dans le ciel (plus derrière les cartes), plus d'étoile filante ----------
const MOON_SVG=`<svg viewBox="0 0 40 40" aria-hidden="true"><defs><mask id="zmoon"><rect width="40" height="40" fill="#fff"/><circle cx="27" cy="14" r="13" fill="#000"/></mask></defs><circle cx="20" cy="20" r="14" fill="currentColor" mask="url(#zmoon)"/></svg>`;
{ const _aa=applyAmbient;
  applyAmbient=function(){ const r=_aa.apply(this,arguments); const a=document.getElementById("ambient");
    if(a&&!a.dataset.v142){ a.dataset.v142="1";
      const st=a.querySelector(".amb-stars"); if(st) st.innerHTML=[...Array(18)].map((_,k)=>{ const big=k%6===0; return `<i style="left:${(4+hrand("nx"+k)*92).toFixed(1)}%;top:${(1+hrand("ny"+k)*9.5).toFixed(1)}%;--s:${big?2.2:(0.9+hrand("ns"+k)*1.1).toFixed(1)}px;--o:${(0.45+hrand("no"+k)*0.5).toFixed(2)};animation-duration:${(4+hrand("nd"+k)*4).toFixed(1)}s;animation-delay:${(-hrand("nl"+k)*6).toFixed(1)}s"></i>`; }).join("");
      if(!a.querySelector(".amb-moon")){ const m=document.createElement("div"); m.className="amb-moon"; m.innerHTML=MOON_SVG; a.appendChild(m); } }
    return r; };
}
