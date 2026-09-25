from playwright.sync_api import sync_playwright
import json,sys,collections
what=sys.argv[1]
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":390,"height":844},is_mobile=True,has_touch=True)
    pg=ctx.new_page(); cdp=ctx.new_cdp_session(pg)
    pg.add_init_script("if(!localStorage.getItem('zeste.v1')) localStorage.setItem('zeste.v1',JSON.stringify({v:1,t:1,quizSkip:1,settings:{unit:'cl',fx:{splash:false}},stock:{gin:4,campari:3,vermouth_rouge:2,bourbon:3,tonic:1,rhum_blanc:3,tequila:3,triple_sec:2,vodka:3,ginger_beer:1,prosecco:2,aperol:2,eau_gazeuse:1},ratings:{negroni:5,mojito:2,daiquiri:4,margarita:4,old_fashioned:3},hist:[{id:'negroni',t:Date.now()-3e8},{id:'daiquiri',t:Date.now()-5e8}]}))")
    if what=="start":
        cdp.send("Profiler.enable"); cdp.send("Profiler.setSamplingInterval",{"interval":100}); cdp.send("Profiler.start")
        pg.goto("file://"+__import__("os").path.abspath("dist/zeste.html")); pg.wait_for_timeout(1500)
    else:
        pg.goto("file://"+__import__("os").path.abspath("dist/zeste.html")); pg.wait_for_timeout(3000)
        cdp.send("Profiler.enable"); cdp.send("Profiler.setSamplingInterval",{"interval":100}); cdp.send("Profiler.start")
        pg.evaluate(what)
    prof=cdp.send("Profiler.stop")["profile"]
    nodes={n["id"]:n for n in prof["nodes"]}; self_t=collections.Counter(); dt=prof["timeDeltas"]
    for s,d in zip(prof["samples"],dt): n=nodes[s]; self_t[n["callFrame"]["functionName"] or "(anonyme)"]+=d
    tot=sum(dt)
    for f,t in self_t.most_common(16): print(f"{t/1000:7.1f} ms  {f}")
    print("total",round(tot/1000),"ms"); b.close()
