import asyncio, json
from playwright.async_api import async_playwright
URL="https://penny323mo.github.io/grokbot/projects/frostgate-wardens/"
UA="Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        ctx=await b.new_context(viewport={"width":390,"height":844},user_agent=UA,device_scale_factor=2,has_touch=True,is_mobile=True)
        pg=await ctx.new_page()
        errs=[];bad=[]
        pg.on("console",lambda m: errs.append(m.text) if m.type=="error" else None)
        pg.on("pageerror",lambda e: errs.append("PAGEERR "+str(e)))
        pg.on("response",lambda r: bad.append((r.status,r.url)) if r.status>=400 else None)
        await pg.goto(URL,wait_until="networkidle")
        await pg.wait_for_timeout(2500)
        await pg.screenshot(path="01-title.png")
        print("title visible:", await pg.is_visible("#title-screen"), "loading:", await pg.is_visible("#loading-screen"))
        # scroll width check
        print("scrollW", await pg.evaluate("document.documentElement.scrollWidth"))
        await pg.tap("#btn-open-credits"); await pg.wait_for_timeout(500)
        await pg.screenshot(path="02-credits.png")
        await pg.tap("#btn-close-credits"); await pg.wait_for_timeout(300)
        await pg.tap("#region-list button >> nth=0"); await pg.wait_for_timeout(2500)
        await pg.screenshot(path="03-region1.png")
        print("tutorial visible", await pg.is_visible("#tutorial-overlay"))
        await pg.tap("#btn-skip-tutorial") if await pg.is_visible("#btn-skip-tutorial") else None
        await pg.wait_for_timeout(500)
        await pg.screenshot(path="04-after-skip.png")
        # tap around canvas to find a plot
        found=False
        for y in range(300,700,40):
            for x in range(30,370,40):
                await pg.touchscreen.tap(x,y); await pg.wait_for_timeout(120)
                if await pg.is_visible("#dock-build"):
                    found=(x,y);break
            if found:break
        print("build dock at",found)
        await pg.screenshot(path="05-build-dock.png")
        if found:
            await pg.tap("#btn-confirm-build"); await pg.wait_for_timeout(600)
            await pg.screenshot(path="06-built.png")
            print("gold after build", await pg.inner_text("#hud-gold"))
        # start wave
        await pg.tap("#btn-start-wave"); await pg.wait_for_timeout(1500)
        await pg.tap("#btn-speed"); await pg.tap("#btn-speed"); 
        await pg.wait_for_timeout(6000)
        await pg.screenshot(path="07-combat.png")
        print("hp",await pg.inner_text("#hud-hp"),"gold",await pg.inner_text("#hud-gold"),"wave",await pg.inner_text("#hud-wave"),"speed",await pg.inner_text("#btn-speed"))
        await pg.tap("#btn-pause"); await pg.wait_for_timeout(400)
        await pg.screenshot(path="08-pause.png")
        await pg.tap("#btn-modal-mute"); print("mute label", await pg.inner_text("#btn-modal-mute"))
        await pg.tap("#btn-quit-map"); await pg.wait_for_timeout(800)
        await pg.screenshot(path="09-quit-title.png")
        # reenter and mute
        await pg.tap("#region-list button >> nth=0"); await pg.wait_for_timeout(1500)
        if await pg.is_visible("#btn-skip-tutorial"): await pg.tap("#btn-skip-tutorial")
        await pg.tap("#btn-pause"); await pg.wait_for_timeout(300)
        before=await pg.inner_text("#btn-modal-mute"); await pg.tap("#btn-modal-mute"); after=await pg.inner_text("#btn-modal-mute")
        print("mute after re-entry:",before,"->",after)
        await pg.tap("#btn-resume")
        await pg.tap("#btn-pause"); await pg.tap("#btn-quit-map"); await pg.wait_for_timeout(500)
        await pg.tap("#btn-endless-mode"); await pg.wait_for_timeout(500)
        await pg.screenshot(path="10-endless-picker.png")
        print("errors",errs[:10]); print("bad",bad[:10])
        await b.close()
asyncio.run(main())
