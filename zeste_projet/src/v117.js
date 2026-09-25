// ================= ZESTE 1.17 =================
const APP_VERSION="1.27";
const COPYRIGHT="© "+new Date().getFullYear()+" Yannick Wahler. Tous droits réservés.";

// ---------- Type de cocktail (pour le filtre) ----------
const CTYPES=[["court","Cocktail court"],["long","Long drink"],["spritz","Spritz et bulles"],["shot","Shot"],["chaud","Chaud"],["sans","Sans alcool"]];
function typeOf(r){
  if(r.na||metricsR(r).abv<0.5) return "sans";
  if(r.fam==="chaud"||r.m==="hot") return "chaud";
  if(r.fam==="shot"||r.g==="shot") return "shot";
  if(r.fam==="bulles") return "spritz";
  const top=r.ing.some(i=>i.r==="top");
  if(["highball","mug"].includes(r.g)) return "long";
  if(top&&!["coupe","martini","flute","shot"].includes(r.g)) return "long";
  return "court";
}
CF.type=CF.type||[];
const _filtered=filtered; filtered=function(ig){ let L=_filtered(ig); if(CF.type&&CF.type.length) L=L.filter(r=>CF.type.includes(typeOf(r))); return L; };
const _nFilters=nFilters; nFilters=function(){ return _nFilters()+((CF.type||[]).length); };
const _resetf=ACT.resetf; ACT.resetf=(d,t)=>{ CF.type=[]; return _resetf(d,t); };

// ---------- Conseils sur un objectif du labo ----------
function goalAdvice(k){
  const M=mixState(), A=analyze(), SC=labScore(A), G=SC.goals.find(g=>g[0]===k), v=G?G[2]:1, {g,ice,rec}=labGlass(), z=A.z, met=A.met;
  const base=baseOf(A.items), acts=[]; let t="", txt="";
  const ok=v>=0.85;
  if(k==="bal"){ t="Équilibre"; const d=A.diag.find(x=>x.warn);
    if(ok) txt="Le rapport entre sucre et acidité est dans la zone des classiques. Rien à changer !";
    else if(d){ txt=d.t+". "+d.why; if(d.fix) acts.push(["Ajouter "+fmtQ({q:d.fix.q,u:unitOf(d.fix.id)})+" "+de(lc(shortN(d.fix.id))).replace(/^de /,"de "),()=>ACT.mixfix({id:d.fix.id,q:String(d.fix.q)})]); }
    else txt="Goûte et ajuste doucement le sucre ou l’acidité, par petites touches."; }
  if(k==="abv"){ t="Force";
    if(ok) txt="La teneur en alcool correspond au style choisi.";
    else if(met.abv>z.abv[2]){ txt="C’est plus fort que les cocktails de ce style (environ "+Math.round(met.abv)+" % contre "+Math.round(z.abv[1])+" % en moyenne). Réduis le spiritueux ou allonge avec un soft.";
      if(base){ const i=M.items.findIndex(x=>x.id===base); if(i>=0) acts.push(["Moins "+de(lc(shortN(base))).replace(/^de /,"de "),()=>ACT.mixq({k:String(i),d:"-1"})]); }
      const soft=["eau_gazeuse","tonic","ginger_beer","soda"].find(x=>has(x)); if(soft&&A.st!=="stirred") acts.push(["Ajouter "+lc(shortN(soft)),()=>ACT.mixadd1({id:soft})]); }
    else { txt="C’est plus léger que les cocktails de ce style (environ "+Math.round(met.abv)+" % contre "+Math.round(z.abv[1])+" % en moyenne). Ajoute un peu de spiritueux.";
      if(base){ const i=M.items.findIndex(x=>x.id===base); if(i>=0) acts.push(["Plus "+de(lc(shortN(base))).replace(/^de /,"de "),()=>ACT.mixq({k:String(i),d:"1"})]); } } }
  if(k==="fill"){ t="Remplissage";
    if(ok) txt="Le verre est bien rempli.";
    else if(SC.fill>1.02){ txt="Ça déborde : il faut environ "+fmtMl(met.vol-SC.avail)+" de place en plus."; acts.push(["Ajuster au verre",()=>ACT.mixfit()]); }
    else { txt="Le verre paraît à moitié vide. Ajoute du volume, ou prends un verre plus petit."; acts.push(["Ajuster au verre",()=>ACT.mixfit()]); const small={highball:"rocks",vin:"coupe",rocks:"coupe",mug:"rocks"}[g]; if(small) acts.push(["Prendre "+LGLASS.find(x=>x[0]===small)[1].toLowerCase(),()=>ACT.mixglass({v:small})]); } }
  if(k==="glass"){ t="Verre"; if(ok) txt="Ce verre convient parfaitement au style.";
    else { txt="Pour ce style, le barman conseille "+GLASSES[rec.g]+"."; acts.push(["Prendre "+LGLASS.find(x=>x[0]===rec.g)[1].toLowerCase(),()=>ACT.mixglass({v:rec.g})]); } }
  if(k==="ice"){ t="Glace"; const L={long:"Un long drink se sert sur beaucoup de glaçons : ils le gardent frais sans le diluer trop vite.",spritz:"Un spritz se sert sur des glaçons.",stirred:"Un cocktail sec se sert sur un gros glaçon, ou sans glace dans un verre bien froid.",sour:"Un cocktail court se sert plutôt sans glace, bien froid.",cremeux:"Plutôt sans glace."};
    if(ok) txt="La glace est adaptée."; else { txt=L[A.st]||"Adapte la glace au style."; acts.push([LICE.find(x=>x[0]===rec.ice)[1],()=>ACT.mixice({v:rec.ice})]); } }
  if(k==="gar"){ t="Décor"; if(ok) txt="La garniture va très bien avec ce mélange.";
    else { txt=M.gar.length?"Ta garniture ne correspond pas vraiment aux saveurs. Essaie plutôt :":"Un cocktail sans décor, c’est dommage. Avec ce mélange, essaie :"; SC.sug.slice(0,3).filter(x=>!M.gar.includes(x)).forEach(x=>acts.push([LGAR.find(y=>y[0]===x)[1]+" "+LGARTXT[x],()=>ACT.mixgar({v:x})])); } }
  return {t,txt,acts,ok,v};
}
let ADV_ACTS=[];
function advHTML(k){ const a=goalAdvice(k); ADV_ACTS=a.acts.map(x=>x[1]); return `<div class="adv ${a.ok?"ok":""}"><div class="adv-h"><b>${esc(a.t)}</b><span>${Math.round(a.v*100)} %</span></div><p>${esc(a.txt)}</p>${a.acts.length?`<div class="adv-b">${a.acts.map((x,i)=>`<button class="btn small ${i?"sec":""}" data-a="advdo" data-i="${i}">${esc(x[0])}</button>`).join("")}</div>`:""}</div>`; }
const _openServe2=openServe;
openServe=function(){ _openServe2(); if(!SV) return; const el=SV.el; const keys=["bal","abv","fill","glass","ice","gar"];
  el.querySelectorAll(".sv-goal").forEach((g,i)=>{ g.setAttribute("data-a","svgoal"); g.setAttribute("data-k",keys[i]); g.setAttribute("role","button"); });
  const gs=el.querySelector(".sv-goals"); if(gs){ const box=document.createElement("div"); box.className="sv-adv"; gs.after(box); const hint=document.createElement("div"); hint.className="sv-hint"; hint.textContent="Touche un objectif pour savoir comment l’améliorer"; box.before(hint); } };
Object.assign(ACT,{
  svgoal:(d,t)=>{ const box=document.querySelector(".sv-adv"); if(!box) return; document.querySelectorAll(".sv-goal").forEach(g=>g.classList.toggle("sel",g===t)); box.innerHTML=advHTML(d.k); box.classList.remove("show"); void box.offsetWidth; box.classList.add("show"); setTimeout(()=>box.scrollIntoView({behavior:"smooth",block:"nearest"}),50); },
  labgoal:(d)=>{ openSheet(()=>({title:"Comment améliorer",body:advHTML(d.k)}),{short:true}); },
  advdo:(d)=>{ const f=ADV_ACTS[+d.i]; if(!f) return; if(SV) svClose(()=>f()); else { closeAll(); f(); } }
});
// les objectifs du labo deviennent touchables eux aussi
const _vComposeG=vCompose; vCompose=function(){ const keys={"Équilibre":"bal","Force":"abv","Remplissage":"fill","Verre":"glass","Glace":"ice","Décor":"gar","Décor (bonus)":"gar"};
  return _vComposeG().replace(/<span class="goal ([^"]*)"><i>([\s\S]*?)<\/i>([^<]+)<\/span>/g,(m,c,i,n)=>`<button class="goal ${c}" data-a="labgoal" data-k="${keys[n]||"bal"}"><i>${i}</i>${n}</button>`); };

// ---------- Carte plein écran : glisser et zoomer ----------
let MFS=null;
function openMapFS(){
  const vb=REGIONS[WORLD_R][1].split(" ").map(Number);
  const el=document.createElement("div"); el.id="mapfs";
  el.innerHTML=`<div class="mf-top"><button class="close-x" data-a="mapclose" aria-label="Fermer">${IC.x}</button><b>Le monde des cocktails</b><div class="mf-zoom"><button data-a="mapzoom" data-z="0.6" aria-label="Zoomer">+</button><button data-a="mapzoom" data-z="1.6" aria-label="Dézoomer">−</button></div></div>
   <div class="mf-map"><svg id="mfsvg" preserveAspectRatio="xMidYMid meet"><rect x="-400" y="-300" width="1200" height="800" class="sea"/><g class="grat">${[...Array(13)].map((_,k)=>`<path d="M${k*30} 0V180"/>`).join("")}${[...Array(7)].map((_,k)=>`<path d="M0 ${k*30}H360"/>`).join("")}</g><path class="land" d="${WORLD_PATH}"/><g id="mfpins"></g></svg></div>
   <div class="mf-panel"><div class="chips mf-reg">${Object.entries(REGIONS).map(([k,v])=>`<button class="chip" data-a="mapreg" data-r="${k}">${v[0]}</button>`).join("")}</div><div class="mf-city"><span class="muted">Glisse pour te déplacer, pince pour zoomer, touche une ville.</span></div></div>`;
  document.body.appendChild(el); MFS={el,vb:{x:vb[0],y:vb[1],w:vb[2],h:vb[3]},ptr:new Map(),moved:false,sel:null};
  mfFit(); mfDraw(); requestAnimationFrame(()=>el.classList.add("open"));
  const svg=el.querySelector("#mfsvg");
  svg.addEventListener("pointerdown",e=>{ svg.setPointerCapture(e.pointerId); MFS.ptr.set(e.pointerId,{x:e.clientX,y:e.clientY}); MFS.moved=false; MFS.start={vb:Object.assign({},MFS.vb),pts:[...MFS.ptr.values()].map(p=>({...p}))}; });
  svg.addEventListener("pointermove",e=>{ if(!MFS||!MFS.ptr.has(e.pointerId)) return; MFS.ptr.set(e.pointerId,{x:e.clientX,y:e.clientY}); const P=[...MFS.ptr.values()], S0=MFS.start, R=svg.getBoundingClientRect(), k=S0.vb.w/R.width;
    if(P.length===1&&S0.pts.length===1){ const dx=P[0].x-S0.pts[0].x, dy=P[0].y-S0.pts[0].y; if(Math.abs(dx)+Math.abs(dy)>6) MFS.moved=true; MFS.vb.x=S0.vb.x-dx*k; MFS.vb.y=S0.vb.y-dy*k; }
    else if(P.length>=2&&S0.pts.length>=2){ MFS.moved=true; const d0=Math.hypot(S0.pts[0].x-S0.pts[1].x,S0.pts[0].y-S0.pts[1].y), d1=Math.hypot(P[0].x-P[1].x,P[0].y-P[1].y); const s=Math.max(0.2,Math.min(5,d0/Math.max(d1,1)));
      const mx=(S0.pts[0].x+S0.pts[1].x)/2-R.left, my=(S0.pts[0].y+S0.pts[1].y)/2-R.top; const cx=S0.vb.x+mx*k, cy=S0.vb.y+my*(S0.vb.h/R.height);
      const nw=Math.max(10,Math.min(400,S0.vb.w*s)), nh=nw*S0.vb.h/S0.vb.w; const nmx=(P[0].x+P[1].x)/2-R.left, nmy=(P[0].y+P[1].y)/2-R.top;
      MFS.vb={x:cx-nmx*nw/R.width,y:cy-nmy*nh/R.height,w:nw,h:nh}; }
    mfClamp(); mfDraw(); });
  const up=e=>{ if(!MFS) return; MFS.ptr.delete(e.pointerId); MFS.start={vb:Object.assign({},MFS.vb),pts:[...MFS.ptr.values()].map(p=>({...p}))};
    if(!MFS.moved&&!MFS.ptr.size){ const pin=e.target.closest&&e.target.closest(".mpin"); if(pin) mfSelect(+pin.dataset.i); else { const now=Date.now(); if(now-(MFS.lastTap||0)<300){ const R=svg.getBoundingClientRect(); mfZoomAt(0.5,e.clientX-R.left,e.clientY-R.top); } MFS.lastTap=now; } } };
  svg.addEventListener("pointerup",up); svg.addEventListener("pointercancel",up);
  svg.addEventListener("wheel",e=>{ e.preventDefault(); const R=svg.getBoundingClientRect(); mfZoomAt(e.deltaY>0?1.15:0.87,e.clientX-R.left,e.clientY-R.top,true); },{passive:false});
  if(typeof SND!=="undefined") SND.whoosh();
}
function mfFit(){ const svg=document.getElementById("mfsvg"), R=svg.getBoundingClientRect(), ar=R.height/Math.max(R.width,1); const c={x:MFS.vb.x+MFS.vb.w/2,y:MFS.vb.y+MFS.vb.h/2}; MFS.vb.h=MFS.vb.w*ar; MFS.vb.x=c.x-MFS.vb.w/2; MFS.vb.y=c.y-MFS.vb.h/2; }
function mfClamp(){ const v=MFS.vb; v.x=Math.max(-40,Math.min(360-v.w*0.3,v.x)); v.y=Math.max(-30,Math.min(150-v.h*0.3,v.y)); }
function mfZoomAt(f,px,py,instant){ const svg=document.getElementById("mfsvg"), R=svg.getBoundingClientRect(), v=MFS.vb, cx=v.x+px/R.width*v.w, cy=v.y+py/R.height*v.h;
  const to={w:Math.max(10,Math.min(400,v.w*f))}; to.h=to.w*v.h/v.w; to.x=cx-px/R.width*to.w; to.y=cy-py/R.height*to.h; mfAnim(to,instant?0:350); }
function mfAnim(to,ms){ const from=Object.assign({},MFS.vb), t0=performance.now(); if(!ms){ MFS.vb=to; mfClamp(); mfDraw(); return; }
  const step=t=>{ if(!MFS) return; const p=Math.min(1,(t-t0)/ms), e=1-Math.pow(1-p,3); MFS.vb={x:from.x+(to.x-from.x)*e,y:from.y+(to.y-from.y)*e,w:from.w+(to.w-from.w)*e,h:from.h+(to.h-from.h)*e}; mfDraw(); if(p<1) requestAnimationFrame(step); else mfClamp(); }; requestAnimationFrame(step); }
function mfDraw(){ if(!MFS) return; const v=MFS.vb, svg=document.getElementById("mfsvg"); svg.setAttribute("viewBox",`${v.x.toFixed(2)} ${v.y.toFixed(2)} ${v.w.toFixed(2)} ${v.h.toFixed(2)}`);
  const r=Math.max(0.35,v.w/95), lab=v.w<150;
  document.getElementById("mfpins").innerHTML=CITIES.map((c,i)=>{ const [px,py]=cityXY(c[1],c[2]), ids=c[3].filter(id=>RMAP[id]), n=ids.length, ok=ids.some(id=>status(RMAP[id]).ok), made=ids.some(id=>madeCount(id)), sel=MFS.sel===i;
    const pos=LABPOS[c[0]]||"r", fs=r*1.7; const [tx,ty,anc]= pos==="l"?[px-r*1.6,py+r*0.5,"end"]: pos==="u"?[px,py-r*1.6,"middle"]: pos==="d"?[px,py+r*2.6,"middle"]:[px+r*1.6,py+r*0.5,"start"];
    return `<g class="mpin pin ${made?"made":""} ${sel?"sel":""}" data-i="${i}"><circle cx="${px}" cy="${py}" r="${(r*2.6).toFixed(2)}" fill="transparent"/><circle class="pin-pulse" cx="${px}" cy="${py}" r="${(r*(1.6+Math.min(n,12)*0.14)).toFixed(2)}"/><circle class="pin-dot" cx="${px}" cy="${py}" r="${(r*(sel?1.5:0.9+Math.min(n,12)*0.07)).toFixed(2)}"/>${ok?`<circle cx="${px+r*0.9}" cy="${py-r*0.9}" r="${(r*0.45).toFixed(2)}" fill="var(--green)"/>`:""}${lab||sel?`<text x="${tx.toFixed(2)}" y="${ty.toFixed(2)}" text-anchor="${anc}" font-size="${fs.toFixed(2)}" class="pin-t">${esc(c[0])}</text>`:""}</g>`; }).join(""); }
function mfSelect(i){ MFS.sel=i; mfDraw(); const c=CITIES[i], L=c[3].map(id=>RMAP[id]).filter(Boolean); if(typeof SND!=="undefined") SND.pop();
  const box=MFS.el.querySelector(".mf-city"); box.innerHTML=`<div class="mfc-h"><b>${esc(c[0])}</b><span>${L.length} cocktail${L.length>1?"s":""}</span></div><p>${esc(c[4])}</p><div class="scroller mfc-list">${L.map(r=>`<button class="mfc-r" data-a="maprec" data-id="${r.id}"><span>${glassThumb(r)}</span><b>${esc(r.n)}</b></button>`).join("")}</div>`;
  box.classList.remove("show"); void box.offsetWidth; box.classList.add("show");
  const [px,py]=cityXY(c[1],c[2]), v=MFS.vb; if(px<v.x||px>v.x+v.w||py<v.y||py>v.y+v.h) mfAnim({x:px-v.w/2,y:py-v.h/2,w:v.w,h:v.h},400); }
function mfClose(then){ if(!MFS) return; const el=MFS.el; MFS=null; el.classList.remove("open"); setTimeout(()=>el.remove(),320); if(then) setTimeout(then,150); }
Object.assign(ACT,{
  mapfs:()=>openMapFS(), mapclose:()=>mfClose(),
  mapzoom:(d)=>{ const svg=document.getElementById("mfsvg"), R=svg.getBoundingClientRect(); mfZoomAt(+d.z,R.width/2,R.height/2); },
  mapreg:(d)=>{ const vb=REGIONS[d.r][1].split(" ").map(Number), svg=document.getElementById("mfsvg"), R=svg.getBoundingClientRect(), ar=R.height/R.width; let w=vb[2], h=w*ar; if(h<vb[3]){ h=vb[3]; w=h/ar; } mfAnim({x:vb[0]+vb[2]/2-w/2,y:vb[1]+vb[3]/2-h/2,w,h},600); },
  maprec:(d)=>mfClose(()=>recSheet(d.id))
});

// ---------- Lancement : un cocktail différent à chaque ouverture ----------
function splashPick(){
  const last=S.lastSplash; let pool=barCount()? tonight().slice(0,14) : [];
  if(pool.length<4) pool=POPULAR.slice(0,40).map(id=>RMAP[id]).filter(Boolean);
  pool=pool.filter(r=>r.id!==last&&r.g!=="mug"); const r=pool[Math.floor(Math.random()*pool.length)]||RMAP.negroni;
  S.lastSplash=r.id; try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} return r;
}
Object.assign(ACT,{ famgo:(d)=>{ CF.fam=[d.f]; CF.main=""; CF.q=""; CF.mode="list"; dirty.cocktails=1; switchTab("cocktails"); toast("Famille : "+FAMILIES[d.f]); } });
