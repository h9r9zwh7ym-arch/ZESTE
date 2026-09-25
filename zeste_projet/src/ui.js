// ================= ÉTAT & SAUVEGARDE =================
const KEY="zeste.v1";
const DEF=()=>({v:1,t:0,stock:{},ratings:{},notes:{},fav:[],hist:[],preps:[],custom:[],mix:{m:"shake",items:[]},settings:{unit:"cl",nobasic:[]},roul:0,labSaved:0,tro:[]});
function loadLocal(){ try{ const j=localStorage.getItem(KEY); if(j) return Object.assign(DEF(),JSON.parse(j)); }catch(e){} return DEF(); }
S=loadLocal();
function fixState(){ S.settings=Object.assign({unit:"cl",nobasic:[]},S.settings||{}); if(!Array.isArray(S.settings.nobasic)) S.settings.nobasic=[]; }
let DB=null, DOC=null, saveTimer=null, saving=false, pending=false;
function save(){
  STC={}; MEMO={}; S.t=Date.now(); try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){}
  clearTimeout(saveTimer); saveTimer=setTimeout(pushRemote,1200);
}
async function pushRemote(){
  if(!DOC) return; if(saving){pending=true;return;} saving=true;
  try{ await DOC.set({json:JSON.stringify(S),t:S.t}); }catch(e){}
  saving=false; if(pending){pending=false; pushRemote();}
}
async function initRemote(){
  try{
    if(!window.claude||!window.claude.use) return;
    const [db,user]=await Promise.all([claude.use("db"),claude.use("user")]);
    if(!db||!user) return; const uid=await user.id(); if(!uid) return;
    DB=db; DOC=db.doc("data/users/"+uid+"/state");
    const snap=await DOC.get();
    if(snap.exists){ const d=snap.data(); if(d&&d.json&&d.t>(S.t||0)){ S=Object.assign(DEF(),JSON.parse(d.json)); fixState(); try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){} buildRecipes(S.custom); renderAll(); refreshSheets(); } else if(S.t) pushRemote(); }
    else if(S.t) pushRemote();
  }catch(e){}
}


// ================= OUTILS UI =================
const $=s=>document.querySelector(s);
let TAB="today"; const dirty={today:1,cocktails:1,bar:1,labo:1,profil:1};
let POP=null; // dernière interaction animée
function toast(t,opt={}){
  const el=$("#toast"); el.className=""; el.innerHTML=(opt.icon||"")+`<span>${esc(t)}</span>`+(opt.action?`<button class="tbtn">${esc(opt.action.label)}</button>`:"");
  if(opt.action) el.querySelector(".tbtn").onclick=()=>{ opt.action.fn(); el.classList.remove("show"); };
  void el.offsetWidth; el.classList.add("show"); if(opt.trophy) el.classList.add("trophy");
  clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove("show"), opt.action?4200:2400);
}
// L'écran sous une fiche ou une fenêtre n'est redessiné qu'à sa fermeture : moins de travail pendant qu'on interagit
function covered(){ return SHEETS.length>0||document.getElementById("serve")||document.getElementById("mapfs")||(document.getElementById("overlay")||{}).classList?.contains("open"); }
function changed(){ save(); Object.keys(dirty).forEach(k=>dirty[k]=1); if(!covered()) renderView(TAB); refreshSheets(); checkTrophies(); }
function softChanged(){ save(); Object.keys(dirty).forEach(k=>{ if(k!==TAB) dirty[k]=1; }); refreshSheets(); checkTrophies(); updateBarStats(); }
function nav(title,right="",left=""){ return `<div class="navbar"><div class="nb-left">${left}</div><div class="nb-title">${esc(title)}</div><div class="nb-right">${right}</div></div>`; }
const statusDot=r=>{ const s=status(r); return `<span class="dot ${s.ok?"ok":s.subOk?"sub":"no"}"></span>`; };
function recRow(r, sub){
  const rt=S.ratings[r.id];
  return `<button class="row tap" data-a="rec" data-id="${r.id}" style="--inset:70px"><div class="thumb">${glassThumb(r)}</div><div class="grow"><div class="t serif">${esc(r.n)}</div><div class="s">${esc(sub||ingList(r))}</div></div>${rt?starsSm(rt):""}${statusDot(r)}${IC.chev}</button>`;
}
function adjCard(r){
  const a=(S.adj||{})[r.id]||{}, hasS=r.ing.some(i=>{const I=ING[i.id]; return I.cat==="sirop"||ADJ_SWEET.includes(i.id)||(I.cat==="liqueur"&&I.sug>=20&&i.id!==r.base);}), hasA=r.ing.some(i=>ADJ_ACID.includes(i.id)), hasF=r.ing.some(i=>ING[i.id].cat==="spirit");
  const rows=[hasS&&["s","Sucre","Moins sucré","Plus sucré"],hasA&&["a","Acidité","Moins acide","Plus acide"],hasF&&["f","Force","Plus léger","Plus fort"]].filter(Boolean);
  if(!rows.length) return "";
  const pk=POP&&POP.k&&POP.k.startsWith("adj"+r.id)&&Date.now()-POP.t<700?POP.k.slice(-1):"";
  return `<h2 class="sh">Ta version${getAdj(r.id)?`<button class="more" data-a="adjreset" data-id="${r.id}">Réinitialiser</button>`:""}</h2><div class="sh-sub">Ajuste à ton goût : les quantités suivent, et l’app s’en souvient.</div><div class="card adj">${rows.map(([k,n,lo,hi])=>{ const v=a[k]||0; return `<div class="adj-row"><div class="adj-l"><b>${n}</b><span>${v<0?lo:v>0?hi:"Comme l’original"}</span></div><div class="adj-dots">${[-2,-1,0,1,2].map(x=>`<button class="${x===v?"on":""} ${x===0?"zero":""} ${pk===k&&x===v?"pop":""}" data-a="adj" data-id="${r.id}" data-k="${k}" data-v="${x}" aria-label="${n} ${x}"><i></i></button>`).join("")}</div></div>`; }).join("")}</div>`;
}
const TERMRE=null;
function termify(html){ let out=html; TERMS.forEach(([k,re])=>{ let done=false; out=out.replace(new RegExp(re.source,re.flags.replace("g","")),m=>{ if(done) return m; done=true; return `<span class="term" role="button" tabindex="0" data-a="term" data-k="${k}">${m}</span>`; }); }); return out; }
function pendingRatings(){ const now=Date.now(), sn=S.snooze||{}, seen=new Set(), out=[];
  for(let k=S.hist.length-1;k>=0;k--){ const h=S.hist[k]; if(now-h.t>6*864e5) break; if(seen.has(h.id)||!RMAP[h.id]||S.ratings[h.id]) continue; seen.add(h.id); if(sn[h.id]&&sn[h.id]>h.t) continue; out.push(h); }
  return out; }
function remindCard(){ const P=pendingRatings(); if(!P.length) return ""; const h=P[0], r=RMAP[h.id];
  return `<div class="remind"><div class="rm-in"><div class="rm-g">${glassSVG(r)}</div><div class="grow"><div class="rm-k">${rel(h.t)==="Aujourd’hui"?"Tout à l’heure":rel(h.t)}${P.length>1?` <span class="rm-n">+${P.length-1}</span>`:""}</div><div class="rm-t">Alors, ce ${esc(r.n)} ?</div><div class="stars">${[1,2,3,4,5].map(n=>`<button data-a="remind" data-id="${r.id}" data-n="${n}" aria-label="${n} étoiles">${IC.star}</button>`).join("")}</div></div><button class="rm-x" data-a="snooze" data-id="${r.id}" aria-label="Plus tard">${IC.x}</button></div><div class="rm-done">${IC.checkc}<span>Merci, c’est noté</span></div></div>`; }
function discoveryCard(){ const L=RECS.filter(r=>r.h&&!madeCount(r.id)); if(!L.length) return ""; const r=L[Math.floor(hrand("d"+daySeed())*L.length)];
  return `<h2 class="sh">Le saviez-vous ?</h2><div class="sh-sub">Une histoire de cocktail par jour</div><div class="disc" data-a="flip"><div class="disc-in"><div class="disc-f"><div class="disc-q">“</div><p>${esc(r.h.split(r.n).join("ce cocktail"))}</p><div class="disc-hint">${IC.sparkle}Touche pour découvrir lequel</div></div><div class="disc-b" style="--c:${r.col}"><div class="disc-g">${glassSVG(r)}</div><div class="disc-n">${esc(r.n)}</div><div class="disc-s">${status(r).ok?"Tu peux le faire maintenant":"Il te manque "+esc(status(r).miss.map(x=>lc(shortN(x))).join(", "))}</div><button class="btn small" data-a="rec" data-id="${r.id}">Voir la recette</button></div></div></div>`; }
function tileLite(r){ return `<button class="tile lite" data-a="rec" data-id="${r.id}"><div class="tg" style="background:radial-gradient(circle at 50% 60%, ${r.col}40, transparent 70%)">${glassThumb(r)}</div><div class="tn">${esc(r.n)}</div><div class="ts">${esc(ingList(r))}</div></button>`; }
function tile(r, sub){
  return `<button class="tile" data-a="rec" data-id="${r.id}">${hasTaste()&&!S.ratings[r.id]&&matchPct(r)>=65?`<span class="tmatch">${matchPct(r)} %</span>`:""}<div class="tg" style="background:radial-gradient(circle at 50% 60%, ${r.col}55, transparent 70%)">${glassSVG(r)}</div><div class="tn">${esc(r.n)}</div><div class="ts">${esc(sub||ingList(r))}</div></button>`;
}
function monthName(m){ return ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"][m-1]; }
function dateLabel(){ const d=new Date(); const j=["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"][d.getDay()]; return j+" "+d.getDate()+" "+monthName(d.getMonth()+1); }
function rel(t){ const d0=new Date(); d0.setHours(0,0,0,0); const d=Math.floor((d0.getTime()-new Date(t).setHours(0,0,0,0))/864e5); if(d<=0) return "Aujourd’hui"; if(d===1) return "Hier"; if(d<7) return "Il y a "+d+" jours"; const x=new Date(t); return x.getDate()+" "+monthName(x.getMonth()+1); }
function barCount(){ return Object.keys(S.stock).filter(id=>ING[id]&&!ING[id].basic&&tracked(id)&&S.stock[id]>0).length; }
function makeable(){ return RECS.filter(r=>status(r).ok).length; }
function updateBarStats(){ const a=$("#st-b"), b=$("#st-m"); [[a,barCount()],[b,makeable()]].forEach(([el,v])=>{ if(el && el.textContent!=String(v)){ el.textContent=v; el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); } }); }
const METH={shake:"Shaker",mshake:"Shaker",stir:"Mélangé",build:"Construit",mbuild:"Écrasé",hot:"Chaud",louche:"Fontaine"};
const GNAME={coupe:"Coupe",martini:"Martini",rocks:"Tumbler",highball:"Highball",flute:"Flûte",vin:"Verre à vin",mug:"Mug",tasse:"Irish coffee",shot:"Shot"};
function segChips(cur, act, withAll, list){ const L=(list||SEGS); return `<div class="segchips">${withAll?`<button class="chip ${!cur?"on":""}" data-a="${act}" data-s="">Tout</button>`:""}${L.map(([k,n])=>`<button class="chip ${cur===k?"on":""}" data-a="${act}" data-s="${k}"><i style="background:${SEGCOL[k]}"></i>${n}</button>`).join("")}</div>`; }


// ================= VUES =================
function renderAll(){ Object.keys(dirty).forEach(k=>dirty[k]=1); renderView(TAB); }
function renderView(t){
  const el=$("#v-"+t); if(!el) return; const st=el.scrollTop;
  el.innerHTML = ({today:vToday,cocktails:vCocktails,bar:vBar,labo:vLabo,profil:vProfil})[t]();
  el.scrollTop=st; dirty[t]=0; onScroll.call(el); animateSegs(el);
}
const SEGPREV={};
function animateSegs(root){ (root||document).querySelectorAll(".seg").forEach(sg=>{ const bs=[...sg.querySelectorAll("button")]; if(!bs.length) return; const on=bs.find(b=>b.classList.contains("on")); if(!on) return;
  const key=sg.dataset.k||bs[0].dataset.a||"x"; let th=sg.querySelector(".seg-thumb"); if(!th){ th=document.createElement("span"); th.className="seg-thumb"; sg.prepend(th); }
  const prev=SEGPREV[key], place=b=>{ th.style.transform=`translateX(${b.offsetLeft-2}px)`; th.style.width=b.offsetWidth+"px"; };
  if(prev!=null&&bs[prev]&&bs[prev]!==on){ th.style.transition="none"; place(bs[prev]); void th.offsetWidth; th.style.transition=""; }
  place(on); SEGPREV[key]=bs.indexOf(on); }); }
function moveTabInd(){ const on=document.querySelector(".tabbar button.on"), ind=document.querySelector(".tab-ind"); if(on&&ind){ ind.style.transform=`translateX(${on.offsetLeft+on.offsetWidth/2-28}px)`; } }
function onScroll(){ this.classList.toggle("scrolled", this.scrollTop>34);
  if(this.id==="v-today"){ const g=this.querySelector(".hero .hg"), y=this.scrollTop; if(g){ g.style.transform=y>0?`scale(${Math.max(0.7,1-y/650).toFixed(3)})`:""; g.style.opacity=y>0?Math.max(0.2,1-y/500):""; } const gl=this.querySelector(".hero .glow"); if(gl) gl.style.opacity=Math.max(0,0.55-y/600); } }

let HERO_LAST=null;
function vToday(){
  const c=ctxInfo(), h=new Date().getHours(), nm=(S.settings.name||"").trim();
  const title= nm? (h>=18||h<4?"Bonsoir ":h<12?"Bonjour ":"Salut ")+nm : (h>=17||h<4? "Ce soir" : "Aujourd’hui");
  const list=tonight(), empty=!barCount(), taste=hasTaste();
  let o=nav(title)+`<div class="content"><div class="eyebrow">${dateLabel()}</div><h1 class="lt">${title}</h1>`;
  if(empty){
    o+=`<div class="hero"><div class="glow" style="background:radial-gradient(circle at 50% 40%, #E8A84A44, transparent 65%)"></div><div class="hg">${glassSVG(RMAP.negroni,{pour:HERO_LAST!=="_w"})}</div><div class="hn">Bienvenue au bar</div><div class="hr">Dis-moi quelles bouteilles tu as. Sucre, œufs, agrumes et autres basiques sont déjà comptés.</div><div class="btn-row"><button class="btn" data-a="quickadd">Remplir mon bar</button></div></div>`;
    HERO_LAST="_w";
  } else if(list.length){
    const r=list[0], anim=HERO_LAST!==r.id; HERO_LAST=r.id; const m=metricsR(r);
    S.heroLog=S.heroLog||[]; const dsd=daySeed(); if(!S.heroLog.some(h=>h.id===r.id&&h.d===dsd)){ S.heroLog.push({id:r.id,d:dsd}); S.heroLog=S.heroLog.slice(-30); try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} }
    o+=`<div class="hero ${anim?"":"still"}"><div class="glow" style="background:radial-gradient(circle at 50% 36%, ${r.col}70, transparent 62%)"></div><div class="hg" data-a="jiggle">${glassSVG(r,{pour:anim,live:1})}</div><div class="kick">${esc(c.label)}</div><div class="hn">${esc(r.n)}</div><div class="hr">${esc(reasons(r))}</div><div class="pills">${S.ratings[r.id]?`<span class="pill match">Noté ${S.ratings[r.id]} sur 5</span>`:taste&&matchPct(r)>=62?`<span class="pill match">${matchPct(r)} % pour toi</span>`:`<span class="pill">${esc(FAMILIES[r.fam])}</span>`}<span class="pill">${Math.round(m.abv)} % d’alcool</span></div><div class="btn-row"><button class="btn sec" data-a="rec" data-id="${r.id}">Voir la recette</button><button class="btn" data-a="barmode" data-id="${r.id}">${IC.play}Préparer</button></div></div>`;
  } else {
    o+=`<div class="hero"><div class="hg">${glassSVG({g:"coupe",col:"#D8D0C0",ing:[]})}</div><div class="hn">Presque !</div><div class="hr">Rien n’est encore faisable avec ton bar, mais il manque souvent une seule bouteille.</div><div class="btn-row"><button class="btn sec" data-a="tab" data-t="bar">Voir les achats malins</button></div></div>`;
  }
  o+=remindCard();
  if(list.length>1){ o+=`<h2 class="sh">Aussi pour toi<button class="more" data-a="tab" data-t="cocktails" data-f="ok">Tout voir</button></h2><div class="sh-sub">${list.length} cocktails possibles, variés et classés selon tes goûts</div><div class="scroller stag">${list.slice(1,12).map(r=>tile(r)).join("")}</div>`; }
  const br=!empty&&(bottleRecs().find(b=>tracked(b.id))||bottleRecs()[0]);
  o+=`<div class="duo"><button class="duo-c" data-a="roulette"><div class="di">${IC.dice}</div><div class="dt">Surprends-moi</div><div class="ds">${list.length?list.length+" possibles":"Toute la carte"}</div></button>${br?`<button class="duo-c" data-a="ing" data-id="${br.id}"><div class="db">${bottleSVG(br.id,4)}</div><div class="dt">${esc(shortN(br.id))}</div><div class="ds">+${br.rs.length} cocktail${br.rs.length>1?"s":""} si tu l’achètes</div></button>`:`<button class="duo-c" data-a="tab" data-t="labo"><div class="di">${IC.flask}</div><div class="dt">Le labo</div><div class="ds">Compose ta création</div></button>`}</div>`;
  const naL=RECS.filter(r=>r.na&&status(r).ok).sort((a,b)=>score(b)-score(a)).slice(0,8);
  if(naL.length) o+=`<h2 class="sh">Sans alcool<button class="more" data-a="nafilter">Tout voir</button></h2><div class="sh-sub">Tout le plaisir, zéro degré</div><div class="scroller">${naL.map(r=>tile(r)).join("")}</div>`;
  o+=discoveryCard();
  const mo=new Date().getMonth()+1, se=SEASON[mo];
  o+=`<h2 class="sh">De saison</h2><div class="sh-sub">${esc(se.p.charAt(0).toUpperCase()+se.p.slice(1))}</div><div class="card season"><div class="sp">${esc(se.t)}</div><div class="mini-list">${se.r.map(id=>RMAP[id]).filter(Boolean).map(r=>`<button class="mini" data-a="rec" data-id="${r.id}">${glassSVG(r)}<div class="mn">${esc(r.n)}</div></button>`).join("")}</div></div>`;
  const exp=(S.preps||[]).filter(p=>daysLeft(p)<=3);
  if(exp.length) o+=`<h2 class="sh">À surveiller</h2><div class="sh-sub">Préparations maison bientôt périmées</div><div class="group">${exp.map(p=>prepRow(p)).join("")}</div>`;
  return o+`<div class="sp24"></div></div>`;
}
let CF={q:"",main:"",fam:[],base:[],x:[],mode:"list",sort:"score",all:0};
const XF=[["swiss","Suisses"],["new","Jamais faits"],["mine","Mes créations"],["crea","Créations à tester"],["classic","Grands classiques"]];
function nFilters(){ return CF.fam.length+CF.base.length+CF.x.length+(CF.sort==="az"?1:0); }
const norm=s=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[’']/g," ").toLowerCase();
// Notoriété : du plus commandé au moins connu (sert à classer les recherches)
const POPULAR=["aperol_spritz","mojito","margarita","gin_tonic","negroni","moscow_mule","pina_colada","old_fashioned","espresso_martini","cosmopolitan","caipirinha","daiquiri","long_island","martini","whisky_sour","cuba_libre","manhattan","bloody_mary","hugo","mai_tai","tequila_sunrise","sex_beach","white_russian","french75","paloma","mimosa","pornstar","dark_stormy","irish_coffee","tom_collins","kir","kir_royal","bellini","americano","sbagliato","campari_spritz","limoncello_spritz","pisco_sour","amaretto_sour","black_russian","sidecar","boulevardier","sazerac","gimlet","bramble","vin_chaud","panache","pastis","jagerbomb","b52","blue_lagoon","screwdriver","mint_julep","dirty_martini","vesper","rob_roy","zombie","hurricane","singapore_sling","penicillin","paper_plane","last_word","jungle_bird","clover_club","aviation","gin_fizz","bees_knees","tommys","planters","painkiller","el_diablo","fernet_cola","kafi_luz","suze_tonic","nojito","virgin_mary","shirley_temple","gold_rush","ramos","gin_basil_smash","french_martini","lemon_drop","godfather","grasshopper","brandy_alexander","hot_toddy","mauresque","picon_biere","pimms_cup","st_germain_spritz","death_afternoon","vieux_carre","hanky_panky","white_lady","corpse_reviver","chindon","diabolo_menthe","diabolo_grenadine"];
const POPIDX={}; POPULAR.forEach((id,k)=>POPIDX[id]=k);
function popScore(r){ const k=POPIDX[r.id]; return k==null? (r.c?4:0) : 40*(1-k/POPULAR.length)+6; }
const ALIAS={martini:"martini",gin_tonic:"gin tonic|gt",aperol_spritz:"spritz",moscow_mule:"mule",whisky_sour:"sour|whiskey sour",old_fashioned:"old fashion",pina_colada:"colada|pina",irish_coffee:"irish|cafe irlandais",espresso_martini:"espresso",white_russian:"russian",long_island:"long island|lit",french75:"french 75",cuba_libre:"rhum coca|rum coke",jack_coke:"jack coca|whisky coca",b52:"b 52",sex_beach:"sex on the beach",tequila_sunrise:"sunrise",kir_royal:"kir royale",vin_chaud:"gluhwein|glühwein",panache:"radler",dark_stormy:"dark and stormy|dark n stormy"};
let ING_WORDS=null;
function relevance(r,qq){ const n=norm(r.n); let s=0;
  if(!ING_WORDS){ ING_WORDS=new Set(["whisky","whiskey","rhum","rum","brandy"]); Object.values(ING).forEach(i=>norm(i.n.replace(/ \(.*\)/,"")).split(/\s+/).forEach(w=>{ if(w.length>2) ING_WORDS.add(w); })); }
  const ingQuery=qq.split(/\s+/).every(w=>ING_WORDS.has(w));
  if(n===qq) s=100; else if(n.startsWith(qq)) s=62; else if(n.split(/[\s-]+/).some(w=>w.startsWith(qq.split(/\s+/)[0]))) s=48; else if(n.includes(qq)) s=38; else s=8;
  const al=ALIAS[r.id]; if(al&&al.split("|").some(x=>norm(x)===qq)) s=Math.max(s,95);
  if(ingQuery&&s<95) s=8+s*0.15+(r.base&&(norm(ING[r.base].n).startsWith(qq)||norm(BASE_LABEL[baseGroup(r)]||"").startsWith(qq))?14:0);
  return s+popScore(r)+Math.max(0,score(r)-3)*3-n.length*0.05; }
function filtered(ignoreMain){
  let L=RECS.slice(); const qq=norm(CF.q.trim());
  if(qq) L=L.filter(r=>{ r._s=r._s||norm(r.n+" "+r.ing.map(i=>ING[i.id].n).join(" ")+" "+FAMILIES[r.fam]+" "+(BASE_LABEL[baseGroup(r)]||"")+" "+(ALIAS[r.id]||"").replace(/\|/g," ")+(baseGroup(r)==="whisky"?" whiskey":"")+(r.na?" sans alcool mocktail virgin":"")); return qq.split(/\s+/).every(w=>(" "+r._s).includes(" "+w)&&!(w==="gin"&&!/(^| )gin( |$)/.test(r._s))); });
  if(!ignoreMain){ if(CF.main==="ok") L=L.filter(r=>status(r).ok); if(CF.main==="fav") L=L.filter(r=>S.fav.includes(r.id)); if(CF.main==="na") L=L.filter(r=>r.na||metricsR(r).abv<0.5); }
  if(CF.fam.length) L=L.filter(r=>CF.fam.includes(r.fam)); if(CF.base.length) L=L.filter(r=>CF.base.includes(baseGroup(r)));
  CF.x.forEach(x=>{ if(x==="swiss") L=L.filter(r=>r.s); if(x==="new") L=L.filter(r=>!madeCount(r.id)); if(x==="mine") L=L.filter(r=>r.mine); if(x==="crea") L=L.filter(r=>r.cr); if(x==="classic") L=L.filter(r=>r.c); });
  if(CF.sort==="az") L.sort((a,b)=>a.n.localeCompare(b.n,"fr"));
  else if(CF.sort==="cost"){ const k=r=>{ const c=costOf(r.ing); return c.miss.length?1e6+c.miss.length:c.tot; }; L.sort((a,b)=>k(a)-k(b)); }
  else if(qq){ const rel={}; L.forEach(r=>rel[r.id]=relevance(r,qq)); L.sort((a,b)=>rel[b.id]-rel[a.id]); }
  else L.sort((a,b)=>(status(b).ok-status(a).ok)||(score(b)-score(a)));
  return L;
}
// Rendu de la liste et de la barre d'outils uniquement (pas la recherche) : reconstruit à chaque frappe,
// sans jamais toucher au champ de recherche lui-même (le recréer pendant la saisie fait sauter des lettres sur iOS).
function cocktailsResults(){
  const L=filtered(), nf=nFilters();
  let o=`<div class="toolbar"><div class="seg small4">${[["","Tous"],["ok","Faisables"],["fav","Favoris"],["na","0 %"]].map(([k,n])=>`<button class="${CF.main===k?"on":""}" data-a="cmain" data-v="${k}">${n}</button>`).join("")}</div><button class="fbtn" data-a="filters">${IC.filter}Filtres${nf?`<b>${nf}</b>`:""}</button></div>`;
  if(nf){ const chips=[...(CF.type||[]).map(k=>["type",k,CTYPES.find(x=>x[0]===k)[1]]),...CF.fam.map(k=>["fam",k,FAMILIES[k]]),...CF.base.map(k=>["base",k,BASE_LABEL[k]]),...CF.x.map(k=>["x",k,XF.find(x=>x[0]===k)[1]])];
    if(CF.sort==="az") chips.push(["sort","az","A à Z"]);
    o+=`<div class="active-f">${chips.map(([g,k,n])=>`<button data-a="unf" data-g="${g}" data-k="${k}">${esc(n)}${IC.x}</button>`).join("")}</div>`; }
  if(CF.mode==="map") CF.mode="list";
  if(CF.mode==="map"){ o+=`<h2 class="sh" style="margin-top:16px">Carte des saveurs</h2><div class="sh-sub">Chaque point est un cocktail. Touche-en un pour l’ouvrir.</div>`+flavorMap(L); return o; }
  if(!L.length) return o+`<div class="empty"><b>Aucun cocktail</b>Essaie d’enlever un filtre ou de changer ta recherche.</div>`;
  if(CF.main==="na") o+=`<div class="na-banner"><b>Zéro degré, plein de goût</b><span>Des recettes équilibrées comme de vrais cocktails, pour conduire, faire une pause ou les potes qui ne boivent pas.</span></div>`;
  const sectioned = CF.sort!=="az" && !CF.main && !CF.q;
  if(sectioned){
    const ok=[],one=[],rest=[]; L.forEach(r=>{ const s=status(r); if(s.ok) ok.push(r); else if(s.subOk||s.miss.length===1) one.push([r,s]); else rest.push(r); });
    const more=(n,k)=>n>(CF.lim[k]||30)?`<button class="row tap more-row" data-a="listmore" data-k="${k}">Afficher ${Math.min(60,n-(CF.lim[k]||30))} de plus (${n-(CF.lim[k]||30)} restants)</button>`:"";
    CF.lim=CF.lim||{};
    if(ok.length) o+=`<div class="list-h"><b>Faisables maintenant</b><span>${ok.length}</span></div><div class="group">${ok.slice(0,CF.lim.ok||30).map(r=>recRow(r)).join("")}${more(ok.length,"ok")}</div>`;
    if(one.length) o+=`<div class="list-h"><b>Il manque une chose</b><span>${one.length}</span></div><div class="group">${one.slice(0,CF.lim.one||30).map(([r,s])=>recRow(r, s.subOk?"Avec "+lc(shortN(s.subs[s.miss[0]]))+" à la place":"Manque : "+lc(shortN(s.miss[0])))).join("")}${more(one.length,"one")}</div>`;
    if(rest.length){ const lim=CF.all?rest.length:Math.min(CF.lim.rest||30,rest.length); o+=`<div class="list-h"><b>Pour plus tard</b><span>${rest.length}</span></div><div class="group">${rest.slice(0,lim).map(r=>recRow(r)).join("")}${rest.length>lim?`<button class="row tap more-row" data-a="showall">Afficher les ${rest.length-lim} autres</button>`:""}</div>`; }
  } else {
    CF.lim=CF.lim||{}; const lim=CF.lim.all||40;
    o+=`<div class="list-h"><b>${L.length} cocktail${L.length>1?"s":""}</b><span></span></div><div class="group">${L.slice(0,lim).map(r=>recRow(r)).join("")}${L.length>lim?`<button class="row tap more-row" data-a="listmore" data-k="all">Afficher ${Math.min(60,L.length-lim)} de plus (${L.length-lim} restants)</button>`:""}</div>`;
  }
  return o;
}
function vCocktails(){
  let o=nav("Cocktails")+`<div class="content"><h1 class="lt">Cocktails</h1>`;
  o+=`<div class="seg c-modes" data-k="cmodes">${[["list","Liste"],["radar","Radar"],["tree","Lignées"],["world","Monde"]].map(([k,n])=>`<button class="${CF.mode===k?"on":""}" data-a="cmode2" data-v="${k}">${n}</button>`).join("")}</div><div class="sp8"></div>`;
  if(CF.mode==="radar") return o+radarView()+`<div class="sp24"></div></div>`;
  if(CF.mode==="tree") return o+treeView()+`<div class="sp24"></div></div>`;
  if(CF.mode==="world") return o+worldView()+`<div class="sp24"></div></div>`;
  o+=`<label class="search">${IC.search}<input id="cq" type="search" placeholder="Nom ou ingrédient" value="${esc(CF.q)}" autocomplete="off"></label>`;
  o+=`<div id="cx-res">${cocktailsResults()}</div>`;
  return o+`<div class="sp24"></div></div>`;
}
function filterSheet(){
  openSheet(()=>{ const n=filtered().length; const ch=(g,k,lab)=>{ const on=g==="sort"?CF.sort===k:CF[g].includes(k); return `<button class="chip ${on?"on":""}" data-a="tf" data-g="${g}" data-k="${k}">${esc(lab)}</button>`; };
    return {title:"Filtres",left:`<button class="link" data-a="resetf">Réinitialiser</button>`,
      body:`<div class="gh">Type de cocktail</div><div class="chips" style="flex-wrap:wrap">${CTYPES.map(([k,v])=>ch("type",k,v)).join("")}</div><div class="gh">Famille</div><div class="chips" style="flex-wrap:wrap">${Object.entries(FAMILIES).map(([k,v])=>ch("fam",k,v)).join("")}</div>
      <div class="gh">Alcool de base</div><div class="chips" style="flex-wrap:wrap">${Object.entries(BASE_LABEL).filter(([k])=>k!=="autre").map(([k,v])=>ch("base",k,v)).join("")}</div>
      <div class="gh">Autres</div><div class="chips" style="flex-wrap:wrap">${XF.map(([k,v])=>ch("x",k,v)).join("")}</div>
      <div class="gh">Tri</div><div class="seg">${[["score","Pour toi"],["az","A à Z"]].concat(hasPrices()?[["cost","Moins chers"]]:[]).map(([k,v])=>`<button class="${CF.sort===k?"on":""}" data-a="tsort" data-k="${k}">${v}</button>`).join("")}</div>`,
      foot:`<button class="btn" data-a="closesheet">Afficher ${n} cocktail${n>1?"s":""}</button>`};
  });
}

function flavorMap(L){
  const W=340,H=340,P=26;
  const pts=RECS.map(r=>{ const p=profileR(r); return [r, p[0]+p[4]*.35-p[2]*1.1-p[1]*.15+p[8]*.2, p[3]*1+p[6]*.08]; });
  const xs=pts.map(p=>p[1]), ys=pts.map(p=>p[2]); const mnx=Math.min(...xs),mxx=Math.max(...xs),mny=Math.min(...ys),mxy=Math.max(...ys);
  const set=new Set(L.map(r=>r.id)); const X=v=>P+(v-mnx)/(mxx-mnx||1)*(W-2*P), Y=v=>H-P-(v-mny)/(mxy-mny||1)*(H-2*P);
  let s=`<div class="fmap"><svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  s+=`<line x1="${W/2}" y1="${P-10}" x2="${W/2}" y2="${H-P+10}" stroke="var(--sep)"/><line x1="${P-10}" y1="${H/2}" x2="${W-P+10}" y2="${H/2}" stroke="var(--sep)"/>`;
  const lab=(x,y,t,a)=>`<text x="${x}" y="${y}" text-anchor="${a}" font-size="11" fill="var(--label2)" font-family="-apple-system,sans-serif" font-weight="600">${t}</text>`;
  s+=lab(W/2+6,14,"Puissant","start")+lab(W/2+6,H-6,"Léger","start")+lab(8,H/2+16,"Amer, sec","start")+lab(W-8,H/2+16,"Doux, fruité","end");
  const liked=pts.filter(p=>(S.ratings[p[0].id]||0)>=4);
  if(liked.length>=2){ const cx=liked.reduce((a,p)=>a+X(p[1]),0)/liked.length, cy=liked.reduce((a,p)=>a+Y(p[2]),0)/liked.length;
    s+=`<ellipse cx="${cx}" cy="${cy}" rx="52" ry="40" fill="var(--tint)" fill-opacity=".12" stroke="var(--tint)" stroke-dasharray="4 4"/><text x="${cx}" y="${cy-44}" text-anchor="middle" font-size="11" fill="var(--tint)" font-weight="700" font-family="-apple-system,sans-serif">Ta zone</text>`; }
  pts.forEach(([r,x,y])=>{ const on=set.has(r.id), made=madeCount(r.id), rt=S.ratings[r.id];
    s+=`<g data-a="rec" data-id="${r.id}" style="cursor:pointer" opacity="${on?1:.18}"><circle cx="${X(x)}" cy="${Y(y)}" r="12" fill="transparent"/><circle cx="${X(x)}" cy="${Y(y)}" r="${rt>=4?6.5:5}" fill="${made?r.col:"var(--bg2)"}" stroke="${rt>=4?"var(--tint)":mix(r.col,"#000000",.25)}" stroke-width="${rt>=4?2.4:1.6}"/></g>`; });
  s+=`</svg></div><div class="gf">Plein : déjà préparé. Contour doré : noté 4 étoiles ou plus.</div>`;
  return s;
}


let BF="";
function vBar(){
  const ids=Object.keys(S.stock).filter(id=>ING[id]&&!ING[id].basic);
  let o=nav("Mon bar",`<button class="icon-btn" data-a="addsheet" aria-label="Ajouter">${IC.plus}</button>`)+`<div class="content"><h1 class="lt">Mon bar</h1>`;
  if(!ids.length){ o+=`<div class="empty">${IC.bottle}<b>Ton bar est vide</b>Ajoute tes bouteilles et tes softs. Sucre, œufs, agrumes, crème et herbes fraîches sont déjà considérés comme disponibles.</div><div class="btn-row"><button class="btn" data-a="quickadd">Ajout rapide</button></div><div class="sp16"></div><div class="btn-row"><button class="btn sec" data-a="addsheet">Parcourir tous les ingrédients</button></div>`; return o+`</div>`; }
  o+=`<div class="stat-grid" style="grid-template-columns:1fr 1fr"><div class="stat"><b id="st-b">${barCount()}</b><span>bouteilles ouvertes</span></div><div class="stat t"><b id="st-m">${makeable()}</b><span>cocktails faisables</span></div></div>${hasPrices()?`<div class="gf" style="margin-top:10px">Valeur estimée de ton bar : <b style="color:var(--label)">${chf(barValue())}</b>, d’après les prix et niveaux renseignés.</div>`:`<div class="gf" style="margin-top:10px">Astuce : renseigne le prix d’une bouteille dans sa fiche pour voir le coût de chaque verre.</div>`}<div class="sp16"></div>`;
  o+=`<div class="seg" data-k="barview" style="margin-bottom:12px">${[["list","Liste"],["shelf","Étagère"],["low","Presque vides"]].map(([k,n])=>`<button class="${(S.settings.barView||"list")===k?"on":""}" data-a="barview" data-v="${k}">${n}</button>`).join("")}</div>`;
  if(S.settings.barView==="low") return o+lowView(ids)+`<div class="sp24"></div></div>`;
  if(S.settings.barView==="shelf") return o+shelfView(ids)+`<div class="sp16"></div><div class="btn-row"><button class="btn sec" data-a="addsheet">${IC.plus}Ajouter des ingrédients</button></div><div class="sp24"></div></div>`;
  o+=segChips(BF,"bf",true);
  const inSeg=id=>!BF||segOf(id)===BF;
  const out=ids.filter(id=>tracked(id)&&S.stock[id]===0&&inSeg(id));
  if(out.length) o+=`<h2 class="sh">À racheter</h2><div class="sh-sub">Bouteilles vides</div><div class="group">${out.map(id=>`<div class="row" style="--inset:58px"><div class="thumb" style="width:30px;height:44px">${bottleSVG(id,0)}</div><button class="grow" data-a="ing" data-id="${id}" style="text-align:left"><div class="t">${esc(ING[id].n)}</div><div class="s">${usedIn(id)} recettes l’utilisent</div></button><button class="btn small sec" data-a="refill" data-id="${id}">Racheté</button></div>`).join("")}</div>`;
  SEGS.forEach(([sg,sn])=>{ if(BF&&BF!==sg) return;
    if(sg==="add"){ const on=BASICS.filter(id=>ING[id]&&!ING[id].al&&has(id)), extra=ids.filter(id=>segOf(id)==="add");
      o+=`<h2 class="sh">${sn}</h2><div class="sh-sub">Toujours à portée de main, compté automatiquement</div><div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:calc(16rem / 17)">${on.length} basiques</b><button class="link" data-a="basics">Modifier</button></div><div class="basics">${on.map(id=>`<span>${esc(shortN(id))}</span>`).join("")}</div></div>`;
      if(extra.length) o+=`<div class="sp8"></div><div class="group">${extra.map(stockRow).join("")}</div>`; return; }
    const L=ids.filter(id=>segOf(id)===sg && !(tracked(id)&&S.stock[id]===0)).sort((a,b)=>ING[a].n.localeCompare(ING[b].n,"fr")); if(!L.length) return;
    o+=`<h2 class="sh"><span style="display:flex;align-items:center;gap:10px"><i style="width:10px;height:10px;border-radius:5px;background:${SEGCOL[sg]};display:block"></i>${sn}</span><span class="more" style="color:var(--label2)">${L.length}</span></h2><div class="sp8"></div><div class="group">${L.map(stockRow).join("")}</div>`;
  });
  if(!BF){ const br=bottleRecs().slice(0,3);
    if(br.length) o+=`<h2 class="sh">Achats malins</h2><div class="sh-sub">Classés selon les cocktails que tu devrais aimer</div><div class="group">${br.map(b=>`<button class="row tap" data-a="ing" data-id="${b.id}" style="--inset:58px"><div class="thumb" style="width:30px;height:44px">${bottleSVG(b.id,4)}</div><div class="grow"><div class="t">${esc(ING[b.id].n)}</div><div class="s">+${b.rs.length} : ${esc(b.rs.slice(0,3).map(r=>r.n).join(", "))}</div></div>${IC.chev}</button>`).join("")}</div>`; }
  o+=`<div class="sp24"></div><div class="btn-row"><button class="btn sec" data-a="addsheet">${IC.plus}Ajouter des ingrédients</button></div>`;
  return o+`<div class="sp24"></div></div>`;
}
function usedIn(id){ return RECS.filter(r=>r.ing.some(i=>i.id===id)).length; }
function stockRow(id){
  const i=ING[id], v=S.stock[id];
  if(tracked(id)) return `<div class="row" id="sr-${id}" style="--inset:58px"><button class="thumb" data-a="ing" data-id="${id}" style="width:30px;height:44px">${bottleSVG(id,v)}</button><button class="grow" data-a="ing" data-id="${id}" style="text-align:left"><div class="t">${esc(i.n)}</div><div class="s">${LVLN[v]}${prepActive(id)?", fait maison":""}</div></button>${lvlCtl(id,v)}</div>`;
  return `<div class="row" id="sr-${id}"><button class="grow" data-a="ing" data-id="${id}" style="text-align:left"><div class="t">${esc(i.n)}</div><div class="s">${v===1?"En stock":"À racheter"}</div></button><button class="switch ${v===1?"on":""}" data-a="toggle" data-id="${id}" aria-label="${esc(i.n)}"></button></div>`;
}
function lvlCtl(id,v){ let s=`<div class="lvl ${v===0?"empty":""}" role="group" aria-label="Niveau">`; for(let l=1;l<=4;l++) s+=`<button data-a="lvl" data-id="${id}" data-l="${l}" class="${v>=l?"on":""}" aria-label="${LVLN[l]}"><i style="height:${6+l*5}px"></i></button>`; return s+"</div>"; }
function patchStock(id){
  const row=document.getElementById("sr-"+id); if(!row||TAB!=="bar") return false;
  const v=S.stock[id];
  if(tracked(id)){ const bl=row.querySelector(".thumb .bl"); if(bl) bl.style.transform=`translateY(${((1-v/4)*21).toFixed(2)}px)`; else row.querySelector(".thumb").innerHTML=bottleSVG(id,v); row.querySelector(".s").textContent=LVLN[v]+(prepActive(id)?", fait maison":"");
    row.querySelectorAll(".lvl button").forEach(b=>{ const l=+b.dataset.l, on=v>=l; if(on&&!b.classList.contains("on")){ b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); } b.classList.toggle("on",on); }); }
  else { row.querySelector(".switch").classList.toggle("on",v===1); row.querySelector(".s").textContent=v===1?"En stock":"À racheter"; }
  return true;
}

// ---------- Labo ----------
let LT="compose";
function vLabo(){
  let o=nav("Labo")+`<div class="content"><h1 class="lt">Labo</h1><div class="seg">${[["compose","Composer"],["tech","Techniques"],["prep","Préparations"]].map(([k,n])=>`<button class="${LT===k?"on":""}" data-a="lt" data-t="${k}">${n}</button>`).join("")}</div>`;
  if(LT==="tech") o+=`<div class="sp16"></div><div class="group">${TECH.map(t=>`<button class="row tap" data-a="tech" data-id="${t.id}"><div class="grow"><div class="t">${esc(t.n)}</div><div class="s">${esc(t.t)}, ${esc(t.lvl.toLowerCase())}</div></div>${IC.chev}</button>`).join("")}</div>`;
  else if(LT==="prep") o+=vPreps();
  else o+=vCompose();
  return o+`<div class="sp24"></div></div>`;
}
function prepRow(p){
  const t=PREP_TPL.find(x=>x[0]===p.tpl)||[null,"Préparation",null,30], dl=daysLeft(p), life=p.life||t[3];
  const frac=clamp01(dl/life), col=dl<0?"var(--red)":dl<=3?"var(--orange)":"var(--green)", C=2*Math.PI*18;
  const ring=`<svg class="prep-ring" viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="var(--fill)" stroke-width="4"/><circle cx="22" cy="22" r="18" fill="none" stroke="${col}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${C*frac} ${C}" transform="rotate(-90 22 22)"/><text x="22" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="var(--label)" font-family="-apple-system,sans-serif">${dl<0?"!":dl}</text></svg>`;
  return `<button class="row tap" data-a="prep" data-pid="${p.id}" style="--inset:72px">${ring}<div class="grow"><div class="t">${esc(p.name||t[1])}</div><div class="s">${dl<0?"Périmé, à jeter":dl===0?"À utiliser aujourd’hui":dl===1?"Encore 1 jour":"Encore "+dl+" jours"}</div></div>${IC.chev}</button>`;
}
function vPreps(){
  const L=(S.preps||[]).slice().sort((a,b)=>daysLeft(a)-daysLeft(b));
  let o=`<div class="sp16"></div>`;
  if(!L.length) o+=`<div class="empty">${IC.flask}<b>Aucune préparation en cours</b>Sirops, infusions, cordials : note ce que tu fabriques et l’app te prévient avant que ça tourne.</div>`;
  else o+=`<div class="group">${L.map(prepRow).join("")}</div><div class="gf">Durées indicatives au frigo. Au moindre doute (trouble, odeur, moisissure), jette.</div>`;
  return o+`<div class="sp16"></div><div class="btn-row"><button class="btn" data-a="newprep">${IC.plus}Nouvelle préparation</button></div>`;
}

function mixItems(){ S.mix.items=(S.mix.items||[]).filter(i=>i&&ING[i.id]); return S.mix.items.map(it=>({id:it.id,q:it.q,u:unitOf(it.id),r:ING[it.id].fizz&&S.mix.m!=="build"?"top":""})); }
function mixIce(){ return S.mix.m==="build"?"cubes":"none"; }
function analyze(){
  const items=mixItems(), m=S.mix.m; if(!items.length) return null;
  const met=calc(items,m,mixIce()), st=labStyle(items,m), z=ZONES[st]||ZONES.sour, ratio=met.sug/Math.max(.05,met.acid*10);
  const out=[]; const base=baseOf(items)||"gin";
  const pickAcid=()=>{ const g=SPIRIT_GROUP[base]; const pref=(g==="rhum"||g==="agave"||g==="vodka"||items.some(i=>i.id==="ginger_beer"))?["citron_vert","citron"]:["citron","citron_vert"]; return pref.find(has)||pref[0]; };
  const pickSweet=()=>{ const g=SPIRIT_GROUP[base]; const pref=g==="agave"?["sirop_agave"]:g==="whisky"?["sirop_miel"]:g==="rhum"?["orgeat","sirop_sucre"]:[]; return pref.find(has)||"sirop_sucre"; };
  const solve=(id,fn,target,max=90)=>{ const u=unitOf(id); let lo=0,hi=max; for(let k=0;k<30;k++){ const mid=(lo+hi)/2; const t=items.concat([{id,q:mid,u,r:ING[id].fizz&&m!=="build"?"top":""}]); const v=fn(calc(t,m,mixIce())); if((v<target)===(fn(calc(items,m,mixIce()))<target)) lo=mid; else hi=mid; }
    const x=(lo+hi)/2; const step=u==="d"?1:2.5; const r=Math.round(x/step)*step; return r>=step?r:0; };
  const fix=(id,x,label,why)=>out.push({warn:1,t:label,why,fix:x?{id,q:x}:null});
  if(st==="sour"||st==="long"){
    if(met.acid<(st==="long"?Math.max(z.acid[0]*0.9,0.2):z.acid[0]*0.85)){ const id=pickAcid(); const x=solve(id,mm=>mm.acid,z.acid[1],60); fix(id,x,"Il manque d’acidité","Sans acide, le mélange paraît plat et sucré. Dans ce style, les recettes équilibrées tournent autour de "+num(Math.round(z.acid[1]*10)/10)+" % d’acidité."); }
    else if(ratio>z.ratio[2]*1.25){ const id=pickAcid(); const x=solve(id,mm=>mm.sug/Math.max(.05,mm.acid*10),z.ratio[1],60); fix(id,x,"Un peu trop sucré","Le sucre prend le dessus sur l’acidité. Rééquilibre avec de l’agrume plutôt que d’enlever du goût."); }
    else if(ratio<z.ratio[0]*0.62){ const id=pickSweet(); const x=solve(id,mm=>mm.sug/Math.max(.05,mm.acid*10),z.ratio[1],50); fix(id,x,"Trop acide","L’acidité agresse le palais. Un peu de sucre arrondit sans masquer."); }
  } else if(st==="spritz"){
    if(met.sug>z.sug[2]*1.3){ const fz=items.find(i=>ING[i.id].fizz)||{id:"eau_gazeuse"}; const x=solve(fz.id,mm=>mm.sug,z.sug[1],200); fix(fz.id,x,"Un peu trop sucré","Allonge avec plus de bulles pour retrouver la légèreté d’un spritz."); }
  } else if(st==="stirred"){
    if(met.sug>z.sug[2]*1.15){ const x=solve(base,mm=>mm.sug,z.sug[1],90); fix(base,x,"Trop sucré pour un cocktail sec","Les cocktails mélangés au verre restent secs. Ajoute un peu de spiritueux de base."); }
    else if(met.sug<1 && met.abv>18 && !items.some(i=>["vin","liqueur","amaro","sirop"].includes(ING[i.id].cat))){ const x=solve("sirop_sucre",mm=>mm.sug,z.sug[1]*0.8,20); fix("sirop_sucre",x,"Très sec","Une touche de sucre relie les arômes, comme dans un Old Fashioned."); }
  }
  if(st!=="cremeux" && met.abv>z.abv[2]*1.15){
    if(st==="long"||st==="spritz"){ const fz=items.find(i=>ING[i.id].fizz); const id=fz?fz.id:"eau_gazeuse"; const x=solve(id,mm=>-mm.abv,-z.abv[1],250); fix(id,x,"Très fort pour un long drink","Allonge pour retrouver la fraîcheur."); }
    else out.push({warn:1,t:"Très fort pour ce style",why:"Environ "+Math.round(met.abv)+" % d’alcool une fois dilué : "+(m==="shake"?"secoue plus longtemps ou ":"")+"allonge un peu les autres ingrédients."});
  } else if((st==="sour"||st==="stirred") && met.abv<z.abv[0]*0.75 && met.abv>0.5){ const x=solve(base,mm=>mm.abv,z.abv[1],60); fix(base,x,"Un peu léger","Le spiritueux se perd. Renforce la base."); }
  if(!out.length) out.push({warn:0,t:"Bien équilibré",why:"Ton mélange tombe dans les proportions des "+z.n+" recettes du même style de la base."});
  return {met,st,z,ratio,diag:out.slice(0,2),items};
}
function zoneBar(v,z,max){ const X=x=>clamp01(x/max)*100; return `<div class="zone"><i style="left:${X(z[0])}%;width:${X(z[2])-X(z[0])}%"></i><b style="left:${X(v)}%"></b></div>`; }
function pairings(items){
  const inMix=new Set(items.map(i=>i.id)); const base=baseOf(items); let g=base&&SPIRIT_GROUP[base]; if(!g&&items.some(i=>i.id==="ginger_beer")) g="gingembre";
  let L=(PAIR[g]||PAIR.gin).slice(); if(items.some(i=>i.id==="ginger_beer"||i.id==="sirop_gingembre")) L=L.concat(PAIR.gingembre);
  L=[...new Set(L)].filter(id=>!inMix.has(id)&&ING[id]); L.sort((a,b)=>has(b)-has(a)); return L.slice(0,4);
}
function nearest(items){
  const key=id=>["citron","citron_vert"].includes(id)?"agr":["sirop_sucre","sirop_miel","sirop_agave"].includes(id)?"suc":["ginger_beer","ginger_ale"].includes(id)?"ging":["eau_gazeuse","limonade"].includes(id)?"soda":SPIRIT_GROUP[id]&&ING[id].cat==="spirit"?"sp_"+SPIRIT_GROUP[id]:id;
  const vec=L=>{ const v={}; L.forEach(i=>{ if(i.r==="rinse") return; const k=key(i.id); v[k]=(v[k]||0)+Math.sqrt(Math.max(mlOf(i),1)); }); return v; };
  const a=vec(items); const cs=(x,y)=>{ let d=0,nx=0,ny=0; for(const k in x){ nx+=x[k]*x[k]; if(y[k]) d+=x[k]*y[k]; } for(const k in y) ny+=y[k]*y[k]; return d/Math.sqrt(nx*ny||1); };
  return RECS.map(r=>[r,cs(a,vec(r.ing))]).filter(x=>x[1]>0.62).sort((p,q2)=>q2[1]-p[1]).slice(0,3);
}
function vCompose(){
  const items=S.mix.items; let o=`<div class="sp16"></div><div class="seg">${[["shake","Shaker"],["stir","Verre à mélange"],["build","Construit"]].map(([k,n])=>`<button class="${S.mix.m===k?"on":""}" data-a="mm" data-m="${k}">${n}</button>`).join("")}</div>`;
  o+=`<div class="gh">Ton mélange</div><div class="group">`;
  if(!items.length) o+=`<div class="empty" style="padding:22px 24px 16px"><b>Compose librement</b>Par exemple rhum et ginger beer : l’app calcule le sucre, l’acidité et l’alcool, et te dit quoi ajouter.<div class="starter">${["daiquiri","negroni","moscow_mule","whisky_sour"].map(id=>`<button class="chip" data-a="tolab" data-id="${id}">Partir d’un ${esc(RMAP[id].n)}</button>`).join("")}</div></div>`;
  items.forEach((it,k)=>{ o+=`<div class="mix-row"><button class="rm" data-a="mixrm" data-k="${k}" aria-label="Retirer">${IC.x}</button><div class="n"><i style="display:inline-block;width:8px;height:8px;border-radius:4px;background:${SEGCOL[segOf(it.id)]};margin-right:8px"></i>${esc(ING[it.id].n)}</div><div class="stepper"><button data-a="mixq" data-k="${k}" data-d="-1" aria-label="Moins">${IC.minus}</button><span>${fmtQ({q:it.q,u:unitOf(it.id)}).replace(" traits","").replace(" trait","").replace(" feuilles","")}</span><button data-a="mixq" data-k="${k}" data-d="1" aria-label="Plus">${IC.plus}</button></div></div>`; });
  o+=`<button class="row tap" data-a="mixadd" style="color:var(--tint)">${IC.plus.replace("<svg","<svg width='20' height='20'")}<div class="grow">Ajouter un ingrédient</div></button></div>`;
  const A=analyze(); if(!A) return o;
  const {met,st,z}=A;
  o+=`<div class="gh">Analyse, profil ${esc(STYLE_N[st])}</div><div class="card"><div class="mixglass">${mixGlass(A)}</div><div class="metrics"><div class="metric"><b>${num(Math.round(met.abv*10)/10)} %</b><span>alcool</span>${zoneBar(met.abv,z.abv,40)}</div><div class="metric"><b>${num(Math.round(met.sug*10)/10)}</b><span>sucre g/100 ml</span>${zoneBar(met.sug,z.sug,16)}</div><div class="metric"><b>${num(Math.round(met.acid*100)/100)} %</b><span>acidité</span>${zoneBar(met.acid,z.acid,1.6)}</div></div>`;
  const p=profileOf(A.items,met);
  o+=`<div class="sp16"></div><div class="prof">${radarSVG(p)}<div class="muted" style="font-size:calc(14rem / 17)">Environ ${fmtMl(met.vol)} dans le verre après ${S.mix.m==="build"?"la fonte de la glace":"dilution"}. La zone verte montre la plage des classiques du même style.${hasPrices()?(()=>{ const c=costOf(A.items); return c.miss.length?"":" Coût : environ "+chf(c.tot)+"."; })():""}</div></div></div>`;
  o+=`<div class="gh">Diagnostic</div><div class="group">${A.diag.map((d,k)=>`<div class="diag"><div class="di ${d.warn?"warn":"ok"}">${d.warn?IC.warn:IC.checkc}</div><div class="dt"><b>${esc(d.t)}</b>${esc(d.why)}${d.fix?`<br><button class="btn small sec" data-a="mixfix" data-id="${d.fix.id}" data-q="${d.fix.q}">Ajouter ${esc(fmtQ({q:d.fix.q,u:unitOf(d.fix.id)}))} ${esc(de(lc(shortN(d.fix.id))).replace(/^de |^d’/,m=>m==="de "?"de ":"d’"))}</button>`:""}</div></div>`).join("")}</div>`;
  const pa=pairings(A.items);
  if(pa.length) o+=`<div class="gh">Pour aller plus loin</div><div class="group">${pa.map(id=>`<div class="pair"><div class="grow"><div class="pn">${esc(ING[id].n)} ${has(id)?`<span class="badge green">${ING[id].basic?"Toujours là":"Dans ton bar"}</span>`:`<span class="badge">À acheter</span>`}</div><div class="pr">Apporte ${esc(ROLE[id]||"de la complexité")}.</div></div><button class="btn small sec" data-a="mixadd1" data-id="${id}">Ajouter</button></div>`).join("")}</div>`;
  const nr=nearest(A.items);
  if(nr.length) o+=`<div class="gh">Ça ressemble à</div><div class="group">${nr.map(([r,s])=>recRow(r, s>0.9?"Presque identique":"Proche à "+Math.round(s*100)+" %")).join("")}</div>`;
  o+=`<div class="sp16"></div><div class="btn-row"><button class="btn" data-a="aiprompt">${IC.copy}Copier le prompt pour une IA</button></div><div class="gf">Colle-le dans ChatGPT, Claude ou une autre IA : il contient ton mélange, l’analyse, ton bar et tes goûts.</div>`;
  o+=`<div class="sp16"></div><div class="btn-row"><button class="btn sec" data-a="mixsave">Enregistrer</button><button class="btn gray" data-a="mixclear">Vider</button></div>`;
  return o;
}
function defaultQ(id){ const i=ING[id], u=unitOf(id); if(u==="d") return 2; if(u==="f") return 6; if(u==="u") return 1; if(u==="bs") return 1; if(u==="br") return 2; if(u==="gt") return 3;
  if(id==="blanc_oeuf") return 20; if(i.fizz) return 100; return {spirit:45,liqueur:15,amaro:22.5,vin:30,sirop:15,jus:(i.ac>3?22.5:60),frais:30}[i.cat]||30; }
function stepQ(q,u,d){ if(u==="d"||u==="f"||u==="u"||u==="bs"||u==="br"||u==="gt") return Math.max(1,q+d); const st=q<30||(q===30&&d<0)?2.5:q<100||(q===100&&d<0)?5:10; return Math.max(2.5,Math.round((q+d*st)*10)/10); }
function aiPrompt(){
  const A=analyze(); const items=mixItems();
  const lines=items.map(i=>"- "+fmtQ(i).replace(/^(\d)/,"$1")+" "+de(lc(shortN(i.id))).replace(/^de /,"de ").replace(/^/,"").trim());
  const meth={shake:"au shaker",stir:"au verre à mélange",build:"construit directement sur glace"}[S.mix.m];
  const bar=Object.keys(S.stock).filter(has).map(id=>ING[id].n);
  const LG=labGlass(), gname=(LGLASS.find(x=>x[0]===LG.g)||[,""])[1], icen=(LICE.find(x=>x[0]===LG.ice)||[,""])[1].toLowerCase(), garn=(S.mix.gar||[]).map(k=>LGARTXT[k].toLowerCase());
  let t="Tu es un barman expert en équilibre des cocktails. Aide-moi à améliorer une création maison.\n\nMon mélange ("+meth+") :\n"+lines.join("\n")+"\nVerre : "+gname.toLowerCase()+" ("+fmtMl(LCAP[LG.g])+"), glace : "+icen+(garn.length?", garniture : "+garn.join(", "):"")+".\n\n";
  if(A){ t+="Analyse de mon app (après dilution estimée) : environ "+num(Math.round(A.met.abv*10)/10)+" % d’alcool, "+num(Math.round(A.met.sug*10)/10)+" g de sucre pour 100 ml, "+num(Math.round(A.met.acid*100)/100)+" % d’acidité. Style détecté : "+STYLE_N[A.st]+".\nDiagnostic : "+A.diag.map(d=>d.t+(d.fix?" (suggestion : ajouter "+fmtQ({q:d.fix.q,u:unitOf(d.fix.id)})+" "+de(lc(shortN(d.fix.id)))+")":"")).join(" ; ")+".\n\n"; }
  t+="Ce que j’ai dans mon bar : "+(bar.length?bar.join(", "):"pas encore renseigné")+" (plus sucre, eau et glace).\n";
  const ts=tasteSentence(); if(ts) t+="Mes goûts, d’après mes notes : "+ts+"\n";
  const top=rated().filter(x=>x[1]>=4).map(x=>RMAP[x[0]].n).slice(0,6); if(top.length) t+="Cocktails que j’ai adorés : "+top.join(", ")+".\n";
  t+="\nPropose-moi 2 ou 3 améliorations précises, avec les quantités en ml, en utilisant en priorité ce que j’ai. Explique brièvement pourquoi chacune fonctionne, dis-moi si un achat vaut vraiment le coup, et donne un nom au cocktail final.";
  return t;
}


// ---------- Profil ----------
const TROPHIES=[
 ["first","Premier verre","Prépare ton premier cocktail",1,()=>S.hist.length],
 ["ten","Habitué","Prépare 10 cocktails",10,()=>S.hist.length],
 ["fifty","Pilier de bar","Prépare 50 cocktails",50,()=>S.hist.length],
 ["hundred","Légende","Prépare 100 cocktails",100,()=>S.hist.length],
 ["d10","Curieux","10 recettes différentes",10,()=>distinct().length],
 ["d30","Globe-trotter","30 recettes différentes",30,()=>distinct().length],
 ["fam","Tour des familles","Un cocktail de chaque famille",8,()=>new Set(distinct().map(id=>RMAP[id].fam)).size],
 ["sour","Tour du monde du sour","5 sours différents",5,()=>distinct().filter(id=>RMAP[id].fam==="sour").length],
 ["stir","Maître du verre à mélange","5 cocktails mélangés au verre",5,()=>distinct().filter(id=>RMAP[id].fam==="stirred").length],
 ["tiki","Âme tiki","3 cocktails tiki",3,()=>distinct().filter(id=>RMAP[id].fam==="tiki").length],
 ["swiss","Helvète","3 cocktails suisses",3,()=>distinct().filter(id=>RMAP[id].s).length],
 ["bitter","Amateur d’amer","5 cocktails avec un amer",5,()=>distinct().filter(id=>RMAP[id].ing.some(i=>ING[i.id].cat==="amaro")).length],
 ["hist","Historien","15 grands classiques",15,()=>distinct().filter(id=>RMAP[id].c).length],
 ["critic","Critique","Note 10 cocktails",10,()=>rated().length],
 ["palate","Palais affûté","Note 30 cocktails",30,()=>rated().length],
 ["bar15","Bar bien garni","15 bouteilles ouvertes",15,()=>barCount()],
 ["bar30","Cave de collection","30 bouteilles ouvertes",30,()=>barCount()],
 ["alch","Alchimiste","Lance une préparation maison",1,()=>S.prepCount||(S.preps||[]).length],
 ["crea","Créateur","Enregistre une création du labo",1,()=>S.labSaved||0],
 ["loyal","Fidèle","Prépare 5 fois le même cocktail",5,()=>Math.max(0,...Object.values(S.hist.reduce((a,h)=>(a[h.id]=(a[h.id]||0)+1,a),{})))],
 ["roul","Aventurier","Suis la roulette 3 fois",3,()=>S.roul||0],
 ["zero","Zéro degré","3 recettes sans alcool",3,()=>distinct().filter(id=>RMAP[id].na).length],
 ["night","Noctambule","Un cocktail entre minuit et 4 h",1,()=>S.hist.filter(h=>{const x=new Date(h.t).getHours();return x<4;}).length]
];
function distinct(){ return [...new Set(S.hist.map(h=>h.id))].filter(id=>RMAP[id]); }
function medal(k,on){ const id="m"+(++GID); const c1=on?"#F7D57A":"#D4D0CA", c2=on?"#C98A1E":"#A8A29A";
  const glyphs={first:"1",ten:"10",fifty:"50",hundred:"100",d10:"10",d30:"30",fam:"8",sour:"S",stir:"M",tiki:"T",swiss:"+",bitter:"A",hist:"H",critic:"★",palate:"★",bar15:"15",bar30:"30",alch:"⚗",crea:"✦",loyal:"∞",roul:"?",night:"☾",zero:"0",labpro:"90",lab10:"10"};
  const g=glyphs[k]||"•", small=g.length>2;
  return `<svg viewBox="0 0 56 56"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><circle cx="28" cy="28" r="25" fill="url(#${id})"/><circle cx="28" cy="28" r="20" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.5"/>${k==="swiss"?`<rect x="24.5" y="17" width="7" height="22" rx="1" fill="#fff"/><rect x="17" y="24.5" width="22" height="7" rx="1" fill="#fff"/>`:`<text x="28" y="${small?33:35}" text-anchor="middle" font-size="${small?15:20}" font-weight="800" fill="#fff" font-family="ui-rounded,-apple-system,sans-serif">${g}</text>`}</svg>`; }
function checkTrophies(){
  S.tro=S.tro||[]; let nw=null;
  TROPHIES.forEach(([k,n,,g,f])=>{ if(!S.tro.includes(k) && f()>=g){ S.tro.push(k); nw=n; } });
  if(nw){ save(); const k=S.tro[S.tro.length-1]; setTimeout(()=>{ toast("Trophée débloqué : "+nw,{icon:medal(k,true),trophy:1}); confetti(innerWidth/2,innerHeight-120); },350); dirty.profil=1; }
}
function vProfil(){
  let o=nav("Profil",`<button class="icon-btn" data-a="settings" aria-label="Paramètres">${IC.gear}</button>`)+`<div class="content"><h1 class="lt">Profil</h1>`;
  o+=`<div class="stat-grid"><div class="stat"><b>${S.hist.length}</b><span>préparés</span></div><div class="stat"><b>${distinct().length}</b><span>recettes</span></div><div class="stat t"><b>${rated().length}</b><span>notés</span></div></div>`;
  const tv=tasteVector(), sty=tasteStyle();
  o+=`<h2 class="sh">Ton profil de goût</h2>${sty?`<div class="sh-sub">Ton style : <b style="color:var(--tint)">${esc(sty)}</b></div>`:`<div class="sp8"></div>`}`;
  if(tv&&tv.liked){ o+=`<div class="card"><div class="prof">${radarSVG(tv.liked)}<div style="font-size:calc(15rem / 17)">${esc(tasteSentence())||"Continue à noter pour affiner ton profil."}<div class="muted" style="font-size:calc(13rem / 17);margin-top:6px">Calculé à partir des cocktails que tu as notés 4 étoiles ou plus.</div></div></div></div>`; }
  else if(S.quiz){ const Q=quizPrior(), av=avgProfile(); o+=`<div class="card"><div class="prof">${radarSVG(av.map((v,i)=>clamp01(v+Q.dir[i]*2.2)))}<div style="font-size:calc(15rem / 17)">D’après ton quiz. Ton profil s’affinera avec tes premières notes.</div></div></div>`; }
  else o+=`<div class="card muted" style="font-size:calc(15rem / 17)">Note au moins trois cocktails, dont un qui t’a plu, pour voir apparaître ton profil de goût. Plus tu notes, plus les suggestions deviennent justes.</div>`;
  if(hasTaste()){ const nx=RECS.filter(r=>!madeCount(r.id)&&!S.ratings[r.id]&&!r.na).map(r=>[r,predict(r)-0.22*status(r).miss.length]).sort((a,b)=>b[1]-a[1]).map(x=>x[0])[0];
    if(nx){ const ok=status(nx).ok; o+=`<h2 class="sh">Ton prochain coup de cœur</h2><div class="sh-sub">Jamais préparé, et c’est notre meilleur pari</div><button class="card buy" data-a="rec" data-id="${nx.id}" style="width:calc(100% - 32px);text-align:left"><div class="bb" style="width:56px;height:70px">${glassSVG(nx)}</div><div class="grow"><div class="bt" style="font-family:var(--serif)">${esc(nx.n)}</div><div class="bs">${matchPct(nx)} % pour toi. ${ok?"Tu peux le faire maintenant.":"Il te manque "+esc(status(nx).miss.map(x=>lc(shortN(x))).join(", "))+"."}</div></div>${IC.chev}</button>`; } }
  if(getModel().n>=2){ const mw=Object.assign({},mWeights()); let tot=mw.knn+mw.ing+mw.fam+mw.dims;
    // la régression (70 % de la prédiction) se répartit entre ton palais (profil) et tes styles (familles, alcools), selon ce qu'elle a appris
    const RW=ridgeOf(getModel()); if(RW){ const e=RW.W.map(w=>w*w), ep=e.slice(0,9).reduce((a,b)=>a+b,0), ec=e.slice(9).reduce((a,b)=>a+b,0), et=ep+ec||1;
      for(const k in mw) mw[k]=0.3*mw[k]/tot; mw.dims+=0.7*ep/et; mw.fam+=0.7*ec/et; tot=1; }
    const L=[["knn","Tes coups de cœur","des cocktails qui ressemblent à ceux que tu as bien notés","#FF9F0A"],["ing","Tes ingrédients","les bouteilles et saveurs qui reviennent dans ce que tu aimes","#FF375F"],["fam","Tes styles","les familles (sours, spritz…) et les alcools que tu préfères","#5E5CE6"],["dims","Ton palais","ton goût pour l’amer, le sucré, l’acide, le fort…","#30B0C7"]].map(x=>x.concat([Math.round(mw[x[0]]/tot*100)]));
    const top=L.slice().sort((a,b)=>b[4]-a[4])[0], pl=(n,a,b)=>n+" "+(n>1?b:a);
    const src=[[rated().length,"note","notes"],[S.hist.length,"verre préparé","verres préparés"],[Object.keys(S.adj||{}).length,"recette ajustée","recettes ajustées"]].filter(x=>x[0]).map(([n,a,b])=>pl(n,a,b)).concat(S.quiz?["quiz de goût"]:[]);
    o+=`<h2 class="sh">Ce qui guide tes suggestions</h2><div class="sh-sub">Zeste apprend de toi. Voici sur quoi il s’appuie le plus pour te proposer des cocktails.</div>
    <div class="card guide"><div class="gd-top">En ce moment, surtout <b>${esc(top[1].toLowerCase())}</b> : ${esc(top[2])}.</div>
    <div class="gd-bar">${L.map(x=>`<i style="width:${x[4]}%;background:${x[3]}"></i>`).join("")}</div>
    ${L.sort((a,b)=>b[4]-a[4]).map(x=>`<div class="gd-row"><span class="gd-dot" style="background:${x[3]}"></span><div class="grow"><b>${esc(x[1])}</b><span>${esc(x[2].charAt(0).toUpperCase()+x[2].slice(1))}</span></div><em>${x[4]} %</em></div>`).join("")}
    <div class="gd-src"><span>Appris grâce à</span>${src.map(x=>`<i>${esc(x)}</i>`).join("")}</div>
    <div class="gd-foot">Chaque nouvelle note renforce ce qui avait vu juste.</div></div>`; }
  const byBase={}; S.hist.forEach(h=>{ const r=RMAP[h.id]; if(!r) return; const b=BASE_LABEL[baseGroup(r)]; byBase[b]=(byBase[b]||0)+1; });
  const bb=Object.entries(byBase).sort((a,b)=>b[1]-a[1]).slice(0,6);
  if(bb.length){ const mx=bb[0][1]; o+=`<h2 class="sh">Tes spiritueux</h2><div class="card bars" style="padding:10px 0">${bb.map(([n,c])=>`<div class="bar-row"><div class="bl">${esc(n)}</div><div class="bt"><i style="width:${c/mx*100}%"></i></div><div class="bn">${c}</div></div>`).join("")}</div>`; }
  const fams=Object.keys(FAMILIES), done=new Set(distinct().map(id=>RMAP[id].fam));
  const dl=distinct();
  o+=`<h2 class="sh">Familles explorées<span class="more" style="color:var(--label2)">${done.size} sur ${fams.length}</span></h2><div class="sh-sub">${done.size?"En couleur : les familles dont tu as déjà préparé un cocktail.":"Prépare un cocktail pour colorier ta première famille."} Touche une famille pour la découvrir.</div><div class="fam-bar"><i style="width:${Math.round(done.size/fams.length*100)}%"></i></div><div class="fams">${fams.map(f=>{ const n=dl.filter(id=>RMAP[id].fam===f).length; return `<button class="famc ${n?"on":""}" data-a="famgo" data-f="${f}">${n?`<span class="fc-ic">${IC.check}</span>`:`<span class="fc-ic off"></span>`}<span class="fc-t"><span class="fc-n">${esc(FAMILIES[f])}</span><em>${n?n+" recette"+(n>1?"s":"")+" préparée"+(n>1?"s":""):"À découvrir"}</em></span></button>`; }).join("")}</div>`;
  const best=rated().filter(x=>x[1]>=4).sort((a,b)=>b[1]-a[1]).slice(0,5);
  if(best.length) o+=`<h2 class="sh">Tes mieux notés</h2><div class="group">${best.map(([id])=>recRow(RMAP[id])).join("")}</div>`;
  const last=S.hist.slice(-6).reverse().filter(h=>RMAP[h.id]);
  if(last.length) o+=`<h2 class="sh">Derniers verres</h2><div class="group">${last.map(h=>recRow(RMAP[h.id], rel(h.t))).join("")}</div>`;
  const got=S.tro||[];
  o+=trophyGrid();
  o+=`${rewindEligible()?`<div class="sp16"></div><button class="rw-card" data-a="rewind" style="margin-top:8px"><div class="rw-bg"></div><div class="rw-in"><div class="rw-k">${IC.sparkle}Zeste Rewind</div><div class="rw-t">Ton année en cocktails</div><div class="rw-s">Revis ton année en quelques histoires, et partage ta carte.</div></div><div class="rw-play">${IC.play}</div></button>`:""}`;
  o+=`<div class="sp24"></div><div class="group"><button class="row tap" data-a="settings" style="--inset:62px"><span class="set-ic" style="background:#8E8E93">${IC.gear}</span><div class="grow">Paramètres</div>${IC.chev}</button></div>`;
  return o+`<div class="sp24"></div></div>`;
}


// ================= FEUILLES =================
const SHEETS=[];
function openSheet(render, opt={}){
  const wrap=$("#sheets"); const bd=document.createElement("div"); bd.className="backdrop"; bd.dataset.a="closesheet";
  const el=document.createElement("div"); el.className="sheet"+(opt.short?" short":""); el.setAttribute("role","dialog");
  wrap.append(bd,el); const sh={el,bd,render,opt}; SHEETS.push(sh); paintSheet(sh); document.body.classList.add("sheet-open");
  requestAnimationFrame(()=>requestAnimationFrame(()=>{el.classList.add("open"); bd.classList.add("open");}));
  dragSheet(sh); return sh;
}
function paintSheet(sh){
  const body=sh.el.querySelector(".sheet-body"), st=body?body.scrollTop:0; const r=sh.render();
  sh.el.classList.toggle("has-foot",!!r.foot);
  if(!sh.painted){ sh.painted=1; sh.el.classList.add("fresh"); setTimeout(()=>sh.el.classList.remove("fresh"),1200); }
  sh.el.innerHTML=`<div class="sheet-head ${(r.title||r.left)?"titled":""}"><div class="sl">${r.left||""}</div><div class="st">${esc(r.title||"")}</div><div class="sr">${r.right!=null?r.right:`<button class="close-x" data-a="closesheet" aria-label="Fermer">${IC.x}</button>`}</div></div><div class="sheet-body">${r.body}</div>${r.foot?`<div class="sheet-foot">${r.foot}</div>`:""}`;
  animateSegs(sh.el); const nb=sh.el.querySelector(".sheet-body"); nb.scrollTop=st; const hd=sh.el.querySelector(".sheet-head"); const upd=()=>hd.classList.toggle("scrolled",nb.scrollTop>40); nb.addEventListener("scroll",upd,{passive:true}); upd(); if(r.after) r.after(sh.el);
}
function refreshSheets(){ SHEETS.forEach(paintSheet); }
function closeSheet(){ const sh=SHEETS.pop(); if(!sh) return; if(!SHEETS.length) document.body.classList.remove("sheet-open"); sh.el.classList.remove("open"); sh.bd.classList.remove("open"); setTimeout(()=>{sh.el.remove(); sh.bd.remove();},420); if(dirty[TAB]) renderView(TAB); }
function closeAll(){ while(SHEETS.length) closeSheet(); }
function dragSheet(sh){
  let y0=null,dy=0; const el=sh.el;
  el.addEventListener("touchstart",e=>{ const head=e.target.closest(".sheet-head"); const body=el.querySelector(".sheet-body"); if(!head && body.scrollTop>0) return; if(e.target.closest("button,input,textarea,.stepper,.lvl,.chips,.segchips,.scroller,.sheet-foot")) return; y0=e.touches[0].clientY; dy=0; },{passive:true});
  el.addEventListener("touchmove",e=>{ if(y0==null) return; dy=e.touches[0].clientY-y0; if(dy>0){ el.classList.add("drag"); el.style.transform=`translateY(${dy}px)`; } },{passive:true});
  el.addEventListener("touchend",()=>{ if(y0==null) return; el.classList.remove("drag"); el.style.transform=""; if(dy>110) closeSheet(); y0=null; });
}
const popOn=(k)=>POP&&POP.k===k&&Date.now()-POP.t<700;

// fiche cocktail
function recSheet(id){
  S.opens=S.opens||{}; S.opens[id]=(S.opens[id]||0)+1; try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){}
  let mult=S.settings.glasses||1, first=true, ver=getAdj(id)?"mine":"orig";
  const sh=openSheet(()=>{ const r=RMAP[id]; if(!r) return {title:"",body:""}; const adj=getAdj(id); if(!adj) ver="orig";
    const items= ver==="mine"? adjItems(r) : r.ing;
    const st=status(r), m= ver==="mine"? calc(items,r.m,r.ice) : metricsR(r), p=profileR(r), rt=S.ratings[id]||0, fav=S.fav.includes(id);
    let b=`<div class="dhero"><div class="glow" style="background:radial-gradient(circle at 50% 42%, ${r.col}78, transparent 60%)"></div><div class="dg" data-a="jiggle">${glassSVG(r,{pour:first,live:1,stream:first&&FX("stream")})}</div><h1>${esc(r.n)}</h1><div class="tags"><span class="badge">${FAMILIES[r.fam]}</span>${r.c?`<span class="badge">Classique</span>`:""}${r.s?`<span class="badge tint">Suisse</span>`:""}${r.cr?`<span class="badge">Création à tester</span>`:""}${r.mine?`<span class="badge tint">Ma création</span>`:""}${m.abv<0.5?`<span class="badge green">Sans alcool</span>`:""}${madeCount(id)?`<span class="badge green">Fait ${madeCount(id)} fois</span>`:""}</div></div>`;
    first=false;
    b+=`<div class="facts"><div><b>${Math.round(m.abv)} %</b><span>alcool</span></div><div><b>${fmtMl(m.vol*mult)}</b><span>volume</span></div><div><b>${esc(METH[r.m])}</b><span>méthode</span></div><div><b>${esc(GNAME[r.g]||"")}</b><span>verre</span></div></div>`+costLine(items,mult,id);
    if(st.ok) b+=`<div class="status ok">${IC.checkc}<span>Tu as tout ce qu’il faut.</span></div>`;
    else b+=`<div class="status no">${IC.warn}<span>${st.subOk?"Faisable en remplaçant ":"Il te manque "}${st.miss.map(x=>`<b>${esc(lc(shortN(x)))}</b>${st.subs[x]?" par "+esc(lc(shortN(st.subs[x]))):""}`).join(", ")}.</span></div>`;
    const rp=popOn("rate"+id);
    b+=`<div class="card rate-box" style="padding:6px 8px 6px 12px;margin-top:10px"><div class="stars">${[1,2,3,4,5].map(n=>`<button class="${n<=rt?"on":""} ${rp&&n<=rt?"pop":""}" data-a="rate" data-id="${id}" data-n="${n}" aria-label="${n} étoiles">${IC.star}</button>`).join("")}</div><span class="muted" style="font-size:calc(14rem / 17);text-align:right;line-height:1.2">${rt?["","Pas pour moi","Bof","Correct","Très bon","Coup de cœur"][rt]:hasTaste()?`<b style="color:var(--tint);font-family:var(--rounded);font-size:calc(17rem / 17)">${matchPct(r)} %</b><br>pour toi`:"Pas encore noté"}</span></div>`;
    b+=adjCard(r);
    b+=`<h2 class="sh">Ingrédients<span class="stepper" style="font-size:calc(15rem / 17)"><button data-a="mult" data-d="-1" aria-label="Moins">${IC.minus}</button><span>${mult} verre${mult>1?"s":""}</span><button data-a="mult" data-d="1" aria-label="Plus">${IC.plus}</button></span></h2>${adj?`<div class="seg" data-k="ver" style="margin:8px 16px 0">${[["mine","Ta version"],["orig","Originale"]].map(([k,n])=>`<button class="${ver===k?"on":""}" data-a="ver" data-v="${k}">${n}</button>`).join("")}</div>`:""}<div class="sp8"></div><div class="group">`;
    SEGS.forEach(([sg,sn])=>{ const L=r.ing.filter(it=>segOf(it.id)===sg); if(!L.length) return;
      b+=`<div class="ing-sec"><i style="background:${SEGCOL[sg]}"></i>${sn}${sg==="add"?"<span>Toujours à portée de main</span>":""}</div>`;
      L.forEach(it0=>{ const it=items.find(x=>x.id===it0.id&&x.r===it0.r)||it0; const bas=ING[it.id].basic, miss=!has(it.id)&&it.r!=="opt"&&it.r!=="rinse";
        const role={opt:"Facultatif",rinse:"Facultatif, pour parfumer le verre",top:"Pour compléter le verre",float:ING[it.id].sug>=40?"Versé en filet à la fin":ING[it.id].cat==="bitters"?"Quelques gouttes sur le dessus":"Versé en dernier, en surface",rinse:"Pour rincer le verre"}[it.r]||"";
        b+=`<button class="ing-line ${miss?"miss":""} ${bas&&!miss?"basic":""}" data-a="ing" data-id="${it.id}"><span class="q">${termify(esc(fmtQ(it,mult)))}${it.orig!=null&&ver==="mine"?`<span class="delta ${it.q>it.orig?"up":"down"}">${it.q>it.orig?"+":"−"}${esc(fmtQ({q:Math.abs(it.q-it.orig),u:it.u},mult).replace(/ (traits?|feuilles|morceaux?|brins?|gouttes?)$/,""))}</span>`:""}</span><span class="n">${esc(ING[it.id].n)}${role?`<small>${role}</small>`:""}</span>${miss?`<span class="badge red">Manque</span>`:""}</button>`; });
    });
    b+=`</div><div class="gf">Garniture : ${esc(lc(r.gar||"aucune"))}.</div>`;
    b+=`<h2 class="sh">Préparation</h2><div class="sp8"></div><div class="group"><ol class="steps tick-steps">${buildSteps(r).map(s=>`<li data-a="stepck">${termify(esc(s.t))}</li>`).join("")}</ol></div><div class="gf">Touche une étape pour la cocher, et un mot souligné pour son explication.</div>`;
    if(r.tip) b+=`<div class="sp8"></div><div class="card" style="font-size:calc(15rem / 17);display:flex;gap:10px"><span style="color:var(--tint);flex:none">${IC.sparkle.replace("<svg","<svg width='20' height='20'")}</span><span>${esc(r.tip)}</span></div>`;
    if(r.h) b+=`<h2 class="sh">Histoire</h2><div class="sp8"></div><div class="card"><p class="hist">${esc(r.h)}</p></div>`;
    b+=`<h2 class="sh">Profil</h2><div class="sp8"></div><div class="card"><div class="prof">${radarSVG(p,avgProfile())}<div style="font-size:calc(14rem / 17);color:var(--label2)">${esc(reasons(r))}.<div style="margin-top:8px;font-size:calc(12rem / 17)">La ligne pointillée montre la moyenne de la carte.</div></div></div></div>`;
    const tips=[...new Set(r.ing.map(i=>i.id))].filter(x=>ING[x].tip&&["spirit","liqueur","amaro","vin","bitters"].includes(ING[x].cat));
    if(tips.length) b+=`<h2 class="sh">Quelle bouteille choisir</h2><div class="sp8"></div><div class="group">${tips.map(x=>`<details class="tip"><summary>${esc(ING[x].n)}${IC.chev}</summary><p>${esc(ING[x].tip)}</p></details>`).join("")}</div>`;
    if(r.v.length) b+=`<h2 class="sh">Variantes et cousins</h2><div class="sp8"></div><div class="scroller">${r.v.map(v=>RMAP[v]).filter(Boolean).map(v=>tileLite(v)).join("")}</div>`;
    b+=`<h2 class="sh">Ma note perso</h2><div class="sp8"></div><div class="group"><textarea class="note" data-note="${id}" placeholder="Ce que tu as changé, ce que tu referais…">${esc(S.notes[id]||"")}</textarea></div>`;
    b+=`<div class="sp16"></div><div class="group"><button class="row tap" data-a="tolab" data-id="${id}"><span style="color:var(--tint)">${IC.flask.replace("<svg","<svg width='22' height='22'")}</span><div class="grow">Modifier dans le labo</div>${IC.chev}</button></div>`;
    if(r.mine) b+=`<div class="sp16"></div><div class="btn-row"><button class="btn danger" data-a="delcustom" data-id="${id}">Supprimer cette création</button></div>`;
    const hp=popOn("fav"+id);
    return {title:"",body:b,foot:`<button class="btn sec sq ${hp?"hpop":""}" data-a="fav" data-id="${id}" aria-label="Favori">${fav?IC.heartf:IC.heart}</button><button class="btn sec ${popOn("made"+id)?"did":""}" data-a="made" data-id="${id}">${popOn("made"+id)?IC.check+"Ajouté":"Je l’ai fait"}</button><button class="btn" data-a="barmode" data-id="${id}">${IC.play}Préparer</button>`};
  });
  sh.setMult=d=>{ mult=Math.max(1,Math.min(8,mult+d)); paintSheet(sh); };
  sh.setVer=v=>{ ver=v; paintSheet(sh); };
  sh.recId=id;
}

// fiche ingrédient
function ingSheet(id){
  openSheet(()=>{ const i=ING[id], v=S.stock[id], hv=has(id); const uses=RECS.filter(r=>r.ing.some(x=>x.id===id));
    const unlock=RECS.filter(r=>{ const s=status(r); return s.miss.length===1&&s.miss[0]===id; }).sort((a,b)=>predict(b)-predict(a));
    let b=`<div style="text-align:center;padding:0 20px"><div style="height:110px;display:grid;place-items:center">${tracked(id)?bottleSVG(id,v==null?4:v).replace("<svg","<svg style='height:110px;width:auto'"):`<div class="badge" style="font-size:calc(14rem / 17);height:30px;padding:0 14px">${CATS[i.cat].n}</div>`}</div><h1 style="font-family:var(--serif);font-size:calc(28rem / 17);margin:10px 0 4px">${esc(i.n)}</h1><div class="muted" style="font-size:calc(15rem / 17)">${CATS[i.cat].n}${i.abv?", "+num(i.abv)+" %":""}${i.basic?", toujours disponible":""}</div></div>`;
    if(i.basic) b+=`<div class="card" style="margin-top:18px;font-size:calc(15rem / 17)">Contenu additionnel : il est considéré comme toujours disponible. Tu peux changer ça dans les réglages du profil.<div class="sp8"></div><button class="btn small sec" data-a="basics">Gérer les basiques</button></div>`;
    if(!i.basic){
      if(tracked(id)){ b+=`<div class="gh">Niveau dans ton bar</div><div class="card"><div class="lvl-big">${[0,1,2,3,4].map(l=>`<button class="${v===l?"on":""}" data-a="setlvl" data-id="${id}" data-l="${l}">${bottleSVG(id,l)}${LVLN[l]}</button>`).join("")}</div></div>`;
        if(v===undefined) b+=`<div class="gf">Pas encore dans ton bar : choisis un niveau pour l’ajouter.</div>`; }
      else b+=`<div class="group" style="margin-top:18px"><div class="row"><div class="grow">J’en ai</div><button class="switch ${v===1?"on":""}" data-a="toggle" data-id="${id}"></button></div></div>`;
    }
    if(prepActive(id)) b+=`<div class="gf">Tu en as une préparation maison en cours.</div>`;
    b+=priceBlock(id);
    if(i.tip) b+=`<div class="gh">Conseil</div><div class="card" style="font-size:calc(15rem / 17)">${esc(i.tip)}</div>`;
    const tech=TECH.find(t=>t.u.includes(id)&&t.p.length); if(tech) b+=`<div class="sp8"></div><div class="group"><button class="row tap" data-a="tech" data-id="${tech.id}"><div class="grow link">Le faire maison : ${esc(tech.n.toLowerCase())}</div>${IC.chev}</button></div>`;
    if(!hv&&unlock.length) b+=`<div class="gh">Si tu l’achètes, tu débloques</div><div class="group">${unlock.slice(0,8).map(r=>recRow(r)).join("")}</div>`;
    if(uses.length) b+=`<div class="gh">Utilisé dans ${uses.length} recette${uses.length>1?"s":""}</div><div class="group">${uses.slice(0,30).map(r=>recRow(r)).join("")}</div>`;
    if(inBar(id)&&!i.basic) b+=`<div class="sp16"></div><div class="btn-row"><button class="btn danger" data-a="rmstock" data-id="${id}">Retirer de mon bar</button></div>`;
    return {title:"",body:b};
  });
}

let AS="spirit";
function addSheet(){
  let qq="";
  // Résultats seuls (sans le champ de recherche) : reconstruits à chaque frappe sans recréer le champ,
  // qui perdrait sinon des lettres en tapant vite sur iOS.
  const results=()=>{ let b=""; if(!qq) b+=segChips(AS,"as",false);
    const L=Object.values(ING).filter(i=>i.id!=="eau"&&!i.al&&(qq? norm(i.n).includes(norm(qq)) : segOf(i.id)===AS)).sort((a,c)=>a.n.localeCompare(c.n,"fr"));
    const bas=L.filter(i=>i.basic), oth=L.filter(i=>!i.basic);
    if(oth.length) b+=`<div class="group" style="margin-top:8px">${oth.map(i=>{ const on=inBar(i.id)&&(tracked(i.id)?S.stock[i.id]>0:S.stock[i.id]===1); return `<button class="row tap" data-a="addtoggle" data-id="${i.id}"><div class="grow"><div class="t">${esc(i.n)}</div>${qq?`<div class="s">${SEGS.find(s=>s[0]===segOf(i.id))[1]}</div>`:""}</div><span style="color:${on?"var(--tint)":"var(--label3)"};width:26px;height:26px;display:grid;place-items:center">${on?IC.checkc.replace("<svg","<svg width='24' height='24'"):IC.plus.replace("<svg","<svg width='22' height='22'")}</span></button>`; }).join("")}</div>`;
    if(bas.length) b+=`<div class="gh">Toujours à portée de main</div><div class="group">${bas.map(i=>`<div class="row"><div class="grow"><div class="t">${esc(i.n)}</div></div><span class="badge ${has(i.id)?"green":""}">${has(i.id)?"Compté":"Désactivé"}</span></div>`).join("")}</div><div class="gf">Ces basiques sont comptés automatiquement. <button class="link" data-a="basics">Modifier</button></div>`;
    if(!L.length) b+=`<div class="empty">Aucun ingrédient trouvé.</div>`;
    return b; };
  const sh=openSheet(()=>({title:"Ajouter au bar",body:`<label class="search">${IC.search}<input id="aq" type="search" placeholder="Rechercher un ingrédient" value="${esc(qq)}" autocomplete="off"></label><div id="aq-res">${results()}</div>`,right:`<button class="link" data-a="closesheet" style="font-weight:600">OK</button>`,after:el=>{ const inp=el.querySelector("#aq"); inp.oninput=()=>{ qq=inp.value; const res=el.querySelector("#aq-res"); if(res){ res.innerHTML=results(); animateSegs(res); } }; }}));
}
function basicsSheet(){
  openSheet(()=>({title:"Contenu additionnel",body:`<p class="body" style="margin-bottom:12px">Ces ingrédients sont considérés comme toujours disponibles. Désactive ceux que tu n’as jamais sous la main.</p><div class="group">${BASICS.filter(id=>ING[id]&&!ING[id].al).map(id=>`<div class="row"><div class="grow"><div class="t">${esc(ING[id].n)}</div></div><button class="switch ${has(id)?"on":""}" data-a="nobasic" data-id="${id}" aria-label="${esc(ING[id].n)}"></button></div>`).join("")}</div>`}));
}
let PS="spirit";
function pickIngSheet(cb){
  let qq="";
  const results=()=>{ const L=Object.values(ING).filter(i=>i.id!=="eau"&&!i.al&&(qq? norm(i.n).includes(norm(qq)) : segOf(i.id)===PS));
    const mine=L.filter(i=>has(i.id)).sort((a,b)=>a.n.localeCompare(b.n,"fr")), rest=L.filter(i=>!has(i.id)).sort((a,b)=>a.n.localeCompare(b.n,"fr"));
    const rows=A=>A.map(i=>`<button class="row tap" data-a="pickit" data-id="${i.id}"><i style="width:8px;height:8px;border-radius:4px;background:${SEGCOL[segOf(i.id)]};flex:none"></i><div class="grow"><div class="t">${esc(i.n)}</div></div>${IC.plus.replace("<svg","<svg width='20' height='20' style='color:var(--tint)'")}</button>`).join("");
    return `${qq?"":segChips(PS,"ps",false)}${mine.length?`<div class="gh">Disponible chez toi</div><div class="group">${rows(mine)}</div>`:""}${rest.length?`<div class="gh">À acheter</div><div class="group">${rows(rest)}</div>`:""}`; };
  const sh=openSheet(()=>({title:"Ajouter au mélange",body:`<label class="search">${IC.search}<input id="pq" type="search" placeholder="Rechercher" value="${esc(qq)}" autocomplete="off"></label><div id="pq-res">${results()}</div>`,
      after:el=>{ const inp=el.querySelector("#pq"); inp.oninput=()=>{ qq=inp.value; const res=el.querySelector("#pq-res"); if(res){ res.innerHTML=results(); animateSegs(res); } }; }}));
  sh.cb=cb;
}

function quickAdd(){
  const common=["gin","vodka","rhum_blanc","rhum_ambre","tequila","bourbon","scotch","triple_sec","campari","aperol","vermouth_rouge","vermouth_dry","angostura","prosecco","kirsch","williamine","citron","citron_vert","orange","eau_gazeuse","tonic","ginger_beer","cola","menthe"];
  openSheet(()=>({title:"Ajout rapide",right:`<button class="link" data-a="closesheet" style="font-weight:600">OK</button>`,body:`<p class="body" style="margin-bottom:14px">Touche ce que tu as. Tu pourras régler les niveaux ensuite dans l’onglet Bar.</p><div class="chips" style="flex-wrap:wrap;gap:10px">${common.map(id=>{ const on=inBar(id)&&(tracked(id)?S.stock[id]>0:S.stock[id]===1); return `<button class="chip ${on?"on":""}" data-a="addtoggle" data-id="${id}" style="height:38px;font-size:calc(16rem / 17)">${esc(shortN(id))}</button>`; }).join("")}</div><div class="sp24"></div><div class="btn-row"><button class="btn sec" data-a="addsheet">Voir tous les ingrédients</button></div>`}),{short:true});
}
function techSheet(id){
  const t=TECH.find(x=>x.id===id);
  openSheet(()=>({title:"",body:`<div style="padding:0 20px"><h1 style="font-family:var(--serif);font-size:calc(30rem / 17);margin:4px 0 6px">${esc(t.n)}</h1><div style="display:flex;gap:6px;margin-bottom:12px"><span class="badge">${esc(t.t)}</span><span class="badge">${esc(t.lvl)}</span></div><p class="hist" style="font-size:calc(17rem / 17)">${esc(t.d)}</p></div><div class="gh">Étapes</div><div class="group"><ol class="steps">${t.st.map(s=>`<li>${esc(s)}</li>`).join("")}</ol></div>${t.k?`<div class="gh">Conservation</div><div class="card" style="font-size:calc(15rem / 17)">${esc(t.k)}</div>`:""}${t.p.length?`<div class="sp16"></div><div class="btn-row"><button class="btn" data-a="startprep" data-tpl="${t.p[0]}">Je lance une préparation</button></div><div class="gf">Elle apparaîtra dans Préparations, avec un compte à rebours de conservation.</div>`:""}${t.u.length?`<div class="gh">Pour</div><div class="group">${[...new Set(RECS.filter(r=>r.ing.some(i=>t.u.includes(i.id))).map(r=>r.id))].slice(0,8).map(x=>recRow(RMAP[x])).join("")}</div>`:""}`}));
}
function newPrepSheet(){
  openSheet(()=>({title:"Nouvelle préparation",body:`<div class="group" style="margin-top:6px">${PREP_TPL.map(t=>`<button class="row tap" data-a="startprep" data-tpl="${t[0]}"><div class="grow"><div class="t">${esc(t[1])}</div><div class="s">Se garde environ ${t[3]>=60?Math.round(t[3]/30)+" mois":t[3]+" jours"}</div></div>${IC.plus.replace("<svg","<svg width='20' height='20' style='color:var(--tint)'")}</button>`).join("")}</div>`}));
}
function prepSheet(pid){
  openSheet(()=>{ const p=(S.preps||[]).find(x=>x.id===pid); if(!p) return {title:"",body:`<div class="empty">Préparation supprimée.</div>`};
    const t=PREP_TPL.find(x=>x[0]===p.tpl), dl=daysLeft(p), tech=TECH.find(x=>x.p.includes(p.tpl));
    return {title:"",body:`<div style="padding:0 20px;text-align:center"><h1 style="font-family:var(--serif);font-size:calc(28rem / 17);margin:6px 0 4px">${esc(p.name||t[1])}</h1><div class="muted">${dl<0?"Périmé depuis "+(-dl)+" jour"+(-dl>1?"s":""):"Encore environ "+dl+" jour"+(dl>1?"s":"")}</div></div>
    <div class="gh">Détails</div><div class="group"><div class="row"><div class="grow">Nom</div><input data-prepname="${pid}" value="${esc(p.name||t[1])}" style="border:0;background:transparent;text-align:right;outline:none;color:var(--label2);width:55%"></div><div class="row"><div class="grow">Préparé le</div><input type="date" data-prepdate="${pid}" value="${p.d.slice(0,10)}" style="border:0;background:transparent;color:var(--tint);outline:none"></div><div class="row"><div class="grow">Conservation</div><div class="stepper"><button data-a="preplife" data-pid="${pid}" data-d="-1">${IC.minus}</button><span>${p.life||t[3]} j</span><button data-a="preplife" data-pid="${pid}" data-d="1">${IC.plus}</button></div></div></div>
    ${t[2]?`<div class="gf">Tant qu’elle est valable, ${esc(lc(ING[t[2]].n))} compte comme disponible dans ton bar.</div>`:""}
    ${tech?`<div class="sp16"></div><div class="group"><button class="row tap" data-a="tech" data-id="${tech.id}"><div class="grow link">Revoir la technique</div>${IC.chev}</button></div>`:""}
    <div class="sp16"></div><div class="btn-row"><button class="btn danger" data-a="delprep" data-pid="${pid}">Terminée ou jetée</button></div>`};
  });
}

function textSheet(title,text){
  openSheet(()=>({title,body:`<p class="body" style="margin-bottom:10px">Sélectionne le texte et copie-le, ou utilise le partage.</p><div class="group"><textarea class="note" readonly style="min-height:260px;font-size:calc(14rem / 17)" id="tt">${esc(text)}</textarea></div><div class="sp16"></div>${navigator.share?`<div class="btn-row"><button class="btn" data-a="sharetxt">${IC.share}Partager</button></div>`:""}`,after:el=>{ const t=el.querySelector("#tt"); setTimeout(()=>{t.focus();t.select();},300); el._text=text; }}));
}
function nameSheet(){
  openSheet(()=>({title:"Enregistrer",body:`<p class="body" style="margin-bottom:12px">Donne un nom à ta création : elle rejoindra la liste des cocktails, avec ses étapes et son profil.</p><div class="group"><div class="row"><input id="nm" placeholder="Nom du cocktail" style="flex:1;border:0;background:transparent;outline:none;font-size:calc(17rem / 17)" maxlength="40"></div></div><div class="sp16"></div><div class="btn-row"><button class="btn" data-a="savemix">Enregistrer</button></div>`,after:el=>setTimeout(()=>el.querySelector("#nm").focus(),350)}),{short:true});
}


// ================= MODE BARMAN & ROULETTE =================
let BM=null;
function barMode(id){
  const r=RMAP[id]; BM={r,i:0,mult:1,done:{},timer:null,items:adjItems(r)};
  $("#overlay").classList.add("open"); paintBM();
}
function bmSteps(){ const r=BM.r; return [{t:"Prépare tout",list:1}].concat(buildSteps(r)).concat([{t:"Santé !",end:1}]); }
function paintBM(){
  const r=BM.r, st=bmSteps(), s=st[BM.i], n=st.length;
  let body=`<div class="bm-prog">${st.map((_,k)=>`<i class="${k<BM.i?"done":k===BM.i?"now":""}"></i>`).join("")}</div><div class="bm-count">Étape ${BM.i+1} sur ${n}</div>`;
  if(s.list){ body+=`<div class="bm-text">Sors ${esc(GLASSES[r.g])}${r.ice!=="none"||["shake","stir","mshake"].includes(r.m)?" et de la glace":""}, puis réunis :</div>${getAdj(r.id)?`<div class="bm-mine">${IC.sparkle}Ta version ajustée</div>`:""}<div class="bm-list">${BM.items.map((it,k)=>`<button class="bm-item ${BM.done[k]?"done":""}" data-a="bmck" data-k="${k}"><span class="ck">${BM.done[k]?IC.check.replace("<svg","<svg width='18' height='18'"):""}</span><span class="bq">${fmtQ(it,BM.mult)}</span><span class="bn">${esc(ING[it.id].n)}${it.r==="opt"?" (facultatif)":""}</span></button>`).join("")}</div>`; }
  else if(s.end){ const rt=S.ratings[r.id]||0; body+=`<div style="text-align:center;margin-top:10px"><div style="height:200px;display:grid;place-items:center">${glassSVG(r,{pour:!BM.rate}).replace("<svg","<svg style='height:200px;width:auto'")}</div><div class="bm-text" style="font-family:var(--serif);font-size:calc(34rem / 17)">Santé !</div><p class="muted">Comment tu le trouves ?</p><div class="stars" style="justify-content:center">${[1,2,3,4,5].map(k=>`<button class="${k<=(BM.rate||rt)?"on":""}" data-a="bmrate" data-n="${k}" aria-label="${k} étoiles">${IC.star}</button>`).join("")}</div>${BM.rate?`<p class="muted" style="margin:18px 0 8px">Pour la prochaine fois, c’était…</p><div class="fb-chips">${[["s",-1,"Trop sucré"],["s",1,"Pas assez sucré"],["a",-1,"Trop acide"],["a",1,"Pas assez acide"],["f",-1,"Trop fort"],["f",1,"Trop léger"],["ok",0,"Parfait"]].map(([k,v,n])=>`<button class="chip ${BM.fb===k+v?"on":""}" data-a="bmfb" data-k="${k}" data-v="${v}">${n}</button>`).join("")}</div>`:""}</div>`; }
  else if(s.list) {}
  else { body+=`<div class="bm-text">${termify(esc(s.t))}</div>`; if(s.timer){ const C=2*Math.PI*96; const left=BM.tleft==null?s.timer:BM.tleft; body+=`<div class="timer"><svg viewBox="0 0 210 210"><circle cx="105" cy="105" r="96" fill="none" stroke="var(--fill)" stroke-width="10"/><circle id="tring" cx="105" cy="105" r="96" fill="none" stroke="var(--tint)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C*(left/s.timer)} ${C}"/></svg><div class="shk ${/remue/i.test(s.t)?"stir":""}">${/remue/i.test(s.t)?'<svg viewBox="0 0 24 24"><path d="M12 2v15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="12" cy="19.5" rx="3" ry="2.5" fill="currentColor"/></svg>':IC.shaker}</div><div class="tv" id="tval">${Math.ceil(left)}</div><div class="tl">secondes</div></div><div style="display:flex;justify-content:center"><button class="btn small sec" data-a="bmtimer" data-s="${s.timer}">${BM.timer?"Recommencer":"Lancer le minuteur"}</button></div>`; } }
  const dir=BM.dir||""; BM.dir="";
  $("#overlay").innerHTML=`<div class="ov-top"><button class="close-x" data-a="bmclose" aria-label="Fermer">${IC.x}</button><div class="ot">${esc(r.n)}</div><div class="stepper"><button data-a="bmmult" data-d="-1" aria-label="Moins">${IC.minus}</button><span>${BM.mult}</span><button data-a="bmmult" data-d="1" aria-label="Plus">${IC.plus}</button></div></div><div class="ov-body ${dir}">${body}</div><div class="ov-bottom">${BM.i>0?`<button class="btn gray" data-a="bmnav" data-d="-1" style="flex:0 0 34%">Retour</button>`:""}${s.end?`<button class="btn" data-a="bmfinish">Terminer</button>`:`<button class="btn" data-a="bmnav" data-d="1">${BM.i===0?"C’est prêt":"Suivant"}</button>`}</div>`;
}
function bmTimer(sec){
  clearInterval(BM.timer); const t0=Date.now(); BM.tleft=sec;
  setTimeout(()=>{ const tm=document.querySelector(".timer"); if(tm) tm.classList.add("run"); },20);
  BM.timer=setInterval(()=>{ BM.tleft=Math.max(0,sec-(Date.now()-t0)/1000); const v=$("#tval"), rg=$("#tring"); if(v) v.textContent=Math.ceil(BM.tleft); if(rg){ const C=2*Math.PI*96; rg.setAttribute("stroke-dasharray",`${C*(BM.tleft/sec)} ${C}`);} if(BM.tleft<=0){ clearInterval(BM.timer); BM.timer=null; if(navigator.vibrate) navigator.vibrate(200); if(v) v.textContent="✓"; const tm=document.querySelector(".timer"); if(tm){ tm.classList.remove("run"); tm.classList.add("done"); } } },100);
  paintBM();
}
function closeOverlay(){ setTimeout(()=>{ if(dirty[TAB]&&!covered()) renderView(TAB); },0); if(BM&&BM.timer) clearInterval(BM.timer); BM=null; $("#overlay").classList.remove("open"); $("#overlay").innerHTML=""; }
function logMade(id, rate, roul){ S.hist.push({id,t:Date.now()}); if(rate) S.ratings[id]=rate; if(roul) S.roul=(S.roul||0)+1; changed(); }

let RL=null;
function roulette(){
  const pool=tonight(); const L=pool.length?pool:RECS; RL={L,pick:null};
  $("#overlay").classList.add("open"); spin();
}
function paintRL(r,spinning){
  const st=status(r), m=metricsR(r);
  $("#overlay").innerHTML=`<div class="ov-top"><button class="close-x" data-a="bmclose" aria-label="Fermer">${IC.x}</button><div class="ot">Surprends-moi</div><div style="width:32px"></div></div><div class="ov-body"><div class="roul ${spinning?"spin":""}"><button class="rg" ${spinning?"":`data-a="rlinfo" aria-label="Voir la recette"`}>${glassSVG(r).replace("<svg","<svg style='height:230px;width:auto'")}</button><button class="rn" ${spinning?"":`data-a="rlinfo"`}>${esc(r.n)}</button><div class="rs">${spinning?"":esc(reasons(r))}</div>${spinning?"":`<div class="rl-pills"><span class="pill">${esc(FAMILIES[r.fam])}</span><span class="pill">${m.abv<0.5?"Sans alcool":Math.round(m.abv)+" % d’alcool"}</span><span class="pill ${st.ok?"ok":""}">${st.ok?"Tu peux le faire":"Il manque "+esc(st.miss.map(x=>lc(shortN(x))).join(", "))}</span></div><div class="rl-ing">${esc(ingList(r))}</div><button class="link rl-more" data-a="rlinfo">Voir la recette ${IC.chev}</button>`}</div></div><div class="ov-bottom"><button class="btn gray" data-a="rlagain" style="flex:0 0 40%" ${spinning?"disabled":""}>Relancer</button><button class="btn" data-a="rlgo" ${spinning?"disabled":""}>Je le fais</button></div>`;
}

function spin(){
  const L=RL.L, w=L.map(r=>Math.max(.2,score(r)-1.5)), tot=w.reduce((a,b)=>a+b,0); let x=Math.random()*tot, pick=L[0];
  for(let k=0;k<L.length;k++){ x-=w[k]; if(x<=0){pick=L[k];break;} } RL.pick=pick;
  let n=0; const steps=16; const tick=()=>{ if(!RL) return; if(n<steps){ paintRL(L[Math.floor(Math.random()*L.length)],true); n++; setTimeout(tick,50+n*n*1.6); } else { paintRL(pick,false); const g=document.querySelector(".roul .rg"); if(g) g.innerHTML=glassSVG(pick,{pour:true,stream:FX("stream")}).replace("<svg","<svg style='height:230px;width:auto'"); } }; tick();
}


function showTerm(k,btn){
  const T=TERMS.find(x=>x[0]===k); if(!T) return; let p=$("#pop"); if(!p){ p=document.createElement("div"); p.id="pop"; document.body.appendChild(p); }
  p.innerHTML=`<b>${esc(T[2])}</b><span>${esc(T[3])}</span>`; p.className=""; const b=btn.getBoundingClientRect(), W=Math.min(300,innerWidth-24);
  p.style.width=W+"px"; const left=Math.max(12,Math.min(innerWidth-W-12,b.left+b.width/2-W/2)); p.style.left=left+"px";
  p.style.setProperty("--ax",(b.left+b.width/2-left)+"px"); void p.offsetWidth;
  const below=b.bottom+p.offsetHeight+16<innerHeight; p.style.top=(below?b.bottom+10:b.top-p.offsetHeight-10)+"px"; p.classList.add("show",below?"below":"above");
}
function hideTerm(){ const p=$("#pop"); if(p) p.classList.remove("show"); }
document.addEventListener("click",e=>{ if(!e.target.closest(".term")&&!e.target.closest("#pop")) hideTerm(); },true);
document.addEventListener("scroll",hideTerm,true);
function bubbles(x,y){ const box=document.createElement("div"); box.className="bubbles"; document.body.appendChild(box);
  for(let k=0;k<14;k++){ const s=document.createElement("i"); const sz=4+Math.random()*7; s.style.cssText=`left:${x+(Math.random()-.5)*50}px;top:${y+(Math.random()-.5)*30}px;width:${sz}px;height:${sz}px;--dx:${(Math.random()-.5)*40}px;animation-delay:${Math.random()*150}ms`; box.appendChild(s); }
  setTimeout(()=>box.remove(),1400); }
function markBought(id){ S.stockT=S.stockT||{}; S.stockT[id]=Date.now(); }
function confetti(x,y,col){
  if(typeof FX==="function"&&!FX("confetti")) return;
  const L=["#F2C94C","#F29A30","#E8584A","#9CCB4A","#F4EFA8",col||"#FFB340"]; const box=document.createElement("div"); box.className="confetti"; document.body.appendChild(box);
  for(let k=0;k<34;k++){ const s=document.createElement("i"); const a=Math.random()*Math.PI*2, v=90+Math.random()*170;
    s.style.cssText=`left:${x}px;top:${y}px;background:${L[k%L.length]};--x:${Math.cos(a)*v}px;--y:${Math.sin(a)*v-120}px;--r:${Math.random()*720-360}deg;animation-delay:${Math.random()*60}ms;${k%3?"border-radius:50%;width:9px;height:9px":""}`; box.appendChild(s); }
  setTimeout(()=>box.remove(),1500);
}
// ================= QUIZ DE GOÛT =================
let QZ=null;
function openQuiz(){ QZ={i:0,a:Object.assign({},S.quiz||{}),dir:"fwd"}; $("#overlay").classList.add("open"); paintQuiz(); }
function paintQuiz(){
  const n=QUIZ.length, ov=$("#overlay");
  if(QZ.i>=n){ return paintQuizEnd(); }
  const q=QUIZ[QZ.i], cur=QZ.a[q.id], sel=v=>q.multi?(cur||[]).includes(v):cur===v;
  ov.innerHTML=`<div class="ov-top"><button class="close-x" data-a="qzskip" aria-label="Passer">${IC.x}</button><div class="qz-prog">${QUIZ.map((_,k)=>`<i class="${k<QZ.i?"done":k===QZ.i?"now":""}"></i>`).join("")}</div><button class="link" data-a="qzskip" style="font-size:calc(15rem / 17)">Passer</button></div>
  <div class="ov-body qz ${QZ.dir}"><div class="bm-count">Question ${QZ.i+1} sur ${n}</div><div class="qz-q">${esc(q.q)}</div>${q.sub?`<div class="muted" style="margin-top:6px">${esc(q.sub)}</div>`:""}
  <div class="qz-opts ${q.o.length>4?"many":""}">${q.o.map(([v,l,rid],k)=>`<button class="qz-o ${sel(v)?"on":""}" data-a="qzpick" data-v="${v}" style="animation-delay:${60+k*50}ms"><span class="qz-g">${glassSVG(RMAP[rid],{garnish:true})}</span><span class="qz-l">${esc(l)}</span>${sel(v)?`<span class="qz-ck">${IC.check}</span>`:""}</button>`).join("")}</div></div>
  <div class="ov-bottom">${QZ.i>0?`<button class="btn gray" data-a="qznav" data-d="-1" style="flex:0 0 34%">Retour</button>`:""}${q.multi?`<button class="btn" data-a="qznav" data-d="1">${(cur||[]).length?"Continuer":"Aucun en particulier"}</button>`:""}</div>`;
  QZ.dir="";
}
function paintQuizEnd(){
  S.quiz=QZ.a; S.quizSkip=0; save(); MODEL=null; Object.keys(dirty).forEach(k=>dirty[k]=1);
  const sty=tasteStyle()||"Curieux de tout"; const tops=RECS.filter(r=>!r.na).sort((a,b)=>(predict(b)+(b.c?0.25:0))-(predict(a)+(a.c?0.25:0))).slice(0,3);
  $("#overlay").innerHTML=`<div class="ov-top"><div></div><div></div><button class="close-x" data-a="qzdone" aria-label="Fermer">${IC.x}</button></div>
  <div class="ov-body qz-end"><div class="qz-badge">${IC.sparkle}</div><div class="bm-count" style="text-align:center">Ton style</div><div class="qz-style">${esc(sty)}</div><p class="muted" style="text-align:center;margin:8px 10px 0">Tes suggestions sont déjà ajustées. Elles deviendront encore plus justes à chaque cocktail que tu notes.</p>
  <div class="qz-tops">${tops.map((r,k)=>`<div class="qz-top" style="animation-delay:${350+k*120}ms"><div class="qz-tg">${glassSVG(r,{pour:true})}</div><div class="qz-tn">${esc(r.n)}</div><div class="qz-tm">${matchPct(r)} %</div></div>`).join("")}</div></div>
  <div class="ov-bottom"><button class="btn" data-a="qzdone">C’est parti</button></div>`;
  setTimeout(()=>confetti(innerWidth/2,innerHeight*0.32),250);
}
// ================= ACTIONS =================
const ACT={
  tab:(d)=>{ if(d.f){ CF.main=d.f; } dirty.cocktails=1; switchTab(d.t); },
  rec:(d)=>recSheet(d.id), ing:(d)=>ingSheet(d.id), closesheet:()=>closeSheet(),
  quickadd:()=>quickAdd(), addsheet:()=>addSheet(), roulette:()=>roulette(),
  barmode:(d)=>{ closeAll(); barMode(d.id); },
  made:(d)=>{ POP={k:"made"+d.id,t:Date.now()}; logMade(d.id); toast("Ajouté à ton historique",{action:{label:"Annuler",fn:()=>{ const k=S.hist.map(h=>h.id).lastIndexOf(d.id); if(k>=0){ S.hist.splice(k,1); changed(); } }}}); },
  fav:(d)=>{ const i=S.fav.indexOf(d.id); if(i<0){ S.fav.push(d.id); POP={k:"fav"+d.id,t:Date.now()}; } else S.fav.splice(i,1); changed(); },
  rate:(d,t)=>{ const n=+d.n; S.rt=S.rt||{}; S.rt[d.id]=Date.now(); if(S.ratings[d.id]===n) delete S.ratings[d.id]; else { if(!S.ratings[d.id]) learnFrom(d.id,n); S.ratings[d.id]=n; POP={k:"rate"+d.id,t:Date.now()}; if(n===5){ const b=t.getBoundingClientRect(); confetti(b.left+b.width/2,b.top+b.height/2,RMAP[d.id].col); } } changed(); },
  mult:(d)=>{ const sh=SHEETS[SHEETS.length-1]; sh&&sh.setMult&&sh.setMult(+d.d); },
  cmain:(d)=>{ CF.main=d.v; CF.all=0; renderView("cocktails"); },
  filters:()=>filterSheet(),
  tf:(d)=>{ const L=CF[d.g]; const i=L.indexOf(d.k); if(i<0) L.push(d.k); else L.splice(i,1); dirty.cocktails=1; refreshSheets(); },
  tsort:(d)=>{ CF.sort=d.k; dirty.cocktails=1; refreshSheets(); },
  resetf:()=>{ CF.fam=[];CF.base=[];CF.x=[];CF.sort="score"; dirty.cocktails=1; refreshSheets(); },
  unf:(d)=>{ if(d.g==="sort") CF.sort="score"; else CF[d.g]=CF[d.g].filter(x=>x!==d.k); renderView("cocktails"); },
  showall:()=>{ CF.all=1; renderView("cocktails"); },
  listmore:(d)=>{ CF.lim=CF.lim||{}; CF.lim[d.k]=(CF.lim[d.k]||(d.k==="all"?40:30))+60; renderView("cocktails"); },
  bf:(d)=>{ BF=d.s; renderView("bar"); },
  as:(d)=>{ AS=d.s; const sh=SHEETS[SHEETS.length-1]; sh&&paintSheet(sh); },
  ps:(d)=>{ PS=d.s; const sh=SHEETS[SHEETS.length-1]; sh&&paintSheet(sh); },
  basics:()=>basicsSheet(),
  nobasic:(d)=>{ const L=S.settings.nobasic, i=L.indexOf(d.id); if(i<0) L.push(d.id); else L.splice(i,1); changed(); },
  tolab:(d)=>{ const r=RMAP[d.id]; const mm={shake:"shake",mshake:"shake",stir:"stir"}; S.mix={m:mm[r.m]||"build",items:r.ing.filter(i=>i.r!=="rinse"&&i.r!=="opt").map(i=>({id:i.id,q:i.q}))}; LT="compose"; closeAll(); changed(); switchTab("labo"); toast(r.n+" chargé dans le labo"); },
  cmode:()=>{ CF.mode=CF.mode==="list"?"map":"list"; renderView("cocktails"); },
  lvl:(d)=>{ const l=+d.l, v=S.stock[d.id], nv=(v===l)? l-1 : l; S.stock[d.id]=nv; if(!(v>0)&&nv>0) markBought(d.id);
    if(nv>0 && patchStock(d.id)) softChanged(); else if(nv===0){ patchStock(d.id); softChanged(); setTimeout(()=>{ renderView("bar"); },380); toast(ING[d.id].n+" ajouté à la liste à racheter",{action:{label:"Annuler",fn:()=>{ S.stock[d.id]=v; changed(); }}}); } else changed(); },
  setlvl:(d)=>{ const v=S.stock[d.id]; S.stock[d.id]=+d.l; if(!(v>0)&&+d.l>0) markBought(d.id); changed(); },
  toggle:(d)=>{ S.stock[d.id]= S.stock[d.id]===1?0:1; if(patchStock(d.id)) softChanged(); else changed(); },
  refill:(d)=>{ S.stock[d.id]= tracked(d.id)?4:1; markBought(d.id); changed(); toast(ING[d.id].n+" : de nouveau en stock"); },
  rmstock:(d)=>{ const v=S.stock[d.id]; delete S.stock[d.id]; changed(); closeSheet(); toast(ING[d.id].n+" retiré",{action:{label:"Annuler",fn:()=>{ S.stock[d.id]=v; changed(); }}}); },
  addtoggle:(d)=>{ const id=d.id, on=inBar(id)&&(tracked(id)?S.stock[id]>0:S.stock[id]===1); if(on) delete S.stock[id]; else { S.stock[id]=tracked(id)?4:1; if(Object.keys(S.stock).length>6) markBought(id); } changed(); },
  lt:(d)=>{ LT=d.t; renderView("labo"); },
  tech:(d)=>techSheet(d.id), newprep:()=>newPrepSheet(), prep:(d)=>prepSheet(d.pid),
  startprep:(d)=>{ S.preps=S.preps||[]; const t=PREP_TPL.find(x=>x[0]===d.tpl); S.preps.push({id:"p"+Date.now(),tpl:d.tpl,d:new Date().toISOString(),name:t[1]}); S.prepCount=(S.prepCount||0)+1; LT="prep"; closeAll(); changed(); switchTab("labo"); toast(t[1]+" : c’est parti"); },
  delprep:(d)=>{ S.preps=S.preps.filter(p=>p.id!==d.pid); closeSheet(); changed(); },
  preplife:(d)=>{ const p=S.preps.find(x=>x.id===d.pid); const t=PREP_TPL.find(x=>x[0]===p.tpl); p.life=Math.max(1,(p.life||t[3])+(+d.d)); changed(); },
  mm:(d)=>{ S.mix.m=d.m; changed(); },
  mixadd:()=>pickIngSheet(id=>{ S.mix.items.push({id,q:defaultQ(id)}); changed(); }),
  mixadd1:(d)=>{ S.mix.items.push({id:d.id,q:defaultQ(d.id)}); changed(); },
  pickit:(d)=>{ const sh=SHEETS[SHEETS.length-1]; const cb=sh&&sh.cb; closeSheet(); cb&&cb(d.id); },
  mixrm:(d)=>{ S.mix.items.splice(+d.k,1); changed(); },
  mixq:(d)=>{ const it=S.mix.items[+d.k]; it.q=stepQ(it.q,unitOf(it.id),+d.d); changed(); },
  mixfix:(d)=>{ const ex=S.mix.items.find(i=>i.id===d.id); if(ex) ex.q=Math.round((ex.q+ +d.q)*10)/10; else S.mix.items.push({id:d.id,q:+d.q}); changed(); },
  mixclear:()=>{ S.mix.items=[]; changed(); },
  mixsave:()=>{ if(!S.mix.items.length) return; nameSheet(); },
  savemix:()=>{ const n=($("#nm")||{}).value; if(!n||!n.trim()) return toast("Donne-lui un nom"); const A=analyze();
    const famMap={sour:"sour",stirred:"stirred",long:"highball",spritz:"bulles",cremeux:"dessert"};
    const items=mixItems(); let V=0,rr=0,gg=0,bb=0; items.forEach(i=>{ const ml=Math.max(mlOf(i),1), c=colOf(i.id); V+=ml; rr+=parseInt(c.slice(1,3),16)*ml; gg+=parseInt(c.slice(3,5),16)*ml; bb+=parseInt(c.slice(5,7),16)*ml; });
    const col="#"+[rr,gg,bb].map(x=>Math.round(x/V).toString(16).padStart(2,"0")).join("");
    const st=A.st, m=S.mix.m, LG=labGlass(), g=LG.g, ice=LG.ice, garL=(S.mix.gar||[]).map(k=>LGARTXT[k]);
    const rec={id:"c_"+Date.now(),n:n.trim(),fam:famMap[st]||"sour",m:m==="build"?"build":m,g,ice,col,gar:garL.join(", ")||"",garList:garL.length?garL:undefined,ing:items.map(i=>({id:i.id,q:i.q,u:i.u,r:ING[i.id].fizz?"top":""}))};
    S.custom.push(rec); S.labSaved=(S.labSaved||0)+1; buildRecipes(S.custom); closeSheet(); changed(); toast("Création enregistrée"); recSheet(rec.id); },
  delcustom:(d)=>{ S.custom=S.custom.filter(c=>c.id!==d.id); delete S.ratings[d.id]; buildRecipes(S.custom); closeSheet(); changed(); },
  aiprompt:()=>copyText(aiPrompt(),"Prompt copié : colle-le dans ton IA"),
  sharetxt:()=>{ const el=SHEETS[SHEETS.length-1].el; navigator.share({text:el._text}).catch(()=>{}); },
  unit:(d)=>{ S.settings.unit=d.u; changed(); },
  export:()=>exportData(), import:()=>importData(),
  reset:()=>{ if(confirm("Effacer ton bar, tes notes, ton historique et tes créations ?")){ const u=S.settings.unit, nm=S.settings.name; S=DEF(); S.settings.unit=u; S.settings.name=nm; S.quizSkip=1; fixState(); buildRecipes([]); changed(); toast("Tout a été réinitialisé"); } },
  bmclose:()=>{ RL=null; closeOverlay(); },
  bmnav:(d)=>{ if(BM.timer){clearInterval(BM.timer);BM.timer=null;} BM.tleft=null; BM.dir=+d.d>0?"fwd":"back"; BM.i=Math.max(0,Math.min(bmSteps().length-1,BM.i+(+d.d))); paintBM(); },
  bmck:(d)=>{ BM.done[d.k]=!BM.done[d.k]; paintBM(); },
  bmmult:(d)=>{ BM.mult=Math.max(1,Math.min(8,BM.mult+(+d.d))); paintBM(); },
  bmtimer:(d)=>bmTimer(+d.s),
  bmrate:(d,t)=>{ BM.rate=+d.n; if(BM.rate===5){ const b=t.getBoundingClientRect(); confetti(b.left+b.width/2,b.top,BM.r.col); } paintBM(); },
  bmfinish:()=>{ const id=BM.r.id, rate=BM.rate, rl=BM.fromRoul; if(rate&&!S.ratings[id]) learnFrom(id,rate); if(rate){ S.rt=S.rt||{}; S.rt[id]=Date.now(); } closeOverlay(); logMade(id,rate,rl); toast(rate?"Noté et ajouté à ton historique":"Ajouté à ton historique"); },
  rlagain:()=>spin(),
  rlinfo:()=>{ if(!RL||!RL.pick) return; const r=RL.pick; RL=null; closeOverlay(); recSheet(r.id); },
  qzpick:(d)=>{ const q=QUIZ[QZ.i]; if(q.multi){ const L=QZ.a[q.id]=QZ.a[q.id]||[]; const k=L.indexOf(d.v); if(k<0) L.push(d.v); else L.splice(k,1); paintQuiz(); }
    else { QZ.a[q.id]=d.v; paintQuiz(); setTimeout(()=>{ if(QZ&&QUIZ[QZ.i]===q){ QZ.i++; QZ.dir="fwd"; paintQuiz(); } },320); } },
  qznav:(d)=>{ QZ.i=Math.max(0,QZ.i+(+d.d)); QZ.dir=+d.d>0?"fwd":"back"; paintQuiz(); },
  qzskip:()=>{ if(!S.quiz){ S.quizSkip=1; save(); } QZ=null; closeOverlay(); },
  qzdone:()=>{ QZ=null; closeOverlay(); HERO_LAST=null; changed(); },
  quiz:()=>{ closeAll(); openQuiz(); },
  remind:(d,t)=>{ const n=+d.n, id=d.id; learnFrom(id,n); S.ratings[id]=n; S.rt=S.rt||{}; S.rt[id]=Date.now(); POP={k:"rem"+id,t:Date.now()}; const card=t.closest(".remind"); if(n===5){ const b=t.getBoundingClientRect(); confetti(b.left+b.width/2,b.top,RMAP[id].col); }
    if(card){ card.querySelectorAll(".stars button").forEach(b=>b.classList.toggle("on",+b.dataset.n<=n)); card.classList.add("done"); setTimeout(()=>{ changed(); },900); } else changed(); },
  snooze:(d,t)=>{ S.snooze=S.snooze||{}; S.snooze[d.id]=Date.now(); const card=t.closest(".remind"); if(card){ card.classList.add("gone"); setTimeout(()=>changed(),420); } else changed(); },
  adj:(d)=>{ S.adj=S.adj||{}; const a=S.adj[d.id]=Object.assign({s:0,a:0,f:0},S.adj[d.id]||{}); a[d.k]=+d.v; if(!a.s&&!a.a&&!a.f) delete S.adj[d.id]; POP={k:"adj"+d.id+d.k,t:Date.now()}; const sh=SHEETS[SHEETS.length-1]; if(sh&&sh.setVer) sh.setVer(getAdj(d.id)?"mine":"orig"); changed(); },
  adjreset:(d)=>{ if(S.adj) delete S.adj[d.id]; changed(); toast("Retour à la recette originale"); },
  ver:(d)=>{ const sh=SHEETS[SHEETS.length-1]; if(sh&&sh.setVer) sh.setVer(d.v); },
  bmfb:(d)=>{ BM.fb=d.k+d.v; if(d.k!=="ok"){ S.adj=S.adj||{}; const a=S.adj[BM.r.id]=Object.assign({s:0,a:0,f:0},S.adj[BM.r.id]||{}); a[d.k]=Math.max(-2,Math.min(2,(a[d.k]||0)+(+d.v))); save(); toast("Ta version est ajustée pour la prochaine fois"); } paintBM(); },
  term:(d,t)=>showTerm(d.k,t),
  jiggle:(d,t)=>{ const g=t.querySelector("svg")||t; t.classList.remove("jig"); void t.offsetWidth; t.classList.add("jig"); const b=t.getBoundingClientRect(); bubbles(b.left+b.width/2,b.top+b.height*0.35); },
  nafilter:()=>{ CF.main="na"; dirty.cocktails=1; switchTab("cocktails"); },
  setna:()=>{ S.settings.na=!S.settings.na; changed(); },
  stepck:(d,t)=>{ const li=t.closest("li"); if(li) li.classList.toggle("done"); },
  flip:(d,t)=>{ const c=t.closest(".disc"); if(c) c.classList.toggle("flipped"); },
  setname:()=>{},
  rlgo:()=>{ const r=RL.pick; RL=null; barMode(r.id); BM.fromRoul=1; }
};
document.addEventListener("click",e=>{ const t=e.target.closest("[data-a]"); if(!t) return; const a=ACT[t.dataset.a]; if(a){ e.preventDefault(); a(t.dataset,t,e); } });
document.addEventListener("touchstart",e=>{ const t=e.target.closest(".tile,.duo-c,.mini"); if(!t) return; const b=t.getBoundingClientRect(), p=e.touches[0]; const rx=((p.clientY-b.top)/b.height-.5)*-9, ry=((p.clientX-b.left)/b.width-.5)*9; t.style.transform=`perspective(500px) rotateX(${rx}deg) rotateY(${ry}deg) scale(.97)`; },{passive:true});
document.addEventListener("touchend",()=>document.querySelectorAll(".tile[style*=perspective],.duo-c[style*=perspective],.mini[style*=perspective]").forEach(t=>t.style.transform=""),{passive:true});
document.addEventListener("touchcancel",()=>document.querySelectorAll(".tile[style*=perspective],.duo-c[style*=perspective],.mini[style*=perspective]").forEach(t=>t.style.transform=""),{passive:true});
document.addEventListener("input",e=>{
  if(e.target.id==="cq"){ CF.q=e.target.value; clearTimeout(window._cqT); window._cqT=setTimeout(()=>{ const res=$("#cx-res"); if(res&&TAB==="cocktails"){ res.innerHTML=cocktailsResults(); animateSegs(res); } else renderView("cocktails"); },70); }
});
document.addEventListener("change",e=>{
  const t=e.target;
  if(t.id==="uname"){ S.settings.name=t.value.trim().slice(0,20); changed(); }
  if(t.dataset.note){ const v=t.value.trim(); if(v) S.notes[t.dataset.note]=v; else delete S.notes[t.dataset.note]; save(); }
  if(t.dataset.prepname){ const p=S.preps.find(x=>x.id===t.dataset.prepname); p.name=t.value.trim()||p.name; changed(); }
  if(t.dataset.prepdate){ const p=S.preps.find(x=>x.id===t.dataset.prepdate); if(t.value){ p.d=new Date(t.value+"T12:00:00").toISOString(); changed(); } }
});
async function copyText(t,msg){
  try{ await navigator.clipboard.writeText(t); toast(msg); return; }catch(e){}
  try{ const ta=document.createElement("textarea"); ta.value=t; ta.style.position="fixed"; ta.style.opacity="0"; document.body.appendChild(ta); ta.select(); const ok=document.execCommand("copy"); ta.remove(); if(ok){ toast(msg); return; } }catch(e){}
  textSheet("Prompt pour une IA",t);
}
async function exportData(){
  const json=JSON.stringify(S,null,1), name="zeste-sauvegarde-"+new Date().toISOString().slice(0,10)+".json";
  try{ const dl=window.claude&&await claude.use("downloads"); if(dl){ await dl.save({filename:name,data:json}); return; } }catch(e){ if(e&&e.code&&e.code!=="unavailable") return; }
  textSheet("Sauvegarde",json);
}
function importData(){
  const inp=document.createElement("input"); inp.type="file"; inp.accept=".json,application/json";
  inp.onchange=()=>{ const f=inp.files[0]; if(!f) return; const rd=new FileReader(); rd.onload=()=>{ try{ const d=JSON.parse(rd.result); if(!d||typeof d.stock!=="object") throw 0; S=Object.assign(DEF(),d); fixState(); buildRecipes(S.custom); changed(); toast("Sauvegarde importée"); }catch(e){ toast("Ce fichier n’est pas une sauvegarde Zeste"); } }; rd.readAsText(f); };
  inp.click();
}


// ================= LANCEMENT =================
function splash(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
  const r=splashPick(), col=r.col, light=mix(col,"#ffffff",.3), deep=mix(col,"#000000",.12);
  const el=document.createElement("div"); el.id="splash"; el.style.setProperty("--c",col);
  const bub=[...Array(9)].map((_,k)=>`<circle cx="${34+hrand("s"+k)*52}" cy="${60+hrand("t"+k)*14}" r="${1+hrand("u"+k)*1.4}" fill="#fff" style="animation-delay:${1.35+k*0.12}s"/>`).join("");
  el.innerHTML=`<div class="sp-glow"></div><div class="sp-stage"><svg class="sp-glass" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" overflow="visible">
    <defs><clipPath id="spk"><path d="M14 30H106C106 64 88 78 60 78C32 78 14 64 14 30Z"/></clipPath><linearGradient id="spl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${deep}"/></linearGradient></defs>
    <g clip-path="url(#spk)"><g class="sp-liq"><rect x="0" y="38" width="120" height="60" fill="url(#spl)"/><path class="sp-wave" d="M-60 38${" q7.5 -3 15 0 t15 0".repeat(12)}V60H-60Z" fill="${light}"/><path class="sp-wave2" d="M-60 38.5${" q7.5 -2 15 0 t15 0".repeat(12)}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.4"/></g><g class="sp-bub">${bub}</g></g>
    <path class="sp-draw" d="M14 30H106C106 64 88 78 60 78C32 78 14 64 14 30Z" fill="none" stroke="var(--glass-stroke)" stroke-width="2.6" stroke-linejoin="round" pathLength="100"/>
    <path class="sp-draw d2" d="M60 78V124" stroke="var(--glass-stroke)" stroke-width="2.8" pathLength="100"/><path class="sp-draw d3" d="M38 126H82" stroke="var(--glass-stroke)" stroke-width="3.6" stroke-linecap="round" pathLength="100"/>
    <path class="sp-shine" d="M21 36Q23 54 34 62" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>
    <g class="sp-lemon"><g class="sp-spin"><circle cx="0" cy="0" r="13" fill="#F2D84A" stroke="#C8A820" stroke-width="1.6"/><circle cx="0" cy="0" r="9.8" fill="#FBEFA8"/>${[0,1,2,3,4,5,6,7].map(k=>{ const a=k*Math.PI/4; return `<path d="M0 0L${(Math.cos(a)*9.4).toFixed(2)} ${(Math.sin(a)*9.4).toFixed(2)}" stroke="#F2D84A" stroke-width="1.2"/>`; }).join("")}<circle r="1.6" fill="#F2D84A"/></g></g>
    ${[[18,8],[104,70],[8,58]].map(([x,y],k)=>`<path class="sp-star" style="animation-delay:${1.55+k*0.12}s;transform-origin:${x}px ${y}px" d="M${x} ${y-6}L${x+1.6} ${y-1.6}L${x+6} ${y}L${x+1.6} ${y+1.6}L${x} ${y+6}L${x-1.6} ${y+1.6}L${x-6} ${y}L${x-1.6} ${y-1.6}Z" fill="var(--tint)"/>`).join("")}
  </svg><div class="sp-title">${"Zeste".split("").map((ch,k)=>`<span style="animation-delay:${1.05+k*0.07}s">${ch}</span>`).join("")}</div><div class="sp-sub">Ton bar, tes cocktails</div></div>`;
  document.body.appendChild(el);
  if(typeof SND!=="undefined") SND.jingleSplash(()=>!gone);
  const T=2350; let gone=false;
  const out=()=>{ if(gone) return; gone=true; el.classList.add("out"); HERO_LAST=null; dirty.today=1; if(TAB==="today") renderView("today"); setTimeout(()=>el.remove(),650); };
  el.addEventListener("click",out); setTimeout(out,T); return T;
}
// ================= ONGLETS & DÉMARRAGE =================
function switchTab(t){
  const prev=TAB; TAB=t; document.querySelectorAll(".view").forEach(v=>{ v.classList.toggle("active",v.id==="v-"+t); if(v.id==="v-"+t && prev!==t){ const order=["today","cocktails","bar","labo","profil"], dir=order.indexOf(t)>order.indexOf(prev)?"from-r":"from-l"; v.classList.remove("enter","from-r","from-l"); void v.offsetWidth; v.classList.add("enter"); if(FX("slide")) v.classList.add(dir); } });
  document.querySelectorAll(".tabbar button").forEach(b=>{ const on=b.dataset.t===t; b.classList.toggle("on",on); if(on&&prev!==t){ b.classList.remove("bounce"); void b.offsetWidth; b.classList.add("bounce"); } });
  if(dirty[t]) renderView(t); else animateSegs($("#v-"+t)); requestAnimationFrame(moveTabInd);
  if(t==="profil"&&prev!==t) document.querySelectorAll("#v-profil .stat b").forEach(el=>{ const v=+el.textContent; if(!v) return; const t0=performance.now(); const step=now=>{ const k=Math.min(1,(now-t0)/700), e=1-Math.pow(1-k,3); el.textContent=Math.round(v*e); if(k<1) requestAnimationFrame(step); }; el.textContent="0"; requestAnimationFrame(step); });
}
function init(){
  // l’astuce n’est pas un nom : on la déplace
  REC_RAW.forEach(r=>{ if(r[9]&&r[9].n){ r[9].tip=r[9].n; delete r[9].n; } });
  buildRecipes(S.custom);
  const tabs=[["today","Aujourd’hui",IC.sparkle],["cocktails","Cocktails",IC.coupe],["bar","Bar",IC.bottle],["labo","Labo",IC.flask],["profil","Profil",IC.trophy]];
  $(".tabbar").innerHTML=`<span class="tab-ind"></span>`+tabs.map(([k,n,ic])=>`<button data-t="${k}" class="${k===TAB?"on":""}">${ic}<span>${n}</span></button>`).join("");
  $(".tabbar").addEventListener("click",e=>{ const b=e.target.closest("button"); if(!b) return; if(b.dataset.t===TAB){ const v=$("#v-"+TAB); v.scrollTo({top:0,behavior:"smooth"}); } else switchTab(b.dataset.t); });
  document.querySelectorAll(".view").forEach(v=>v.addEventListener("scroll",onScroll,{passive:true}));
  switchTab("today");
  initRemote();
  applyAmbient(); applyWowClass();
  const splashMs=FX("splash")?splash():0;
  if(!S.quiz && !S.quizSkip) setTimeout(()=>{ if(!S.quiz&&!S.quizSkip&&!QZ) openQuiz(); },splashMs+250);
}
