// ================= ZESTE 1.74 : Rewind des 3 mois =================
// Un récap par trimestre (janvier–mars, avril–juin, juillet–septembre, octobre–décembre), sur le modèle du récap du mois
// (rewindRange) : verres, cocktail du trimestre, mois fort, moment préféré, alcool, coup de cœur, découvertes, et une carte
// à enregistrer. Proposé sur l'accueil du 1er au 10 du mois qui suit le trimestre (au moins 3 verres), et toujours dans
// Profil > Tes récaps.
const TRIM=["janvier–mars","avril–juin","juillet–septembre","octobre–décembre"];
function quarterRange(y,q){ return [new Date(y,q*3,1).getTime(), new Date(y,q*3+3,1).getTime()]; }
function quarterLabel(y,q){ return TRIM[q]+" "+y; }
// trimestre écoulé le plus récent (au 15 janvier 2027 : octobre–décembre 2026)
function lastQuarter(now){ const d=new Date(now||Date.now()), q=Math.floor(d.getMonth()/3); return q? {y:d.getFullYear(),q:q-1} : {y:d.getFullYear()-1,q:3}; }
function quarterCount(y,q){ const [a,b]=quarterRange(y,q); return S.hist.filter(h=>h.t>=a&&h.t<b&&RMAP[h.id]).length; }
function quarterEligible(y,q){ return quarterCount(y,q)>=3; }
function quarterData(y,q){ const [a,b]=quarterRange(y,q), D=rewindRange(a,b);
  const months=[0,1,2].map(k=>{ const [ma,mb]=[new Date(y,q*3+k,1).getTime(),new Date(y,q*3+k+1,1).getTime()]; return D.H.filter(h=>h.t>=ma&&h.t<mb).length; });
  const topM=months.indexOf(Math.max(...months));
  return Object.assign({},D,{months,topM,monthNames:[0,1,2].map(k=>MOIS[q*3+k]),label:quarterLabel(y,q),y,q,tro:(S.tro||[]).length}); }
function openQuarterRewind(y,q){
  const D=quarterData(y,q), top=D.top&&RMAP[D.top.id], best=D.best&&RMAP[D.best], col=top?top.col:"#2E7A52", cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
  const slides=[];
  slides.push({c:[col,"#1A1020"],h:`<div class="rw-small">Tes 3 mois, ${esc(D.label)}</div><div class="rw-big" data-count="${D.count}">0</div><div class="rw-mid">cocktail${D.count>1?"s":""} préparé${D.count>1?"s":""}</div><div class="rw-note">${D.distinct} recette${D.distinct>1?"s":""} différente${D.distinct>1?"s":""}${D.discoveries.length?`, dont ${D.discoveries.length} découverte${D.discoveries.length>1?"s":""}`:""}</div>`});
  if(top) slides.push({c:[top.col,mix(top.col,"#000000",.6)],h:`<div class="rw-small">Ton cocktail du trimestre</div><div class="rw-glass">${glassSVG(top,{pour:true,live:1})}</div><div class="rw-name">${esc(top.n)}</div><div class="rw-note">préparé ${D.top.n} fois${S.ratings[top.id]?", noté "+S.ratings[top.id]+" sur 5":""}</div>`});
  if(D.count>=3){ const mx=Math.max(...D.months,1);
    slides.push({c:["#3A6AC0","#08102A"],h:`<div class="rw-small">Ton mois le plus festif</div><div class="rw-name">${esc(cap(D.monthNames[D.topM]))}</div><div class="rw-note">${D.months[D.topM]} verre${D.months[D.topM]>1?"s":""}${Math.max(...D.days)>1?`, et le ${JOURS[D.peakD]} est ton jour favori`:""}.</div><div class="rw-months">${D.months.map((v,k)=>`<div class="rw-m ${k===D.topM?"top":""}"><i style="--h:${Math.round(v/mx*100)}%;animation-delay:${0.2+k*0.1}s"></i><span>${esc(D.monthNames[k].slice(0,3))}</span></div>`).join("")}</div>`}); }
  if(D.bases.length){ const mx=D.bases[0][1]; slides.push({c:["#C98A2E","#2A1606"],h:`<div class="rw-small">Ton alcool du trimestre</div><div class="rw-name">${esc(D.bases[0][0])}</div><div class="rw-bars">${D.bases.slice(0,4).map(([n,v],k)=>`<div class="rw-bar"><span>${esc(n)}</span><i style="--w:${Math.round(v/mx*100)}%;animation-delay:${0.3+k*0.12}s"></i><b>${v}</b></div>`).join("")}</div>`}); }
  if(best&&best!==top) slides.push({c:[best.col,mix(best.col,"#000000",.6)],h:`<div class="rw-small">Ton coup de cœur</div><div class="rw-glass">${glassSVG(best,{pour:true,live:1})}</div><div class="rw-name">${esc(best.n)}</div><div class="rw-stars">${[1,2,3,4,5].map(k=>`<span class="${k<=S.ratings[best.id]?"on":""}" style="animation-delay:${0.5+k*0.1}s">${IC.star}</span>`).join("")}</div>`});
  if(D.avgCost!=null&&D.priced>=2) slides.push({c:["#C8A020","#1A1404"],h:`<div class="rw-small">Côté porte-monnaie</div><div class="rw-big money">${chf(D.avgCost)}</div><div class="rw-mid">le verre en moyenne</div>`});
  slides.push({c:[col,"#100A14"],end:1,h:`<div class="rw-small">C’étaient tes 3 mois</div><div class="rw-sum"><div><b>${D.count}</b><span>verres</span></div><div><b>${D.distinct}</b><span>recettes</span></div><div><b>${D.fams.length}</b><span>familles</span></div><div><b>${D.discoveries.length}</b><span>découvertes</span></div></div>${top?`<div class="rw-note">Cocktail du trimestre : <b>${esc(top.n)}</b></div>`:""}<div class="rw-actions"><button class="btn" data-a="rwsave">${IC.share}Enregistrer ma carte</button><button class="btn gray" data-a="rwclose">Terminer</button></div>`});
  RW={i:0,slides,D,quarter:{y,q},lab:{head:"MES 3 MOIS ZESTE",title:cap(TRIM[q])+" "+y,top:"mon cocktail du trimestre",file:"zeste-3-mois-"+y+"-t"+(q+1)+".png",s4:[D.discoveries.length,"découverte"+(D.discoveries.length>1?"s":"")]},timer:null,paused:false};
  let el=document.getElementById("rewind"); if(!el){ el=document.createElement("div"); el.id="rewind"; document.body.appendChild(el); }
  el.innerHTML=`<div class="rw-prog">${slides.map(()=>`<i><b></b></i>`).join("")}</div><button class="close-x rw-x" data-a="rwclose" aria-label="Fermer">${IC.x}</button><div class="rw-stage"></div><div class="rw-tap l"></div><div class="rw-tap r"></div>`;
  el.classList.add("open"); el.querySelector(".rw-tap.l").onclick=()=>rwGo(-1); el.querySelector(".rw-tap.r").onclick=()=>rwGo(1);
  const st=el.querySelector(".rw-stage"); st.onpointerdown=()=>{ RW&&(RW.paused=true); }; st.onpointerup=()=>{ RW&&(RW.paused=false); };
  rwShow(0);
}
// La carte à enregistrer : celle du Rewind annuel (rwSave), avec les libellés du trimestre (RW.lab)
Object.assign(ACT,{ rwquarter:d=>openQuarterRewind(+d.y,+d.q) });
// Accueil, sous la suggestion du soir (les récaps du mois vivent au Profil depuis la 1.38 ; celui-ci n'est là que 10 jours) :
// du 1er au 10 du mois qui suit un trimestre
function quarterCard(){ const now=new Date(); if(now.getMonth()%3!==0||now.getDate()>10) return ""; const {y,q}=lastQuarter(now); if(!quarterEligible(y,q)) return "";
    const n=quarterCount(y,q);
    return `<div class="sp16"></div><button class="rw-card month" data-a="rwquarter" data-y="${y}" data-q="${q}"><div class="rw-bg"></div><div class="rw-in"><div class="rw-k">${IC.sparkle}Tes 3 mois</div><div class="rw-t">${esc(TRIM[q].replace(/^./,c=>c.toUpperCase()))} ${y}</div><div class="rw-s">${n} cocktails préparés. Revis ton trimestre et partage ta carte.</div></div><div class="rw-play">${IC.play}</div></button>`; }
{ const _sg=HOME_SEC.suggest; HOME_SEC.suggest=(ctx)=>{ const h=_sg(ctx); return h+quarterCard(); }; }
// Profil > Tes récaps : le dernier trimestre écoulé, sinon le trimestre en cours (au moins 3 verres)
{ const _rr=recapRows;
  recapRows=function(){ const h=_rr(), now=new Date(), cq={y:now.getFullYear(),q:Math.floor(now.getMonth()/3)}, lq=lastQuarter(now);
    const t=quarterEligible(lq.y,lq.q)? lq : quarterEligible(cq.y,cq.q)? cq : null; if(!t) return h;
    const cur=t===cq, n=quarterCount(t.y,t.q);
    return h+prow("sparkles","Tes 3 derniers mois",`${TRIM[t.q].replace(/^./,c=>c.toUpperCase())} ${t.y}${cur?", jusqu’ici":""} · ${n} cocktails`,"","rwquarter",`data-y="${t.y}" data-q="${t.q}"`); };
}
