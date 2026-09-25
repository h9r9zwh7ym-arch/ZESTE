from playwright.sync_api import sync_playwright
import sys
W,H=int(sys.argv[1]),int(sys.argv[2])
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":W,"height":H},device_scale_factor=2,color_scheme="light",is_mobile=True,has_touch=True)
    pg=ctx.new_page(); errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file://"+__import__("os").path.abspath("dist/zeste.html")); pg.wait_for_timeout(1000); pg.screenshot(path=f"s{W}_0.png")
    pg.evaluate("()=>{QZ=null;closeOverlay();S.quizSkip=1;S.settings.name='YaYa';S.stock={gin:4,campari:3,vermouth_rouge:2,bourbon:3,tonic:1,rhum_ambre:3,ginger_beer:1};S.ratings={negroni:5,mojito:2,daiquiri:4};S.hist=[{id:'daiquiri',t:Date.now()-864e5},{id:'gin_tonic',t:Date.now()-3600e3}];changed();HERO_LAST=null;switchTab('today');}"); pg.wait_for_timeout(1800); pg.screenshot(path=f"s{W}_1.png")
    pg.evaluate("switchTab('cocktails')"); pg.wait_for_timeout(400); pg.screenshot(path=f"s{W}_2.png")
    pg.evaluate("recSheet('corpse_reviver')"); pg.wait_for_timeout(1800); pg.screenshot(path=f"s{W}_3.png")
    pg.evaluate("document.querySelector('.sheet-body').scrollTop=450"); pg.wait_for_timeout(300); pg.screenshot(path=f"s{W}_4.png")
    pg.evaluate("closeAll();switchTab('bar')"); pg.wait_for_timeout(600); pg.screenshot(path=f"s{W}_5.png")
    pg.evaluate("switchTab('labo')"); pg.wait_for_timeout(400); pg.screenshot(path=f"s{W}_6.png")
    pg.evaluate("switchTab('profil')"); pg.wait_for_timeout(900); pg.screenshot(path=f"s{W}_7.png")
    print(errs); b.close()
from PIL import Image
ims=[Image.open(f"s{W}_{i}.png").resize((W,H)) for i in range(8)]
Wd=Image.new('RGB',((W+10)*8,H),'white')
for i,im in enumerate(ims): Wd.paste(im,(i*(W+10),0))
Wd.save(f"small_{W}.png")
