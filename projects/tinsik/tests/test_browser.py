#!/usr/bin/env python3
"""
tests/test_browser.py · 天色 Tin Sik
Comprehensive Playwright browser tests covering layout, 390px/375px/430px viewports,
console errors, hourly pinning, 7-day accordion, place switching, and live data rendering.
"""

import os
import sys
import time
import subprocess
import socket
from playwright.sync_api import sync_playwright

def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

def run_tests():
    port = find_free_port()
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    server_process = subprocess.Popen(
        [sys.executable, '-m', 'http.server', str(port)],
        cwd=base_dir,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    time.sleep(0.5)

    url = f"http://127.0.0.1:{port}/index.html"
    print(f"Testing {url}...")

    console_errors = []

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)

            # 1. Test 390x844 (standard iPhone)
            context = browser.new_context(
                viewport={"width": 390, "height": 844},
                device_scale_factor=2,
                is_mobile=True,
                has_touch=True
            )
            page = context.new_page()

            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
            page.on("pageerror", lambda exc: console_errors.append(str(exc)))

            page.goto(url)
            page.wait_for_load_state("networkidle")

            # Wait for hero temperature to load
            page.wait_for_selector(".hero-temp")
            time.sleep(1.0) # Allow API or snapshot to complete render

            # Assert brand title
            brand_text = page.locator(".brand-title").inner_text()
            assert "天色" in brand_text, f"Brand title should contain 天色, got: {brand_text}"
            print("✓ Brand title 天色 verified")

            # Assert default place notice
            notice_text = page.locator("#place-notice").inner_text()
            assert "澳門半島" in notice_text, f"Notice should mention 澳門半島, got: {notice_text}"
            print("✓ Default place notice verified:", notice_text)

            # Assert hero temperature is non-empty and has degree symbol
            temp_text = page.locator(".hero-temp").inner_text()
            assert "°" in temp_text and temp_text != "--°", f"Hero temp invalid: {temp_text}"
            print("✓ Hero temperature rendered:", temp_text)

            # Assert sky condition word is in Cantonese
            sky_word = page.locator(".hero-sky-word").inner_text()
            assert len(sky_word) > 0 and sky_word != "載入中…", f"Sky word invalid: {sky_word}"
            print("✓ Cantonese sky word rendered:", sky_word)

            # Assert hourly filmstrip has cells and ochre now-tick
            cells = page.locator(".hourly-cell")
            cell_count = cells.count()
            assert cell_count >= 24, f"Expected at least 24 hourly cells, found {cell_count}"
            now_tick = page.locator(".now-tick")
            assert now_tick.count() > 0, "Expected now-tick on current hour"
            print(f"✓ Hourly filmstrip rendered with {cell_count} cells and now-tick")

            # Test hourly pinning: tap hour 3
            cells.nth(2).click()
            time.sleep(0.3)
            pinned_box = page.locator("#hourly-pinned-box")
            assert pinned_box.is_visible(), "Pinned box should be visible after tapping cell"
            pinned_text = pinned_box.inner_text()
            print("✓ Tapped hour cell; pinned readout:", pinned_text)

            # Tap close on pinned box
            page.locator("#btn-close-pinned").click()
            time.sleep(0.2)
            assert not pinned_box.is_visible(), "Pinned box should hide after close button click"
            print("✓ Hourly pinned box closed")

            # Assert 7-day forecast has 7 items
            day_items = page.locator(".day-item")
            assert day_items.count() == 7, f"Expected 7 daily rows, found {day_items.count()}"
            print(f"✓ Seven-day forecast rendered with {day_items.count()} days")

            # Test 7-day accordion expansion
            day_items.nth(1).locator(".day-row-btn").click()
            time.sleep(0.3)
            detail_panel = page.locator(".day-detail-panel")
            assert detail_panel.is_visible(), "Day detail accordion should be visible when tapped"
            hour_rows = page.locator(".day-hour-row")
            assert hour_rows.count() > 0, f"Expected hourly rows inside day accordion, got {hour_rows.count()}"
            first_hour_time = hour_rows.first.locator(".day-hour-time").inner_text()
            first_hour_sky = hour_rows.first.locator(".day-hour-sky").inner_text()
            first_hour_temp = hour_rows.first.locator(".day-hour-temp").inner_text()
            print(f"✓ Day detail accordion expanded with {hour_rows.count()} hour rows: {first_hour_time} {first_hour_sky} {first_hour_temp}")
            print("✓ Day detail accordion expanded:", detail_panel.inner_text())

            # Test Place Switcher: Switch to 香港天文台
            hk_btn = page.locator("button[data-place-id='hk-hko']")
            hk_btn.click()
            time.sleep(1.5)
            notice_after_switch = page.locator("#place-notice").inner_text()
            assert "香港天文台" in notice_after_switch, f"Notice should mention 香港天文台, got {notice_after_switch}"
            print("✓ Place switcher to 香港天文台 successful:", notice_after_switch)

            # Take screenshot at 390px
            os.makedirs(os.path.join(base_dir, "review"), exist_ok=True)
            shot_390 = os.path.join(base_dir, "review/screenshot-390.png")
            page.screenshot(path=shot_390, full_page=True)
            print("✓ Screenshot saved to", shot_390)

            # 2. Test 375x667 (iPhone SE) for horizontal overflow
            context_375 = browser.new_context(viewport={"width": 375, "height": 667})
            page_375 = context_375.new_page()
            page_375.goto(url)
            page_375.wait_for_load_state("networkidle")
            time.sleep(0.5)

            # Check overflow
            scroll_width = page_375.evaluate("document.documentElement.scrollWidth")
            client_width = page_375.evaluate("document.documentElement.clientWidth")
            assert scroll_width <= client_width, f"Horizontal overflow detected at 375px: scrollWidth={scroll_width}, clientWidth={client_width}"
            print("✓ 375px viewport checked: 0 horizontal overflow")

            # 3. Test 430x932 (iPhone Pro Max)
            context_430 = browser.new_context(viewport={"width": 430, "height": 932})
            page_430 = context_430.new_page()
            page_430.goto(url)
            page_430.wait_for_load_state("networkidle")
            time.sleep(0.5)

            scroll_width_430 = page_430.evaluate("document.documentElement.scrollWidth")
            client_width_430 = page_430.evaluate("document.documentElement.clientWidth")
            assert scroll_width_430 <= client_width_430, f"Horizontal overflow detected at 430px: scrollWidth={scroll_width_430}, clientWidth={client_width_430}"
            print("✓ 430px viewport checked: 0 horizontal overflow")

            # Assert 0 console errors
            assert len(console_errors) == 0, f"Console errors encountered: {console_errors}"
            print("✓ 0 console errors during all user interactions")

            # 4. Test Geolocation Deny flow: returns to 澳門半島 and exact sentence
            context_deny = browser.new_context(permissions=[])
            page_deny = context_deny.new_page()
            page_deny.goto(url)
            page_deny.wait_for_load_state("networkidle")
            # Switch to HK first
            page_deny.locator("button[data-place-id='hk-hko']").click()
            time.sleep(0.5)
            # Click locate
            page_deny.locator("#btn-locate").click()
            time.sleep(0.5)
            deny_notice = page_deny.locator("#place-notice").inner_text()
            assert deny_notice == "而家用澳門半島做起點（未開定位）", f"Deny notice should be exact, got: {deny_notice}"
            active_chip = page_deny.locator(".place-chip.active").inner_text()
            assert active_chip == "澳門半島", f"Active chip after deny should be 澳門半島, got: {active_chip}"
            print("✓ Geolocation deny flow verified: resets to 澳門半島 with exact notice")

            # 5. Test Non-Macau fetch failure does not show Macau snapshot
            context_err = browser.new_context()
            page_err = context_err.new_page()
            # Abort Open-Meteo requests to simulate failure
            page_err.route("**/api.open-meteo.com/**", lambda route: route.abort())
            page_err.goto(url)
            page_err.wait_for_load_state("networkidle")
            # For Macau peninsula, it falls back to snapshot with notice
            time.sleep(1.0)
            macau_notice = page_err.locator("#place-notice").inner_text()
            assert "未能連線，顯示澳門半島離線快照" in macau_notice, f"Macau fallback notice mismatch: {macau_notice}"
            print("✓ Macau Peninsula offline fallback snapshot verified:", macau_notice)

            # Now switch to 氹仔: must show Cantonese error and hide all modules
            page_err.locator("button[data-place-id='macau-taipa']").click()
            time.sleep(1.0)
            empty_msg = page_err.locator(".empty-msg").inner_text()
            assert "氹仔" in empty_msg and "無法讀取" in empty_msg, f"Expected Taipa error message, got: {empty_msg}"
            assert not page_err.locator("#filmstrip-section").is_visible(), "Filmstrip must be hidden on failure"
            assert not page_err.locator("#seven-day-section").is_visible(), "Seven day forecast must be hidden on failure"
            print("✓ Non-Macau failure isolation verified: error displayed, no snapshot used")

            # 6. Test Live refresh after snapshot resets notice
            # Unroute abort
            page_err.unroute("**/api.open-meteo.com/**")
            page_err.locator("button[data-place-id='macau-peninsula']").click()
            time.sleep(1.0)
            # Click refresh to simulate online recovery
            page_err.locator("#btn-refresh").click()
            time.sleep(1.0)
            recovered_notice = page_err.locator("#place-notice").inner_text()
            assert "離線快照" not in recovered_notice, f"Recovered notice should not say snapshot, got: {recovered_notice}"
            print("✓ Live refresh after snapshot verified: notice successfully resets to live state:", recovered_notice)

            browser.close()

    finally:
        server_process.terminate()

    print("ALL BROWSER TESTS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    run_tests()
