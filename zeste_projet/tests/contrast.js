// Audit de contraste WCAG 2.2 des textes visibles, thèmes clair et sombre : NODE_PATH=$(npm root -g) node tests/contrast.js
const {chromium}=require('playwright'),path=require('path');
const AUDIT=()=>{ const P=s=>{ const m=s.match(/rgba?\(([^)]+)\)/); if(!m) return null; const v=m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [v[0],v[1],v[2],v.length>3?v[3]:1]; };
  const L=c=>{ const f=x=>{ x/=255; return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4); }; return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2]); };
  const over=(a,b)=>[a[0]*a[3]+b[0]*(1-a[3]),a[1]*a[3]+b[1]*(1-a[3]),a[2]*a[3]+b[2]*(1-a[3]),1];
  const bgOf=el=>{ const st=[]; for(let e=el;e;e=e.parentElement){ const cs=getComputedStyle(e); if(cs.backgroundImage!=="none") return null; const c=P(cs.backgroundColor); if(c&&c[3]>0){ st.push(c); if(c[3]>=1) break; } }
    let bg=P(getComputedStyle(document.body).backgroundColor)||[255,255,255,1]; for(let i=st.length-1;i>=0;i--) bg=over(st[i],bg); return bg; };
  const out=[], seen=new Set();
  document.querySelectorAll("body *").forEach(el=>{ if(!el.childNodes.length) return; const txt=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(" ").trim(); if(!txt) return;
    const r=el.getBoundingClientRect(); if(!r.width||!r.height||r.bottom<0||r.top>innerHeight*3) return; const cs=getComputedStyle(el); if(cs.visibility==="hidden"||+cs.opacity===0) return;
    let op=1; for(let e=el;e;e=e.parentElement) op*=+getComputedStyle(e).opacity; if(op<0.2) return;
    const bg=bgOf(el); if(!bg) return; let fg=P(cs.color); fg=over([fg[0],fg[1],fg[2],fg[3]*op],bg);
    const a=L(fg),b=L(bg), ratio=(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05), px=parseFloat(cs.fontSize), bold=+cs.fontWeight>=700, large=px>=24||(px>=18.66&&bold), need=large?3:4.5;
    if(ratio<need){ const k=(el.className&&el.className.baseVal===undefined?el.className:el.tagName)+"|"+cs.color; if(seen.has(k)) return; seen.add(k); out.push(ratio.toFixed(2)+" < "+need+" | "+px+"px | ."+String(el.className).slice(0,28)+" | "+cs.color+" | « "+txt.slice(0,40)+" »"); } });
  return out; };
(async()=>{ const b=await chromium.launch();
  for(const scheme of ["light","dark"]){ const p=await b.newPage({viewport:{width:390,height:844},colorScheme:scheme});
    await p.addInitScript(()=>{ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{unit:"cl",fx:{splash:false}},stock:{gin:4,campari:3,vermouth_rouge:2,bourbon:3,tonic:1},ratings:{negroni:5,mojito:2,daiquiri:4}})); });
    await p.goto("file://"+path.resolve(__dirname,"..","dist","zeste.html")); await p.waitForTimeout(2500);
    for(const t of ["today","cocktails","bar","labo","profil","fiche"]){ if(t==="fiche") await p.evaluate(()=>recSheet("negroni")); else await p.evaluate(t=>switchTab(t),t); await p.waitForTimeout(1600);
      const r=await p.evaluate(AUDIT); console.log("== "+scheme+" / "+t+" : "+r.length+" problème(s)"); r.forEach(x=>console.log("  "+x)); }
    await p.close(); }
  await b.close(); })();
