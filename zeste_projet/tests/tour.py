import sys
from playwright.sync_api import sync_playwright
mode=sys.argv[1]
setup="""()=>{QZ=null;closeOverlay();S.quiz={amer:'love',acide:'vif',force:'moyen',bulles:'egal',aromes:['herbe'],alcools:['gin']};
S.stock={gin:4,campari:3,vermouth_rouge:2,bourbon:3,rhum_ambre:2,angostura:4,tonic:1,ginger_beer:1,eau_gazeuse:1,prosecco:3,aperol:0,gentiane:4,pamplemousse:1,triple_sec:2,rye:1};
S.ratings={negroni:5,boulevardier:4,mojito:2}; S.hist=[{id:'negroni',t:Date.now()-5*864e5},{id:'gin_tonic',t:Date.now()-864e5}];
S.preps=[{id:'p1',tpl:'gingembre',d:new Date(Date.now()-12*864e5).toISOString(),name:'Sirop de gingembre'},{id:'p2',tpl:'orgeat',d:new Date().toISOString(),name:'Orgeat maison'}];
S.mix={m:'build',items:[{id:'rhum_ambre',q:50},{id:'ginger_beer',q:100}]}; S.tro=['first','ten']; changed(); HERO_LAST=null; switchTab('today'); }"""
shots=[]
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,color_scheme=mode,is_mobile=True,has_touch=True)
    pg=ctx.new_page(); errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("console",lambda m: errs.append(m.text) if m.type=="error" else None)
    pg.goto("file://"+__import__("os").path.abspath("dist/zeste.html")); pg.wait_for_timeout(900); pg.evaluate(setup); pg.wait_for_timeout(1800)
    def snap(n): pg.screenshot(path=f"t_{mode}_{n}.png"); shots.append(n)
    snap("01today")
    for i,y in enumerate([700,1400,2100]): pg.evaluate(f"document.querySelector('#v-today').scrollTop={y}"); pg.wait_for_timeout(250); snap(f"0{2+i}today")
    pg.evaluate("switchTab('cocktails')"); pg.wait_for_timeout(400); snap("05cock")
    pg.evaluate("ACT.filters()"); pg.wait_for_timeout(600); snap("06filt"); pg.evaluate("closeAll()"); pg.wait_for_timeout(450)
    pg.evaluate("ACT.cmode()"); pg.wait_for_timeout(300); pg.evaluate("document.querySelector('#v-cocktails').scrollTop=260"); snap("07map"); pg.evaluate("ACT.cmode()")
    pg.evaluate("recSheet('queens_park')"); pg.wait_for_timeout(2000); snap("08det")
    for i,y in enumerate([600,1200,1800,2600]): pg.evaluate(f"document.querySelector('.sheet-body').scrollTop={y}"); pg.wait_for_timeout(250); snap(f"0{9+i}det" if i==0 else f"1{i-1}det")
    pg.evaluate("closeAll();switchTab('bar')"); pg.wait_for_timeout(500); snap("20bar")
    pg.evaluate("document.querySelector('#v-bar').scrollTop=700"); pg.wait_for_timeout(250); snap("21bar")
    pg.evaluate("document.querySelector('#v-bar').scrollTop=1500"); pg.wait_for_timeout(250); snap("22bar")
    pg.evaluate("ingSheet('campari')"); pg.wait_for_timeout(600); snap("23ing"); pg.evaluate("closeAll()"); pg.wait_for_timeout(450)
    pg.evaluate("addSheet()"); pg.wait_for_timeout(600); snap("24add"); pg.evaluate("closeAll()"); pg.wait_for_timeout(450)
    pg.evaluate("switchTab('labo')"); pg.wait_for_timeout(400); snap("30lab")
    pg.evaluate("document.querySelector('#v-labo').scrollTop=600"); pg.wait_for_timeout(250); snap("31lab")
    pg.evaluate("document.querySelector('#v-labo').scrollTop=1300"); pg.wait_for_timeout(250); snap("32lab")
    pg.evaluate("LT='tech';renderView('labo');document.querySelector('#v-labo').scrollTop=0"); pg.wait_for_timeout(300); snap("33tech")
    pg.evaluate("techSheet('orgeat')"); pg.wait_for_timeout(600); snap("34techs"); pg.evaluate("closeAll()"); pg.wait_for_timeout(450)
    pg.evaluate("LT='prep';renderView('labo')"); pg.wait_for_timeout(300); snap("35prep")
    pg.evaluate("prepSheet('p1')"); pg.wait_for_timeout(600); snap("36preps"); pg.evaluate("closeAll()"); pg.wait_for_timeout(450)
    pg.evaluate("switchTab('profil')"); pg.wait_for_timeout(900); snap("40prof")
    for i,y in enumerate([700,1400,2100,2800]): pg.evaluate(f"document.querySelector('#v-profil').scrollTop={y}"); pg.wait_for_timeout(250); snap(f"4{1+i}prof")
    pg.evaluate("roulette()"); pg.wait_for_timeout(2500); snap("50roul"); pg.evaluate("RL=null;closeOverlay()")
    pg.evaluate("barMode('negroni')"); pg.wait_for_timeout(400); snap("51bm")
    print(errs); b.close()
from PIL import Image
for k in range(0,len(shots),6):
    ims=[Image.open(f"t_{mode}_{n}.png").resize((390,844)) for n in shots[k:k+6]]
    W=Image.new('RGB',(400*len(ims)-10,844),'white')
    for i,im in enumerate(ims): W.paste(im,(i*400,0))
    W.save(f"tour_{mode}_{k//6}.png")
print(len(shots))
