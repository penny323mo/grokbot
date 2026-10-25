#!/usr/bin/env python3
"""
fetch_macau.py - Fetches live match fixtures and odds from Macau Slot public API.
Filters to Top 5 European Leagues and UEFA Cup competitions within the next 3 days.
"""

import json
import os
import sys
import time
import re
import urllib.request
import urllib.parse
from datetime import datetime, timezone, timedelta

# Ensure parent directory is in sys.path for team_names import
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from team_names import get_team_cantonese

MACAU_LIST_URL = "https://www.macau-slot.com/event-api/cn/D/FB/coming/all/-/threeinone/-"
MACAU_MARKETS_URL = "https://www.macau-slot.com/event-api/cn/D/FB/markets/coming/all/threeinone"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://www.macau-slot.com/content/soccer/coming_bet.html",
    "Content-Type": "application/x-www-form-urlencoded",
    "Accept-Language": "zh-HK,zh-TW,zh;q=0.9"
}

COMPETITION_MAP = {
    "England Premier League": {"code": "E0", "name": "英超", "group": "top5"},
    "Spain LALIGA": {"code": "SP1", "name": "西甲", "group": "top5"},
    "Italy Serie A": {"code": "I1", "name": "意甲", "group": "top5"},
    "Germany Bundesliga": {"code": "D1", "name": "德甲", "group": "top5"},
    "France Ligue 1": {"code": "F1", "name": "法甲", "group": "top5"},
    "UEFA Champions League": {"code": "UCL", "name": "歐聯", "group": "uefa"},
    "UEFA Europa League": {"code": "UEL", "name": "歐霸", "group": "uefa"},
    "UEFA Europa Conference League": {"code": "UECL", "name": "歐協聯", "group": "uefa"},
}

def parse_handicap(hcap_str):
    """
    Parses handicap string to a float.
    Examples:
      "-0.5" -> -0.5
      "+0.5" -> 0.5
      "-0.5/-1" -> -0.75
      "+0.5/+1" -> +0.75
      "0/-0.5" -> -0.25
      "2.5/3" -> 2.75
    """
    if not hcap_str:
        return None
    s = str(hcap_str).strip()
    if not s or s.lower() == "none":
        return None
    try:
        if "/" in s:
            parts = s.split("/")
            return round(sum(float(p) for p in parts) / len(parts), 3)
        return round(float(s), 3)
    except (ValueError, TypeError):
        return None

def fetch_post(url, form_data, max_retries=3, timeout=15):
    """Executes a polite POST request with exponential backoff."""
    encoded_data = urllib.parse.urlencode(form_data).encode("utf-8")
    req = urllib.request.Request(url, data=encoded_data, headers=HEADERS)

    for attempt in range(1, max_retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                if resp.status == 200:
                    raw_bytes = resp.read()
                    return json.loads(raw_bytes.decode("utf-8", errors="replace"))
        except Exception as e:
            if attempt == max_retries:
                print(f"[MacauSlot] Request failed after {max_retries} attempts: {e}", file=sys.stderr)
                raise
            time.sleep(1.5 * attempt)
    return None

def fetch_macau_data(sample_save_dir=None):
    """
    Fetches coming events and markets from Macau Slot.
    Returns:
      {
        "status": "ok",
        "fetched_at": "YYYY-MM-DDTHH:MM:SSZ",
        "events": [...]
      }
    """
    now_macau = datetime.now(timezone(timedelta(hours=8)))
    # 3-day window: from now - 2h (in case match just started) to now + 72h
    window_start = now_macau - timedelta(hours=2)
    window_end = now_macau + timedelta(hours=72)

    print(f"[MacauSlot] Fetching event list from {MACAU_LIST_URL}...")
    list_res = fetch_post(MACAU_LIST_URL, {"request_data": "{}", "token": ""})

    if not list_res or "data" not in list_res or "events" not in list_res["data"]:
        raise ValueError("[MacauSlot] Invalid list response structure")

    raw_events = list_res["data"]["events"]
    print(f"[MacauSlot] Received {len(raw_events)} total coming events.")

    # Filter events
    target_events = []
    for ev in raw_events:
        league_en = ev.get("eventType", {}).get("translateName", {}).get("EN")
        if league_en not in COMPETITION_MAP:
            continue

        start_time_str = ev.get("start_time")  # e.g. "2026-10-25 22:00:00" in GMT+8
        if not start_time_str:
            continue

        try:
            match_dt = datetime.strptime(start_time_str, "%Y-%m-%d %H:%M:%S").replace(
                tzinfo=timezone(timedelta(hours=8))
            )
        except ValueError:
            continue

        if window_start <= match_dt <= window_end:
            h_en = ev.get("translateName", {}).get("homeTeam", {}).get("EN") or ev.get("home_team") or ""
            a_en = ev.get("translateName", {}).get("awayTeam", {}).get("EN") or ev.get("away_team") or ""

            raw_h_zh = ev.get("translateName", {}).get("homeTeam", {}).get("ZHT") or ev.get("translateName", {}).get("homeTeam", {}).get("ZH") or ""
            raw_a_zh = ev.get("translateName", {}).get("awayTeam", {}).get("ZHT") or ev.get("translateName", {}).get("awayTeam", {}).get("ZH") or ""

            has_cjk_h = bool(re.search(r"[\u4e00-\u9fff]", raw_h_zh)) and "?" not in raw_h_zh
            has_cjk_a = bool(re.search(r"[\u4e00-\u9fff]", raw_a_zh)) and "?" not in raw_a_zh

            h_zh = raw_h_zh if has_cjk_h else get_team_cantonese(h_en)
            a_zh = raw_a_zh if has_cjk_a else get_team_cantonese(a_en)

            target_events.append({
                "ev_id": str(ev.get("ev_id")),
                "start_time": start_time_str,
                "kickoff_iso": match_dt.isoformat(),
                "league_en": league_en,
                "league_code": COMPETITION_MAP[league_en]["code"],
                "league_zh": COMPETITION_MAP[league_en]["name"],
                "home_en": h_en,
                "away_en": a_en,
                "home_zh": h_zh,
                "away_zh": a_zh,
            })

    print(f"[MacauSlot] Filtered to {len(target_events)} matches in target competitions within 3 days.")

    if not target_events:
        return {
            "status": "ok",
            "fetched_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "events": []
        }

    # Fetch markets in batches of 25 IDs
    batch_size = 25
    event_ids = [e["ev_id"] for e in target_events]
    markets_by_event = {}

    for i in range(0, len(event_ids), batch_size):
        batch = event_ids[i:i + batch_size]
        req_payload = json.dumps({"events": ",".join(batch)})
        time.sleep(0.3)  # Be polite
        m_res = fetch_post(MACAU_MARKETS_URL, {"request_data": req_payload, "token": ""})
        if m_res and "data" in m_res:
            for item in m_res["data"]:
                markets_by_event[str(item.get("ev_id"))] = item.get("markets", [])

    # Save raw sample if directory provided
    if sample_save_dir:
        os.makedirs(sample_save_dir, exist_ok=True)
        sample_path = os.path.join(sample_save_dir, "macau_sample.json")
        with open(sample_path, "w", encoding="utf-8") as f:
            json.dump({
                "list_sample": raw_events[:5],
                "target_events": target_events,
                "markets_sample": {k: markets_by_event[k] for k in list(markets_by_event.keys())[:3]}
            }, f, ensure_ascii=False, indent=2)
        print(f"[MacauSlot] Saved raw sample to {sample_path}")

    # Process and structure each event with its odds
    processed_events = []
    for ev in target_events:
        ev_id = ev["ev_id"]
        raw_mkts = markets_by_event.get(ev_id, [])

        # 1X2 market
        odds_1x2 = None
        # Asian Handicap markets (all lines + main line)
        ah_markets = []
        # Over/Under markets (all lines + main line)
        ou_markets = []

        for mkt in raw_mkts:
            name_en = mkt.get("translateName", {}).get("EN", "")
            outcomes = mkt.get("outcomes", [])

            # 1X2
            if name_en == "Win/Draw/Win":
                rates = {}
                for o in outcomes:
                    res = o.get("fb_result")
                    rate = float(o.get("rate", 0)) if o.get("rate") else None
                    if res and rate:
                        rates[res] = rate
                if "H" in rates and "D" in rates and "A" in rates:
                    # Calculate margin
                    margin = (1.0 / rates["H"] + 1.0 / rates["D"] + 1.0 / rates["A"]) - 1.0
                    odds_1x2 = {
                        "h": rates["H"],
                        "d": rates["D"],
                        "a": rates["A"],
                        "margin": round(margin, 4)
                    }

            # Asian Handicap
            elif name_en == "Asian Handicap":
                hcap_str = mkt.get("hcap_disp")
                line = parse_handicap(hcap_str)
                if line is not None:
                    h_rate = None
                    a_rate = None
                    for o in outcomes:
                        res = o.get("fb_result")
                        rate = float(o.get("rate", 0)) if o.get("rate") else None
                        if res == "H":
                            h_rate = rate
                        elif res == "A":
                            a_rate = rate
                    if h_rate and a_rate:
                        margin = (1.0 / h_rate + 1.0 / a_rate) - 1.0
                        ah_markets.append({
                            "line": line,
                            "hcap_disp": hcap_str,
                            "h": h_rate,
                            "a": a_rate,
                            "margin": round(margin, 4)
                        })

            # Over/Under
            elif name_en == "Over/Under":
                hcap_str = mkt.get("hcap_disp")
                line = parse_handicap(hcap_str)
                if line is not None:
                    o_rate = None
                    u_rate = None
                    for o in outcomes:
                        res = o.get("fb_result")
                        rate = float(o.get("rate", 0)) if o.get("rate") else None
                        if res == "O":
                            o_rate = rate
                        elif res == "U":
                            u_rate = rate
                    if o_rate and u_rate:
                        margin = (1.0 / o_rate + 1.0 / u_rate) - 1.0
                        ou_markets.append({
                            "line": line,
                            "hcap_disp": hcap_str,
                            "over": o_rate,
                            "under": u_rate,
                            "margin": round(margin, 4)
                        })

        # Select main line for AH and OU (the one closest to balanced ~1.90 / minimal margin)
        main_ah = None
        if ah_markets:
            # Sort by distance from 1.90 and then by margin
            ah_markets.sort(key=lambda m: (abs(m["h"] - 1.90) + abs(m["a"] - 1.90), m["margin"]))
            main_ah = ah_markets[0]

        main_ou = None
        if ou_markets:
            # Sort by distance from 2.5 or balanced rates
            ou_markets.sort(key=lambda m: (abs(m["over"] - 1.90) + abs(m["under"] - 1.90), m["margin"]))
            main_ou = ou_markets[0]

        processed_events.append({
            **ev,
            "odds_1x2": odds_1x2,
            "main_ah": main_ah,
            "all_ah": ah_markets,
            "main_ou": main_ou,
            "all_ou": ou_markets
        })

    return {
        "status": "ok",
        "fetched_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "events": processed_events
    }

if __name__ == "__main__":
    result = fetch_macau_data(sample_save_dir="data/raw_samples")
    print(f"Successfully processed {len(result['events'])} Macau Slot events.")
    for ev in result["events"][:3]:
        print(f"  {ev['start_time']} [{ev['league_code']}] {ev['home_en']} vs {ev['away_en']}")
        if ev["odds_1x2"]:
            print(f"     1X2: H={ev['odds_1x2']['h']} D={ev['odds_1x2']['d']} A={ev['odds_1x2']['a']} (margin={ev['odds_1x2']['margin']*100:.1f}%)")
        if ev["main_ah"]:
            print(f"     AH: Line={ev['main_ah']['line']} H={ev['main_ah']['h']} A={ev['main_ah']['a']}")
        if ev["main_ou"]:
            print(f"     OU: Line={ev['main_ou']['line']} O={ev['main_ou']['over']} U={ev['main_ou']['under']}")
