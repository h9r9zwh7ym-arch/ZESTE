const {chromium}=require('playwright'); const fs=require('fs'), http=require('http');
const html=fs.readFileSync(process.argv[2]); const ST=JSON.parse(fs.readFileSync(process.argv[3]));
const srv=http.createServer((q,r)=>{ r.writeHead(200,{"Content-Type":"text/html; charset=utf-8"}); r.end(html); });
(async()=>{ await new Promise(z=>srv.listen(0,'127.0.0.1',z)); const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844}}); const p=await ctx.newPage(); const cdp=await ctx.newCDPSession(p);
 await p.addInitScript(s=>localStorage.setItem("zeste.v1",JSON.stringify(s)),ST); await p.goto('http://127.0.0.1:'+srv.address().port+'/'); await p.waitForTimeout(2500);
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 const r=await p.evaluate(()=>{ switchTab("cocktails"); const out={}; const res=document.getElementById("cx-res");
   for(const q of ["n","ne","neg","g","gin","gin t","citron","sans alcool","zz",""]){ const a=performance.now(); CF.q=q; res.innerHTML=cocktailsResults(); out[q||"(vide)"]=Math.round(performance.now()-a); }
   const a=performance.now(); for(let i=0;i<5;i++){ STC={}; MEMO={}; RECS.forEach(r=>status(r)); } out["status() 382 recettes, à froid"]=Math.round((performance.now()-a)/5);
   const c=performance.now(); for(let i=0;i<3;i++){ SREV++; MODEL=null; tonight(); } out["tonight() modèle à froid"]=Math.round((performance.now()-c)/3);
   const d=performance.now(); checkTrophies(); out["checkTrophies()"]=Math.round(performance.now()-d);
   return out; });
 console.log("CPU ×4 :",JSON.stringify(r)); await b.close(); srv.close(); })();
