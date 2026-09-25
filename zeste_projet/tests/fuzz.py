import json
from playwright.sync_api import sync_playwright
res={}
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":390,"height":844},device_scale_factor=1,color_scheme="light",is_mobile=True,has_touch=True)
    pg=ctx.new_page(); errs=[]; pg.on("pageerror",lambda e:errs.append("PAGE: "+str(e))); pg.on("console",lambda m: errs.append("CONSOLE: "+m.text) if m.type=="error" else None)
    pg.on("dialog", lambda d: d.dismiss())
    pg.goto("file://"+__import__("os").path.abspath("dist/zeste.html")); pg.wait_for_timeout(1000)
    pg.evaluate("()=>{QZ=null;closeOverlay();S.quizSkip=1;S.stock={gin:4,campari:3,vermouth_rouge:2,bourbon:3,tonic:1,ginger_beer:1,rhum_ambre:0,orange:1};S.ratings={negroni:5,mojito:2};S.hist=[{id:'negroni',t:Date.now()-864e5}];changed();}")
    # 1. toutes les fiches cocktails
    r=pg.evaluate("""()=>{ const bad=[]; for(const r of RECS){ try{ recSheet(r.id); const sh=SHEETS[SHEETS.length-1]; sh.setMult(2); if(getAdj(r.id)) sh.setVer('orig'); const t=sh.el.innerText; if(/NaN|undefined|null|\\[object/.test(t)) bad.push(r.id+': '+t.match(/.{0,30}(NaN|undefined|null|\\[object).{0,30}/)[0]); SHEETS.pop().el.remove(); document.querySelectorAll('#sheets .backdrop').forEach(x=>x.remove()); }catch(e){ bad.push(r.id+' ERR '+e.message); } } document.body.classList.remove('sheet-open'); return bad; }""")
    res["fiches"]=r
    # 2. toutes les fiches ingrédients + techniques + préparations
    r=pg.evaluate("""()=>{ const bad=[]; const run=(f,k)=>{ try{ f(); const sh=SHEETS[SHEETS.length-1]; const t=sh.el.innerText; if(/NaN|undefined|\\[object/.test(t)) bad.push(k+': '+t.match(/.{0,30}(NaN|undefined|\\[object).{0,30}/)[0]); SHEETS.pop().el.remove(); }catch(e){ bad.push(k+' ERR '+e.message); } };
      Object.keys(ING).forEach(id=>run(()=>ingSheet(id),'ing '+id)); TECH.forEach(t=>run(()=>techSheet(t.id),'tech '+t.id));
      PREP_TPL.forEach(t=>{ S.preps=[{id:'x',tpl:t[0],d:new Date().toISOString(),name:t[1]}]; run(()=>prepSheet('x'),'prep '+t[0]); }); S.preps=[];
      run(()=>addSheet(),'add'); SEGS.forEach(([k])=>{ AS=k; run(()=>addSheet(),'add '+k); }); run(()=>basicsSheet(),'basics'); run(()=>filterSheet(),'filter'); run(()=>quickAdd(),'quick'); run(()=>newPrepSheet(),'newprep'); run(()=>pickIngSheet(()=>{}),'pick'); run(()=>settingsSheet(),'settings'); run(()=>fxSheet(),'fx'); run(()=>momentSheet(),'moment'); run(()=>homeSheet(),'home'); run(()=>citySheet(0),'city'); run(()=>trophySheet('first'),'trophy'); run(()=>dishSheet('fondue'),'dish');
      document.querySelectorAll('#sheets .backdrop').forEach(x=>x.remove()); document.body.classList.remove('sheet-open'); return bad; }""")
    res["feuilles"]=r
    # 3. mode barman sur toutes les recettes
    r=pg.evaluate("""()=>{ const bad=[]; for(const r of RECS){ try{ barMode(r.id); const n=bmSteps().length; for(let i=0;i<n;i++){ BM.i=i; paintBM(); const t=document.querySelector('#overlay').innerText; if(/NaN|undefined|\\[object/.test(t)) { bad.push(r.id+' étape '+i); break; } } closeOverlay(); }catch(e){ bad.push(r.id+' ERR '+e.message); } } return bad; }""")
    res["barman"]=r
    # 4. moteur : valeurs finies
    r=pg.evaluate("""()=>{ const bad=[]; for(const r of RECS){ const m=metricsR(r), p=profileR(r), pr=predict(r), mp=matchPct(r); if(![m.abv,m.sug,m.acid,m.vol,pr,mp].every(Number.isFinite)||p.some(x=>!Number.isFinite(x))) bad.push(r.id); if(m.vol<20&&r.fam!=='shot') bad.push(r.id+' vol '+m.vol); } return bad; }""")
    res["moteur"]=r
    # 5. labo : mélanges aléatoires
    r=pg.evaluate("""()=>{ const bad=[]; const ids=Object.keys(ING).filter(i=>i!=='eau'); for(let k=0;k<400;k++){ const n=1+Math.floor(Math.random()*5); S.mix={m:['shake','stir','build'][k%3],items:[...Array(n)].map(()=>{ const id=ids[Math.floor(Math.random()*ids.length)]; return {id,q:defaultQ(id)}; })}; try{ const A=analyze(); if(A&&(![A.met.abv,A.met.sug,A.met.acid].every(Number.isFinite))) bad.push(JSON.stringify(S.mix)); const h=vCompose(); if(/NaN|undefined/.test(h.replace(/<[^>]+>/g,''))) bad.push('rendu '+JSON.stringify(S.mix.items.map(i=>i.id))); aiPrompt(); }catch(e){ bad.push(e.message+' '+JSON.stringify(S.mix.items.map(i=>i.id))); } } S.mix={m:'shake',items:[]}; return bad.slice(0,10); }""")
    res["labo"]=r
    # 6. clic sur tous les boutons de chaque onglet
    out=[]
    for tab in ["today","cocktails","bar","labo","profil"]:
        for lt in (["compose","tech","prep"] if tab=="labo" else [None]):
            pg.evaluate(f"()=>{{closeAll();closeOverlay();{'LT=\"'+lt+'\";' if lt else ''}dirty['{tab}']=1;switchTab('{tab}');}}"); pg.wait_for_timeout(200)
            n=pg.evaluate(f"()=>document.querySelectorAll('#v-{tab} [data-a]').length")
            for i in range(min(n,140)):
                try:
                    act=pg.evaluate(f"(i)=>{{ const el=[...document.querySelectorAll('#v-{tab} [data-a]')][i]; if(!el) return null; const a=el.dataset.a; if(['reset','import','export','quiz','roulette','barmode','rewind','rwsave','settings','fxpreview'].includes(a)) return a+' (sauté)'; el.click(); return a; }}", i)
                    pg.wait_for_timeout(30)
                    pg.evaluate(f"()=>{{ closeAll(); rwClose(); if(typeof QZ!=='undefined') QZ=null; RL=null; closeOverlay(); if(TAB!=='{tab}') switchTab('{tab}'); }}")
                except Exception as e: out.append(f"{tab} {i}: {e}")
    res["clics"]=out
    # 7. roulette, quiz, barman bout à bout
    pg.evaluate("()=>{roulette();}"); pg.wait_for_timeout(2600); pg.evaluate("()=>{ACT.rlgo();}"); pg.wait_for_timeout(300)
    pg.evaluate("()=>{ for(let i=0;i<20;i++){ if(BM.i<bmSteps().length-1){ BM.i++; paintBM(); } } ACT.bmrate({n:'5'},document.body); ACT.bmfb({k:'s',v:'-1'}); ACT.bmfinish(); }"); pg.wait_for_timeout(300)
    pg.evaluate("()=>{ openQuiz(); for(const q of QUIZ){ if(q.type==='items'){ QZ.a.items={negroni:'love',pina_colada:'no',mojito:'bof'}; } else if(q.multi){ QZ.a[q.id]=[q.o[0][0]]; } else QZ.a[q.id]=q.o[1][0]; } QZ.i=QUIZ.length; paintQuiz(); ACT.qzdone(); }"); pg.wait_for_timeout(300)
    # 8. vieilles sauvegardes
    r=pg.evaluate("""()=>{ const bad=[]; const olds=[{v:1,stock:{gin:4}},{v:1,t:5,stock:{},ratings:{inconnu:5},hist:[{id:'inconnu',t:1}],fav:['inconnu'],settings:{unit:'ml'}},{stock:{gin:2},custom:[{id:'c_1',n:'Test',fam:'sour',m:'shake',g:'coupe',ice:'none',col:'#FFAA00',gar:'',ing:[{id:'gin',q:50,u:'ml',r:''}]}]}];
      for(const o of olds){ try{ S=Object.assign(DEF(),o); fixState(); buildRecipes(S.custom); ['today','cocktails','bar','labo','profil'].forEach(t=>{ dirty[t]=1; renderView(t); }); tonight(); checkTrophies(); }catch(e){ bad.push(e.message); } } return bad; }""")
    res["sauvegardes"]=r
    res["erreurs_page"]=errs[:20]
    b.close()
print(json.dumps(res,ensure_ascii=False,indent=1))
