// Mesure comparée et répétée (médianes sur 5 lancements, processeur ralenti ×4) : rendu de chaque onglet à froid (1er rendu
// après un enregistrement) et à chaud, ouverture d'une fiche, changed(). usage : node perf3.js avant.html apres.html etat.json
const {chromium}=require('playwright'); const fs=require('fs'), http=require('http');
const ST=JSON.parse(fs.readFileSync(process.argv[4])); const now=Date.now(); ST.hist=[]; const ids=["negroni","mojito","margarita","gin_tonic","daiquiri","old_fashioned","whisky_sour","aperol_spritz","manhattan","espresso_martini"];
for(let d=365; d>0; d-=0.5) ST.hist.push({id:ids[Math.floor(d*3)%ids.length],t:Math.round(now-d*864e5)}); ST.settings.fx={splash:false};
const med=a=>{ const s=a.slice().sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; };
(async()=>{ const b=await chromium.launch(); const res={};
  for(const f of [process.argv[2],process.argv[3]]){ const html=fs.readFileSync(f); const srv=http.createServer((q,r)=>{ r.writeHead(200,{"Content-Type":"text/html; charset=utf-8"}); r.end(html); }); await new Promise(z=>srv.listen(0,'127.0.0.1',z));
    const acc={};
    for(let k=0;k<5;k++){ const ctx=await b.newContext({viewport:{width:390,height:844}}); const p=await ctx.newPage(); const cdp=await ctx.newCDPSession(p);
      await p.addInitScript(s=>localStorage.setItem("zeste.v1",JSON.stringify(s)),ST); await p.goto('http://127.0.0.1:'+srv.address().port+'/'); await p.waitForTimeout(3000);
      await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
      const r=await p.evaluate(async()=>{ const T={}, tm=(n,f)=>{ const a=performance.now(); f(); T[n]=performance.now()-a; };
        for(const t of ["today","cocktails","bar","labo","profil"]){ save(); tm("froid "+t,()=>{ dirty[t]=1; renderView(t); }); tm("chaud "+t,()=>{ dirty[t]=1; renderView(t); }); }
        tm("changed()",()=>changed()); tm("fiche Negroni",()=>recSheet("negroni")); closeAll(); await new Promise(z=>setTimeout(z,500)); tm("fiche Negroni (2e)",()=>recSheet("negroni")); closeAll(); return T; });
      for(const [n,v] of Object.entries(r)) (acc[n]=acc[n]||[]).push(v); await ctx.close(); }
    res[f.split("/").pop()]=Object.fromEntries(Object.entries(acc).map(([n,a])=>[n,Math.round(med(a))])); srv.close(); }
  const [A,B]=Object.values(res), keys=Object.keys(A); console.log("mesure (ms, médiane de 5, CPU ×4) | avant | après"); keys.forEach(k=>console.log(k+" | "+A[k]+" | "+B[k])); await b.close(); })();
