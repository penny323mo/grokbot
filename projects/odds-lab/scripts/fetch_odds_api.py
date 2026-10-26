#!/usr/bin/env python3
"""
fetch_odds_api.py - Fetches bookmaker odds from The Odds API (v4).
Strictly guarded: runs at most once per UTC day, with 500 credits/month budget check.
Skips inactive sports via free /v4/sports endpoint.
Never logs or exposes the API key.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone

TARGET_SPORTS = [
    "soccer_epl",
    "soccer_spain_la_liga",
    "soccer_italy_serie_a",
    "soccer_germany_bundesliga",
    "soccer_france_ligue_one",
    "soccer_uefa_champs_league",
    "soccer_uefa_europa_league",
    "soccer_uefa_europa_conference_league"
]

SPORTS_CODE_MAP = {
    "soccer_epl": "E0",
    "soccer_spain_la_liga": "SP1",
    "soccer_italy_serie_a": "I1",
    "soccer_germany_bundesliga": "D1",
    "soccer_france_ligue_one": "F1",
    "soccer_uefa_champs_league": "UCL",
    "soccer_uefa_europa_league": "UEL",
    "soccer_uefa_europa_conference_league": "UECL"
}

def get_api_key():
    """Retrieves API key from environment or local secret file without echoing it."""
    key = os.environ.get("ODDS_API_KEY", "").strip()
    if key:
        return key
    secret_path = "/workspace/.odds_api_key"
    if os.path.exists(secret_path):
        try:
            with open(secret_path, "r", encoding="utf-8") as f:
                key = f.read().strip()
                if key:
                    return key
        except Exception:
            pass
    return ""

def load_json(filepath, default=None):
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return default

def save_json(filepath, data):
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def fetch_odds_api(data_dir="data", force=False):
    """
    Fetches odds from The Odds API if allowed by daily guard and credit threshold.
    Returns:
      {
        "status": "ok"|"skipped"|"error",
        "state": {...},
        "matches": [...]
      }
    """
    state_file = os.path.join(data_dir, "odds_api_state.json")
    cache_file = os.path.join(data_dir, "odds_api_cache.json")

    state = load_json(state_file, {
        "last_run_utc": "",
        "last_run_timestamp": "",
        "requests_remaining": None,
        "requests_used": None,
        "status": "uninitialized",
        "message": ""
    })

    cached_data = load_json(cache_file, [])

    api_key = get_api_key()
    if not api_key:
        print("[TheOddsAPI] Warning: No ODDS_API_KEY available in env or secret file.", file=sys.stderr)
        state["status"] = "no_key"
        state["message"] = "ODDS_API_KEY not configured"
        save_json(state_file, state)
        return {"status": "skipped", "state": state, "matches": cached_data}

    today_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Guard: Run at most once per UTC day unless forced
    if not force and state.get("last_run_utc") == today_utc and cached_data:
        print(f"[TheOddsAPI] Daily guard: already executed for UTC date {today_utc}. Serving from cache.")
        return {"status": "skipped", "state": state, "matches": cached_data}

    # Step 1: Free check via /v4/sports to verify key, inspect credits, and check active sports
    print("[TheOddsAPI] Querying /v4/sports (free endpoint) to check quota and active leagues...")
    sports_url = f"https://api.the-odds-api.com/v4/sports/?apiKey={api_key}"
    try:
        req = urllib.request.Request(sports_url, headers={"User-Agent": "OddsLab/4.0"})
        with urllib.request.urlopen(req, timeout=12) as resp:
            headers = resp.headers
            rem = headers.get("x-requests-remaining")
            used = headers.get("x-requests-used")
            if rem is not None:
                state["requests_remaining"] = int(rem)
            if used is not None:
                state["requests_used"] = int(used)

            sports_list = json.loads(resp.read().decode("utf-8"))
            active_map = {s.get("key"): s.get("active", False) for s in sports_list}
    except Exception as e:
        print(f"[TheOddsAPI] Error querying sports endpoint: {e}", file=sys.stderr)
        state["status"] = "error"
        state["message"] = f"Sports check failed: {e}"
        save_json(state_file, state)
        return {"status": "error", "state": state, "matches": cached_data}

    print(f"[TheOddsAPI] Quota status: remaining={state.get('requests_remaining')}, used={state.get('requests_used')}")

    # Guard: Abort if remaining credits < 40
    if state.get("requests_remaining") is not None and state["requests_remaining"] < 40:
        print(f"[TheOddsAPI] Quota low ({state['requests_remaining']} < 40). Aborting fetch.", file=sys.stderr)
        state["status"] = "quota_low"
        state["message"] = f"Remaining credits ({state['requests_remaining']}) below threshold (40)"
        save_json(state_file, state)
        return {"status": "skipped", "state": state, "matches": cached_data}

    # Determine active target sports
    active_targets = [sp for sp in TARGET_SPORTS if active_map.get(sp, False)]
    print(f"[TheOddsAPI] Active target competitions to fetch: {active_targets}")

    all_matches = []
    fetched_sports = []

    for sp in active_targets:
        url = f"https://api.the-odds-api.com/v4/sports/{sp}/odds/?apiKey={api_key}&regions=eu&markets=h2h,totals&oddsFormat=decimal"
        try:
            time.sleep(0.3)
            req = urllib.request.Request(url, headers={"User-Agent": "OddsLab/4.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                headers = resp.headers
                rem = headers.get("x-requests-remaining")
                used = headers.get("x-requests-used")
                if rem is not None:
                    state["requests_remaining"] = int(rem)
                if used is not None:
                    state["requests_used"] = int(used)

                data = json.loads(resp.read().decode("utf-8"))
                for match in data:
                    match["sport_key"] = sp
                    match["league_code"] = SPORTS_CODE_MAP.get(sp, "")
                all_matches.extend(data)
                fetched_sports.append(sp)
                print(f"[TheOddsAPI] Fetched {len(data)} matches for {sp} (rem={state.get('requests_remaining')})")
        except Exception as e:
            print(f"[TheOddsAPI] Error fetching {sp}: {e}", file=sys.stderr)

    now_utc_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    if fetched_sports:
        state["last_run_utc"] = today_utc
        state["last_run_timestamp"] = now_utc_str
        state["status"] = "success"
        state["message"] = f"Successfully fetched {len(all_matches)} matches across {len(fetched_sports)} leagues"
        state["cached_events_count"] = len(all_matches)
        save_json(state_file, state)
        save_json(cache_file, all_matches)
        print(f"[TheOddsAPI] Completed fetch: {len(all_matches)} total matches cached. Remaining credits: {state.get('requests_remaining')}")
        return {"status": "ok", "state": state, "matches": all_matches}
    else:
        state["last_run_timestamp"] = now_utc_str
        state["status"] = "error"
        state["message"] = "Failed to fetch any sports: all network requests failed"
        save_json(state_file, state)
        existing_cached = load_json(cache_file) or []
        print(f"[TheOddsAPI] Error: no sports fetched. Retaining {len(existing_cached)} existing cached matches.", file=sys.stderr)
        return {"status": "error", "message": state["message"], "state": state, "matches": existing_cached}

if __name__ == "__main__":
    fetch_odds_api()
