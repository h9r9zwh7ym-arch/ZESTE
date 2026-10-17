// 1.59 (F18) : sur le Profil, le titre (« X, tendance Y »), la phrase (« Tu aimes ce qui est … ») et le radar viennent du même
// vecteur de goût final (getModel().DIR) : sur des profils simulés, les axes dominants concordent toujours.
const {chromium}=require('playwright'); const path=require('path');
const APP='file://'+path.join(__dirname,'../../dist/zeste.html');
(async()=>{ const b=await chromium.launch(); const fail=[]; const errs=[];
  const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ if(!localStorage.getItem("zeste.v1")) localStorage.setItem("zeste.v1",JSON.stringify({v:1,t:1,quizSkip:1,settings:{fx:{splash:false}},stock:{gin:1}})); });
  await p.goto(APP); await p.waitForTimeout(2500);
  const r=await p.evaluate(()=>{ const out=[]; let seed=7; const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
    const A=["gourmand","acidulé","amer","puissant","fruité","herbacé","épicé","boisé"];
    for(let u=0;u<40;u++){ S.ratings={}; S.quiz=u%3===0?{amer:["love","no","ok"][u%3],acide:"vif",force:"fort"}:null; S.adj={};
      const ids=RECS.map(r=>r.id).sort(()=>rnd()-.5).slice(0,4+Math.floor(rnd()*14)); ids.forEach(id=>S.ratings[id]=1+Math.floor(rnd()*5)); SREV++;
      const sty=tasteStyle(), sen=tasteSentence(), rv=tasteRadar(), av=avgProfile(), ax=tasteAxes(); if(!sty||!rv||!ax) continue;
      const top=ax.D.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0])[0][1], radTop=rv.map((v,i)=>[v-av[i],i]).sort((a,b)=>b[0]-a[0])[0][1];
      const okT=sty.toLowerCase().includes(["gourmand","acidité","amers","spiritueux","fruité","herboriste","épicé","boisé"][top].toLowerCase());
      const okS=!ax.plus.length||sen.indexOf(DIMS[top].toLowerCase())===sen.indexOf("ce qui est ")+11;
      const okR=radTop===top;
      out.push({u,okT,okS,okR,sty,sen,top:DIMS[top],radTop:DIMS[radTop]}); }
    return out; });
  const bad=r.filter(x=>!x.okT||!x.okS||!x.okR);
  if(r.length<20) fail.push('trop peu de profils testés : '+r.length);
  if(bad.length) fail.push(bad.length+' profils contradictoires, ex. '+JSON.stringify(bad[0]));
  // le rendu du Profil utilise bien la phrase et le radar unifiés
  const v=await p.evaluate(()=>{ S.ratings={negroni:5,boulevardier:5,americano:4,daiquiri:2,pina_colada:1}; S.quiz=null; SREV++; switchTab("profil"); dirty.profil=1; renderView("profil"); const fc=document.querySelector('#v-profil .focal-card'); return {t:fc.querySelector('.fc-t')&&fc.querySelector('.fc-t').textContent, s:fc.querySelector('.fc-txt').textContent, poly:fc.querySelectorAll('svg.radar polygon').length, sen:tasteSentence()}; });
  if(!v.t||!v.s.startsWith(v.sen)||v.poly<5) fail.push('rendu du Profil : '+JSON.stringify(v));
  if(errs.length) fail.push('erreurs JS : '+[...new Set(errs)].join(' | '));
  console.log(fail.length?'ÉCHEC profil de goût : '+fail.join(' ; '):`Profil de goût : titre, phrase et radar concordent sur ${r.length} profils simulés (une seule source, le vecteur de goût final).`);
  await b.close(); process.exit(fail.length?1:0); })();
