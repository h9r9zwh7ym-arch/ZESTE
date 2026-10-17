// ---------- 1.66 : Profil > « Mes créations » (tous les cocktails créés dans le Labo, du plus récent au plus ancien) ----------
function myCreations(){
  const t=c=>{ const m=/^c_(\d+)/.exec(c.id||""); return m?+m[1]:0; };
  return (S.custom||[]).map((c,i)=>({c,i})).sort((a,b)=>(t(b.c)-t(a.c))||(b.i-a.i)).map(x=>RMAP[x.c.id]).filter(Boolean);
}
if(typeof vProfil==="function"){ const _vp=vProfil; vProfil=function(){
  const L=myCreations();
  const body=L.length? foldRows("mine",L.map(r=>recRow(r)),3)
    : prow("flask-conical","Crée ton premier cocktail","Dans le Labo, mode Composer","","gocreate");
  const sec=`<h2 class="sh">Mes créations${L.length?`<span class="more" style="color:var(--label2)">${L.length}</span>`:""}</h2><div class="group">${body}</div>`;
  return _vp().replace('<h2 class="sh">Ton carnet</h2>',m=>sec+m);
}; }
Object.assign(ACT,{ gocreate:()=>{ LT="compose"; closeAll(); changed(); switchTab("labo"); } });
