// Mise à jour (1.31) : le service worker ouvre l'app hors réseau, prévient quand une nouvelle version est publiée,
// et ne dit rien quand rien n'a changé ou que le réseau manque. Sert une copie de dist/ sur un petit serveur local.
const {chromium}=require('playwright'), http=require('http'), fs=require('fs'), path=require('path'), os=require('os');
const D=fs.mkdtempSync(path.join(os.tmpdir(),'zeste-sw-'));
fs.copyFileSync(path.join(__dirname,'../../dist/zeste.html'),D+'/index.html'); fs.copyFileSync(path.join(__dirname,'../../sw.js'),D+'/sw.js');
fs.copyFileSync(path.join(__dirname,'../../assets/apple-touch-icon.png'),D+'/apple-touch-icon.png');
const srv=http.createServer((q,r)=>{ let f=decodeURIComponent(q.url.split('?')[0]); if(f.endsWith('/')) f+='index.html'; const p=D+f;
  if(!fs.existsSync(p)){ r.writeHead(404); return r.end(); } const st=fs.statSync(p);
  r.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':p.endsWith('.png')?'image/png':'text/html; charset=utf-8','last-modified':st.mtime.toUTCString(),'etag':'"'+st.size+'-'+st.mtimeMs+'"'}); fs.createReadStream(p).pipe(r); });
const bump=n=>fs.appendFileSync(D+'/index.html',`\n<!-- maj ${n} -->`);
srv.listen(0,async()=>{ const url=`http://localhost:${srv.address().port}/`; const b=await chromium.launch(); const ctx=await b.newContext(); const p=await ctx.newPage(); const errs=[], fail=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false}}})); });
  const toast=()=>p.evaluate(()=>{ const t=document.getElementById('toast'); return t.classList.contains('show')?t.textContent:''; });
  try{
    await p.goto(url); await p.evaluate(()=>navigator.serviceWorker.ready); await p.reload(); await p.waitForTimeout(2500);
    if(!await p.evaluate(()=>!!navigator.serviceWorker.controller)) fail.push("page non contrôlée par le service worker");
    if(/Nouvelle version/.test(await toast())) fail.push("notification sans changement");
    bump(1); await p.reload(); await p.waitForTimeout(3500);
    if(!/Nouvelle version/.test(await toast())) fail.push("pas de notification après publication");
    await ctx.setOffline(true); await p.reload(); await p.waitForTimeout(3000);
    if(!await p.evaluate(()=>!!document.querySelector('.tabbar button'))) fail.push("l'app ne s'ouvre pas hors réseau");
    await p.evaluate(()=>{ UPD_LAST=0; document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(2000);
    if(/Nouvelle version/.test(await toast())) fail.push("notification hors réseau");
    await ctx.setOffline(false); await p.reload(); await p.waitForTimeout(2500); await p.evaluate(()=>{ document.getElementById('toast').classList.remove('show'); UPD_SHOWN=false; });
    bump(2); await p.evaluate(()=>{ UPD_LAST=0; document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(3000);
    if(!/Nouvelle version/.test(await toast())) fail.push("pas de notification au retour au premier plan");
  }catch(e){ fail.push("exception : "+e.message); }
  if(errs.length) fail.push("erreurs JS : "+errs.join(" | "));
  console.log(fail.length?"ÉCHEC mise à jour : "+fail.join(" ; "):"Mise à jour : ouverture hors réseau, notification après publication et au retour au premier plan, silence sans changement ou hors réseau : tout est correct.");
  await b.close(); srv.close(); fs.rmSync(D,{recursive:true,force:true}); process.exit(fail.length?1:0); });
