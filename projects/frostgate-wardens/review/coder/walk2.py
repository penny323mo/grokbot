import asyncio
from playwright.async_api import async_playwright
URL="https://penny323mo.github.io/grokbot/projects/frostgate-wardens/"
UA="Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        ctx=await b.new_context(viewport={"width":390,"height":844},user_agent=UA,device_scale_factor=2,has_touch=True,is_mobile=True)
        pg=await ctx.new_page()
        await pg.goto(URL,wait_until="networkidle"); await pg.wait_for_timeout(2000)
        await pg.tap("#region-list button >> nth=0"); await pg.wait_for_timeout(1500)
        await pg.tap("#btn-skip-tutorial"); await pg.wait_for_timeout(300)
        await pg.touchscreen.tap(200,400); await pg.wait_for_timeout(80); await pg.touchscreen.tap(200,400); await pg.wait_for_timeout(600)
        await pg.screenshot(path="11-doubletap.png")
        await pg.tap("#btn-start-wave")
        for i in range(4):
            await pg.wait_for_timeout(2500)
            await pg.screenshot(path=f"12-wave{i}.png")
        await b.close()
asyncio.run(main())
