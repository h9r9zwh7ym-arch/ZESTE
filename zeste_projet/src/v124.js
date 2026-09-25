// ================= ALCOOLÉMIE (indicative) =================
// Bulle discrète sur « Aujourd'hui », qui n'apparaît que si tu as bu quelque chose récemment et disparaît
// d'elle-même à zéro. Formule de Widmark, simplifiée à dessein (voir la phrase dans Paramètres > À propos) :
// ce n'est qu'une estimation, jamais une mesure, et l'app ne prétend pas le contraire.
const BAC_DENSITY=0.789;   // g d'éthanol pur par ml
const BAC_R=0.66;          // facteur de Widmark, valeur moyenne (pas de distinction homme/femme, pour rester léger)
const BAC_BETA=0.15;       // ‰ éliminés par heure, valeur usuelle
function gramsOf(ml,abv){ return Math.max(0,ml)*Math.max(0,abv)/100*BAC_DENSITY; }
// Événements des ~30 dernières heures seulement : au-delà, le taux est de toute façon revenu à zéro,
// inutile de reparcourir tout l'historique de l'app à chaque rendu.
function bacEventsRaw(){
  const cutoff=Date.now()-30*36e5, out=[];
  S.hist.forEach(h=>{ if(h.t<cutoff) return; const r=RMAP[h.id]; if(!r||r.na) return; const m=metricsR(r); if(m.abv<=0) return; out.push({t:h.t,g:gramsOf(m.vol,m.abv)}); });
  (S.drinks||[]).forEach(d=>{ if(d.t<cutoff) return; out.push({t:d.t,g:gramsOf(d.ml,d.abv)}); });
  return out.sort((a,b)=>a.t-b.t);
}
function bacState(){
  const evs=bacEventsRaw(); if(!evs.length) return {any:false};
  const w=S.settings.weightKg; if(!w) return {any:true,ready:false};
  let bac=0, tPrev=evs[0].t;
  evs.forEach(e=>{ bac=Math.max(0,bac-BAC_BETA*(e.t-tPrev)/36e5)+e.g/(w*BAC_R); tPrev=e.t; });
  const now=Date.now(), cur=Math.max(0,bac-BAC_BETA*(now-tPrev)/36e5);
  if(cur<=0.01) return {any:true,ready:true,active:false};
  return {any:true,ready:true,active:true,perMille:cur,zeroAt:now+cur/BAC_BETA*36e5};
}
function zeroLabel(ts){ const d=new Date(ts), n=new Date(), h=d.getHours(), m=d.getMinutes(), t=h+"h"+(m<10?"0":"")+m;
  return d.toDateString()!==n.toDateString()?"demain "+t:t; }
IC.drop=`<svg viewBox="0 0 24 24"><path d="M12 3c3.2 4.7 7 9.2 7 12.6A7 7 0 1 1 5 15.6C5 12.2 8.8 7.7 12 3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
function bacCard(){
  const st=bacState(); if(!st.any) return "";
  if(!st.ready) return `<button class="card bac-card bac-setup tap" data-a="settings" style="display:flex;gap:12px;align-items:center;text-align:left;width:calc(100% - 32px)"><span class="bac-ic">${IC.drop}</span><div class="grow"><b>Taux d’alcoolémie</b><span class="bac-t">Renseigne ton poids dans les réglages pour l’estimer</span></div>${IC.chev}</button>`;
  if(!st.active) return "";
  return `<div class="card bac-card" id="bac-card"><div class="bac-row"><span class="bac-ic">${IC.drop}</span><div class="grow"><b class="bac-v">${num(Math.round(st.perMille*10)/10)} ‰</b><span class="bac-t">Retour à zéro vers ${zeroLabel(st.zeroAt)}</span></div><button class="link" data-a="bacadd">+ boisson</button></div><div class="bac-note">Estimation, pas une mesure exacte.</div></div>`;
}
// Insérée juste avant le bouton « Personnaliser l'accueil » : discrète, pas dans les sections qu'on peut réordonner.
const _vTodayBac=vToday;
vToday=function(){
  const h=_vTodayBac(), bc=bacCard(); if(!bc) return h;
  const marker='<div class="sp24"></div><div class="btn-row"><button class="btn gray home-edit"';
  return h.replace(marker, bc+marker);
};
// Mise à jour discrète toutes les minutes : le chiffre s'affine, et la bulle disparaît d'elle-même à zéro.
setInterval(()=>{ if(TAB!=="today") return; const el=document.getElementById("bac-card"), st=bacState();
  if(!el){ if(st.any){ dirty.today=1; renderView("today"); } return; }
  if(!st.active){ el.classList.add("bac-gone"); setTimeout(()=>{ if(TAB==="today") renderView("today"); },420); }
  else { const v=el.querySelector(".bac-v"); if(v) v.textContent=num(Math.round(st.perMille*10)/10)+" ‰"; const t=el.querySelector(".bac-t"); if(t) t.textContent="Retour à zéro vers "+zeroLabel(st.zeroAt); }
},60000);

// ---------- Ajouter une boisson qui n'est pas une recette de l'app (bière, vin…) ----------
const BAC_PRESETS=[["Bière",5],["Vin",12.5],["Fort",40]];
function bacAddSheet(){
  let abv=5, ml=330;
  const sh=openSheet(()=>({title:"Autre boisson",
    body:`<p class="body" style="margin-bottom:12px">Pour affiner ton estimation avec ce que tu bois en dehors de l’app.</p>
      <div class="chips" style="flex-wrap:wrap">${BAC_PRESETS.map(([n,d])=>`<button class="chip ${abv===d?"on":""}" data-a="bacpreset" data-d="${d}">${n}</button>`).join("")}</div>
      <div class="group" style="margin-top:10px"><div class="row"><div class="grow">Degré</div><div class="stepper"><button data-a="bacdeg" data-d="-0.5" aria-label="Moins">${IC.minus}</button><span>${num(abv)} %</span><button data-a="bacdeg" data-d="0.5" aria-label="Plus">${IC.plus}</button></div></div>
      <div class="row"><div class="grow">Quantité</div><div class="stepper"><button data-a="bacml" data-d="-30" aria-label="Moins">${IC.minus}</button><span>${fmtMl(ml)}</span><button data-a="bacml" data-d="30" aria-label="Plus">${IC.plus}</button></div></div></div>`,
    foot:`<button class="btn" data-a="bacconfirm">Ajouter</button>`}),{short:true});
  sh.bacGet=()=>({abv,ml});
  sh.bacSet=(a,m)=>{ if(a!=null) abv=a; if(m!=null) ml=m; paintSheet(sh); };
}
Object.assign(ACT,{
  bacadd:()=>bacAddSheet(),
  bacpreset:(d)=>{ const sh=SHEETS[SHEETS.length-1]; if(sh&&sh.bacSet) sh.bacSet(+d.d,null); },
  bacdeg:(d)=>{ const sh=SHEETS[SHEETS.length-1]; if(!sh||!sh.bacGet) return; const {abv}=sh.bacGet(); sh.bacSet(Math.max(0.5,Math.min(80,Math.round((abv+ +d.d)*10)/10)),null); },
  bacml:(d)=>{ const sh=SHEETS[SHEETS.length-1]; if(!sh||!sh.bacGet) return; const {ml}=sh.bacGet(); sh.bacSet(null,Math.max(30,ml+ +d.d)); },
  bacconfirm:()=>{ const sh=SHEETS[SHEETS.length-1]; if(!sh||!sh.bacGet) return; const {abv,ml}=sh.bacGet();
    S.drinks=(S.drinks||[]).filter(x=>x.t>Date.now()-30*36e5); S.drinks.push({abv,ml,t:Date.now()});
    closeSheet(); changed(); toast("Boisson ajoutée"); }
});

// ---------- Poids, dans les réglages : nécessaire pour l'estimation, à côté du prénom ----------
document.addEventListener("change",e=>{ const t=e.target; if(t.id==="bac-w-set"){ const v=parseFloat(t.value); if(v>=30&&v<=200){ S.settings.weightKg=Math.round(v); changed(); } else if(!t.value){ delete S.settings.weightKg; changed(); } } });
// Redéfinition complète (comme trophyGrid en 1.20) : ajoute la ligne Poids et la phrase sur le taux d'alcoolémie.
// ICS n'est initialisé que plus loin (ui_final.js) : on l'enrichit ici, au moment où la feuille s'ouvre, pas au chargement du script.
settingsSheet=function(){
  ICS.weight=ICS.weight||["#5AC8FA",`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="#fff" stroke-width="2"/><path d="M8.5 12a3.5 3.5 0 0 1 7 0" fill="none" stroke="#fff" stroke-width="1.8"/></svg>`];
  openSheet(()=>{ const s=S.settings, MN={auto:"Automatique",matin:"Matin",aprem:"Après-midi",apero:"Apéro",soir:"Soir",nuit:"Nuit"}, PN={complet:"Complet",standard:"Standard",reduit:"Réduit",perso:"Personnalisé"};
    let b=`<div class="set-hero"><div class="set-logo">${glassSVG(RMAP.negroni)}</div><div><b>Zeste</b><span>${RECS.filter(r=>!r.mine).length} recettes, ton bar, tes goûts</span></div></div>`;
    b+=`<div class="gh">Toi</div><div class="group">${srow("user","Prénom",`<input id="uname" class="set-in" value="${esc(s.name||"")}" placeholder="Facultatif" maxlength="20" autocomplete="given-name">`)}${srow("weight","Poids",`<input id="bac-w-set" class="set-in" type="number" inputmode="numeric" value="${s.weightKg||""}" placeholder="kg" min="30" max="200" style="width:64px">`)}${srow("quiz",S.quiz?"Refaire le quiz de goût":"Faire le quiz de goût",`<span class="val">${S.quiz?"Fait":""}</span>`,"quiz")}</div><div class="gf">Le poids sert uniquement à estimer ton taux d’alcoolémie sur « Aujourd’hui », une fois que tu as préparé un cocktail.</div>`;
    b+=`<div class="gh">Apparence</div><div class="group">${srow("theme","Thème","")}<div class="row set-sub">${sseg("theme",s.theme||"auto",[["auto","Système"],["light","Clair"],["dark","Sombre"]],"settheme")}</div>${srow("txt","Taille du texte","")}<div class="row set-sub">${sseg("txt",String(s.txt||"auto"),[["auto","Système"],["1","Standard"],["1.15","Grand"],["1.3","Très grand"]],"settxt")}</div>${srow("sky","Ambiance selon l’heure",sw(s.ambiance!==false,"setamb","Ambiance selon l’heure"))}${s.ambiance!==false?srow("clock","Aperçu d’un moment",`<span class="val">${(s.moment||"auto")==="auto"?"Heure du téléphone":MN[s.moment]}</span>`,"momentsheet"):""}</div><div class="gf">Le ciel de l’accueil suit l’heure de ton téléphone : matin, après-midi, heure de l’apéro, soirée et nuit. Un aperçu choisi ici ne dure que jusqu’à la prochaine ouverture de l’app.</div>`;
    b+=`<div class="gh">Sons</div><div class="group">${srow("snd","Sons",sw(s.sound!==false,"setsound","Sons"))}${s.sound!==false?`${srow("snd","Volume","")}<div class="row set-sub">${sseg("vol",String(s.vol??0.7),[["0.35","Doux"],["0.7","Normal"],["1","Fort"]],"sndvol")}</div><button class="row tap" data-a="soundtest" style="--inset:58px">${sic("snd")}<div class="grow">Écouter un exemple</div></button>`:""}</div><div class="gf">Glaçons, shaker, versement, trophées… Si ton iPhone est en mode silencieux, les sons restent coupés.</div>`;
    b+=`<div class="gh">Animations</div><div class="group">${srow("anim","Niveau","")}<div class="row set-sub">${sseg("fxp",fxPreset(),[["complet","Complet"],["standard","Standard"],["reduit","Réduit"]],"setfxp")}</div>${srow("anim","Réglages détaillés",`<span class="val">${PN[fxPreset()]}</span>`,"fxsheet")}</div>${REDUCED.matches?`<div class="gf">Ton iPhone demande de réduire les animations : Zeste s’y conforme.</div>`:""}`;
    b+=`<div class="gh">Accueil</div><div class="group">${srow("home","Sections et ordre",`<span class="val">${s.home.filter(x=>x[1]).length} actives</span>`,"homeedit")}</div>`;
    b+=`<div class="gh">Suggestions</div><div class="group">${srow("reco","Style","")}<div class="row set-sub">${sseg("explore",String(s.explore),[["0","Valeurs sûres"],["1","Équilibré"],["2","Aventurier"]],"setexplore")}</div>${srow("ctx","Selon le moment",sw(s.ctx!==false,"setctx","Suggestions selon le moment"))}${srow("na","Inclure le sans alcool",sw(!!s.na,"setna","Inclure le sans alcool"))}${srow("star","Rappels « Alors, ce … ? »",sw(s.remind!==false,"setremind","Rappels de note"))}${srow("quiz","Inclure les créations à tester",sw(s.untested!==false,"setuntested","Inclure les créations à tester"))}${srow("brain","Réinitialiser l’apprentissage","","resetlearn")}</div><div class="gf">${["Valeurs sûres : surtout des cocktails proches de ce que tu aimes déjà.","Équilibré : tes favoris, avec une découverte de temps en temps.","Aventurier : davantage de découvertes hors de tes habitudes."][s.explore]} « Selon le moment » favorise l’apéro, les cocktails chauds en hiver ou les recettes rapides en semaine.</div>`;
    b+=`<div class="gh">Bar et recettes</div><div class="group">${srow("unit","Unités","")}<div class="row set-sub">${sseg("unit",s.unit,[["cl","Centilitres"],["ml","Millilitres"]],"unit2")}</div>${srow("money","Devise","")}<div class="row set-sub">${sseg("cur",s.cur||"CHF",[["CHF","Franc suisse"],["EUR","Euro"]],"setcur")}</div>${srow("unit","Verres par défaut","")}<div class="row set-sub">${sseg("glasses",String(s.glasses||1),[["1","1 verre"],["2","2 verres"],["4","4 verres"]],"setglasses")}</div>${srow("clock","Écran allumé en préparation",sw(s.wake!==false,"setwake","Écran allumé en préparation"))}${srow("basics","Contenu additionnel",`<span class="val">${BASICS.filter(has).length} basiques</span>`,"basics")}</div>`;
    b+=`<div class="gh">Données</div><div class="group">${srow("up","Exporter une sauvegarde","","export")}${srow("down","Importer une sauvegarde","","import")}${srow("trash",`<span style="color:var(--red)">Tout réinitialiser</span>`,"","reset")}</div><div class="gf">Ton bar, tes notes et ton historique se synchronisent avec ton compte quand c’est possible, et restent aussi sur cet appareil.</div>`;
    b+=`<div class="gh">À propos</div><div class="group">${srow("info","Version",`<span class="val">${APP_VERSION}</span>`)}${srow("info","Recettes",`<span class="val">${RECS.filter(r=>!r.mine).length}, dont ${RECS.filter(r=>r.na).length} sans alcool</span>`)}</div><div class="about-foot"><div class="af-logo">${glassSVG(RMAP.negroni)}</div><b>Zeste ${APP_VERSION}</b><span>${esc(COPYRIGHT)}</span><span>À consommer avec modération. Santé !</span><span>Le taux d’alcoolémie affiché est une estimation, pas une mesure : ne t’y fie jamais pour prendre le volant.</span></div>`;
    return {title:"Paramètres",right:`<button class="link" data-a="closesheet" style="font-weight:600">OK</button>`,body:b};
  });
};
