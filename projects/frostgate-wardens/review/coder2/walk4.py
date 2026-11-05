import asyncio,json
from playwright.async_api import async_playwright
URL="https://penny323mo.github.io/grokbot/projects/frostgate-wardens/"
UA="Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        ctx=await b.new_context(viewport={"width":390,"height":844},user_agent=UA,device_scale_factor=2,has_touch=True,is_mobile=True)
        await ctx.add_init_script("localStorage.setItem('frostgate_wardens_save', JSON.stringify({unlockedRegions:[1,2,3,4,5],stars:{},bestEndlessWave:0,tutorialCompleted:true,tutorialStep:0,speed:1,muted:true}))")
        pg=await ctx.new_page(); errs=[]
        pg.on("pageerror",lambda e: errs.append(str(e)))
        pg.on("console",lambda m: errs.append(m.text) if m.type=="error" else None)
        await pg.goto(URL,wait_until="networkidle"); await pg.wait_for_timeout(2000)
        await pg.screenshot(path="u-title.png")
        for r in range(5):
            await pg.tap(f".region-card[data-region=\"{r+1}\"]"); await pg.wait_for_timeout(2500)
            await pg.screenshot(path=f"u-r{r+1}-open.png")
            # build 1 tower if possible, start wave
            found=None
            for y in range(250,650,40):
                for x in range(30,370,40):
                    await pg.touchscreen.tap(x,y); await pg.wait_for_timeout(80)
                    if await pg.is_visible("#dock-build"): found=(x,y);break
                if found:break
            if found:
                await pg.tap("#btn-confirm-build"); await pg.wait_for_timeout(300)
            await pg.tap("#btn-start-wave"); await pg.wait_for_timeout(5000)
            await pg.screenshot(path=f"u-r{r+1}-combat.png")
            await pg.tap("#btn-pause"); await pg.tap("#btn-quit-map"); await pg.wait_for_timeout(800)
        # defeat: run region 1 without towers at 3x
        await pg.tap(".region-card[data-region=\"1\"]"); await pg.wait_for_timeout(1500)
        await pg.tap("#btn-speed"); await pg.tap("#btn-speed")
        for i in range(30):
            if await pg.is_visible("#btn-start-wave"):
                try: await pg.tap("#btn-start-wave",timeout=800)
                except Exception: pass
            await pg.wait_for_timeout(2000)
            if await pg.is_visible("#modal-defeat"): print("defeat after",i); break
        await pg.screenshot(path="u-defeat.png")
        print("errs",errs[:6])
        await b.close()
asyncio.run(main())
