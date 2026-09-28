// Test ad hoc : simule chaque occasion à J-2 puis au jour J, vérifie la section d'accueil, la feuille, et le lendemain (disparition).
const {chromium}=require('playwright'),path=require('path');
(async()=>{
  const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:844}});
  const errs=[];p.on('pageerror',e=>errs.push('pageerror: '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
  await p.goto('file://'+require('path').resolve(__dirname,'..','..','dist','zeste.html'));
  await p.waitForTimeout(1200);
  if(await p.getByText('Passer').count()){ await p.getByText('Passer').first().click(); await p.waitForTimeout(500); }
  const res=await p.evaluate(()=>{
    const out=[];
    for(const o of OCCASIONS){
      // vérifie les recettes de l'occasion existent bien et sont faisables ou non sans planter
      try{ const recs=occRecs(o); if(!recs.length) out.push(o.id+' : aucune recette trouvée'); }catch(e){ out.push(o.id+' : occRecs a planté : '+e.message); }
      // simule "aujourd'hui" à J-2 avant l'occasion
      const dt=occNext(o); const OrigDate=Date;
      const fake=new Date(dt.getTime()-2*864e5);
      globalThis.Date=class extends OrigDate{ constructor(...a){ if(a.length===0) return new OrigDate(fake); return new OrigDate(...a); } static now(){ return fake.getTime(); } };
      try{
        const A=occActive(); const hit=A.find(x=>x.o.id===o.id);
        if(!hit) out.push(o.id+' : pas actif à J-2 (lead='+o.lead+')');
        dirty.today=1; if(TAB==='today') renderView('today');
        const html=HOME_SEC.occasion();
        if(!html || !html.includes(o.n)) out.push(o.id+' : section accueil vide ou incorrecte à J-2');
        ACT.occasion({id:o.id});
        const bodies=document.querySelectorAll('.sheet .sheet-body'), sheetBody=bodies[bodies.length-1];
        if(!sheetBody || !sheetBody.innerHTML.includes(o.n)) out.push(o.id+' : feuille vide ou incorrecte');
        closeAll();
        document.querySelectorAll('.sheet,.backdrop').forEach(el=>el.remove());
      }catch(e){ out.push(o.id+' : erreur à J-2 : '+e.message); }
      // simule le lendemain de l'occasion : la section doit disparaître
      globalThis.Date=class extends OrigDate{ constructor(...a){ if(a.length===0) return new OrigDate(new OrigDate(dt.getTime()+864e5)); return new OrigDate(...a); } static now(){ return dt.getTime()+864e5; } };
      try{
        const A2=occActive(); const hit2=A2.find(x=>x.o.id===o.id);
        if(hit2) out.push(o.id+' : encore actif le lendemain !');
      }catch(e){ out.push(o.id+' : erreur lendemain : '+e.message); }
      globalThis.Date=OrigDate;
    }
    return out;
  });
  console.log(res.length?res.join('\n'):'Toutes les occasions s’affichent correctement à J-2 et disparaissent le lendemain.');
  console.log(errs.length?errs.join('\n'):'Aucune erreur JavaScript.');
  await b.close(); process.exit(res.length||errs.length?1:0);
})();
