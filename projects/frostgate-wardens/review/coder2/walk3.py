import asyncio
from playwright.async_api import async_playwright
URL="https://penny323mo.github.io/grokbot/projects/frostgate-wardens/"
UA="Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for (w,h) in [(390,844),(375,667)]:
            ctx=await b.new_context(viewport={"width":w,"height":h},user_agent=UA,device_scale_factor=2,has_touch=True,is_mobile=True)
            pg=await ctx.new_page()
            errs=[];bad=[]
            pg.on("pageerror",lambda e: errs.append(str(e)))
            pg.on("console",lambda m: errs.append(m.text) if m.type=="error" else None)
            pg.on("response",lambda r: bad.append((r.status,r.url)) if r.status>=400 else None)
            await pg.goto(URL,wait_until="networkidle"); await pg.wait_for_timeout(2500)
            await pg.screenshot(path=f"t{w}-title.png")
            n=await pg.locator("#region-list button").count()
            lock=[await pg.locator("#region-list button").nth(i).is_disabled() for i in range(n)]
            print(w,"regions",n,"disabled",lock)
            await pg.tap("#region-list button >> nth=0"); await pg.wait_for_timeout(2500)
            await pg.screenshot(path=f"t{w}-r1-open.png")
            if await pg.is_visible("#btn-skip-tutorial"): await pg.tap("#btn-skip-tutorial")
            await pg.wait_for_timeout(500)
            await pg.screenshot(path=f"t{w}-r1-open-notut.png")
            found=None
            for y in range(int(h*0.3),int(h*0.8),36):
                for x in range(30,w-20,36):
                    await pg.touchscreen.tap(x,y); await pg.wait_for_timeout(100)
                    if await pg.is_visible("#dock-build"): found=(x,y);break
                if found:break
            print(w,"dock",found)
            await pg.screenshot(path=f"t{w}-dock.png")
            if found:
                await pg.tap("#btn-confirm-build"); await pg.wait_for_timeout(500)
                print("gold",await pg.inner_text("#hud-gold"))
            await pg.tap("#btn-start-wave")
            for i in range(3):
                await pg.wait_for_timeout(4000)
                await pg.screenshot(path=f"t{w}-combat{i}.png")
            print("hp",await pg.inner_text("#hud-hp"),"wave",await pg.inner_text("#hud-wave"))
            await pg.tap("#btn-pause"); await pg.wait_for_timeout(400)
            await pg.screenshot(path=f"t{w}-pause.png")
            print(w,"errs",errs[:5],"bad",bad[:5])
            await ctx.close()
        await b.close()
asyncio.run(main())
