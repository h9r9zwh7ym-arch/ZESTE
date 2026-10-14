// ================= ZESTE 1.41 : glace naturelle dans le labo, bar plus simple à lire =================

// ---------- Labo : le verre automatique s'adapte à la glace et à la quantité versée ----------
// Avant : en verre « choisi par le barman », mettre des glaçons gardait la coupe (11,7 cl utiles une fois la glace
// déduite) et le troisième ingrédient était refusé (« Plus de place dans ce verre ! »). Désormais, tant que tu n'as pas
// choisi le verre toi-même, le barman prend un verre qui accepte la glace et qui contient le mélange.
// (1.42) seulement des verres que le score du labo juge bons pour le style (glassOk de labScore)
const ICE_GLASS={long:["highball","vin"],spritz:["vin","highball"],stirred:["rocks"],sour:["rocks"],cremeux:["rocks"]};
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
// Loi de Hick : une seule vue ;
// chaque bouteille tient sur une ligne : son nom, puis son niveau en clair et la jauge.
stockRow=function(id){
  const i=ING[id], v=S.stock[id];
  if(tracked(id)) return `<div class="row bar-row" id="sr-${id}" style="--inset:58px"><button class="thumb" data-a="ing" data-id="${id}" style="width:30px;height:44px" aria-label="${esc(i.n)}">${bottleSVG(id,v)}</button><button class="grow" data-a="ing" data-id="${id}" style="text-align:left"><div class="t">${esc(i.n)}</div></button><span class="s lvl-txt">${LVLN[v]}${prepActive(id)?", fait maison":""}</span>${lvlCtl(id,v)}</div>`;
  return `<div class="row bar-row" id="sr-${id}"><button class="grow" data-a="ing" data-id="${id}" style="text-align:left"><div class="t">${esc(i.n)}</div></button><span class="s lvl-txt">${v===1?"En stock":"À racheter"}</span><button class="switch ${v===1?"on":""}" data-a="toggle" data-id="${id}" aria-label="${esc(i.n)}"></button></div>`;
};
// (1.42 : l'étagère et son bouton ont été retirés)
