#!/usr/bin/env python3
"""
verify_ui.py - Headless Chrome verification for Odds Lab v4.
- Runs at 390x844 viewport (iPhone mobile-first)
- Captures console errors and warnings
- Takes screenshots of all primary v4 tabs into screenshots/v4/
- Automatically manages local HTTP server on port 8799
"""

import os
import sys
import time
import subprocess
from playwright.sync_api import sync_playwright

PORT = 8799
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SCREENSHOTS_DIR = os.path.join(ROOT_DIR, "screenshots", "v4")

def main():
    os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

    # Start local server
    print(f"[UI Verify] Starting HTTP server on port {PORT} in {ROOT_DIR}...")
    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT)],
        cwd=ROOT_DIR,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    console_errors = []
    console_warnings = []

    try:
        time.sleep(1.0)
        url = f"http://127.0.0.1:{PORT}/"

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                viewport={"width": 390, "height": 844},
                device_scale_factor=2,
                user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
            )
            page = context.new_page()

            page.on("console", lambda msg: (
                console_errors.append(msg.text) if msg.type == "error" else (
                    console_warnings.append(msg.text) if msg.type == "warning" else None
                )
            ))
            page.on("pageerror", lambda err: console_errors.append(str(err)))

            print(f"[UI Verify] Navigating to {url}...")
            page.goto(url, wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(1000)

            # 1. Screenshot Tab 1 (Default: 澳門盤值博)
            print("[UI Verify] Capturing Tab 1: 澳門盤值博...")
            page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "01_macau_fixtures.png"))

            # 2. Toggle "只睇值博"
            btn_only_val = page.locator("#btnToggleOnlyValue")
            if btn_only_val.is_visible():
                btn_only_val.click()
                page.wait_for_timeout(500)
                print("[UI Verify] Capturing Tab 1 (只睇值博 filtered)...")
                page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "02_only_value_filter.png"))
                # Toggle back
                btn_only_val.click()
                page.wait_for_timeout(300)

            # 3. Open Match Detail Modal on first card
            first_card = page.locator(".live-fixture-card").first
            if first_card.is_visible():
                print("[UI Verify] Opening Match Detail Modal...")
                first_card.click()
                page.wait_for_timeout(600)
                page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "03_match_detail_modal.png"))
                # Close modal
                page.locator("#btnCloseMatchDetail").click()
                page.wait_for_timeout(300)

            # 4. Tab 2: 莊家比較
            btn_compare = page.locator('button.nav-tab[data-tab="tab-compare"]')
            if btn_compare.is_visible():
                print("[UI Verify] Capturing Tab 2: 莊家比較...")
                btn_compare.click()
                page.wait_for_timeout(600)
                page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "04_compare_tab.png"))

            # 5. Tab 3: 戰績追蹤
            btn_record = page.locator('button.nav-tab[data-tab="tab-record"]')
            if btn_record.is_visible():
                print("[UI Verify] Capturing Tab 3: 戰績追蹤...")
                btn_record.click()
                page.wait_for_timeout(600)
                page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "05_track_record_tab.png"))

            browser.close()

    finally:
        print("[UI Verify] Stopping HTTP server...")
        server.terminate()
        server.wait()

    print("\n" + "="*50)
    print(f"Console Errors ({len(console_errors)}):")
    for err in console_errors:
        print(f"  ❌ {err}")

    print(f"Console Warnings ({len(console_warnings)}):")
    for warn in console_warnings:
        print(f"  ⚠️ {warn}")

    if console_errors:
        print("\nFAILED: Console errors detected!")
        sys.exit(1)
    else:
        print("\nPASSED: 0 console errors detected in headless Chrome at 390x844!")

if __name__ == "__main__":
    main()
