// ================= ZESTE 1.39 : hiérarchie visuelle =================
// Trois niveaux par écran, pas plus :
//  1. un point focal (verre du soir, verre du labo, compteurs du bar, profil de goût) ;
//  2. les sections principales : titre de 22 px et contenu en carte ;
//  3. le reste : petits en-têtes de liste, lignes qui ouvrent une feuille. Pas de grosse carte pour une info secondaire.
const prow=(ic,label,sub,val,act,extra="")=>`<button class="row tap" data-a="${act}" ${extra} style="--inset:58px"><span class="set-ic" style="background:var(--tint-bg)">${lu(ic)}</span><div class="grow"><div class="t">${label}</div>${sub?`<div class="s">${sub}</div>`:""}</div>${val!=null&&val!==""?`<span class="val">${val}</span>`:""}${IC.chev}</button>`;

// ---------- Profil : moi d'abord ; l'historique et les statistiques dans « Ton carnet » ----------
function profPart(title){ const h=PROF_PREV(), parts=h.split(/(?=<h2 class="sh">)/); const p=parts.find(x=>x.startsWith(`<h2 class="sh">${title}`)); if(!p) return "";
  const i=p.indexOf("</h2>"); let body=p.slice(i+5); const t=body.indexOf('<div class="sp24"></div><div class="group"><button class="row tap" data-a="settings"'); if(t>=0) body=body.slice(0,t); return body; }
let PROF_PREV=null;
function bestList(){ return rated().filter(x=>x[1]>=4).sort((a,b)=>b[1]-a[1]).map(([id])=>RMAP[id]).filter(Boolean); }
function carnetSheet(k){
  const T={best:"Tes mieux notés",hist:"Historique",fam:"Familles explorées",spi:"Tes spiritueux"};
  openSheet(()=>{ let b="";
    if(k==="best") b=`<div class="group">${bestList().map(r=>recRow(r)).join("")}</div>`;
    if(k==="hist") b=`<div class="group">${S.hist.slice(-60).reverse().filter(h=>RMAP[h.id]).map(h=>recRow(RMAP[h.id],rel(h.t))).join("")}</div>${S.hist.length>60?`<div class="gf">Les 60 derniers verres.</div>`:""}`;
    if(k==="fam"||k==="spi") b=profPart(k==="fam"?"Familles explorées":"Tes spiritueux");
    return {title:T[k],body:b||`<div class="empty"><b>Rien pour l’instant</b>Prépare et note quelques cocktails.</div>`}; });
}
Object.assign(ACT,{ carnet:(d)=>carnetSheet(d.k) });
{ const _famgo=ACT.famgo; ACT.famgo=(d,t,e)=>{ closeAll(); return _famgo(d,t,e); }; }
{ const _vp=vProfil; PROF_PREV=_vp;
  vProfil=function(){ const h=_vp();
    const parts=h.split(/(?=<h2 class="sh">)/), head=parts.shift(), sec={};
    parts.forEach(p=>{ const t=(p.match(/^<h2 class="sh">([^<]*)/)||[])[1]||"?"; sec[t]=p; });
    // la fin (récaps + Paramètres) est collée à la dernière section : on la détache
    const last=parts[parts.length-1]||"", ti=last.indexOf('<div class="sp24"></div><div class="group"><button class="row tap" data-a="settings"');
    const tail=ti>=0? last.slice(ti) : `<div class="sp24"></div></div>`;
    if(ti>=0){ const lt=(last.match(/^<h2 class="sh">([^<]*)/)||[])[1]; sec[lt]=last.slice(0,ti); }
    const nBest=bestList().length, fams=Object.keys(FAMILIES), done=new Set(distinct().map(id=>RMAP[id].fam)).size;
    const carnet=[ nBest?prow("star","Tes mieux notés","",nBest,"carnet",'data-k="best"'):"",
      S.hist.length?prow("clock","Historique",S.hist.length+" verre"+(S.hist.length>1?"s":"")+" préparé"+(S.hist.length>1?"s":""),"","carnet",'data-k="hist"'):"",
      prow("map","Familles explorées","",done+" sur "+fams.length,"carnet",'data-k="fam"'),
      sec["Tes spiritueux"]?prow("bottle-wine","Tes spiritueux","","","carnet",'data-k="spi"'):"" ].join("");
    const rc=recapRows();
    return head+(sec["Ton profil de goût"]||"")+(sec["Ton prochain coup de cœur"]||"")+(sec["Trophées"]||"")
      +(rc?`<h2 class="sh">Tes récaps</h2><div class="group">${rc}</div>`:"")
      +`<h2 class="sh">Ton carnet</h2><div class="group">${carnet}</div>`+tail;
  };
}
// les récaps en lignes (les grandes cartes vertes écrasaient tout l'écran)
function recapRows(){
  const now=new Date(), y=now.getFullYear(), m=now.getMonth(), AM=availableMonths(), cur=AM.find(x=>x.y===y&&x.m===m), pY=m?y:y-1, pM=m?m-1:11, prev=AM.find(x=>x.y===pY&&x.m===pM), L=[];
  if(cur&&cur.n>=3) L.push(prow("sparkles",`${MOIS[m].replace(/^./,c=>c.toUpperCase())}, jusqu’ici`,`${cur.n} cocktails ce mois-ci`,"","rwmonth",`data-y="${y}" data-m="${m}"`));
  else if(prev) L.push(prow("sparkles",`Ton mois de ${MOIS[pM]}`,`${prev.n} cocktail${prev.n>1?"s":""} préparé${prev.n>1?"s":""}`,"","rwmonth",`data-y="${pY}" data-m="${pM}"`));
  if(rewindEligible()) L.push(prow("sparkles","Zeste Rewind","Ton année en cocktails","","rewind"));
  return L.join("");
}
// trophées : trois médailles et la collection à un toucher (les compteurs par métal sont dans la collection)
{ const _ts=trophySummary; trophySummary=function(){ let h=_ts(); h=h.replace(/<div class="tro-tiers">[\s\S]*?<\/div>/,"");
    const a=h.indexOf('<div class="trophies">'), b=h.indexOf('</div><div class="sp8"></div>',a); if(a<0||b<0) return h;
    const tiles=h.slice(a+22,b).split(/(?=<button class="trophy)/).slice(0,3).join("");
    return h.slice(0,a)+`<div class="trophies">${tiles}</div>`+h.slice(b+6); }; }

// ---------- Bar : les catégories sont des en-têtes de liste, pas des sections ; les basiques en une ligne ----------
{ const _vb=vBar;
  vBar=function(){ let h=_vb();
    h=h.replace(/<h2 class="sh"><span style="display:flex;align-items:center;gap:10px">([\s\S]*?)<\/span><span class="more" style="color:var\(--label2\)">(\d+)<\/span><\/h2><div class="sp8"><\/div>/g,`<div class="list-h cat-h"><b>$1</b><span>$2</span></div>`)
       .replace('<h2 class="sh">À racheter</h2><div class="sh-sub">Bouteilles vides</div>','<div class="list-h cat-h"><b>À racheter</b><span></span></div>');
    h=h.replace(/<h2 class="sh">Additionnel<\/h2><div class="sh-sub">[^<]*<\/div><div class="card">[\s\S]*?<b[^>]*>(\d+) basiques<\/b>[\s\S]*?<div class="basics-line">([\s\S]*?)<\/div><\/div>/,
      (m,n,line)=>`<div class="list-h cat-h"><b>Additionnel</b><span></span></div><div class="group"><button class="row tap" data-a="basics" style="--inset:20px"><div class="grow"><div class="t">Basiques toujours disponibles</div><div class="s">${line.replace(/\.$/,"")}</div></div><span class="val">${n}</span>${IC.chev}</button></div>`);
    h=h.replace(/<div class="stat t"><b id="st-m">([^<]*)<\/b><span>([^<]*)<\/span><\/div>/,`<button class="stat t" data-a="gofaisables"><b id="st-m">$1</b><span>$2 ›</span></button>`);
    return h; };
}
Object.assign(ACT,{ gofaisables:()=>{ CF.main="ok"; CF.q=""; CF.mode="list"; CF.fam=[]; CF.base=[]; CF.type=[]; CF.x=[]; dirty.cocktails=1; switchTab("cocktails"); } });

// ---------- Labo : le verre, puis les ingrédients (l'essentiel), puis « Le service » en sous-réglages ----------
{ const _vc=vCompose;
  vCompose=function(){ const h=_vc(), at=n=>h.indexOf(`<h2 class="sh lab-h"><span class="lab-n">${n}</span>`);
    const i1=at(1),i2=at(2),i3=at(3),i4=at(4),i5=at(5); if([i1,i2,i3,i4,i5].some(x=>x<0)||!(i1<i2&&i2<i3&&i3<i4&&i4<i5)) return h;
    const pre=h.slice(0,i1), s1=h.slice(i1,i2), s2=h.slice(i2,i3), s3=h.slice(i3,i4), s4=h.slice(i4,i5), r5=h.slice(i5);
    const mm=r5.match(/^<h2 class="sh lab-h"><span class="lab-n">5<\/span>La méthode<\/h2><div class="seg" data-k="labm">[\s\S]*?<\/div>/); if(!mm) return h;
    let tail=r5.slice(mm[0].length);
    const sub=(s,name)=>s.replace(/^<h2 class="sh lab-h"><span class="lab-n">\d<\/span>[^<]*/,`<div class="lab-sub">${name}`).replace("</h2>","</div>");
    // point de départ conseillé quand le verre est vide : juste sous le verre, pas tout en bas
    let start=""; tail=tail.replace(/<div class="sp16"><\/div><div class="card lab-start">[\s\S]*?<div class="starter">([\s\S]*?)<\/div><\/div>/,(m,chips)=>{ start=`<div class="lab-classics"><span>Ou pars d’un classique</span><div class="starter">${chips}</div></div>`; return ""; });
    const ing=s3.replace(/^<h2 class="sh lab-h"><span class="lab-n">3<\/span>/,'<h2 class="sh lab-h">').replace("Touche une bouteille pour verser, ou choisis dans toute la carte.","Touche une bouteille pour verser.");
    return pre+start+ing+`<h2 class="sh">Le service</h2>`+sub(s2,"Verre")+sub(s4,"Glace et décor")+sub(mm[0],"Méthode")+sub(s1,"Style")+tail;
  };
}
