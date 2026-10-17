// ================= ZESTE 1.38 : chaque chose à sa place =================
// Un rôle par onglet : Aujourd'hui = que boire maintenant ; Cocktails = chercher ; Bar = ce que j'ai ;
// Labo = créer et fabriquer ; Profil = moi (goûts, historique, trophées, récaps). Une information à un seul endroit.

// ---------- Aujourd'hui : plus de récap ni d'achat (ils vivent dans le Profil et le Bar) ----------
{ const _sg=HOME_SEC.suggest; HOME_SEC.suggest=(ctx)=>{ const h=_sg(ctx), i=h.indexOf('<div class="rw-in-foryou">'); return i<0?h:h.slice(0,i); }; }
HOME_SEC.duo=({list})=>`<div class="duo one"><button class="duo-c" data-a="roulette"><div class="di">${IC.dice}</div><div class="grow"><div class="dt">Surprends-moi</div><div class="ds">${list.length?"Un cocktail au hasard parmi tes idées":"Un cocktail au hasard dans toute la carte"}</div></div>${IC.chev}</button></div>`;
HOME_N.duo="Surprends-moi";
// le titre dit déjà « Ce soir » : la carte ne répète pas « Pour ce soir »
{ const _vt=vToday; vToday=function(){ const h=_vt(); const t=(h.match(/<h1 class="lt">([^<]*)<\/h1>/)||[])[1], k=(h.match(/<div class="kick">([^<]*)<\/div>/)||[])[1];
    return t&&k&&norm(k).includes(norm(t))? h.replace(`<div class="kick">${k}</div>`,"") : h; }; }

// ---------- Cocktails : « Sans alcool » est un filtre (plus de « 0 % » à part), une famille n'apparaît plus deux fois ----------
const FAM_AS_TYPE={bulles:"spritz",chaud:"chaud",shot:"shot",na:"sans"};
function naToType(){ if(CF.main==="na"){ CF.main=""; CF.type=(CF.type||[]).filter(x=>x!=="sans").concat(["sans"]); } }
{ const _cr=cocktailsResults;
  cocktailsResults=function(){ naToType(); let h=_cr();
    h=h.replace(/<button class="[^"]*" data-a="cmain" data-v="na">0 %<\/button>/,"").replace('class="seg small4"','class="seg small3"');
    if(CF.type&&CF.type.length===1&&CF.type[0]==="sans"&&!/na-banner/.test(h)) h=h.replace(/(<\/div>)(<div class="list-h">|<div class="group">|<div class="empty">)/,`$1<div class="na-banner"><b>Zéro degré, plein de goût</b><span>Des recettes équilibrées comme de vrais cocktails.</span></div>$2`);
    return h; };
}
Object.assign(ACT,{
  nafilter:()=>{ CF.main=""; CF.type=["sans"]; CF.fam=[]; CF.q=""; CF.mode="list"; dirty.cocktails=1; switchTab("cocktails"); },
  famgo:(d)=>{ const t=FAM_AS_TYPE[d.f]; CF.fam=t?[]:[d.f]; CF.type=t?[t]:[]; CF.main=""; CF.q=""; CF.mode="list"; dirty.cocktails=1; switchTab("cocktails"); toast("Famille : "+FAMILIES[d.f]); }
});
{ const _fs=filterSheet;
  filterSheet=function(){ CF.fam=CF.fam.filter(f=>{ const t=FAM_AS_TYPE[f]; if(t&&!CF.type.includes(t)) CF.type.push(t); return !t; }); _fs();
    const sh=SHEETS[SHEETS.length-1]; if(!sh) return; const r0=sh.render;
    sh.render=()=>{ const o=r0(); o.body=o.body.replace(/<button class="chip[^"]*" data-a="tf" data-g="fam" data-k="(bulles|chaud|shot|na)">[^<]*<\/button>/g,"").replace('<div class="gh">Type de cocktail</div>','<div class="gh">Style</div>'); return o; };
    paintSheet(sh); };
}

// ---------- Bar : deux façons de voir le bar (Liste, Étagère) ; « Presque vides » devient une ligne ----------
const barIds=()=>Object.keys(S.stock).filter(id=>ING[id]&&!ING[id].basic);
const lowCount=()=>barIds().filter(id=>tracked(id)&&S.stock[id]>0&&S.stock[id]<=2).length;
{ const _vb=vBar;
  vBar=function(){ if(S.settings.barView==="low") S.settings.barView="list"; let h=_vb();
    h=h.replace(/<button class="[^"]*" data-a="barview" data-v="low">Presque vides<\/button>/,"")
       .replace(/<div class="gf" style="margin-top:var\(--z-s1\)">Astuce : [^<]*<\/div>/,"");
    const n=lowCount();
    if(n&&(S.settings.barView||"list")==="list") h=h.replace(/(<div class="seg" data-k="barview"[^>]*>[\s\S]*?<\/div>)/,`$1<div class="group low-link"><button class="row tap" data-a="lowsheet" style="--inset:20px"><div class="grow">Presque vides</div><span class="val">${n}</span>${IC.chev}</button></div><div class="sp8"></div>`);
    return h; };
}
Object.assign(ACT,{ lowsheet:()=>openSheet(()=>({title:"Presque vides",body:lowView(barIds())})) });

// ---------- Labo : Composer | Fait maison (préparations en cours + recettes et techniques) ----------
function homemadeView(){
  const P=(S.preps||[]).slice().sort((a,b)=>daysLeft(a)-daysLeft(b)), withP=TECH.filter(t=>t.p&&t.p.length), gest=TECH.filter(t=>!t.p||!t.p.length);
  const row=t=>`<button class="row tap" data-a="tech" data-id="${t.id}"><div class="grow"><div class="t">${esc(t.n)}</div><div class="s">${esc(t.t)}, ${esc(t.lvl.toLowerCase())}</div></div>${IC.chev}</button>`;
  let o="";
  if(P.length) o+=`<h2 class="sh">En cours</h2><div class="group">${P.map(prepRow).join("")}</div><div class="gf">Durées indicatives au frigo. Au moindre doute (trouble, odeur, moisissure), jette.</div>`;
  o+=`<h2 class="sh">À faire soi-même</h2><div class="group">${withP.map(row).join("")}</div>`;
  if(gest.length) o+=`<h2 class="sh">Gestes de bar</h2><div class="group">${gest.map(row).join("")}</div>`;
  return o+`<div class="sp16"></div><div class="btn-row"><button class="btn sec" data-a="newprep">${IC.plus}Noter une autre préparation</button></div>`;
}
vLabo=function(){ if(LT==="tech"||LT==="prep") LT="home";
  let o=nav("Labo")+`<div class="content"><h1 class="lt">Labo</h1><div class="seg">${[["compose","Composer"],["home","Fait maison"]].map(([k,n])=>`<button class="${LT===k?"on":""}" data-a="lt" data-t="${k}">${n}</button>`).join("")}</div>`;
  o+= LT==="home"? homemadeView() : vCompose();
  return o+`<div class="sp24"></div></div>`; };

// ---------- Profil : les récaps (mois et année) réunis au même endroit ----------
function recapCards(){
  const now=new Date(), y=now.getFullYear(), m=now.getMonth(), AM=availableMonths(), cur=AM.find(x=>x.y===y&&x.m===m), pY=m?y:y-1, pM=m?m-1:11, prev=AM.find(x=>x.y===pY&&x.m===pM), cards=[];
  const card=(a,k,t,s,extra="")=>`<button class="rw-card month" data-a="${a}" ${extra}><div class="rw-bg"></div><div class="rw-in"><div class="rw-k">${IC.sparkle}${k}</div><div class="rw-t">${t}</div><div class="rw-s">${s}</div></div><div class="rw-play">${IC.play}</div></button>`;
  if(cur&&cur.n>=3) cards.push(card("rwmonth","Ton mois en cours",`${MOIS[m].replace(/^./,c=>c.toUpperCase())}, jusqu’ici`,`${cur.n} cocktails depuis le 1er ${MOIS[m]}.`,`data-y="${y}" data-m="${m}"`));
  else if(prev) cards.push(card("rwmonth","Récap du mois",`Ton mois de ${MOIS[pM]}`,`${prev.n} cocktail${prev.n>1?"s":""} préparé${prev.n>1?"s":""}.`,`data-y="${pY}" data-m="${pM}"`));
  if(rewindEligible()) cards.push(`<button class="rw-card" data-a="rewind"><div class="rw-bg"></div><div class="rw-in"><div class="rw-k">${IC.sparkle}Zeste Rewind</div><div class="rw-t">Ton année en cocktails</div><div class="rw-s">Revis ton année et partage ta carte.</div></div><div class="rw-play">${IC.play}</div></button>`);
  return cards.length? `<h2 class="sh">Tes récaps</h2>${cards.join('<div class="sp8"></div>')}` : "";
}
{ const _vp=vProfil;
  vProfil=function(){ let h=_vp();
    h=h.replace(/<div class="sp16"><\/div><button class="rw-card" data-a="rewind"[\s\S]*?<\/button>/,"");
    const rc=recapCards(), at=h.indexOf('<div class="sp24"></div><div class="group"><button class="row tap" data-a="settings"');
    return rc&&at>=0? h.slice(0,at)+rc+h.slice(at) : h; };
}

// ---------- Paramètres › Suggestions : l'explication rejoint les réglages qu'elle éclaire ----------
{ const g=SET_GROUPS.reco, body=g[2]; g[2]=()=>body()+(typeof guideHTML==="function"?guideHTML():""); }
