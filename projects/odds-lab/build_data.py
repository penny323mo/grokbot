#!/usr/bin/env python3
"""
build_data.py - Builds data/data.js for Odds Lab (盤口實驗室)
Extracts historical match data (2025-26, 2026-27) and upcoming fixtures
across top 5 European leagues (E0, SP1, I1, D1, F1).
Uses only Python standard library.
"""

import csv
import json
import os
import sys
from datetime import datetime, timezone, timedelta
from team_names import TEAM_NAMES, get_team_cantonese

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SCRIPTS_DIR = os.path.join(SCRIPT_DIR, "scripts")
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

from pipeline import run_pipeline

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(SCRIPT_DIR, "raw")
DATA_DIR = os.path.join(SCRIPT_DIR, "data")

LEAGUES = [
    {"id": "E0", "key": "epl", "name": "英超", "fullName": "英格蘭超級聯賽"},
    {"id": "SP1", "key": "laliga", "name": "西甲", "fullName": "西班牙甲組聯賽"},
    {"id": "I1", "key": "seriea", "name": "意甲", "fullName": "意大利甲組聯賽"},
    {"id": "D1", "key": "bundesliga", "name": "德甲", "fullName": "德國甲組聯賽"},
    {"id": "F1", "key": "ligue1", "name": "法甲", "fullName": "法國甲組聯賽"},
]

SEASONS = ["2526", "2627"]

MATCH_SCHEMA = [
    "date", "home", "away", "fthg", "ftag", "hthg", "htag", "season",
    "o1x2_h", "o1x2_d", "o1x2_a",
    "c1x2_h", "c1x2_d", "c1x2_a",
    "o_ou_o", "o_ou_u",
    "c_ou_o", "c_ou_u",
    "o_ah_line", "o_ah_h", "o_ah_a",
    "c_ah_line", "c_ah_h", "c_ah_a",
    "sharp_h", "sharp_d", "sharp_a",
    "sharp_ou_o", "sharp_ou_u",
    "sharp_ah_h", "sharp_ah_a"
]

FIXTURE_SCHEMA = [
    "date", "time", "home", "away",
    "o1x2_h", "o1x2_d", "o1x2_a",
    "ou_line", "ou_o", "ou_u",
    "ah_line", "ah_h", "ah_a"
]

def parse_num(v):
    if v is None:
        return None
    s = str(v).strip()
    if not s:
        return None
    try:
        f = float(s)
        return round(f, 2)
    except (ValueError, TypeError):
        return None

def parse_int(v):
    if v is None:
        return None
    s = str(v).strip()
    if not s:
        return None
    try:
        return int(s)
    except (ValueError, TypeError):
        return None

def parse_date(date_str):
    if not date_str:
        return ""
    parts = date_str.strip().split("/")
    if len(parts) == 3:
        try:
            d, m, y = int(parts[0]), int(parts[1]), int(parts[2])
            if y < 100:
                y += 2000
            return f"{y:04d}-{m:02d}-{d:02d}"
        except ValueError:
            return date_str.strip()
    return date_str.strip()

def build():
    os.makedirs(DATA_DIR, exist_ok=True)
    all_dates = []

    # First, load upcoming fixtures to index them per league
    fixtures_by_league = {lg["id"]: [] for lg in LEAGUES}
    fixtures_csv = os.path.join(RAW_DIR, "fixtures.csv")
    raw_fixtures_rows = []
    if os.path.exists(fixtures_csv):
        with open(fixtures_csv, "r", encoding="utf-8-sig", errors="replace") as fp:
            reader = csv.DictReader(fp)
            for r in reader:
                div = r.get("Div", "").strip()
                if div in fixtures_by_league:
                    raw_fixtures_rows.append(r)

    league_data = {}

    for lg in LEAGUES:
        div = lg["id"]
        teams_map = {}
        teams_list = []
        matches_list = []
        teams_2627 = set()

        # Check 2627 teams first from 2627 season CSV and fixtures
        s2627_path = os.path.join(RAW_DIR, f"{div}_2627.csv")
        if os.path.exists(s2627_path):
            with open(s2627_path, "r", encoding="utf-8-sig", errors="replace") as fp:
                for r in csv.DictReader(fp):
                    h = (r.get("HomeTeam") or "").strip()
                    a = (r.get("AwayTeam") or "").strip()
                    if h:
                        teams_2627.add(h)
                    if a:
                        teams_2627.add(a)

        for r in raw_fixtures_rows:
            if r.get("Div", "").strip() == div:
                h = (r.get("HomeTeam") or "").strip()
                a = (r.get("AwayTeam") or "").strip()
                if h:
                    teams_2627.add(h)
                if a:
                    teams_2627.add(a)

        def get_or_add_team(t_name):
            if t_name not in teams_map:
                t_idx = len(teams_list)
                teams_map[t_name] = t_idx
                is_curr = t_name in teams_2627
                teams_list.append({
                    "id": t_idx,
                    "name": t_name,
                    "zh": get_team_cantonese(t_name),
                    "current": is_curr
                })
            return teams_map[t_name]

        # Ensure current teams are added first or registered
        for t_name in sorted(teams_2627):
            get_or_add_team(t_name)

        # Process seasons 2526, 2627
        for season in SEASONS:
            csv_path = os.path.join(RAW_DIR, f"{div}_{season}.csv")
            if not os.path.exists(csv_path):
                print(f"Warning: {csv_path} not found", file=sys.stderr)
                continue

            with open(csv_path, "r", encoding="utf-8-sig", errors="replace") as fp:
                reader = csv.DictReader(fp)
                for r in reader:
                    home_raw = (r.get("HomeTeam") or "").strip()
                    away_raw = (r.get("AwayTeam") or "").strip()
                    if not home_raw or not away_raw:
                        continue

                    fthg = parse_int(r.get("FTHG"))
                    ftag = parse_int(r.get("FTAG"))
                    if fthg is None or ftag is None:
                        continue

                    hthg = parse_int(r.get("HTHG"))
                    htag = parse_int(r.get("HTAG"))
                    date_iso = parse_date(r.get("Date"))
                    if date_iso:
                        all_dates.append(date_iso)

                    h_idx = get_or_add_team(home_raw)
                    a_idx = get_or_add_team(away_raw)

                    # 1X2 opening
                    o1x2_h = parse_num(r.get("B365H")) or parse_num(r.get("AvgH"))
                    o1x2_d = parse_num(r.get("B365D")) or parse_num(r.get("AvgD"))
                    o1x2_a = parse_num(r.get("B365A")) or parse_num(r.get("AvgA"))
                    if not (o1x2_h and o1x2_d and o1x2_a):
                        o1x2_h, o1x2_d, o1x2_a = None, None, None

                    # 1X2 closing
                    c1x2_h = parse_num(r.get("B365CH")) or parse_num(r.get("AvgCH"))
                    c1x2_d = parse_num(r.get("B365CD")) or parse_num(r.get("AvgCD"))
                    c1x2_a = parse_num(r.get("B365CA")) or parse_num(r.get("AvgCA"))
                    if not (c1x2_h and c1x2_d and c1x2_a):
                        c1x2_h, c1x2_d, c1x2_a = None, None, None

                    # Sharp closing 1X2: PSCH/CD/CA else BFECH/CD/CA else AvgCH/CD/CA
                    sharp_h = parse_num(r.get("PSCH")) or parse_num(r.get("BFECH")) or parse_num(r.get("AvgCH")) or c1x2_h
                    sharp_d = parse_num(r.get("PSCD")) or parse_num(r.get("BFECD")) or parse_num(r.get("AvgCD")) or c1x2_d
                    sharp_a = parse_num(r.get("PSCA")) or parse_num(r.get("BFECA")) or parse_num(r.get("AvgCA")) or c1x2_a

                    # O/U 2.5 opening
                    o_ou_o = parse_num(r.get("B365>2.5")) or parse_num(r.get("Avg>2.5"))
                    o_ou_u = parse_num(r.get("B365<2.5")) or parse_num(r.get("Avg<2.5"))
                    if not (o_ou_o and o_ou_u):
                        o_ou_o, o_ou_u = None, None

                    # O/U 2.5 closing
                    c_ou_o = parse_num(r.get("B365C>2.5")) or parse_num(r.get("AvgC>2.5"))
                    c_ou_u = parse_num(r.get("B365C<2.5")) or parse_num(r.get("AvgC<2.5"))
                    if not (c_ou_o and c_ou_u):
                        c_ou_o, c_ou_u = None, None

                    # Sharp closing O/U (PC > BFEC > AvgC > B365C)
                    sharp_ou_o = parse_num(r.get("PC>2.5")) or parse_num(r.get("BFEC>2.5")) or parse_num(r.get("AvgC>2.5")) or c_ou_o
                    sharp_ou_u = parse_num(r.get("PC<2.5")) or parse_num(r.get("BFEC<2.5")) or parse_num(r.get("AvgC<2.5")) or c_ou_u

                    # AH opening
                    o_ah_line = parse_num(r.get("AHh")) if r.get("AHh") is not None and str(r.get("AHh")).strip() != "" else parse_num(r.get("AvgAHh"))
                    o_ah_h = parse_num(r.get("B365AHH")) or parse_num(r.get("AvgAHH"))
                    o_ah_a = parse_num(r.get("B365AHA")) or parse_num(r.get("AvgAHA"))
                    if o_ah_line is None or not (o_ah_h and o_ah_a):
                        o_ah_line, o_ah_h, o_ah_a = None, None, None

                    # AH closing
                    c_ah_line = parse_num(r.get("AHCh")) if r.get("AHCh") is not None and str(r.get("AHCh")).strip() != "" else parse_num(r.get("AvgAHCh"))
                    c_ah_h = parse_num(r.get("B365CAHH")) or parse_num(r.get("AvgCAHH"))
                    c_ah_a = parse_num(r.get("B365CAHA")) or parse_num(r.get("AvgCAHA"))
                    if c_ah_line is None or not (c_ah_h and c_ah_a):
                        c_ah_line, c_ah_h, c_ah_a = None, None, None

                    # Sharp closing AH (PCA > BFECA > AvgCA > B365CA)
                    sharp_ah_h = parse_num(r.get("PCAHH")) or parse_num(r.get("BFECAHH")) or parse_num(r.get("AvgCAHH")) or c_ah_h
                    sharp_ah_a = parse_num(r.get("PCAHA")) or parse_num(r.get("BFECAHA")) or parse_num(r.get("AvgCAHA")) or c_ah_a

                    match_row = [
                        date_iso, h_idx, a_idx, fthg, ftag, hthg, htag, season,
                        o1x2_h, o1x2_d, o1x2_a,
                        c1x2_h, c1x2_d, c1x2_a,
                        o_ou_o, o_ou_u,
                        c_ou_o, c_ou_u,
                        o_ah_line, o_ah_h, o_ah_a,
                        c_ah_line, c_ah_h, c_ah_a,
                        sharp_h, sharp_d, sharp_a,
                        sharp_ou_o, sharp_ou_u,
                        sharp_ah_h, sharp_ah_a
                    ]
                    matches_list.append(match_row)

        # Sort matches chronologically by date
        matches_list.sort(key=lambda m: m[0])

        # Process upcoming fixtures for this league
        # Filter at build time relative to build date with slack (today-1 to today+5)
        today_utc = datetime.now(timezone.utc).date()
        min_fixture_date = (today_utc - timedelta(days=1)).strftime("%Y-%m-%d")
        max_fixture_date = (today_utc + timedelta(days=5)).strftime("%Y-%m-%d")

        league_fixtures = []
        for r in raw_fixtures_rows:
            if r.get("Div", "").strip() != div:
                continue
            date_iso = parse_date(r.get("Date"))
            if date_iso and (date_iso < min_fixture_date or date_iso > max_fixture_date):
                continue

            h_name = (r.get("HomeTeam") or "").strip()
            a_name = (r.get("AwayTeam") or "").strip()
            h_idx = get_or_add_team(h_name)
            a_idx = get_or_add_team(a_name)

            time_str = (r.get("Time") or "").strip()

            # Latest pre-match 1X2 odds (prefer closing if available, else opening)
            o1x2_h = parse_num(r.get("B365CH")) or parse_num(r.get("B365H")) or parse_num(r.get("AvgCH")) or parse_num(r.get("AvgH"))
            o1x2_d = parse_num(r.get("B365CD")) or parse_num(r.get("B365D")) or parse_num(r.get("AvgCD")) or parse_num(r.get("AvgD"))
            o1x2_a = parse_num(r.get("B365CA")) or parse_num(r.get("B365A")) or parse_num(r.get("AvgCA")) or parse_num(r.get("AvgA"))

            # Latest pre-match O/U 2.5 odds
            ou_o = parse_num(r.get("B365C>2.5")) or parse_num(r.get("B365>2.5")) or parse_num(r.get("AvgC>2.5")) or parse_num(r.get("Avg>2.5"))
            ou_u = parse_num(r.get("B365C<2.5")) or parse_num(r.get("B365<2.5")) or parse_num(r.get("AvgC<2.5")) or parse_num(r.get("Avg<2.5"))

            # Latest pre-match Asian handicap
            ah_line = parse_num(r.get("AHCh")) if r.get("AHCh") is not None and str(r.get("AHCh")).strip() != "" else (
                parse_num(r.get("AHh")) if r.get("AHh") is not None and str(r.get("AHh")).strip() != "" else (
                    parse_num(r.get("AvgAHCh")) or parse_num(r.get("AvgAHh"))
                )
            )
            ah_h = parse_num(r.get("B365CAHH")) or parse_num(r.get("B365AHH")) or parse_num(r.get("AvgCAHH")) or parse_num(r.get("AvgAHH"))
            ah_a = parse_num(r.get("B365CAHA")) or parse_num(r.get("B365AHA")) or parse_num(r.get("AvgCAHA")) or parse_num(r.get("AvgAHA"))

            fix_row = [
                date_iso, time_str, h_idx, a_idx,
                o1x2_h, o1x2_d, o1x2_a,
                2.5, ou_o, ou_u,
                ah_line, ah_h, ah_a
            ]
            league_fixtures.append(fix_row)

        league_fixtures.sort(key=lambda f: (f[0], f[1]))

        current_team_ids = [t["id"] for t in teams_list if t["current"]]

        league_data[div] = {
            "id": div,
            "key": lg["key"],
            "name": lg["name"],
            "fullName": lg["fullName"],
            "teams": teams_list,
            "currentTeams": current_team_ids,
            "matches": matches_list,
            "fixtures": league_fixtures
        }

    max_match_date = max(all_dates) if all_dates else "2026-10-21"
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    print("[build_data] Running v4 live data pipeline (Macau Slot + Consensus + Track Record)...")
    v4_data = run_pipeline()

    macau_fixtures = v4_data.get("macauFixtures", [])
    out_file = os.path.join(DATA_DIR, "data.js")

    # Safeguard (P1-7): On error, preserve last known good fixtures if current is empty
    if not macau_fixtures and os.path.exists(out_file):
        try:
            import re
            with open(out_file, "r", encoding="utf-8") as fp:
                prev_content = fp.read()
            m = re.search(r"const\s+ODDS_DATA\s*=\s*(\{.*?\});\s*(?:if|$)", prev_content, re.DOTALL)
            if m:
                prev_data = json.loads(m.group(1))
                macau_fixtures = prev_data.get("macauFixtures", [])
                print(f"[build_data] Preserved {len(macau_fixtures)} fixtures from previous data.js.")
        except Exception as e:
            print(f"[build_data] Warning: Could not preserve previous fixtures: {e}")

    output = {
        "generatedAt": now_str,
        "dataThrough": max_match_date,
        "health": v4_data.get("health", {}),
        "sourcesStatus": v4_data.get("sourcesStatus", {}),
        "macauFixtures": macau_fixtures,
        "trackRecord": v4_data.get("trackRecord", {}),
        "matchSchema": MATCH_SCHEMA,
        "fixtureSchema": FIXTURE_SCHEMA,
        "leagues": league_data
    }
    json_str = json.dumps(output, ensure_ascii=False, separators=(',', ':'))
    with open(out_file, "w", encoding="utf-8") as fp:
        fp.write("/* 盤口實驗室 ODDS_DATA */\n")
        fp.write(f"const ODDS_DATA = {json_str};\n")
        fp.write("if (typeof window !== 'undefined') { window.ODDS_DATA = ODDS_DATA; }\n")
        fp.write("if (typeof module !== 'undefined' && module.exports) { module.exports = ODDS_DATA; }\n")

    size_kb = os.path.getsize(out_file) / 1024
    print(f"Successfully generated {out_file} ({size_kb:.1f} KB)")
    for div, ldata in league_data.items():
        print(f"  {div} ({ldata['name']}): {len(ldata['teams'])} teams ({len(ldata['currentTeams'])} current), {len(ldata['matches'])} matches, {len(ldata['fixtures'])} fixtures")

if __name__ == "__main__":
    build()
