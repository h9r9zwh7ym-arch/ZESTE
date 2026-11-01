// ================= ZESTE 1.81 : lancement et icône de saison =================
// L'écran de lancement garde le vert et le ruban de la marque, avec une touche de la saison : un halo de couleur et
// quelques flocons (hiver), pétales (printemps), éclats de soleil (été) ou feuilles (automne) qui tombent pendant
// les 2 secondes. L'icône de l'onglet du navigateur reçoit une pastille de la même couleur.
// L'icône de l'écran d'accueil de l'iPhone, elle, est figée par iOS au moment de l'ajout : elle ne change pas.
const SEASON_LOOK={
  hiver:{halo:"#7FB8D8",bits:["#FFFFFF","#DDEFF8"],shape:"flake"},
  printemps:{halo:"#F2A7C3",bits:["#F7C6D9","#FFFFFF","#C8E6A0"],shape:"petal"},
  ete:{halo:"#F5C518",bits:["#FFE27A","#F5C518"],shape:"spark"},
  automne:{halo:"#E08A3C",bits:["#E08A3C","#C8642A","#E8B04A"],shape:"leaf"}
};
function seasonBitsHTML(k,n){ const L=SEASON_LOOK[k]; let h="";
  for(let i=0;i<n;i++){ const x=(hrand("sx"+i+k)*100).toFixed(1), d=(hrand("sd"+i)*1.2).toFixed(2), du=(1.6+hrand("su"+i)*1.2).toFixed(2), s=(6+hrand("ss"+i)*8).toFixed(1), c=L.bits[i%L.bits.length], r=Math.round(hrand("sr"+i)*360);
    h+=`<i class="sb ${L.shape}" style="left:${x}%;width:${s}px;height:${s}px;--c:${c};--r:${r}deg;--dx:${((hrand("sdx"+i)-0.5)*80).toFixed(0)}px;animation-delay:${d}s;animation-duration:${du}s"></i>`; }
  return h; }
{ const _sp=splash;
  splash=function(){ const T=_sp.apply(this,arguments); const el=document.getElementById("splash"); if(!el) return T;
    const k=seasonKey(); el.classList.add("s-"+k); el.style.setProperty("--halo",SEASON_LOOK[k].halo);
    const box=document.createElement("div"); box.className="sp-season"; box.setAttribute("aria-hidden","true"); box.innerHTML=seasonBitsHTML(k,16); el.prepend(box);
    return T; };
}
// pastille de saison sur l'icône de l'onglet (SVG, si le navigateur l'accepte ; sinon l'icône PNG d'origine reste)
function seasonFavicon(){ try{ const k=seasonKey(), c=SEASON_LOOK[k].halo;
    const mark=zesteMark({round:true}).replace(/ class="[^"]*"/g,"").replace(/ aria-hidden="true"/,"");
    const svg=mark.replace(/<\/svg>$/,`<circle cx="82" cy="82" r="15" fill="${c}" stroke="#F7F1E3" stroke-width="5"/></svg>`);
    let l=document.querySelector('link[rel="icon"][data-season]'); if(!l){ l=document.createElement("link"); l.rel="icon"; l.type="image/svg+xml"; l.dataset.season="1"; document.head.appendChild(l); }
    l.href="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg); }catch(e){} }
seasonFavicon();
