// ================= ZESTE 1.63 : Labo — « Autre » sous 10 cl, « + » sans son, quantité au clavier =================
// Cause du blocage restant : « Autre » (feuille de choix d'ingrédient, ACT.mixadd) passait encore la dose entière (10 cl pour
// un soft) à labTry, qui refusait. Il passe désormais par labPour comme les autres chemins : min(dose, place), au 0,05 cl.
ACT.mixadd=()=>pickIngSheet(id=>labPour(id,defaultQ(id)));
// « + » des quantités : sans son (labPour joue le versement ; on le coupe le temps de l'appel)
function labPourQuiet(id,want){ const P=typeof SND!=="undefined"&&SND.pour; if(P) SND.pour=()=>{}; try{ return labPour(id,want); } finally{ if(P) SND.pour=P; } }
ACT.mixq=(d)=>{ const it=S.mix.items[+d.k]; if(!it) return; const u=unitOf(it.id);
  if(+d.d<0){ it.q=stepQ(it.q,u,-1); LAB_SERVE=null; changed(); return; }
  return labPourQuiet(it.id, stepQ(it.q,u,1)-it.q); };
// Quantité au clavier : toucher le nombre ouvre un champ (cl pour les liquides, nombre entier sinon) ; Entrée ou sortie valide, Échap annule.
function labQtyShown(it){ const u=unitOf(it.id); return u==="ml"? num(Math.round(it.q/10*100)/100) : String(it.q); }
{ const _vc=vCompose; vCompose=function(){ let h=_vc(); const M=mixState();
    return h.replace(/(<button data-a="mixq" data-k="(\d+)" data-d="-1"[^>]*>[\s\S]*?<\/button>)<span>([^<]*)<\/span>/g,(m,a,k,t)=>{ const it=M.items[+k]; if(!it) return m;
      return `${a}<button class="mq-n" data-a="mixqedit" data-k="${k}" aria-label="Quantité de ${esc(lc(ING[it.id].n))} : ${esc(t)}, toucher pour saisir">${t}</button>`; }); }; }
function labQtySet(k,raw){ const it=S.mix.items[+k]; if(!it) return; const u=unitOf(it.id);
  let v=parseFloat(String(raw).replace(",",".").replace(/[^\d.]/g,"")); if(!isFinite(v)) { changed(); return; }
  const want= u==="ml"? Math.round(v*10*20)/20 : Math.round(v);
  if(want<=0){ S.mix.items.splice(+k,1); LAB_SERVE=null; changed(); return; }
  if(want<=it.q){ it.q= u==="ml"? Math.max(0.5,want) : Math.max(1,want); LAB_SERVE=null; changed(); return; }
  if(!labPourQuiet(it.id,want-it.q)) changed(); }
Object.assign(ACT,{ mixqedit:(d,t)=>{ const it=S.mix.items[+d.k]; if(!it||!t) return; const u=unitOf(it.id);
  const inp=document.createElement("input"); inp.className="mq-in"; inp.type="text"; inp.setAttribute("inputmode",u==="ml"?"decimal":"numeric"); inp.setAttribute("enterkeyhint","done");
  inp.setAttribute("aria-label","Quantité de "+lc(ING[it.id].n)+(u==="ml"?" en cl":"")); inp.value=labQtyShown(it);
  let done=false; const fin=ok=>{ if(done) return; done=true; if(ok) labQtySet(d.k,inp.value); else changed(); };
  inp.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); fin(true); } else if(e.key==="Escape"){ e.preventDefault(); fin(false); } });
  inp.addEventListener("blur",()=>fin(true));
  t.replaceWith(inp); inp.focus(); inp.select(); } });
