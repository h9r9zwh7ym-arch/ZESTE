// ================= ZESTE 1.41 : glace naturelle dans le labo, bar plus simple à lire =================

// ---------- Labo : le verre automatique s'adapte à la glace et à la quantité versée ----------
// Avant : en verre « choisi par le barman », mettre des glaçons gardait la coupe (11,7 cl utiles une fois la glace
// déduite) et le troisième ingrédient était refusé (« Plus de place dans ce verre ! »). Désormais, tant que tu n'as pas
// choisi le verre toi-même, le barman prend un verre qui accepte la glace et qui contient le mélange.
const ICE_GLASS={long:["highball","vin"],spritz:["vin","highball"],stirred:["rocks","highball"],sour:["rocks","highball"],cremeux:["rocks","highball"]};
{ const _lg=labGlass;
  labGlass=function(){ const r=_lg(), M=mixState(); if(M.g||M.t==="shot") return r;
    const items=mixItems(), st=items.length?labStyle(items,M.m):({long:"long",spritz:"spritz",sec:"stirred"}[M.t]||"sour");
    const ladder=[r.g].concat(ICE_GLASS[st]||["rocks","highball"]).filter((x,i,a)=>a.indexOf(x)===i);
    let cand=ladder;
    if(r.ice&&r.ice!=="none"&&["coupe","martini","flute","shot"].includes(r.g)) cand=ladder.slice(1); // pas de glaçons dans une coupe
    const vol=items.length?labVol(items,M.m,r.ice):0;
    const g=cand.find(x=>vol<=labAvail(x,r.ice)*1.03)||cand[cand.length-1];
    return g===r.g? r : Object.assign({},r,{g}); };
}
// un message « ça déborde » ne reste pas affiché quand ce n'est plus vrai
function hideToast(){ const el=document.getElementById("toast"); if(el){ el.classList.remove("show"); clearTimeout(el._t); } }
// la glace tombe dans le verre quand on la choisit
let ICE_DROP=false;
{ ACT.mixice=(d)=>{ const M=mixState(), was=labGlass().ice; ICE_DROP=d.v!=="none"&&d.v!==was; hideToast(); M.ice=d.v; LAB_SERVE=null;
    if(!labFits(M.items)) toast("Avec cette glace, ça déborde un peu",{action:{label:"Ajuster",fn:()=>ACT.mixfit()}});
    changed(); if(typeof SND!=="undefined"&&SND.ice&&SND.tap) (d.v==="none"?SND.tap():SND.ice()); }; }
{ const _lt=labTry; labTry=function(mut){ const ok=_lt(mut); if(ok) hideToast(); return ok; }; }

// ---------- Labo : la glace juste sous le verre (on voit les glaçons tomber), le décor reste dans « Le service » ----------
{ const _vc=vCompose;
  vCompose=function(){ let h=_vc(); const m=h.match(/<div class="seg lab-ice" data-k="labice">[\s\S]*?<\/div>/); if(!m) return h;
    h=h.replace(m[0],"").replace('<div class="lab-sub">Glace et décor','<div class="lab-sub">Décor');
    const row=`<div class="lab-icerow">${m[0].replace('data-v="none">Sans</button>','data-v="none">Sans glace</button>')}</div>`;
    const at=[h.indexOf('<div class="lab-classics">'),h.indexOf('<h2 class="sh lab-h">Les ingrédients')].filter(x=>x>=0).sort((a,b)=>a-b)[0];
    return at==null? h : h.slice(0,at)+row+h.slice(at); };
}
{ const _rv=renderView;
  renderView=function(t){ const r=_rv.apply(this,arguments);
    if(t==="labo"&&ICE_DROP){ ICE_DROP=false; const s=document.querySelector('#v-labo .lab-glass svg'); if(s&&FX("live")&&!REDUCED.matches){ s.classList.add("icedrop"); setTimeout(()=>s.classList.remove("icedrop"),1200); } }
    return r; }; }

// ---------- Bar : une seule vue lisible, une ligne par bouteille ----------
// Loi de Hick : plus de bascule Liste/Étagère au milieu de l'écran (l'étagère reste à un toucher, en haut à droite) ;
// chaque bouteille tient sur une ligne : son nom, puis son niveau en clair et la jauge.
const IC_SHELF=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 20h18M3 11h18"/><path d="M6 11V6.5a1.5 1.5 0 0 1 3 0V11M11 20v-5a1.5 1.5 0 0 1 3 0v5M16 11V8a1.5 1.5 0 0 1 3 0v3"/></svg>`;
const IC_LIST=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>`;
stockRow=function(id){
  const i=ING[id], v=S.stock[id];
  if(tracked(id)) return `<div class="row bar-row" id="sr-${id}" style="--inset:58px"><button class="thumb" data-a="ing" data-id="${id}" style="width:30px;height:44px" aria-label="${esc(i.n)}">${bottleSVG(id,v)}</button><button class="grow" data-a="ing" data-id="${id}" style="text-align:left"><div class="t">${esc(i.n)}</div></button><span class="s lvl-txt">${LVLN[v]}${prepActive(id)?", fait maison":""}</span>${lvlCtl(id,v)}</div>`;
  return `<div class="row bar-row" id="sr-${id}"><button class="grow" data-a="ing" data-id="${id}" style="text-align:left"><div class="t">${esc(i.n)}</div></button><span class="s lvl-txt">${v===1?"En stock":"À racheter"}</span><button class="switch ${v===1?"on":""}" data-a="toggle" data-id="${id}" aria-label="${esc(i.n)}"></button></div>`;
};
{ const _vb=vBar;
  vBar=function(){ let h=_vb(); const shelf=S.settings.barView==="shelf";
    h=h.replace(/<div class="seg" data-k="barview"[^>]*>[\s\S]*?<\/div>/,"");
    const btn=`<button class="icon-btn" data-a="barview" data-v="${shelf?"list":"shelf"}" aria-label="${shelf?"Voir en liste":"Voir l’étagère"}">${shelf?IC_LIST:IC_SHELF}</button>`;
    return h.replace('<div class="nb-right">','<div class="nb-right">'+btn); };
}
