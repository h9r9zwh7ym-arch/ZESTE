// ================= ZESTE 1.56 : Labo — contenance des verres réglable =================
// La contenance nominale d'un type de verre (ex. Highball 35 cl) peut être changée : S.settings.glassCap = {highball:28}
// (en cl, 5 à 100). labAvail l'utilise : labFits/labFitsWith, labGlass (verre automatique), la jauge et les tuiles suivent.
// La glace est toujours déduite de la contenance effective. Recettes et règles de glace inchangées.
const CAP_MIN=5, CAP_MAX=100;
function capCustom(g){ const c=S.settings&&S.settings.glassCap; const v=c&&c[g]; return typeof v==="number"&&isFinite(v)&&v>=CAP_MIN&&v<=CAP_MAX?v:null; }
function capOf(g){ const c=capCustom(g); return c!=null? c*10 : (LCAP[g]||250); }
function cleanGlassCap(x){ const out={}; if(x&&typeof x==="object"&&!Array.isArray(x)) for(const [g,v] of Object.entries(x)) if(LCAP[g]&&typeof v==="number"&&isFinite(v)&&v>=CAP_MIN&&v<=CAP_MAX) out[g]=Math.round(v); return out; }
labAvail=function(g,ice){ return capOf(g)*(1-(ICESHARE[ice]||0)); };
{ const _hs=healState; healState=function(){ const r=_hs.apply(this,arguments); if(S&&S.settings){ const c=cleanGlassCap(S.settings.glassCap); if(Object.keys(c).length) S.settings.glassCap=c; else delete S.settings.glassCap; } return r; }; }
{ const _sb=sanitizeBackup; sanitizeBackup=function(d){ const out=_sb(d); if(out&&out.settings){ const c=cleanGlassCap(d&&d.settings&&d.settings.glassCap); if(Object.keys(c).length) out.settings.glassCap=c; else delete out.settings.glassCap; } return out; }; }
// rendu : tuiles de verre à la contenance effective ; la légende « x / y cl » ouvre la feuille (chevron, plus d'icône)
{ const _vc=vCompose;
  vCompose=function(){ let h=_vc();
    h=h.replace(/(data-a="mixglass" data-v="([a-z]+)"[^>]*>[\s\S]*?<\/b><span>)([^<]*)(<\/span>)/g,(m,a,g,t,b)=>capCustom(g)!=null? a+fmtMl(capOf(g))+b : m);
    h=h.replace(/<span class="lab-legend">([^<]*)(?:<span class="lab-legice"[^>]*>[\s\S]*?<\/svg><\/span>)?<\/span>/,(m,t)=>`<button class="lab-legend" data-a="capsheet" aria-label="Contenance du verre : ${esc(t.trim())}">${esc(t.trim())}${IC.chev}</button>`);
    return h; };
}
function capSheet(){
  openSheet(()=>{ const {g,ice}=labGlass(), gn=(LGLASS.find(x=>x[0]===g)||[0,g])[1], cl=Math.round(capOf(g)/10), mod=capCustom(g)!=null, ded=ICESHARE[ice]?Math.round(capOf(g)*ICESHARE[ice]):0;
    return {title:"Contenance",body:`<div class="group cap-g"><div class="row cap-row"><div class="grow"><div class="t">${esc(gn)}</div>${ded?`<div class="s">Glace déduite : ${fmtMl(ded)}</div>`:""}</div><span class="stepper"><button data-a="capset" data-d="-1" aria-label="Moins" ${cl<=CAP_MIN?"disabled":""}>${IC.minus}</button><span>${cl} cl</span><button data-a="capset" data-d="1" aria-label="Plus" ${cl>=CAP_MAX?"disabled":""}>${IC.plus}</button></span></div>${mod?`<button class="row tap cap-reset" data-a="capreset"><div class="grow">Rétablir ${fmtMl(LCAP[g])}</div></button>`:""}</div>`}; },{short:true});
}
Object.assign(ACT,{
  capsheet:()=>capSheet(),
  capset:(d)=>{ const {g}=labGlass(), cl=Math.round(capOf(g)/10)+(+d.d), v=Math.max(CAP_MIN,Math.min(CAP_MAX,cl));
    S.settings.glassCap=Object.assign({},S.settings.glassCap||{});
    if(v*10===LCAP[g]) delete S.settings.glassCap[g]; else S.settings.glassCap[g]=v;
    if(!Object.keys(S.settings.glassCap).length) delete S.settings.glassCap; LAB_SERVE=null; changed(); },
  capreset:()=>{ const {g}=labGlass(); if(S.settings.glassCap){ delete S.settings.glassCap[g]; if(!Object.keys(S.settings.glassCap).length) delete S.settings.glassCap; } LAB_SERVE=null; changed(); }
});
