"""
test_browser.py · 潮候 Ciu Hau
Playwright automated headless browser test suite under mobile viewport 390x844 (iPhone 14/15).
Exercises real user interactions, SVG chart scrubbing, station switching, live/offline data loading,
and geolocation flow.
"""

import asyncio
import http.server
import socketserver
import threading
import sys
import os
from playwright.async_api import async_playwright

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
EVIDENCE_DIR = os.path.join(WORKSPACE_DIR, "review", "build-2026-11-12")
os.makedirs(EVIDENCE_DIR, exist_ok=True)

class StaticHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WORKSPACE_DIR, **kwargs)

    def log_message(self, format, *args):
        pass

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

def start_server():
    httpd = ReusableTCPServer(("", 0), StaticHandler)
    port = httpd.server_address[1]
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()
    return httpd, port

async def run_browser_tests():
    server, port = start_server()
    print(f"Started local server on port {port}...")
    app_url = f"http://127.0.0.1:{port}/index.html"

    tests_run = 0
    tests_passed = 0

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-web-security"]
        )

        try:
            # -------------------------------------------------------------
            # TEST 1: Initial Load on Macau Inner Harbour at 390x844
            # -------------------------------------------------------------
            tests_run += 1
            print("\n[TEST 1] Initial Load on Macau Inner Harbour (390x844)...")
            context = await browser.new_context(
                viewport={"width": 390, "height": 844},
                user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
            )
            page = await context.new_page()

            console_errors = []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

            await page.goto(app_url)
            await page.wait_for_selector(".brand-wordmark")
            # Wait for async data fetch to complete and populate hero height
            await page.wait_for_function("() => document.getElementById('hero-height-value').textContent !== '--'", timeout=8000)

            # Check title & wordmark
            title = await page.text_content(".brand-wordmark")
            assert "潮候" in title, f"Wordmark mismatch: {title}"

            station_name = await page.text_content("#station-name-title")
            assert "澳門內港" in station_name, f"Expected 澳門內港, got: {station_name}"

            territory_badge = await page.text_content("#station-territory-badge")
            assert "澳門" in territory_badge, f"Expected 澳門 badge, got: {territory_badge}"

            datum_tag = await page.text_content("#station-datum-tag")
            assert "平均海平面" in datum_tag or "MSL" in datum_tag

            origin_text = await page.text_content("#origin-label")
            assert "而家用澳門內港做起點（未開定位）" in origin_text

            # Check hero height digits rendered
            height_val = await page.text_content("#hero-height-value")
            assert height_val != "--" and float(height_val) > -5.0, f"Expected numeric height, got: {height_val}"

            # Check next extreme text
            next_extreme = await page.text_content("#hero-next-extreme")
            print(f"  Next extreme readout: {next_extreme}")
            assert "下一潮" in next_extreme

            # Check SVG curve rendered
            svg_paths = await page.query_selector_all(".chart-curve-layer path")
            assert len(svg_paths) >= 2, "Tide curve paths must be rendered"

            # Check chart subtitle for Macau
            subtitle = await page.text_content("#chart-subtitle")
            assert "Open-Meteo 模式預測（非官方潮汐表）" in subtitle, f"Unexpected subtitle: {subtitle}"

            # Check navigation disclaimer
            disclaimer = await page.text_content(".footer-disclaimer-text")
            assert "資料唔適用於航行" in disclaimer

            # Check horizontal overflow
            scroll_width = await page.evaluate("() => document.documentElement.scrollWidth")
            inner_width = await page.evaluate("() => window.innerWidth")
            assert scroll_width <= inner_width, f"Horizontal overflow detected: scrollWidth {scroll_width} > innerWidth {inner_width}"

            screenshot_macau = os.path.join(EVIDENCE_DIR, "screenshot-macau-390.png")
            await page.screenshot(path=screenshot_macau)
            print(f"  Saved screenshot: {screenshot_macau}")

            # Verify 0 console errors
            filtered_errors = [e for e in console_errors if not "favicon" in e.lower()]
            assert len(filtered_errors) == 0, f"Console errors found: {filtered_errors}"

            await context.close()
            tests_passed += 1
            print("  ✔ [PASS] Test 1 passed.")

            # -------------------------------------------------------------
            # TEST 2: Station Switch to Hong Kong Tai O (TAO) Official Tides
            # -------------------------------------------------------------
            tests_run += 1
            print("\n[TEST 2] Station Switch to Hong Kong Tai O (TAO) Official Tides...")
            context = await browser.new_context(viewport={"width": 390, "height": 844})
            page = await context.new_page()
            await page.goto(app_url)
            await page.wait_for_selector(".station-chip")

            # Click on 大澳 chip
            tao_chip = await page.wait_for_selector('button[data-station-id="hk-tao"]')
            await tao_chip.click()
            await page.wait_for_function("() => document.getElementById('station-name-title').textContent.includes('大澳')", timeout=8000)
            await page.wait_for_function("() => document.getElementById('station-datum-tag').textContent.includes('海圖基準面')", timeout=8000)
            await page.wait_for_function("() => document.getElementById('footer-source-credit').textContent.includes('香港天文台')", timeout=8000)
            await page.wait_for_function("() => document.getElementById('extremes-list').textContent.includes('高潮')", timeout=8000)

            hk_station_title = await page.text_content("#station-name-title")
            assert "大澳" in hk_station_title, f"Expected 大澳, got: {hk_station_title}"

            hk_subtitle = await page.text_content("#chart-subtitle")
            assert "香港天文台官方天文潮汐表（海圖基準面）" in hk_subtitle, f"Unexpected HK subtitle: {hk_subtitle}"

            hk_territory = await page.text_content("#station-territory-badge")
            assert "香港" in hk_territory, f"Expected 香港, got: {hk_territory}"

            hk_datum = await page.text_content("#station-datum-tag")
            assert "海圖基準面" in hk_datum or "CD" in hk_datum, f"Expected Chart Datum, got: {hk_datum}"

            # Check footer credits HKO
            footer_credit = await page.text_content("#footer-source-credit")
            assert "香港天文台" in footer_credit, f"Footer must credit HKO: {footer_credit}"

            # Check extremes list has HKO heights
            extremes_html = await page.inner_html("#extremes-list")
            assert "高潮" in extremes_html and "低潮" in extremes_html

            screenshot_hk = os.path.join(EVIDENCE_DIR, "screenshot-hk-tao-390.png")
            await page.screenshot(path=screenshot_hk)
            print(f"  Saved screenshot: {screenshot_hk}")

            await context.close()
            tests_passed += 1
            print("  ✔ [PASS] Test 2 passed.")

            # -------------------------------------------------------------
            # TEST 3: Interactive Chart Finger Scrubbing
            # -------------------------------------------------------------
            tests_run += 1
            print("\n[TEST 3] Interactive SVG Tide Curve Finger Scrubbing...")
            context = await browser.new_context(viewport={"width": 390, "height": 844})
            page = await context.new_page()
            await page.goto(app_url)
            await page.wait_for_function("() => document.getElementById('hero-height-value').textContent !== '--'", timeout=8000)

            # Scrub across the chart
            chart_el = await page.wait_for_selector(".tide-chart-wrapper")
            chart_box = await chart_el.bounding_box()
            assert chart_box, "Chart box not found"

            mid_x = chart_box["x"] + chart_box["width"] * 0.45
            mid_y = chart_box["y"] + chart_box["height"] * 0.5

            await page.mouse.move(mid_x, mid_y)
            await page.mouse.down()
            await page.wait_for_timeout(100)
            await page.mouse.move(mid_x + 50, mid_y)
            await page.wait_for_timeout(200)

            # Check scrub indicator is visible
            scrub_display = await page.eval_on_selector(".chart-scrub-layer", "el => el.style.display")
            assert scrub_display != "none", "Scrub indicator must be visible during scrub"

            # Check hero badge shows scrub preview
            hero_status = await page.text_content("#hero-tendency-badge")
            assert "預測" in hero_status, f"Hero badge must show scrub preview, got: {hero_status}"

            screenshot_scrub = os.path.join(EVIDENCE_DIR, "screenshot-chart-scrub.png")
            await page.screenshot(path=screenshot_scrub)
            print(f"  Saved screenshot: {screenshot_scrub}")

            await page.mouse.up()
            await context.close()
            tests_passed += 1
            print("  ✔ [PASS] Test 3 passed.")

            # -------------------------------------------------------------
            # TEST 4: Geolocation Denial & Fallback
            # -------------------------------------------------------------
            tests_run += 1
            print("\n[TEST 4] Geolocation Denial & Default Origin Action...")
            context = await browser.new_context(viewport={"width": 390, "height": 844})
            page = await context.new_page()
            await page.add_init_script("""
                navigator.geolocation.getCurrentPosition = function(success, error, options) {
                    setTimeout(() => error({ code: 1, message: 'User denied geolocation' }), 50);
                };
            """)
            await page.goto(app_url)
            await page.wait_for_function("() => document.getElementById('hero-height-value').textContent !== '--'", timeout=8000)
            await page.wait_for_selector("#btn-locate")

            await page.click("#btn-locate")
            await page.wait_for_timeout(300)

            error_label = await page.text_content("#origin-label")
            print(f"  Origin label on denial: {error_label}")
            assert "未獲授權" in error_label
            assert "澳門內港" in error_label

            # Visible #btn-default-origin control
            is_visible = await page.is_visible("#btn-default-origin")
            assert is_visible, "#btn-default-origin must be visible"

            screenshot_denied = os.path.join(EVIDENCE_DIR, "screenshot-locate-denied.png")
            await page.screenshot(path=screenshot_denied)

            # Real tap on #btn-default-origin
            await page.click("#btn-default-origin")
            await page.wait_for_timeout(200)

            restored = await page.text_content("#origin-label")
            assert "而家用澳門內港做起點" in restored

            await context.close()
            tests_passed += 1
            print("  ✔ [PASS] Test 4 passed.")

            # -------------------------------------------------------------
            # TEST 5: Geolocation Success (Explicitly Simulated Coordinates)
            # -------------------------------------------------------------
            tests_run += 1
            print("\n[TEST 5] Geolocation Success (Explicitly Simulated Lantau Coordinates)...")
            context = await browser.new_context(
                viewport={"width": 390, "height": 844},
                permissions=["geolocation"],
                geolocation={"latitude": 22.254, "longitude": 113.864} # Explicitly simulated Tai O coords
            )
            page = await context.new_page()
            await page.goto(app_url)
            await page.wait_for_function("() => document.getElementById('hero-height-value').textContent !== '--'", timeout=8000)
            await page.wait_for_selector("#btn-locate")

            await page.click("#btn-locate")
            await page.wait_for_timeout(600)

            origin_after_geo = await page.text_content("#origin-label")
            print(f"  Origin label after locate: {origin_after_geo}")
            assert "大澳" in origin_after_geo, f"Should snap to nearest station 大澳, got: {origin_after_geo}"

            # Check visible return control
            assert await page.is_visible("#btn-default-origin"), "Return to Macau Inner Harbour button must appear"

            screenshot_success = os.path.join(EVIDENCE_DIR, "screenshot-locate-success.png")
            await page.screenshot(path=screenshot_success)

            # Tap return button to go back to 澳門內港
            await page.click("#btn-default-origin")
            await page.wait_for_timeout(300)

            returned = await page.text_content("#station-name-title")
            assert "澳門內港" in returned

            await context.close()
            tests_passed += 1
            print("  ✔ [PASS] Test 5 passed.")

            # -------------------------------------------------------------
            # TEST 6: Multi-Viewport Responsive Pass (375px & 430px)
            # -------------------------------------------------------------
            tests_run += 1
            print("\n[TEST 6] Multi-Viewport Responsive Check (375px SE & 430px Pro Max)...")
            for w in [375, 430]:
                ctx = await browser.new_context(viewport={"width": w, "height": 844})
                pg = await ctx.new_page()
                await pg.goto(app_url)
                await pg.wait_for_selector(".station-name-title")

                sw = await pg.evaluate("() => document.documentElement.scrollWidth")
                iw = await pg.evaluate("() => window.innerWidth")
                assert sw <= iw, f"Horizontal overflow at {w}px viewport: {sw} > {iw}"
                await ctx.close()

            tests_passed += 1
            print("  ✔ [PASS] Test 6 passed.")

        finally:
            await browser.close()
            server.shutdown()

    print(f"\n==========================================")
    print(f"Browser Verification Summary: {tests_passed}/{tests_run} Passed")
    print(f"==========================================")

    return 0 if tests_passed == tests_run else 1

if __name__ == "__main__":
    code = asyncio.run(run_browser_tests())
    sys.exit(code)
