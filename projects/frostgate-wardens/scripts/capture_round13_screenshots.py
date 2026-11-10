import asyncio
import os
import sys
import json
import subprocess
import time
from playwright.async_api import async_playwright
from PIL import Image

OUT = "/workspace/nightly/2026-11-04-frostgate-wardens/screenshots/review-round-13"
os.makedirs(OUT, exist_ok=True)

UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"

async def run_capture():
    srv = subprocess.Popen(["python3", "-m", "http.server", "8123"], cwd="/workspace/nightly/2026-11-04-frostgate-wardens")
    time.sleep(1.2)
    url = "http://127.0.0.1:8123/index.html"

    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
            ctx = await b.new_context(
                viewport={"width": 390, "height": 844},
                user_agent=UA,
                device_scale_factor=2,
                has_touch=True,
                is_mobile=True
            )
            pg = await ctx.new_page()

            # Pre-seed save with all regions unlocked
            await pg.goto(url, wait_until="commit")
            await pg.evaluate("""() => {
                localStorage.setItem('frostgate_wardens_save', JSON.stringify({
                    unlockedRegions: [1, 2, 3, 4, 5],
                    stars: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 },
                    tutorialCompleted: true,
                    tutorialStep: 99,
                    bestEndlessWave: 15,
                    speed: 1,
                    muted: false
                }));
            }""")

            # 1. Title Screen
            print("1. Loading title screen...")
            await pg.goto(url, wait_until="networkidle", timeout=30000)
            await pg.wait_for_timeout(1000)
            await pg.screenshot(path=f"{OUT}/01-title.png")

            # 2. Enter Region 1
            print("2. Entering Region 1...")
            await pg.locator('.region-card[data-region="1"]').tap()
            await pg.wait_for_timeout(1200)

            # Opening frame of Region 1
            await pg.screenshot(path=f"{OUT}/02-r1-opening.png")

            # 3. Build a tower on plot
            print("3. Building tower on Plot...")
            canvas = await pg.locator('canvas').bounding_box()
            for fx, fy in [(0.28, 0.52), (0.42, 0.48), (0.55, 0.55), (0.35, 0.62), (0.48, 0.40)]:
                x = canvas['x'] + canvas['width'] * fx
                y = canvas['y'] + canvas['height'] * fy
                await pg.touchscreen.tap(x, y)
                await pg.wait_for_timeout(300)
                if await pg.locator("#btn-confirm-build").is_visible():
                    await pg.locator("#btn-confirm-build").tap()
                    await pg.wait_for_timeout(500)
                    break

            await pg.screenshot(path=f"{OUT}/03-r1-build.png")

            # 4. Start wave & Combat
            print("4. Starting wave 1 combat...")
            if await pg.locator("#btn-cancel-build").is_visible():
                await pg.locator("#btn-cancel-build").tap()
                await pg.wait_for_timeout(200)

            if await pg.locator("#btn-start-wave").is_visible():
                await pg.locator("#btn-start-wave").tap(force=True)
                print("Wave started! Waiting 7s for runners to march down pass...")
                await pg.wait_for_timeout(7000)

            await pg.screenshot(path=f"{OUT}/04-r1-combat.png")

            # 5. Pause modal
            print("5. Opening pause modal...")
            if await pg.locator("#btn-pause").is_visible():
                await pg.locator("#btn-pause").tap(force=True)
                await pg.wait_for_timeout(500)
                await pg.screenshot(path=f"{OUT}/05-pause.png")

            # Return to map selection
            if await pg.locator("#btn-quit-map").is_visible():
                await pg.locator("#btn-quit-map").tap(force=True)
                await pg.wait_for_timeout(800)

            # 6. Capture Region 2, 3, 4, 5 opening frames via level select
            for r_num in [2, 3, 4, 5]:
                print(f"Loading Region {r_num}...")
                card = pg.locator(f'.region-card[data-region="{r_num}"]')
                if await card.is_visible():
                    await card.tap(force=True)
                    await pg.wait_for_timeout(1200)

                await pg.screenshot(path=f"{OUT}/0{r_num+4}-r{r_num}-opening.png")

                # Back to menu
                if await pg.locator("#btn-pause").is_visible():
                    await pg.locator("#btn-pause").tap(force=True)
                    await pg.wait_for_timeout(300)
                    if await pg.locator("#btn-quit-map").is_visible():
                        await pg.locator("#btn-quit-map").tap(force=True)
                        await pg.wait_for_timeout(600)

            await b.close()
            print("All screenshots captured successfully!")

    finally:
        srv.terminate()
        srv.wait()

    create_comparison()

def create_comparison():
    print("Creating style comparison image...")
    before_path = "/workspace/nightly/2026-11-04-frostgate-wardens/review/coder3/pw-02-r1-open.png"
    after_path = f"{OUT}/02-r1-opening.png"
    combat_path = f"{OUT}/04-r1-combat.png"
    title_key_path = "/workspace/nightly/2026-11-04-frostgate-wardens/assets/art/title_key.webp"

    if os.path.exists(before_path) and os.path.exists(after_path):
        im_before = Image.open(before_path).convert('RGB')
        im_after = Image.open(after_path).convert('RGB')
        im_combat = Image.open(combat_path).convert('RGB') if os.path.exists(combat_path) else im_after
        im_key = Image.open(title_key_path).convert('RGB') if os.path.exists(title_key_path) else im_after

        thumb_w, thumb_h = 390, 844
        im_b_s = im_before.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        im_a_s = im_after.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        im_c_s = im_combat.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        im_k_s = im_key.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)

        # 4-panel comparison: [Before | After Open | After Combat | Title Key Reference]
        comp = Image.new('RGB', (thumb_w * 4, thumb_h))
        comp.paste(im_b_s, (0, 0))
        comp.paste(im_a_s, (thumb_w, 0))
        comp.paste(im_c_s, (thumb_w * 2, 0))
        comp.paste(im_k_s, (thumb_w * 3, 0))

        comp_path = f"{OUT}/style_comparison_before_after.png"
        comp.save(comp_path, "PNG")
        print(f"Style comparison saved: {comp_path} ({comp.size})")

if __name__ == "__main__":
    asyncio.run(run_capture())
