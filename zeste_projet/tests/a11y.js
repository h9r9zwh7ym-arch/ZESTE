// Audit VoiceOver : éléments interactifs sans nom accessible, cibles tactiles trop petites.
// usage : NODE_PATH=$(npm root -g) node tests/a11y.js
const {chromium}=require('playwright'),path=require('path');
const AUDIT=()=>{ const out={sansNom:{},petites:{}}; const name=el=>(el.getAttribute("aria-label")||el.getAttribute("title")||(el.getAttribute("aria-labelledby")&&document.getElementById(el.getAttribute("aria-labelledby"))?.textContent)||el.innerText||el.textContent||"").trim();
  document.querySelectorAll("button,[data-a],a[href],input,select,[role=button]").forEach(el=>{ const r=el.getBoundingClientRect(); if(!r.width||!r.height||r.bottom<0||r.top>innerHeight) return; if(el.closest("[aria-hidden=true]")) return;
    const cs=getComputedStyle(el); if(cs.visibility==="hidden"||cs.display==="none") return;
    const k=(el.dataset.a||el.tagName.toLowerCase())+"."+String(el.className&&el.className.baseVal===undefined?el.className:"").split(" ")[0];
    if(!name(el)&&el.tagName!=="INPUT") out.sansNom[k]=(out.sansNom[k]||0)+1;
    // (1.58) zone réelle : la boîte agrandie par un ::after absolu débordant (motif « zone ≥ 44 px sans changer le visuel »)
    let zw=r.width, zh=r.height; const af=getComputedStyle(el,"::after"); if(af.content!=="none"&&af.position==="absolute"){ const n=v=>Math.min(0,parseFloat(v)||0); zw=Math.max(zw,r.width-n(af.left)-n(af.right)); zh=Math.max(zh,r.height-n(af.top)-n(af.bottom)); }
    if((zw<43.5||zh<43.5)&&el.tagName!=="INPUT"&&!el.closest(".ing-line,.row")){ const kk=k+" "+Math.round(zw)+"×"+Math.round(zh); out.petites[kk]=(out.petites[kk]||0)+1; } });
  const svgs=[...document.querySelectorAll("svg")].filter(s=>{ const r=s.getBoundingClientRect(); return r.width>=40&&r.top<innerHeight&&!s.closest("[aria-hidden=true],button,[data-a]")&&!s.getAttribute("aria-label")&&s.getAttribute("role")!=="img"&&s.getAttribute("aria-hidden")!=="true"; }).length;
  out.dessinsSansDescription=svgs; return out; };
(async()=>{ const b=await chromium.launch(), p=await b.newPage({viewport:{width:390,height:844}});
  await p.addInitScript(()=>{ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{unit:"cl",fx:{splash:false}},stock:{gin:4,campari:3,vermouth_rouge:2,bourbon:3,tonic:1},ratings:{negroni:5,mojito:2,daiquiri:4}})); });
  await p.goto("file://"+path.resolve(__dirname,"..","dist","zeste.html")); await p.waitForTimeout(2500);
  for(const t of ["today","cocktails","bar","labo","profil","fiche"]){ if(t==="fiche") await p.evaluate(()=>recSheet("negroni")); else await p.evaluate(t=>switchTab(t),t); await p.waitForTimeout(1500);
    console.log("== "+t+" "+JSON.stringify(await p.evaluate(AUDIT))); }
  await b.close(); })();
