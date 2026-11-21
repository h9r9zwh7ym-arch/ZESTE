const {chromium}=require('playwright'); const fs=require('fs'), http=require('http');
const html=fs.readFileSync(process.argv[2]); const srv=http.createServer((q,r)=>{ r.writeHead(200,{"Content-Type":"text/html; charset=utf-8"}); r.end(html); });
(async()=>{ await new Promise(z=>srv.listen(0,'127.0.0.1',z)); const b=await chromium.launch();
 for(const [now,t,lab] of [["2026-03-30T10:00:00","2026-03-29T12:00:00","lundi après passage à l'heure d'été, verre de dimanche"],["2026-10-26T10:00:00","2026-10-24T12:00:00","lundi après retour à l'heure d'hiver, verre de samedi"],["2026-03-31T10:00:00","2026-03-29T12:00:00","mardi, verre du dimanche du changement"]]){
  const ctx=await b.newContext({timezoneId:"Europe/Zurich"}); const p=await ctx.newPage(); await p.clock.install({time:new Date(now+"+02:00")}); await p.clock.setFixedTime(new Date(now));
  await p.goto('http://127.0.0.1:'+srv.address().port+'/'); await p.waitForTimeout(500);
  const r=await p.evaluate(t=>rel(new Date(t).getTime()),t); console.log(lab,"→",r); await ctx.close(); }
 await b.close(); srv.close(); })();
