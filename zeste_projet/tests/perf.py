from playwright.sync_api import sync_playwright
import json,sys
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":390,"height":844},is_mobile=True,has_touch=True)
    pg=ctx.new_page(); cdp=ctx.new_cdp_session(pg); cdp.send("Emulation.setCPUThrottlingRate",{"rate":4})
    pg.add_init_script("if(!localStorage.getItem('zeste.v1')) localStorage.setItem('zeste.v1',JSON.stringify({v:1,t:1,quizSkip:1,settings:{unit:'cl',fx:{splash:false}},stock:{gin:4,campari:3,vermouth_rouge:2,bourbon:3,tonic:1,rhum_blanc:3,tequila:3,triple_sec:2,vodka:3,ginger_beer:1,prosecco:2,aperol:2,eau_gazeuse:1},ratings:{negroni:5,mojito:2,daiquiri:4,margarita:4,old_fashioned:3},hist:[{id:'negroni',t:Date.now()-3e8},{id:'daiquiri',t:Date.now()-5e8}]}))")
    pg.goto("file://"+__import__("os").path.abspath("dist/zeste.html")); pg.wait_for_timeout(3500)
    r=pg.evaluate("""async()=>{ const R={}; R.demarrage=Math.round(window.__ZT);
      const m=(k,f,n=3)=>{ const t0=performance.now(); for(let i=0;i<n;i++) f(); R[k]=Math.round((performance.now()-t0)/n); };
      m('accueil',()=>{dirty.today=1;renderView('today')}); m('cocktails',()=>{dirty.cocktails=1;renderView('cocktails')}); m('bar',()=>{dirty.bar=1;renderView('bar')}); m('labo',()=>{dirty.labo=1;renderView('labo')}); m('profil',()=>{dirty.profil=1;renderView('profil')});
      m('fiche',()=>{ recSheet('negroni'); SHEETS.pop().el.remove(); }); m('recherche',()=>{ CF.q='gin'; renderView('cocktails'); CF.q=''; });
      m('changement_etat',()=>{ changed(); });
      CF.mode='world'; m('monde',()=>renderView('cocktails')); CF.mode='tree'; m('lignees',()=>renderView('cocktails')); CF.mode='radar'; m('radar',()=>renderView('cocktails')); CF.mode='list';
      return R; }""")
    print(json.dumps(r)); b.close()
