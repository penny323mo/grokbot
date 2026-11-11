"""
test_location_browser.py
Automated headless browser verification for 就近 (Just Around) location flow.
Uses Playwright with headless Chromium at mobile viewport 390x844.

NOTE: All location fixes tested here use EXPLICITLY SIMULATED coordinates.
Never claims actual iPhone Safari device verification.
"""

import asyncio
import http.server
import socketserver
import threading
import sys
import os
from playwright.async_api import async_playwright

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
EVIDENCE_DIR = os.path.join(WORKSPACE_DIR, "review", "fix-location-2026-11-11")
PORT = 8923

# Ensure evidence directory exists
os.makedirs(EVIDENCE_DIR, exist_ok=True)

class StaticHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WORKSPACE_DIR, **kwargs)

    def log_message(self, format, *args):
        # Quiet logging
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
    print(f"Starting local HTTP server on dynamic port {port}...")
    app_url = f"http://127.0.0.1:{port}/index.html"

    tests_run = 0
    tests_passed = 0

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-web-security"]
        )

        try:
            # Test 1: User gesture on locate control with simulated coordinates
            tests_run += 1
            print("\n[TEST 1] User gesture & success (explicitly simulated coordinates)...")
            context = await browser.new_context(
                viewport={"width": 390, "height": 844},
                user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
                permissions=["geolocation"],
                geolocation={"latitude": 22.1937, "longitude": 113.5406} # Explicitly simulated Senado Square
            )
            page = await context.new_page()
            await page.goto(app_url)
            await page.wait_for_selector("#btn-locate")

            # Check initial origin text
            initial_text = await page.text_content("#origin-label")
            assert "議事亭前地" in initial_text, f"Expected initial origin, got: {initial_text}"

            # Click locate control with user gesture
            await page.click("#btn-locate")
            await page.wait_for_timeout(500)

            origin_text = await page.text_content("#origin-label")
            locate_btn_text = await page.text_content(".btn-locate-text")
            print(f"  Origin label after locate: {origin_text}")
            print(f"  Button text after locate: {locate_btn_text}")

            assert "你嘅位置" in origin_text or "實際定位" in origin_text, f"Unexpected origin: {origin_text}"
            assert "用我嘅位置" in locate_btn_text, f"Button text must reset: {locate_btn_text}"

            screenshot_path = os.path.join(EVIDENCE_DIR, "screenshot-simulated-locate-success.png")
            await page.screenshot(path=screenshot_path)
            print(f"  Saved evidence screenshot: {screenshot_path}")
            await context.close()
            tests_passed += 1
            print("  ✔ [PASS] Test 1 passed.")

            # Test 2: Permission denied (error code 1)
            tests_run += 1
            print("\n[TEST 2] Permission denied (code 1) shows honest copy & retry option...")
            context = await browser.new_context(
                viewport={"width": 390, "height": 844},
                permissions=[] # No geolocation permission
            )
            page = await context.new_page()
            # Force permission denied via script override
            await page.add_init_script("""
                navigator.geolocation.getCurrentPosition = function(success, error, options) {
                    setTimeout(() => {
                        error({ code: 1, message: 'User denied Geolocation' });
                    }, 50);
                };
            """)
            await page.goto(app_url)
            await page.wait_for_selector("#btn-locate")
            await page.click("#btn-locate")
            await page.wait_for_timeout(300)

            denied_text = await page.text_content("#origin-label")
            btn_text = await page.text_content(".btn-locate-text")
            is_disabled = await page.is_disabled("#btn-locate")
            print(f"  Origin label: {denied_text}")

            assert "未獲授權" in denied_text, f"Must mention permission denied: {denied_text}"
            assert "重試" in denied_text, f"Must offer retry: {denied_text}"
            assert "議事亭前地" in denied_text, f"Must offer default origin: {denied_text}"
            assert not is_disabled, "Button must not remain disabled after denial"
            assert "用我嘅位置" in btn_text, f"Button text must reset: {btn_text}"

            screenshot_denied = os.path.join(EVIDENCE_DIR, "screenshot-locate-denied.png")
            await page.screenshot(path=screenshot_denied)
            await context.close()
            tests_passed += 1
            print("  ✔ [PASS] Test 2 passed.")

            # Test 3: Position unavailable (error code 2)
            tests_run += 1
            print("\n[TEST 3] Position unavailable (code 2) does NOT accuse of authorization denial...")
            context = await browser.new_context(viewport={"width": 390, "height": 844})
            page = await context.new_page()
            await page.add_init_script("""
                navigator.geolocation.getCurrentPosition = function(success, error, options) {
                    setTimeout(() => {
                        error({ code: 2, message: 'Position unavailable' });
                    }, 50);
                };
            """)
            await page.goto(app_url)
            await page.click("#btn-locate")
            await page.wait_for_timeout(300)

            unavail_text = await page.text_content("#origin-label")
            print(f"  Origin label: {unavail_text}")

            assert "未獲授權" not in unavail_text, f"Code 2 must NOT say unauthorized: {unavail_text}"
            assert "未能獲取位置" in unavail_text or "訊號" in unavail_text
            assert "重試" in unavail_text
            assert "議事亭前地" in unavail_text

            screenshot_unavail = os.path.join(EVIDENCE_DIR, "screenshot-locate-unavailable.png")
            await page.screenshot(path=screenshot_unavail)

            await context.close()
            tests_passed += 1
            print("  ✔ [PASS] Test 3 passed.")

            # Test 4: Timeout (error code 3)
            tests_run += 1
            print("\n[TEST 4] Timeout (code 3) shows honest timeout copy and retry...")
            context = await browser.new_context(viewport={"width": 390, "height": 844})
            page = await context.new_page()
            await page.add_init_script("""
                navigator.geolocation.getCurrentPosition = function(success, error, options) {
                    setTimeout(() => {
                        error({ code: 3, message: 'Timeout' });
                    }, 50);
                };
            """)
            await page.goto(app_url)
            await page.click("#btn-locate")
            # Wait until geolocation fallback finishes and label updates
            await page.wait_for_function("() => !document.getElementById('origin-label').textContent.includes('正在獲取')", timeout=3000)

            timeout_text = await page.text_content("#origin-label")
            print(f"  Origin label: {timeout_text}")

            assert "未獲授權" not in timeout_text, f"Code 3 must NOT say unauthorized: {timeout_text}"
            assert "逾時" in timeout_text or "訊號" in timeout_text
            assert "重試" in timeout_text
            assert "議事亭前地" in timeout_text

            screenshot_timeout = os.path.join(EVIDENCE_DIR, "screenshot-locate-timeout.png")
            await page.screenshot(path=screenshot_timeout)

            await context.close()
            tests_passed += 1
            print("  ✔ [PASS] Test 4 passed.")

            # Test 5: Retry after failure succeeds
            tests_run += 1
            print("\n[TEST 5] Retry after failure succeeds on second tap...")
            context = await browser.new_context(viewport={"width": 390, "height": 844})
            page = await context.new_page()
            await page.add_init_script("""
                window.__callCount = 0;
                navigator.geolocation.getCurrentPosition = function(success, error, options) {
                    window.__callCount++;
                    if (window.__callCount === 1) {
                        setTimeout(() => error({ code: 1, message: 'Denied first time' }), 50);
                    } else {
                        setTimeout(() => success({
                            coords: { latitude: 22.1937, longitude: 113.5406 }
                        }), 50);
                    }
                };
            """)
            await page.goto(app_url)
            # First tap: fails
            await page.click("#btn-locate")
            await page.wait_for_timeout(200)
            text1 = await page.text_content("#origin-label")
            assert "未獲授權" in text1

            # Second tap (retry): succeeds
            await page.click("#btn-locate")
            await page.wait_for_timeout(300)
            text2 = await page.text_content("#origin-label")
            print(f"  After retry: {text2}")
            assert "你嘅位置" in text2 or "實際定位" in text2

            await context.close()
            tests_passed += 1
            print("  ✔ [PASS] Test 5 passed.")

            # Test 6: Default origin fallback selectable via real tap on visible control
            tests_run += 1
            print("\n[TEST 6] Default origin fallback selectable via real tap on visible control...")
            context = await browser.new_context(
                viewport={"width": 390, "height": 844},
                user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
            )
            page = await context.new_page()
            await page.add_init_script("""
                window.__simulateSuccess = false;
                navigator.geolocation.getCurrentPosition = function(success, error, options) {
                    if (window.__simulateSuccess) {
                        setTimeout(() => success({
                            coords: { latitude: 22.1937, longitude: 113.5406 } // Explicitly simulated coordinates
                        }), 50);
                    } else {
                        setTimeout(() => error({ code: 1, message: 'User denied Geolocation' }), 50);
                    }
                };
            """)
            await page.goto(app_url)

            # Part 6A: After locate failure, user taps visible #btn-default-origin
            print("  [6A] Testing default origin tap after locate failure...")
            await page.click("#btn-locate")
            await page.wait_for_timeout(300)

            # Control must be visible in the DOM
            is_btn_visible = await page.is_visible("#btn-default-origin")
            btn_text = await page.text_content("#btn-default-origin")
            print(f"  Visible #btn-default-origin after failure: {is_btn_visible}, text: '{btn_text}'")
            assert is_btn_visible, "Visible #btn-default-origin control must appear on error"
            assert "議事亭前地" in btn_text, f"Expected 議事亭前地 in button text, got: {btn_text}"

            # Real user tap/click on #btn-default-origin
            await page.click("#btn-default-origin")
            await page.wait_for_timeout(200)

            restored_label = await page.text_content("#origin-label")
            print(f"  Origin label after tapping #btn-default-origin: {restored_label}")
            assert "議事亭前地" in restored_label, f"Origin must reset to Senado Square, got: {restored_label}"

            # Part 6B: After locate success with simulated coordinates, user taps visible #btn-default-origin to go back
            print("  [6B] Testing default origin tap after locate success (explicitly simulated coordinates)...")
            await page.evaluate("window.__simulateSuccess = true")
            await page.click("#btn-locate")
            await page.wait_for_timeout(300)

            origin_text_success = await page.text_content("#origin-label")
            print(f"  Origin label after locate success: {origin_text_success}")
            assert "實際定位" in origin_text_success or "你嘅位置" in origin_text_success

            is_return_btn_visible = await page.is_visible("#btn-default-origin")
            return_btn_text = await page.text_content("#btn-default-origin")
            print(f"  Visible #btn-default-origin after success: {is_return_btn_visible}, text: '{return_btn_text}'")
            assert is_return_btn_visible, "Visible #btn-default-origin must appear after success to allow going back"
            assert "議事亭前地" in return_btn_text

            # Take screenshot before tapping return button
            screenshot_action = os.path.join(EVIDENCE_DIR, "screenshot-default-origin-action.png")
            await page.screenshot(path=screenshot_action)

            # Real user tap/click on #btn-default-origin to return to default origin
            await page.click("#btn-default-origin")
            await page.wait_for_timeout(200)

            restored_label_2 = await page.text_content("#origin-label")
            print(f"  Origin label after tapping return button: {restored_label_2}")
            assert "而家用議事亭前地做起點" in restored_label_2, f"Origin must return to Senado Square, got: {restored_label_2}"

            await context.close()
            tests_passed += 1
            print("  ✔ [PASS] Test 6 passed via real user tap on visible control.")

        finally:
            await browser.close()
            server.shutdown()

    print(f"\n==========================================")
    print(f"Browser Location Tests Summary: {tests_passed}/{tests_run} Passed")
    print(f"==========================================")

    if tests_passed == tests_run:
        return 0
    return 1

if __name__ == "__main__":
    code = asyncio.run(run_browser_tests())
    sys.exit(code)
