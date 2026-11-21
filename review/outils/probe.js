// petit outil : exécute des expressions dans l'app avec un état donné. usage: node probe.js file.html state.json|- "expr" ...
const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const [,,file,stateF,...exprs]=process.argv; const st=stateF==="-"?null:JSON.parse(fs.readFileSync(stateF,'utf8'));
 const http=require('http'); const srv=http.createServer((q,r)=>{ r.writeHead(200,{"Content-Type":"text/html; charset=utf-8"}); r.end(fs.readFileSync(file)); }); await new Promise(z=>srv.listen(0,'127.0.0.1',z));
 const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(s=>{ if(s&&!sessionStorage.getItem("seeded")){ sessionStorage.setItem("seeded","1"); localStorage.setItem("zeste.v1",JSON.stringify(s)); } },st);
 await p.goto('http://127.0.0.1:'+srv.address().port+'/'); await p.waitForTimeout(1500);
 for(const e of exprs){ if(e.startsWith("wait:")){ await p.waitForTimeout(+e.slice(5)); continue; } try{ const v=await p.evaluate(e); console.log("»",e.slice(0,80),"\n ",typeof v==="string"?v:JSON.stringify(v)); }catch(x){ console.log("»",e.slice(0,80),"\n  ERREUR",x.message.split("\n")[0]); } }
 if(errs.length) console.log("pageerrors:",errs); await b.close(); srv.close(); })();
