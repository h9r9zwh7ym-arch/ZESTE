// ================= ZESTE 1.18 =================
// ---------- À table : chips et snacks à la place du brunch, emojis corrigés ----------
(function(){
  const i=DISHES.findIndex(d=>d.id==="brunch");
  if(i>=0) DISHES[i]={id:"snacks",e:"🥨",n:"Chips et snacks",why:"Le sel des chips, des bretzels et des cacahuètes appelle des bulles, de l’amertume et de l’acidité : tout ce qui rafraîchit et donne envie d’une autre poignée.",want:{fizz:1,acid:.6,bitter:.6,sweet:-.5,strong:-.3,cream:-1},base:["amer","agave"],picks:["michelada","aperol_spritz","gin_tonic","paloma","margarita","whisky_highball","americano","vermouth_soda"]};
  const E={raclette:"🥔",fromages:"🧀",grill:"🍔",asiat:"🍜"}; DISHES.forEach(d=>{ if(E[d.id]) d.e=E[d.id]; });
  const g=LGAR.find(x=>x[0]==="cv"); if(g) g[1]="🍋‍🟩";
})();
// ---------- Lignées vérifiées ----------
(function(){
  const L=n=>LINEAGES.find(l=>l.n===n);
  const crusta=L("De la Crusta à la Margarita"); if(crusta){ crusta.n="Crusta et Daisy : les sours à l’orange"; crusta.d="Spiritueux, citron et liqueur d’orange. Le Sidecar et la Margarita sont deux « Daisies », des sours à l’orange descendus de la Brandy Crusta ; la Margarita (« marguerite » en espagnol) vient de la Tequila Daisy.";
    crusta.t=["brandy_crusta","1850",[["sidecar","1922",[["white_lady","1929"],["between_sheets","1930"]]],["margarita","1936",[["tommys","1990"],["mezcal_margarita",""],["kamikaze","1970",[["cosmopolitan","1988"]]]]]]]; }
  const mules=L("Les mules"); if(mules){ mules.d="Le Mamie Taylor (scotch, citron vert, ginger ale), star de 1899, a inspiré le Moscow Mule de 1941 et toute sa famille. Le Dark ’n’ Stormy, lui, est né indépendamment aux Bermudes.";
    mules.t=["mamie_taylor","1899",[["moscow_mule","1941",[["kentucky_mule",""],["london_mule",""],["mezcal_mule",""],["gin_gin_mule","2000"]]]]]; }
  const sp=L("Le spritz"); if(sp){ sp.d="Au XIXe siècle, les soldats austro-hongrois allongeaient le vin de Vénétie d’eau gazeuse : le « G’Spritzter ». L’Aperol, créé en 1919, n’a rejoint le spritz que dans les années 1950.";
    sp.t=["gespritzter","1850",[["aperol_spritz","1950",[["campari_spritz",""],["cynar_spritz",""],["limoncello_spritz",""],["spritz_peche",""]]],["hugo","2005"]].concat(RMAP.chasselas_spritz?[]:[])]; if(RMAP.chasselas_spritz) sp.t[2].push(["chasselas_spritz",""]); }
  const neg=L("La famille Negroni"); if(neg){ neg.d="Tout commence avec le Milano-Torino (Campari et vermouth), devenu l’Americano avec de l’eau gazeuse, avant qu’un comte florentin ne réclame du gin à la place."; }
  const ws=L("Le Whisky Sour et ses héritiers"); if(ws){ const walk=n=>{ if(n[0]==="amaretto_sour") n[1]="1970"; (n[2]||[]).forEach(walk); }; walk(ws.t); }
})();
// ---------- Villes et notoriété ----------
(function(){ const c=CITIES.find(x=>x[0]==="Baie de San Francisco"); if(c&&!c[3].includes("pisco_punch")) c[3].push("pisco_punch");
  const ny=CITIES.find(x=>x[0]==="New York"); if(ny&&!ny[3].includes("fitzgerald")) ny[3].push("fitzgerald");
  ["harvey_wallbanger","dirty_shirley","mezcal_margarita","airmail","italian_greyhound"].forEach(id=>{ if(!POPULAR.includes(id)) POPULAR.push(id); });
  POPULAR.forEach((id,k)=>POPIDX[id]=k); })();
// ---------- Suggestions : profiter des bouteilles qui s'abîment une fois ouvertes ----------
// Seuls les alcools gazeux perdent vite leurs bulles une fois débouchés
const PERISH={prosecco:[0,3,"avant qu’il perde ses bulles"],champagne:[0,3,"avant qu’il perde ses bulles"],cidre:[0,3,"avant qu’il s’évente"],biere:[0,1,"avant qu’elle s’évente"]};
function perishing(r){ const T=S.opened||{}, now=Date.now(); let best=null; for(const it of r.ing){ const p=PERISH[it.id]; if(!p||!T[it.id]||!(S.stock[it.id]>0)) continue; const d=(now-T[it.id])/864e5; if(d>=p[0]&&d<=p[1]&&(!best||p[1]<best[2])) best=[it.id,p[2],p[1]]; } return best; }
(function(){ const W=k=>{ const g=ACT[k]; if(!g) return; ACT[k]=(d,t)=>{ const had=d&&d.id&&has(d.id); const r=g(d,t); if(d&&d.id&&!had&&has(d.id)) { markBought(d.id); save(); } return r; }; }; ["toggle","addtoggle","pickit","refill","setlvl","lvl"].forEach(W); })();
const _reasons=reasons; reasons=function(r){ const rt=S.ratings[r.id]; if(!(rt>=4)){ const p=perishing(r); if(p){ const n=lc(shortN(p[0])); return "Pour finir "+(/^[aeiouyéèêàâîïôœ]/i.test(n)?"ton ":FEM.test(n)?"ta ":"ton ")+n+" ouvert"+(FEM.test(n)?"e":"")+" "+p[1]; } } return _reasons(r); };
// ---------- Étagère 2.0 ----------
function shelfView(ids){
  const segs=[["spirit","Spiritueux"],["liq","Liqueurs et amers"],["vin","Vins et vermouths"],["sirop","Sirops"],["soft","Softs et jus"]], LV=["Vide","¼","½","¾","Pleine"];
  const tot=ids.length, empty=ids.filter(id=>tracked(id)&&S.stock[id]===0).length;
  let o=`<div class="bar2"><div class="b2-glow"></div><div class="b2-head"><b>${tot} bouteille${tot>1?"s":""}</b>${empty?`<span class="b2-warn">${empty} à racheter</span>`:""}</div>`, k=0;
  segs.forEach(([sg,n])=>{ const L=ids.filter(id=>segOf(id)===sg).sort((a,b)=>(S.stock[b]>0)-(S.stock[a]>0)||ING[a].n.localeCompare(ING[b].n,"fr")); if(!L.length) return;
    o+=`<div class="b2-shelf"><div class="b2-lab">${esc(n)}<i>${L.length}</i></div><div class="b2-row">${L.map(id=>{ const tr=tracked(id), v=S.stock[id], lv=tr?v:(v===1?4:0), idx=k++;
      return `<button class="b2-b ${lv===0?"vide":""}" data-a="shelfpick" data-id="${id}" style="--i:${idx};--d:${(idx%9)*0.7}s"><span class="b2-svg">${bottleSVG(id,lv,false,FX("live")?((idx%9)*0.8).toFixed(1):0)}</span><span class="b2-tag"><span class="b2-n">${esc(shortN(id))}</span>${tr?`<span class="b2-l l${lv}">${LV[lv]}</span>`:""}</span></button>`; }).join("")}</div><div class="b2-board"><i></i></div></div>`; });
  return o+`</div><div class="gf" style="margin-top:10px">Touche une bouteille pour changer son niveau, son prix ou voir ce qu’elle permet de faire.</div>`;
}
Object.assign(ACT,{ shelfpick:(d,t)=>{ if(t){ t.classList.add("lift"); } if(typeof SND!=="undefined") SND.pop(0.9); setTimeout(()=>{ if(t) t.classList.remove("lift"); ingSheet(d.id); },170); } });

// ---------- Débouchage détecté automatiquement ----------
function markOpened(id,silent){ S.opened=S.opened||{}; S.opened[id]=Date.now(); if(!silent){ const n=lc(shortN(id)), f=FEM.test(n); toast("Nouvelle bouteille "+de(n).replace(/^de /,"de ")+" débouchée : à finir dans les "+(PERISH[id][1]+1)+" jours pour garder les bulles"); } }
const _logMade=logMade;
logMade=function(id,rate,roul){ const r=RMAP[id];
  if(r) r.ing.forEach(it=>{ if(!PERISH[it.id]||it.r==="opt"||!tracked(it.id)) return; const v=S.stock[it.id];
    if(v===4){ markOpened(it.id); S.stock[it.id]=3; }            // bouteille pleine : on vient de la déboucher
  });                                                              // déjà entamée : on garde sa date d'ouverture
  _logMade(id,rate,roul); };
(function(){
  const W=(k,f)=>{ const g=ACT[k]; if(!g) return; ACT[k]=(d,t)=>{ const before=d&&d.id!=null?S.stock[d.id]:undefined; const r=g(d,t); try{ f(d||{},before); }catch(e){} return r; }; };
  const levelHook=(d,before)=>{ const id=d.id; if(!id||!PERISH[id]) return; const v=S.stock[id]; S.opened=S.opened||{};
    if(v===4||v===0||v==null) delete S.opened[id];                 // pleine ou vide : pas de bouteille entamée
    else if(before===4&&v<4&&!S.opened[id]) markOpened(id,true);  // on vient de l'entamer
    save(); };
  W("lvl",levelHook); W("setlvl",levelHook);
  W("refill",(d)=>{ if(S.opened&&d.id) { delete S.opened[d.id]; save(); } });
  W("toggle",(d)=>{ if(d.id&&!has(d.id)&&S.opened) { delete S.opened[d.id]; save(); } });
})();
