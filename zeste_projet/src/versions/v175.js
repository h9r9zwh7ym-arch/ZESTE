// ================= ZESTE 1.71 : « Mon bar » plus utile =================
// 1. « À finir » : les bouteilles ouvertes qui s'abîment (bulles, vins, vermouths…), avec les jours restants.
// 2. « Le meilleur achat » sorti du repli (classement de bottleRecs, donc selon tes goûts).
// 3. Sous chaque bouteille : combien de cocktails faisables l'utilisent.
// 4. Fiche bouteille : faisables, à une bouteille près, autonomie, et ce que tu perdrais sans elle.

// Durées de conservation une fois ouverte (bouchée, au frais), en jours. Repères usuels des producteurs et sommeliers :
// mousseux 1 à 3 j, vin tranquille 3 à 5 j, bière 1 j, cidre et poiré 2 à 3 j, vermouths et Lillet ≈ 1 mois,
// porto rouge ou blanc 4 à 6 semaines, xérès (fino) ≈ 1 à 2 semaines, saké 1 à 2 semaines. On garde la borne prudente.
const KEEP={prosecco:3,champagne:3,prosecco_0:3,cidre:3,poire:3,biere:1,biere_blanche:1,ipa:1,biere_0:1,
  vin_blanc:4,vin_rouge:4,vin_rose:4,sake:14,sherry:14,vermouth_rouge:30,vermouth_dry:30,vermouth_blanc:30,lillet:30,porto:30,porto_blanc:30};
// Jours restants (négatif : dépassé) pour une bouteille ouverte et suivie ; null sinon
function keepLeft(id){ const t=(S.opened||{})[id]; if(!KEEP[id]||!t||!ING[id]||!tracked(id)||!(S.stock[id]>0)||S.stock[id]>=4) return null;
  return KEEP[id]-Math.floor((Date.now()-t)/864e5); }
// À montrer : les courtes durées tout de suite, les longues dans leur dernier quart ; les plus urgentes d'abord
function toFinish(){ return Object.keys(KEEP).map(id=>[id,keepLeft(id)]).filter(([id,l])=>l!=null&&(KEEP[id]<=4||l<=Math.ceil(KEEP[id]/4))).sort((a,b)=>a[1]-b[1]); }
function leftTxt(l){ return l<0?"à goûter avant de servir":l===0?"à finir aujourd’hui":"encore "+l+" jour"+(l>1?"s":""); }

// La date d'ouverture des bouteilles hors bulles (v118 ne suit que PERISH) : même règle, pleine → entamée
(function(){ const W=k=>{ const g=ACT[k]; if(!g) return; ACT[k]=(d,t)=>{ const id=d&&d.id, before=id!=null?S.stock[id]:undefined; const r=g(d,t);
    try{ if(id&&KEEP[id]&&!PERISH[id]){ const v=S.stock[id]; S.opened=S.opened||{};
      if(k==="refill"||v===4||v===0||v==null) delete S.opened[id]; else if(before===4&&v<4&&!S.opened[id]) S.opened[id]=Date.now(); save(); } }catch(e){}
    return r; }; };
  ["lvl","setlvl","refill","toggle"].forEach(W); })();

// Cocktails faisables qui utilisent chaque ingrédient (hors optionnels), calculé une fois par état
function makeCount(){ return memo("makeCount",()=>{ const c={}; RECS.forEach(r=>{ if(!status(r).ok) return; new Set(r.ing.filter(i=>i.r!=="opt"&&i.r!=="rinse").map(i=>i.id)).forEach(id=>c[id]=(c[id]||0)+1); }); return c; }); }

// ---------- la vue ----------
{ const _vb=vBar;
  vBar=function(){ let h=_vb(); const at=h.indexOf('<div class="bar-head one">'); if(at<0) return h;
    const end=h.indexOf("</div>",at)+6; let add="";
    const F=toFinish();
    if(F.length){ const [id,l]=F[0];
      add+=`<button class="low-line fin-line" data-a="finsheet"><span class="ol-dot"></span>À finir : ${esc(shortN(id))}, ${leftTxt(l)}${F.length>1?` (+${F.length-1})`:""}${IC.chev}</button>`; }
    // la ligne « bientôt à racheter » reste juste après l'en-tête ; « À finir » passe devant
    h=h.slice(0,end)+add+h.slice(end);
    const br=bottleRecs(); if(br.length){ const b=br[0], ex=b.rs.slice(0,2).map(r=>r.n);
      const card=`<button class="buy-card" data-a="buysheet"><div class="bc-b">${bottleSVG(b.id,4)}</div><div class="grow"><div class="bc-k">Le meilleur achat</div><div class="bc-t">${esc(shortN(b.id))} : +${b.rs.length} cocktail${b.rs.length>1?"s":""}</div><div class="bc-s">dont ${esc(ex.join(" et "))}</div></div>${IC.chev}</button>`;
      // sous les lignes d'en-tête, avant l'inventaire
      const m=h.slice(end).match(/^(?:<button class="low-line[\s\S]*?<\/button>)*/); const p=end+(m?m[0].length:0);
      h=h.slice(0,p)+card+h.slice(p);
      // et la ligne « Achats malins » du repli devient superflue
      h=h.replace(/<button class="row tap" data-a="buysheet"[\s\S]*?<\/button>/,""); }
    return h; };
}
{ const _sr=stockRow;
  stockRow=function(id){ const h=_sr(id), n=makeCount()[id]||0, l=keepLeft(id);
    const sub=[n?n+" cocktail"+(n>1?"s":""):"", l!=null&&(KEEP[id]<=4||l<=Math.ceil(KEEP[id]/4))?`<span class="fin">${leftTxt(l)}</span>`:""].filter(Boolean).join(" · ");
    return sub? h.replace(/(<button class="grow" data-a="ing" data-id="[\w]+"[^>]*><div class="t">[\s\S]*?<\/div>)/,`$1<div class="bar-n">${sub}</div>`) : h; };
}

// ---------- feuille « À finir » ----------
Object.assign(ACT,{ finsheet:()=>openSheet(()=>{ const F=toFinish(), seen=new Set();
  const blocks=F.map(([id,l])=>{ const rs=RECS.filter(r=>!seen.has(r.id)&&status(r).ok&&r.ing.some(i=>i.id===id&&i.r!=="opt")).sort((a,b)=>predict(b)-predict(a)).slice(0,3); rs.forEach(r=>seen.add(r.id));
    return `<div class="gh">${esc(ING[id].n)} · ${leftTxt(l)}</div><div class="group">${rs.length?rs.map(r=>recRow(r)).join(""):`<div class="row"><div class="grow s">Aucun cocktail faisable avec ton bar pour l’instant.</div></div>`}</div>`; }).join("");
  return {title:"À finir",body:`<p class="body" style="margin-bottom:var(--z-s2)">Ces bouteilles ouvertes perdent vite leurs arômes ou leurs bulles. De quoi les finir à ton goût :</p>${blocks||`<p class="body">Rien à finir pour l’instant.</p>`}`}; }) });

// ---------- fiche bouteille : ce qu'elle t'apporte ----------
{ const _ing=ingSheet;
  ingSheet=function(id){ const r=_ing(id); const sh=SHEETS[SHEETS.length-1]; if(!sh||!ING[id]||ING[id].basic) return r; const r0=sh.render;
    sh.render=()=>{ const o=r0(); const a=o.body.indexOf('<div class="gh">Utilisé dans'); if(a<0) return o;
      const uses=RECS.filter(r=>r.ing.some(i=>i.id===id&&i.r!=="opt"&&i.r!=="rinse"));
      const ok=uses.filter(r=>status(r).ok);
      const near=uses.filter(r=>{ const s=status(r); return !s.ok&&s.miss.length===1&&s.miss[0]!==id; }).sort((x,y)=>predict(y)-predict(x));
      const st=[[ok.length,"faisable"+(ok.length>1?"s":"")],[near.length,"à une bouteille près"]];
      if(tracked(id)&&S.stock[id]>0){ const g=glassesLeft(id); st.push([g>0?"≈ "+g:"0",g>1?"verres restants":"verre restant"]); }
      let b=`<div class="gh">Ce qu’elle t’apporte</div><div class="card ing-stats">${st.map(([v,t])=>`<div><b>${v}</b><span>${t}</span></div>`).join("")}</div>`;
      if(has(id)&&ok.length){ const sub=(ING[id].subs||[]).find(s=>s!==id&&has(s));
        b+=`<div class="gf">${sub?`Sans elle, tu pourrais la remplacer par ${esc(lc(shortN(sub)))} dans ces ${ok.length} cocktail${ok.length>1?"s":""}.`:`Sans elle, ${ok.length>1?"ces "+ok.length+" cocktails ne seraient plus faisables":"ce cocktail ne serait plus faisable"} : rien dans ton bar ne la remplace.`}</div>`; }
      const l=keepLeft(id); if(l!=null) b+=`<div class="gf fin">Ouverte : ${leftTxt(l)} (se garde ${KEEP[id]} jour${KEEP[id]>1?"s":""} au frais).</div>`;
      if(near.length) b+=`<div class="gh">À une bouteille près</div><div class="group">${near.slice(0,3).map(r=>recRow(r,"Il manque "+lc(shortN(status(r).miss[0])))).join("")}</div>`;
      // juste sous le niveau, avant le prix et le conseil
      let at=o.body.indexOf('<div class="gh">Prix'); if(at<0||at>a) at=a;
      o.body=o.body.slice(0,at)+b+o.body.slice(at); return o; };
    paintSheet(sh); return sh; };
}
