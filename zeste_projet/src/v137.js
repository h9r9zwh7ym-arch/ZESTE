// ================= ZESTE 1.37 : moins de choix à la fois, hiérarchie, harmonisation =================
// Même design, mêmes fonctions : on montre l'essentiel, le reste est à un toucher (« Voir les N autres »,
// feuilles « Tous les trophées », groupes de réglages). Règles reprises de la refonte d'ASCEN (loi de Hick).
// Règle pour la suite : avant d'ajouter un bouton à un écran, se demander ce qu'il remplace.

// ---------- Listes repliées : « Voir les N autres » (l'état tient jusqu'à la fermeture de l'app) ----------
const MORE_OPEN=new Set();
function moreBtn(key,n,label){ return `<button class="more-btn" data-a="more" data-k="${esc(key)}">${esc(label||("Voir les "+n+" autres"))}</button>`; }
// rows : morceaux HTML déjà rendus ; on en garde `keep`, le reste derrière le bouton
function foldRows(key,rows,keep,label){ if(rows.length<=keep+1||MORE_OPEN.has(key)) return rows.join(""); return rows.slice(0,keep).join("")+moreBtn(key,rows.length-keep,label&&label(rows.length-keep)); }
Object.assign(ACT,{ more:(d,el)=>{ MORE_OPEN.add(d.k); const sh=el&&el.closest(".sheet");
  if(sh){ const s=SHEETS.find(x=>x.el===sh); s&&paintSheet(s); } else { dirty[TAB]=1; renderView(TAB); } } });
const splitRows=html=>html.split(/(?=<button class="row tap")/).filter(x=>x.trim());

// ---------- Profil : une hiérarchie, des listes courtes, les trophées en résumé ----------
function troTile(k){ const got=S.tro||[], on=got.includes(k), [v,G]=troProgress(k), T=TROPHIES.find(x=>x[0]===k);
  return `<button class="trophy ${on?"":"locked"} t-${tierOf(k)}" data-a="trophy" data-k="${k}">${medal(k,on,on?null:v/G)}<div class="tn">${esc(T[1])}</div><div class="tp">${on?(HIDDEN.has(k)?"Secret · ":"")+TIERS[tierOf(k)].n:v+" / "+T[3]}</div></button>`; }
function trophySummary(){
  const full=trophyGrid(), head=full.slice(0,full.indexOf('<div class="trophies">'));
  const got=S.tro||[], classic=k=>TROPHIES.some(t=>t[0]===k);
  const recent=got.filter(classic).slice(-3).reverse();
  const tiersOn=TIER_TROPHIES.filter(tt=>tierInfo(tt).cur>=0).map(tierTile);
  const earned=recent.map(troTile).concat(tiersOn).slice(0,3);
  const next=TROPHIES.filter(t=>!got.includes(t[0])&&!HIDDEN.has(t[0])).map(t=>{ const [v,G]=troProgress(t[0]); return [t[0],G?v/G:0]; })
    .sort((a,b)=>b[1]-a[1]).slice(0,6-earned.length).map(x=>troTile(x[0]));
  return head+`<div class="trophies">${earned.concat(next).join("")}</div><div class="sp8"></div><div class="group"><button class="row tap" data-a="alltro" style="--inset:20px"><div class="grow">Tous les trophées</div>${IC.chev}</button></div>`;
}
function allTrophiesSheet(){ openSheet(()=>({title:"Trophées",body:trophyGrid().replace(/^\s*<h2 class="sh">Trophées/,'<h2 class="sh" style="margin-top:8px">Ta collection')})); }
Object.assign(ACT,{ alltro:()=>allTrophiesSheet() });
{
  const _vProfil=vProfil;
  vProfil=function(){
    const tg=trophyGrid; trophyGrid=()=>`<h2 class="sh">Trophées</h2><!--TRO-->`;
    let html; try{ html=_vProfil(); } finally { trophyGrid=tg; }
    const i=html.indexOf("<!--TRO-->"); if(i<0) return html;
    const tail=html.slice(i+10), body=html.slice(0,i);
    const parts=body.split(/(?=<h2 class="sh">)/), head=parts.shift(), sec={};
    parts.forEach(p=>{ const t=(p.match(/^<h2 class="sh">([^<]*)/)||[])[1]||"?"; sec[t]=p; });
    const fold=(t,k)=>{ const p=sec[t]; if(!p) return; const a=p.indexOf('<div class="group">'); if(a<0) return; const inner=p.slice(a+19,p.lastIndexOf("</div>"));
      sec[t]=p.slice(0,a)+`<div class="group">${foldRows(k,splitRows(inner),3)}</div>`; };
    fold("Tes mieux notés","prof-best"); fold("Derniers verres","prof-last");
    // ce qui guide les suggestions : la phrase et la barre, le détail sur demande
    if(sec["Ce qui guide tes suggestions"]&&!MORE_OPEN.has("guide")) sec["Ce qui guide tes suggestions"]=sec["Ce qui guide tes suggestions"]
      .replace(/(<div class="gd-bar">[\s\S]*?<\/div>)/,`$1<div class="gd-more" hidden>`).replace(/<\/div>\s*$/,`</div>${moreBtn("guide",0,"Voir le détail")}</div>`);
    sec["Trophées"]=trophySummary();
    const order=["Ton profil de goût","Ton prochain coup de cœur","Trophées","Tes mieux notés","Derniers verres","Familles explorées","Tes spiritueux","Ce qui guide tes suggestions"];
    const rest=Object.keys(sec).filter(k=>!order.includes(k));
    return head+order.concat(rest).map(k=>sec[k]||"").join("")+tail;
  };
}

// ---------- Bar : une jauge = un seul bouton (cible de 44 px), choix du niveau en grand ----------
lvlCtl=function(id,v){ let s=`<button class="lvl one ${v===0?"empty":""}" data-a="lvlpick" data-id="${id}" aria-label="Niveau : ${esc(LVLN[v]||"")}. Modifier">`; for(let l=1;l<=4;l++) s+=`<i data-l="${l}" class="${v>=l?"on":""}" style="height:${6+l*5}px"></i>`; return s+"</button>"; };
{ const _ps=patchStock; patchStock=function(id){ const r=_ps(id); const row=document.getElementById("sr-"+id), v=S.stock[id];
    if(r&&row){ const b=row.querySelector(".lvl.one"); if(b){ b.classList.toggle("empty",v===0); b.setAttribute("aria-label","Niveau : "+(LVLN[v]||"")+". Modifier");
      b.querySelectorAll("i[data-l]").forEach(i=>{ const on=v>=+i.dataset.l; if(on&&!i.classList.contains("on")){ i.classList.remove("bump"); void i.offsetWidth; i.classList.add("bump"); } i.classList.toggle("on",on); }); } }
    return r; }; }
function levelSheet(id){
  openSheet(()=>{ const v=S.stock[id]; return {title:ING[id].n,body:`<div class="card"><div class="lvl-big">${[0,1,2,3,4].map(l=>`<button class="${v===l?"on":""}" data-a="lvlset" data-id="${id}" data-l="${l}">${bottleSVG(id,l)}${LVLN[l]}</button>`).join("")}</div></div><div class="sp8"></div><div class="group"><button class="row tap" data-a="lvlmore" data-id="${id}" style="--inset:20px"><div class="grow">Fiche de la bouteille</div>${IC.chev}</button></div>`}; },{short:true});
}
Object.assign(ACT,{
  lvlpick:(d)=>levelSheet(d.id),
  lvlset:(d)=>{ const v=S.stock[d.id], l=+d.l; closeSheet(); if(v===l) return; S.stock[d.id]=l; if(!(v>0)&&l>0) markBought(d.id);
    if(l>0&&patchStock(d.id)) softChanged();
    else if(l===0){ patchStock(d.id); softChanged(); setTimeout(()=>{ renderView("bar"); },380); toast(ING[d.id].n+" ajouté à la liste à racheter",{action:{label:"Annuler",fn:()=>{ S.stock[d.id]=v; changed(); }}}); }
    else changed(); },
  lvlmore:(d)=>{ closeSheet(); ingSheet(d.id); }
});
{ const _vBar=vBar;
  vBar=function(){
    const n=Object.keys(S.stock).filter(id=>ING[id]&&!ING[id].basic).length, few=n<24;
    if(few) BF=""; // les sections suffisent : pas de deuxième rangée de filtres pour un petit bar
    const sc=segChips; if(few) segChips=(cur,act,all,list)=>act==="bf"?"":sc(cur,act,all,list);
    let html; try{ html=_vBar(); } finally { segChips=sc; }
    // les basiques en une ligne au lieu d'un nuage d'étiquettes
    return html.replace(/<div class="basics">([\s\S]*?)<\/div><\/div>/,(m,inner)=>{ const L=[...inner.matchAll(/<span>([^<]*)<\/span>/g)].map(x=>x[1]);
      return `<div class="basics-line">${L.slice(0,4).join(", ")}${L.length>4?` et ${L.length-4} autres`:""}.</div></div>`; });
  };
}

// ---------- Labo : six décors à la fois (les choisis, les conseillés, puis les plus courants) ----------
{ const _vc=vCompose;
  vCompose=function(){
    const html=_vc(); if(MORE_OPEN.has("labgar")) return html;
    return html.replace(/<div class="lab-gars">([\s\S]*?)<\/div>(?=<h2)/,(m,inner)=>{
      const bs=inner.split(/(?=<button class="lgar)/).filter(x=>x.trim()); if(bs.length<=7) return m;
      const pri=b=>/lgar on/.test(b)?0:/ sug"/.test(b)||/\bsug\b/.test(b.slice(0,60))?1:2;
      const idx=bs.map((b,i)=>[i,pri(b)]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
      const keep=new Set(idx.slice(0,Math.max(6,idx.filter(x=>x[1]<2).length)).map(x=>x[0]));
      const shown=bs.filter((b,i)=>keep.has(i));
      return `<div class="lab-gars">${shown.join("")}</div>${moreBtn("labgar",bs.length-shown.length,"Plus de décors ("+(bs.length-shown.length)+")")}`; });
  };
}

// ---------- Fiche ingrédient : 5 recettes, les faisables d'abord, puis « Voir les N autres » ----------
{ const _ing=ingSheet;
  ingSheet=function(id){ _ing(id); const sh=SHEETS[SHEETS.length-1]; if(!sh) return; const r0=sh.render;
    sh.render=()=>{ const o=r0(); const a=o.body.indexOf('<div class="gh">Utilisé dans'); if(a<0) return o;
      let b=o.body.indexOf('<div class="sp16"></div><div class="btn-row"><button class="btn danger"',a); if(b<0) b=o.body.length;
      const uses=RECS.filter(r=>r.ing.some(x=>x.id===id)).map(r=>[r,status(r).ok?1:0,S.ratings[r.id]||0]).sort((x,y)=>y[1]-x[1]||y[2]-x[2]).map(x=>x[0]);
      const rows=uses.map(r=>recRow(r));
      o.body=o.body.slice(0,a)+`<div class="gh">Utilisé dans ${uses.length} recette${uses.length>1?"s":""}</div><div class="group">${foldRows("ing:"+id,rows,5)}</div>`+o.body.slice(b);
      return o; };
    paintSheet(sh); return sh; };
}

// ---------- Accueil : huit idées dans le carrousel (le reste : « Tout voir ») ----------
{ const _sg=HOME_SEC.suggest; HOME_SEC.suggest=(ctx)=>_sg(Object.assign({},ctx,{list:ctx.list.slice(0,9)})); }

// ---------- Paramètres : « Toi » sur place, le reste en groupes (une feuille chacun, avec Retour) ----------
function subSheet(title,body,foot){ openSheet(()=>({title,left:`<button class="link back-link" data-a="closesheet">${IC.chev.replace('class="chev"','class="chev back"')}Paramètres</button>`,right:"",body:body()}),{child:true}); }
const SET_GROUPS={
  look:["Apparence","theme",()=>{ const s=S.settings, MN={auto:"Auto",matin:"Matin",aprem:"Après-midi",apero:"Apéro",soir:"Soir",nuit:"Nuit"};
    return `<div class="group">${srow("theme","Thème","")}<div class="row set-sub">${sseg("theme",s.theme||"auto",[["auto","Système"],["light","Clair"],["dark","Sombre"]],"settheme")}</div>${srow("txt","Taille du texte","")}<div class="row set-sub">${sseg("txt",String(s.txt||"auto"),[["auto","Système"],["1","Standard"],["1.15","Grand"],["1.3","Très grand"]],"settxt")}</div>${srow("sky","Ambiance selon l’heure",sw(s.ambiance!==false,"setamb","Ambiance selon l’heure"))}${s.ambiance!==false?srow("clock","Aperçu d’un moment",`<span class="val">${(s.moment||"auto")==="auto"?"Auto":MN[s.moment]}</span>`,"momentsheet"):""}</div><div class="gf">Le ciel de l’accueil suit l’heure de ton téléphone : matin, après-midi, heure de l’apéro, soirée et nuit. Un aperçu choisi ici ne dure que jusqu’à la prochaine ouverture de l’app.</div>`; },
    ()=>({auto:"Système",light:"Clair",dark:"Sombre"})[S.settings.theme||"auto"]],
  snd:["Sons et animations","snd",()=>{ const s=S.settings, PN={complet:"Complet",standard:"Standard",reduit:"Réduit",perso:"Personnalisé"};
    return `<div class="gh">Sons</div><div class="group">${srow("snd","Sons",sw(s.sound!==false,"setsound","Sons"))}${s.sound!==false?`${srow("snd","Volume","")}<div class="row set-sub">${sseg("vol",String(s.vol??0.7),[["0.35","Doux"],["0.7","Normal"],["1","Fort"]],"sndvol")}</div><button class="row tap" data-a="soundtest" style="--inset:58px">${sic("snd")}<div class="grow">Écouter un exemple</div></button>`:""}</div><div class="gf">Glaçons, shaker, versement, trophées… Si ton iPhone est en mode silencieux, les sons restent coupés.</div>
    <div class="gh">Animations</div><div class="group">${srow("anim","Niveau","")}<div class="row set-sub">${sseg("fxp",fxPreset(),[["complet","Complet"],["standard","Standard"],["reduit","Réduit"]],"setfxp")}</div>${srow("anim","Réglages détaillés",`<span class="val">${PN[fxPreset()]}</span>`,"fxsheet")}</div>${REDUCED.matches?`<div class="gf">Ton iPhone demande de réduire les animations : Zeste s’y conforme.</div>`:""}`; },
    ()=>S.settings.sound===false?"Sons coupés":({complet:"Complet",standard:"Standard",reduit:"Réduit",perso:"Personnalisé"})[fxPreset()]],
  reco:["Suggestions","reco",()=>{ const s=S.settings;
    return `<div class="group">${srow("reco","Style","")}<div class="row set-sub">${sseg("explore",String(s.explore),[["0","Valeurs sûres"],["1","Équilibré"],["2","Aventurier"]],"setexplore")}</div>${srow("ctx","Selon le moment",sw(s.ctx!==false,"setctx","Suggestions selon le moment"))}${srow("na","Inclure le sans alcool",sw(!!s.na,"setna","Inclure le sans alcool"))}${srow("star","Rappels « Alors, ce … ? »",sw(s.remind!==false,"setremind","Rappels de note"))}${srow("quiz","Inclure les créations à tester",sw(s.untested!==false,"setuntested","Inclure les créations à tester"))}</div><div class="gf">${["Valeurs sûres : surtout des cocktails proches de ce que tu aimes déjà.","Équilibré : tes favoris, avec une découverte de temps en temps.","Aventurier : davantage de découvertes hors de tes habitudes."][s.explore]} « Selon le moment » favorise l’apéro, les cocktails chauds en hiver ou les recettes rapides en semaine.</div><div class="sp16"></div><div class="group">${srow("brain","Réinitialiser l’apprentissage","","resetlearn")}</div>`; },
    ()=>["Valeurs sûres","Équilibré","Aventurier"][S.settings.explore]||""],
  bar:["Bar et recettes","unit",()=>{ const s=S.settings;
    return `<div class="group">${srow("unit","Unités","")}<div class="row set-sub">${sseg("unit",s.unit,[["cl","Centilitres"],["ml","Millilitres"]],"unit2")}</div>${srow("money","Devise","")}<div class="row set-sub">${sseg("cur",s.cur||"CHF",[["CHF","Franc suisse"],["EUR","Euro"]],"setcur")}</div>${srow("unit","Verres par défaut","")}<div class="row set-sub">${sseg("glasses",String(s.glasses||1),[["1","1 verre"],["2","2 verres"],["4","4 verres"]],"setglasses")}</div>${srow("clock","Écran allumé en préparation",sw(s.wake!==false,"setwake","Écran allumé en préparation"))}${srow("basics","Contenu additionnel",`<span class="val">${BASICS.filter(has).length} basiques</span>`,"basics")}</div>`; },
    ()=>S.settings.unit==="ml"?"Millilitres":"Centilitres"],
  data:["Données","up",()=>`<div class="group">${srow("up","Exporter une sauvegarde","","export")}${srow("down","Importer une sauvegarde","","import")}</div><div class="gf">Ton bar, tes notes et ton historique se synchronisent avec ton compte quand c’est possible, et restent aussi sur cet appareil.</div><div class="sp16"></div><div class="group">${srow("trash",`<span style="color:var(--red)">Tout réinitialiser</span>`,"","reset")}</div>`,
    ()=>""]
};
Object.assign(ACT,{ setgroup:(d)=>{ const g=SET_GROUPS[d.g]; if(g) subSheet(g[0],g[2]); } });
{ const _ss=settingsSheet;
  settingsSheet=function(){ _ss(); const sh=SHEETS[SHEETS.length-1]; if(!sh) return; const r0=sh.render;
    sh.render=()=>{ const o=r0(), b=o.body, cut=b.indexOf('<div class="gh">Apparence</div>'), ab=b.indexOf('<div class="gh">À propos</div>'); if(cut<0||ab<0) return o;
      const rows=[["look"],["snd"],["reco"],["bar"]].map(([k])=>{ const g=SET_GROUPS[k]; return srow(g[1],g[0],`<span class="val">${esc(g[3]())}</span>`,"setgroup",`data-g="${k}"`); }).join("")+srow("home","Accueil",`<span class="val">${S.settings.home.filter(x=>x[1]).length} sections</span>`,"homeedit");
      o.body=b.slice(0,cut)+`<div class="gh">Préférences</div><div class="group">${rows}</div><div class="gh">Données</div><div class="group">${srow("up","Sauvegarde et réinitialisation","","setgroup",'data-g="data"')}</div>`+b.slice(ab);
      return o; };
    paintSheet(sh); };
}
