// Audit UI (lecture seule) : captures + mesures, sur une copie de dist/zeste.html
// usage : node audit_ui.js <zeste.html> <outdir>
const {chromium}=require('playwright'); const http=require('http'), fs=require('fs'), path=require('path');
const FILE=process.argv[2], OUT=process.argv[3]; fs.mkdirSync(OUT,{recursive:true});
const SRV=http.createServer((q,r)=>{ r.writeHead(200,{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}); r.end(fs.readFileSync(FILE)); });

// états de test
const now=Date.now(), D=864e5;
function richState(){
  const stock={}; const ids=["gin","vodka","rhum_blanc","rhum_ambre","tequila","bourbon","rye","cognac","campari","aperol","vermouth_rouge","vermouth_sec","triple_sec","amaretto","kahlua","angostura","peychaud","chartreuse_verte","maraschino","prosecco","tonic","ginger_beer","cola","citron","citron_vert","orange","sirop_sucre","grenadine","menthe","fernet","st_germain","cassis","absinthe","mezcal","scotch","pisco","cachaca","lillet","creme_coco","ananas"];
  ids.forEach((id,k)=>stock[id]=k%5===0?1:k%7===0?0:4-(k%3));
  const recs=["negroni","mojito","margarita","gin_tonic","daiquiri","old_fashioned","whisky_sour","aperol_spritz","manhattan","espresso_martini","moscow_mule","caipirinha","boulevardier","last_word","paloma","americano","cosmopolitan","sazerac","penicillin","paper_plane"];
  const hist=[]; for(let d=365; d>0; d-=1.2) hist.push({id:recs[Math.floor(d)%recs.length],t:Math.round(now-d*D)});
  const ratings={}; recs.forEach((r,k)=>ratings[r]=1+(k*7)%5);
  return {v:1,t:now-1000,quizSkip:1,quizIntro:1,quiz:{amer:'love',acide:'vif',force:'moyen',bulles:'egal',aromes:['herbe'],alcools:['gin']},stock,ratings,hist,fav:["negroni","last_word"],
    preps:[{id:'p1',tpl:'gingembre',d:new Date(now-12*D).toISOString(),name:'Sirop de gingembre'}],settings:{unit:"cl",nobasic:[],fx:{splash:false},hintSwipe:1},backupT:now-30*D};
}
const STATES={
  vide:null,                                                 // première ouverture
  presquevide:{v:1,t:now,quizSkip:1,quizIntro:1,stock:{gin:4,tonic:1},settings:{fx:{splash:false},hintSwipe:1}},
  riche:richState()
};

(async()=>{
  await new Promise(z=>SRV.listen(0,'127.0.0.1',z)); const APP='http://127.0.0.1:'+SRV.address().port+'/zeste.html';
  const b=await chromium.launch(); const report={};
  for(const [vw,vh] of [[390,844],[375,667]]) for(const scheme of ["light","dark"]) for(const [sn,st] of Object.entries(STATES)){
    if(vw===375&&sn!=="riche") continue; if(scheme==="dark"&&sn==="presquevide") continue;
    const tag=`${vw}x${vh}_${scheme}_${sn}`; const ctx=await b.newContext({viewport:{width:vw,height:vh},deviceScaleFactor:1,colorScheme:scheme,isMobile:true,hasTouch:true});
    const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==="error") errs.push(m.text()); });
    await p.addInitScript(s=>{ if(s&&!sessionStorage.getItem("seeded")){ sessionStorage.setItem("seeded","1"); localStorage.setItem("zeste.v1",JSON.stringify(s)); } },st);
    await p.goto(APP); await p.waitForTimeout(st?1500:2600);
    const R=report[tag]={errs,screens:{}};
    const measure=async(name)=>{ await p.waitForTimeout(450); await p.screenshot({path:path.join(OUT,`${tag}_${name}.png`)});
      R.screens[name]=await p.evaluate(()=>{
        const vis=e=>{ const r=e.getBoundingClientRect(); if(r.width<1||r.height<1) return null; if(r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth) return null; const cs=getComputedStyle(e); if(cs.visibility==="hidden"||+cs.opacity===0) return null; if(e.closest('details:not([open])')&&!e.closest('summary')) return null; return r; };
        // couche visible du dessus : feuille ouverte sinon vue active
        const sheets=[...document.querySelectorAll('.sheet')].filter(s=>vis(s)); const ov=document.getElementById('overlay'); const root=(ov&&ov.classList.contains('open'))?ov:sheets.length?sheets[sheets.length-1]:document.querySelector('.view.on, .view.active')||document.body;
        const out={small:[],fonts:{},inputsSmall:[],instr:[],accent:[],leftEdges:{}};
        const ints=[...root.querySelectorAll('button,a,[data-a],label.hap,input,select,textarea,[role=button],summary')].filter(e=>!e.closest('.tabbar')||root===document.body);
        for(const e of ints){ const r=vis(e); if(!r) continue; if(e.matches('input.hap-sw')) continue; if(e.parentElement&&e.parentElement.closest('[data-a],button,label.hap')&&!e.matches('input,select,textarea')) continue;
          if(r.width>=44&&r.height>=44) continue;
          // zone effective : pixels touchés sur la ligne et la colonne qui passent par le centre (pas de 1 px, 30 px au-delà du bord)
          const cx=r.left+r.width/2, cy=r.top+r.height/2, hit=(x,y)=>{ const a=document.elementFromPoint(x,y); return !!a&&(a===e||e.contains(a)); };
          let hw=0,hh=0; for(let x=Math.floor(r.left-30);x<=r.right+30;x++) if(hit(x+0.5,cy)) hw++; for(let y=Math.floor(r.top-30);y<=r.bottom+30;y++) if(hit(cx,y+0.5)) hh++;
          if(hw<44||hh<44) out.small.push(`${e.tagName.toLowerCase()}.${(e.className&&e.className.baseVal==null?e.className:"").toString().split(" ").slice(0,2).join(".")}[${e.dataset.a||""}] ${Math.round(r.width)}×${Math.round(r.height)} (impact ${hw}×${hh}) «${(e.textContent||e.getAttribute('aria-label')||"").trim().slice(0,24)}»`); }
        const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); let n; while((n=tw.nextNode())){ const t=n.textContent.trim(); if(!t) continue; const el=n.parentElement; if(!el||el.closest('svg')) continue; const r=vis(el); if(!r) continue;
          const fs=getComputedStyle(el).fontSize; out.fonts[fs]=(out.fonts[fs]||0)+1;
          if(/\b(touche|touchez|appuie|appuyez|glisse|fais glisser|tire|tape|tapote|balaie|maintiens|clique)\b/i.test(t)) out.instr.push(t.slice(0,90)); }
        root.querySelectorAll('input,textarea,select').forEach(i=>{ if(vis(i)&&parseFloat(getComputedStyle(i).fontSize)<16) out.inputsSmall.push((i.id||i.className)+" "+getComputedStyle(i).fontSize); });
        const acc=getComputedStyle(document.documentElement).getPropertyValue('--z-accent').trim(); const tmp=document.createElement('i'); tmp.style.color=acc; document.body.appendChild(tmp); const accRGB=getComputedStyle(tmp).color; tmp.remove(); out.accentColor=acc;
        root.querySelectorAll('*').forEach(e=>{ const r=vis(e); if(!r||e.closest('svg')) return; const cs=getComputedStyle(e); const hits=[]; if(cs.color===accRGB&&e.textContent.trim()&&[...e.childNodes].some(c=>c.nodeType===3&&c.textContent.trim())) hits.push("texte"); if(cs.backgroundColor===accRGB) hits.push("fond"); if(cs.borderTopColor===accRGB&&parseFloat(cs.borderTopWidth)>0) hits.push("bord");
          if(hits.length) out.accent.push(hits.join("+")+" "+e.tagName.toLowerCase()+"."+String(e.className).split(" ").slice(0,2).join(".")+" «"+e.textContent.trim().slice(0,20)+"»"); });
        root.querySelectorAll('.content > *, .sheet-body > *').forEach(e=>{ const r=vis(e); if(!r||r.width<100) return; const k=Math.round(r.left); out.leftEdges[k]=(out.leftEdges[k]||0)+1; });
        out.hScroll=document.documentElement.scrollWidth>innerWidth+1;
        return out; }); };
    const ev=s=>p.evaluate(s).catch(e=>errs.push("eval "+s.slice(0,40)+" : "+e.message));
    if(!st){ await measure("00_premiere_ouverture"); await ev("closeOverlay&&closeOverlay(); closeAll&&closeAll(); S.quizSkip=1; S.quizIntro=1; save();"); await p.waitForTimeout(500); }
    await ev("switchTab('today')"); await measure("01_aujourdhui");
    await ev("switchTab('cocktails')"); await measure("02_cocktails");
    await ev("CF.q='zzzz'; renderView('cocktails')"); await measure("03_recherche_vide"); await ev("CF.q=''; renderView('cocktails')");
    await ev("switchTab('bar')"); await measure("04_bar");
    await ev("switchTab('labo')"); await measure("05_labo");
    await ev("LT='prep'; renderView('labo')"); await measure("06_labo_preparations"); await ev("LT='compose'; renderView('labo')");
    await ev("switchTab('profil')"); await measure("07_profil");
    await ev("recSheet('negroni')"); await p.waitForTimeout(800); await measure("10_fiche_negroni"); await ev("closeAll()");
    await ev("ingSheet('gin')"); await measure("11_fiche_gin"); await ev("closeAll()");
    if(st){ await ev("levelSheet('gin')"); await measure("12_niveau_gin"); await ev("closeAll()"); }
    await ev("addSheet()"); await measure("13_ajout_bouteille"); await ev("closeAll()");
    await ev("filterSheet()"); await measure("14_filtres"); await ev("closeAll()");
    await ev("settingsSheet()"); await measure("15_parametres"); await ev("closeAll()");
    if(st&&sn==="riche"){ await ev("barMode('negroni')"); await p.waitForTimeout(1600); await measure("16_mode_preparation"); await ev("closeOverlay()"); }
    await p.waitForTimeout(300); await ctx.close();
  }
  fs.writeFileSync(path.join(OUT,"report.json"),JSON.stringify(report,null,1)); await b.close(); SRV.close(); console.log("ok");
})();
