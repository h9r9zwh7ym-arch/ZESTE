// Mesures de performance (lecture seule). usage : node perf.js zeste.html riche.json
const {chromium}=require('playwright'); const fs=require('fs'), http=require('http'), zlib=require('zlib');
const FILE=process.argv[2], ST=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
// 1 an de données « réelles » : 2 verres par soir, 120 notes, 60 bouteilles
const now=Date.now(),D=864e5; ST.hist=[]; const ids=["negroni","mojito","margarita","gin_tonic","daiquiri","old_fashioned","whisky_sour","aperol_spritz","manhattan","espresso_martini","moscow_mule","caipirinha","boulevardier","last_word","paloma","americano","cosmopolitan","sazerac","penicillin","paper_plane","hugo","kir","mimosa","bellini","sidecar","gimlet","french75","dark_stormy","cuba_libre","pina_colada"];
for(let d=365; d>0; d-=0.5) ST.hist.push({id:ids[Math.floor(d*3)%ids.length],t:Math.round(now-d*D)});
const html=fs.readFileSync(FILE); console.log("taille :",(html.length/1024).toFixed(0),"Ko ; gzip :",(zlib.gzipSync(html).length/1024).toFixed(0),"Ko");
const js=html.toString().split('<script>')[1].split('</script>')[0], css=html.toString().split('<style>')[1].split('</style>')[0];
const b64=(html.toString().match(/base64,[A-Za-z0-9+/=]+/g)||[]).reduce((a,s)=>a+s.length,0);
console.log("JS :",(js.length/1024).toFixed(0),"Ko ; CSS :",(css.length/1024).toFixed(0),"Ko ; polices/icônes base64 :",(b64/1024).toFixed(0),"Ko");
const srv=http.createServer((q,r)=>{ r.writeHead(200,{"Content-Type":"text/html; charset=utf-8"}); r.end(html); });
(async()=>{ await new Promise(z=>srv.listen(0,'127.0.0.1',z)); const URL='http://127.0.0.1:'+srv.address().port+'/';
  const b=await chromium.launch(); const res={};
  for(const [label,state] of [["vide",null],["1 an",ST]]){
    const runs=[];
    for(let k=0;k<3;k++){
      const ctx=await b.newContext({viewport:{width:390,height:844}}); const p=await ctx.newPage(); const cdp=await ctx.newCDPSession(p);
      await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
      await p.addInitScript(s=>{ if(s) localStorage.setItem("zeste.v1",JSON.stringify(s)); window.__lt=[]; try{ new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__lt.push(e.duration))).observe({type:"longtask",buffered:true}); }catch(e){} },state);
      const t0=Date.now(); await p.goto(URL,{waitUntil:"load"}); const tl=Date.now()-t0; await p.waitForTimeout(3000);
      const m=await p.evaluate(()=>({zt:Math.round(window.__ZT), fcp:Math.round((performance.getEntriesByName("first-contentful-paint")[0]||{}).startTime||0), lt:window.__lt.map(Math.round), lsKB:Math.round((localStorage.getItem("zeste.v1")||"").length/1024)}));
      m.load=tl; runs.push(m);
      if(k===0){
        // rendu de chaque onglet, sauvegarde, recherche
        const r=await p.evaluate(async()=>{ const T={}; const tm=(n,f)=>{ const a=performance.now(); f(); T[n]=Math.round((performance.now()-a)*10)/10; };
          for(const t of ["today","cocktails","bar","labo","profil"]) tm("rendu "+t,()=>{ dirty[t]=1; renderView(t); });
          tm("save()",()=>save()); tm("changed()",()=>changed());
          switchTab("cocktails"); await new Promise(z=>setTimeout(z,300));
          const inp=document.querySelector('#v-cocktails input'); const ks=[];
          for(const q of ["n","ne","neg","negr","g","gi","gin","gin t","citron","zz"]){ const a=performance.now(); inp.value=q; inp.dispatchEvent(new Event("input",{bubbles:true})); ks.push(Math.round(performance.now()-a)); }
          T["frappe recherche (ms par touche)"]=ks.join("/");
          tm("fiche Negroni",()=>recSheet("negroni")); closeAll();
          return T; });
        Object.assign(m,r);
        // écouteurs après 20 changements d'onglet
        const before=(await cdp.send('Runtime.evaluate',{expression:'document',objectGroup:'x'})).result.objectId; const l0=(await cdp.send('DOMDebugger.getEventListeners',{objectId:before})).listeners.length;
        await p.evaluate(async()=>{ for(let i=0;i<20;i++){ switchTab(["today","bar","labo","profil","cocktails"][i%5]); await new Promise(z=>setTimeout(z,30)); } });
        const l1=(await cdp.send('DOMDebugger.getEventListeners',{objectId:before})).listeners.length; m.listenersDoc=l0+"→"+l1;
        m.nodes=await p.evaluate(()=>document.getElementsByTagName("*").length);
      }
      await ctx.close();
    }
    res[label]=runs;
  }
  console.log(JSON.stringify(res,null,1)); await b.close(); srv.close(); })();
