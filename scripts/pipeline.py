#!/usr/bin/env python3
"""
pipeline.py - Orchestrates the entire Odds Lab v4 data pipeline:
1. Fetches or loads Macau Slot live data (next 3 days, top 5 + UEFA cups)
2. Fetches or loads The Odds API data (guarded daily run, 500/mo budget)
3. Loads football-data historical matches & fixtures
4. Fits Dixon-Coles model on top-5 leagues
5. Cross-source matches fixtures with normalized team names
6. Calculates consensus (Pinnacle-weighted, median)
7. Converts totals lines via Poisson expected goals solver
8. Blends consensus (0.7) with Dixon-Coles model (0.3)
9. Classifies every Macau Slot market (1X2, Asian handicap, Over/Under) with EV% and Cantonese badges
10. Builds bookmaker discrepancy matrix and best price highlights
11. Records and updates snapshots in data/snapshots/
12. Updates track record in data/track_record.json
13. Performs schema validation and writes health status to data/health.json
14. Produces rich data/data.js
"""

import csv
import json
import math
import os
import sys
from datetime import datetime, timezone, timedelta

# Import helper modules
from team_names import TEAM_NAMES, get_team_cantonese, teams_match, normalize_team_name
from fetch_macau import fetch_macau_data, COMPETITION_MAP
from fetch_odds_api import fetch_odds_api
from math_engine import (
    remove_margin_multiplicative, remove_margin_power,
    solve_poisson_lambda_for_ou25, convert_ou_line_probs,
    calc_ou_expected_return, settle_ah_single, settle_ou_single,
    blend_probabilities, classify_ev, calc_kelly_stake
)
from snapshots_tracker import save_snapshot, load_snapshots_history
from record_tracker import update_track_record, load_track_record

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
DATA_DIR = os.path.join(ROOT_DIR, "data")
RAW_DIR = os.path.join(ROOT_DIR, "raw")

LEAGUES_TOP5 = [
    {"id": "E0", "key": "epl", "name": "英超", "fullName": "英格蘭超級聯賽"},
    {"id": "SP1", "key": "laliga", "name": "西甲", "fullName": "西班牙甲組聯賽"},
    {"id": "I1", "key": "seriea", "name": "意甲", "fullName": "意大利甲組聯賽"},
    {"id": "D1", "key": "bundesliga", "name": "德甲", "fullName": "德國甲組聯賽"},
    {"id": "F1", "key": "ligue1", "name": "法甲", "fullName": "法國甲組聯賽"},
]

def format_day_label(date_str, now_macau=None):
    """
    Formats a YYYY-MM-DD date into Cantonese day label:
    e.g. 今日 10月25日 (日), 聽日 10月26日 (一), 後日 10月27日 (二)
    """
    if now_macau is None:
        now_macau = datetime.now(timezone(timedelta(hours=8))).date()
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        return date_str

    diff = (dt - now_macau).days
    weekdays_zh = ["一", "二", "三", "四", "五", "六", "日"]
    wd_str = weekdays_zh[dt.weekday()]

    if diff == 0:
        prefix = "今日"
    elif diff == 1:
        prefix = "聽日"
    elif diff == 2:
        prefix = "後日"
    elif diff < 0:
        prefix = "早前"
    else:
        prefix = f"{diff}日後"

    return f"{prefix} {dt.month}月{dt.day}日 (星期{wd_str})"

def fit_dixon_coles_python(matches_list, teams_list, as_of_ts, half_life_days=180):
    """
    Fast Poisson / Dixon-Coles model fitting in Python for a league.
    Returns: attack alpha dict, defense beta dict, home advantage gamma
    """
    team_ids = [t["id"] for t in teams_list]
    if not team_ids or not matches_list:
        return {}, {}, 0.25

    lambda_decay = math.log(2.0) / (half_life_days * 86400.0)
    alpha = {t: 0.0 for t in team_ids}
    beta = {t: 0.0 for t in team_ids}
    gamma = 0.25

    # Filter matches before as_of_ts
    valid_matches = []
    for m in matches_list:
        # m: [date, h_idx, a_idx, fthg, ftag, ...]
        try:
            m_dt = datetime.strptime(m[0], "%Y-%m-%d").replace(tzinfo=timezone.utc)
            m_ts = m_dt.timestamp()
            if m_ts < as_of_ts:
                valid_matches.append((m[1], m[2], m[3], m[4], m_ts))
        except Exception:
            continue

    if not valid_matches:
        return alpha, beta, gamma

    for _ in range(15):
        goals_for = {t: 0.0 for t in team_ids}
        exp_for = {t: 0.001 for t in team_ids}
        goals_against = {t: 0.0 for t in team_ids}
        exp_against = {t: 0.001 for t in team_ids}

        for h, a, fthg, ftag, mts in valid_matches:
            if h not in alpha or a not in alpha:
                continue
            dt = max(0.0, as_of_ts - mts)
            w = math.exp(-lambda_decay * dt)
            lh = math.exp(alpha[h] - beta[a] + gamma)
            la = math.exp(alpha[a] - beta[h])
            goals_for[h] += w * fthg
            exp_for[h] += w * lh
            goals_against[h] += w * ftag
            exp_against[h] += w * la
            goals_for[a] += w * ftag
            exp_for[a] += w * la
            goals_against[a] += w * fthg
            exp_against[a] += w * lh

        for t in team_ids:
            alpha[t] += 0.5 * math.log(max(0.05, goals_for[t]) / max(0.05, exp_for[t]))
            beta[t] -= 0.5 * math.log(max(0.05, goals_against[t]) / max(0.05, exp_against[t]))

        mean_alpha = sum(alpha.values()) / len(team_ids)
        for t in team_ids:
            alpha[t] -= mean_alpha

    return alpha, beta, gamma

def calc_dc_matrix(lh, la, rho=-0.05, max_goals=10):
    """Generates 11x11 score matrix with low-score tau correction and normalizes to 1.0."""
    lh = max(0.05, lh)
    la = max(0.05, la)
    pH = [(math.exp(-lh) * (lh ** i)) / math.factorial(i) for i in range(max_goals + 1)]
    pA = [(math.exp(-la) * (la ** i)) / math.factorial(i) for i in range(max_goals + 1)]

    matrix = []
    tot = 0.0
    for h in range(max_goals + 1):
        row = []
        for a in range(max_goals + 1):
            tau = 1.0
            if h == 0 and a == 0:
                tau = 1.0 - lh * la * rho
            elif h == 0 and a == 1:
                tau = 1.0 + lh * rho
            elif h == 1 and a == 0:
                tau = 1.0 + la * rho
            elif h == 1 and a == 1:
                tau = 1.0 - rho
            val = max(0.0, tau) * pH[h] * pA[a]
            row.append(val)
            tot += val
        matrix.append(row)

    if tot > 0:
        for h in range(max_goals + 1):
            for a in range(max_goals + 1):
                matrix[h][a] /= tot
    return matrix

def derive_probs_from_matrix(matrix):
    """Derives 1X2, Over 2.5, and Expected Goals from matrix."""
    max_goals = len(matrix) - 1
    p_h = 0.0
    p_d = 0.0
    p_a = 0.0
    p_o25 = 0.0
    xg_h = 0.0
    xg_a = 0.0

    for h in range(max_goals + 1):
        for a in range(max_goals + 1):
            p = matrix[h][a]
            xg_h += h * p
            xg_a += a * p
            if h > a:
                p_h += p
            elif h == a:
                p_d += p
            else:
                p_a += p
            if h + a > 2.5:
                p_o25 += p

    return {
        "p_h": p_h, "p_d": p_d, "p_a": p_a,
        "p_o25": p_o25, "p_u25": 1.0 - p_o25,
        "xg_h": round(xg_h, 2), "xg_a": round(xg_a, 2)
    }

def derive_ah_fair_from_matrix(matrix, line):
    """Computes fair prices for Asian handicap at line from matrix."""
    max_goals = len(matrix) - 1
    p_win = 0.0
    p_hw = 0.0
    p_push = 0.0
    p_hl = 0.0
    p_loss = 0.0

    for h in range(max_goals + 1):
        for a in range(max_goals + 1):
            prob = matrix[h][a]
            mult = settle_ah_single(h - a, line, 2.0)
            if mult == 2.0:
                p_win += prob
            elif mult == 1.5:
                p_hw += prob
            elif mult == 1.0:
                p_push += prob
            elif mult == 0.5:
                p_hl += prob
            else:
                p_loss += prob

    home_w = p_win + 0.5 * p_hw
    home_r = 0.5 * p_hw + p_push + 0.5 * p_hl
    fair_h = (1.0 - home_r) / home_w if home_w > 0.001 else 99.0

    away_w = p_loss + 0.5 * p_hl
    away_r = 0.5 * p_hl + p_push + 0.5 * p_hw
    fair_a = (1.0 - away_r) / away_w if away_w > 0.001 else 99.0

    return {
        "line": line,
        "fair_h": round(fair_h, 2),
        "fair_a": round(fair_a, 2),
        "p_win": p_win,
        "p_hw": p_hw,
        "p_push": p_push,
        "p_hl": p_hl,
        "p_loss": p_loss
    }

def run_pipeline(force_odds_api=False):
    """Main execution method for Odds Lab v4 pipeline."""
    now_utc = datetime.now(timezone.utc)
    now_macau = datetime.now(timezone(timedelta(hours=8)))
    now_iso_utc = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")

    health_status = {
        "status": "healthy",
        "checked_at": now_iso_utc,
        "issues": [],
        "sources": {}
    }

    # Step 1: Fetch Macau Slot Data
    print("[Pipeline] 1/7 Fetching live Macau Slot coming events & markets...")
    macau_result = {"events": []}
    try:
        macau_result = fetch_macau_data(sample_save_dir=os.path.join(DATA_DIR, "raw_samples"))
        health_status["sources"]["macau_slot"] = {
            "status": "healthy",
            "last_fetch": now_iso_utc,
            "events_count": len(macau_result.get("events", [])),
            "message": f"Fetched {len(macau_result.get('events', []))} events"
        }
    except Exception as e:
        print(f"[Pipeline] ERROR in Macau Slot fetch: {e}", file=sys.stderr)
        health_status["status"] = "warning"
        health_status["issues"].append(f"Macau Slot fetch failure: {e}")
        health_status["sources"]["macau_slot"] = {
            "status": "error",
            "last_fetch": now_iso_utc,
            "events_count": 0,
            "message": str(e)
        }
        # Fallback to cached sample if available
        sample_file = os.path.join(DATA_DIR, "raw_samples", "macau_sample.json")
        if os.path.exists(sample_file):
            try:
                with open(sample_file, "r", encoding="utf-8") as f:
                    cached = json.load(f)
                    macau_result = {"events": cached.get("target_events", [])}
            except Exception:
                pass

    # Step 2: Fetch The Odds API Data (Guarded)
    print("[Pipeline] 2/7 Querying The Odds API (daily guard)...")
    odds_api_res = fetch_odds_api(data_dir=DATA_DIR, force=force_odds_api)
    api_matches = odds_api_res.get("matches", [])
    api_state = odds_api_res.get("state", {})
    health_status["sources"]["the_odds_api"] = {
        "status": "healthy" if api_state.get("status") in ("success", "skipped") else "warning",
        "last_fetch": api_state.get("last_run_timestamp", now_iso_utc),
        "requests_remaining": api_state.get("requests_remaining"),
        "requests_used": api_state.get("requests_used"),
        "events_count": len(api_matches),
        "message": api_state.get("message", "")
    }

    # Step 3: Load historical match data & fit Dixon-Coles models for Top 5 leagues
    print("[Pipeline] 3/7 Loading historical data and fitting Dixon-Coles models...")
    dc_models = {}
    league_teams_map = {}
    finished_matches_for_tracker = {}

    for lg in LEAGUES_TOP5:
        div = lg["id"]
        matches_list = []
        teams_map = {}
        teams_list = []

        # Load 2526 and 2627
        for season in ["2526", "2627"]:
            csv_path = os.path.join(RAW_DIR, f"{div}_{season}.csv")
            if not os.path.exists(csv_path):
                continue
            with open(csv_path, "r", encoding="utf-8-sig", errors="replace") as fp:
                reader = csv.DictReader(fp)
                for r in reader:
                    h = (r.get("HomeTeam") or "").strip()
                    a = (r.get("AwayTeam") or "").strip()
                    if not h or not a:
                        continue
                    try:
                        fthg = int(r.get("FTHG", 0))
                        ftag = int(r.get("FTAG", 0))
                    except (ValueError, TypeError):
                        continue

                    # Register team
                    for t_name in (h, a):
                        if t_name not in teams_map:
                            t_idx = len(teams_list)
                            teams_map[t_name] = t_idx
                            teams_list.append({"id": t_idx, "name": t_name})

                    h_idx = teams_map[h]
                    a_idx = teams_map[a]

                    # Parse date
                    date_raw = r.get("Date", "")
                    parts = date_raw.split("/")
                    date_iso = f"{int(parts[2]):04d}-{int(parts[1]):02d}-{int(parts[0]):02d}" if len(parts) == 3 else date_raw

                    matches_list.append([date_iso, h_idx, a_idx, fthg, ftag])
                    finished_matches_for_tracker[(h, a)] = (fthg, ftag)

        league_teams_map[div] = (teams_map, teams_list)
        as_of_ts = now_utc.timestamp()
        alpha, beta, gamma = fit_dixon_coles_python(matches_list, teams_list, as_of_ts)
        dc_models[div] = {
            "alpha": alpha,
            "beta": beta,
            "gamma": gamma,
            "teams_map": teams_map
        }

    health_status["sources"]["football_data"] = {
        "status": "healthy",
        "finished_matches_count": len(finished_matches_for_tracker)
    }

    # Step 4: Cross-source match mapping & Consensus generation
    print("[Pipeline] 4/7 Cross-source matching and calculating consensus...")
    macau_events = macau_result.get("events", [])
    processed_fixtures = []
    unmatched_events = []
    all_value_bets = []

    # Load snapshot history for sparklines
    snapshot_histories = load_snapshots_history(base_data_dir=DATA_DIR)

    for mev in macau_events:
        m_dt = datetime.fromisoformat(mev["kickoff_iso"])
        m_ts = m_dt.timestamp()
        h_m = mev["home_en"]
        a_m = mev["away_en"]
        lg_code = mev["league_code"]
        ev_id = mev["ev_id"]

        match_key = f"{lg_code}_{h_m}_{a_m}"

        # Match against The Odds API
        found_odds_match = None
        for om in api_matches:
            try:
                o_dt = datetime.fromisoformat(om["commence_time"].replace("Z", "+00:00"))
                o_ts = o_dt.timestamp()
                if abs(m_ts - o_ts) <= 3 * 3600:
                    if teams_match(h_m, om["home_team"]) and teams_match(a_m, om["away_team"]):
                        found_odds_match = om
                        break
            except Exception:
                continue

        # Bookmaker Odds aggregation & Consensus
        books_list = []
        pinnacle_book = None
        all_1x2_probs = {"h": [], "d": [], "a": []}
        all_ou25_probs = {"over": [], "under": []}

        if found_odds_match:
            for bm in found_odds_match.get("bookmakers", []):
                b_key = bm.get("key")
                b_title = bm.get("title")

                # Extract 1X2
                b_1x2 = None
                for mkt in bm.get("markets", []):
                    if mkt.get("key") == "h2h":
                        rates = {}
                        for oc in mkt.get("outcomes", []):
                            name = oc.get("name")
                            price = oc.get("price")
                            if price and price > 1.0:
                                if name == "Draw":
                                    rates["d"] = price
                                elif teams_match(h_m, name) or name == found_odds_match.get("home_team"):
                                    rates["h"] = price
                                elif teams_match(a_m, name) or name == found_odds_match.get("away_team"):
                                    rates["a"] = price
                        if "h" in rates and "d" in rates and "a" in rates:
                            devig_probs, margin = remove_margin_multiplicative([rates["h"], rates["d"], rates["a"]])
                            b_1x2 = {
                                "h": rates["h"], "d": rates["d"], "a": rates["a"],
                                "margin": round(margin * 100.0, 1),
                                "prob_h": devig_probs[0], "prob_d": devig_probs[1], "prob_a": devig_probs[2]
                            }
                            all_1x2_probs["h"].append(devig_probs[0])
                            all_1x2_probs["d"].append(devig_probs[1])
                            all_1x2_probs["a"].append(devig_probs[2])

                    elif mkt.get("key") == "totals":
                        rates = {}
                        for oc in mkt.get("outcomes", []):
                            name = oc.get("name")
                            point = oc.get("point")
                            price = oc.get("price")
                            if point == 2.5 and price and price > 1.0:
                                if name == "Over":
                                    rates["over"] = price
                                elif name == "Under":
                                    rates["under"] = price
                        if "over" in rates and "under" in rates:
                            devig_probs, margin = remove_margin_multiplicative([rates["over"], rates["under"]])
                            all_ou25_probs["over"].append(devig_probs[0])
                            all_ou25_probs["under"].append(devig_probs[1])

                if b_1x2:
                    book_entry = {
                        "key": b_key,
                        "title": b_title,
                        "1x2": b_1x2
                    }
                    books_list.append(book_entry)
                    if b_key == "pinnacle":
                        pinnacle_book = book_entry
        else:
            unmatched_events.append({
                "ev_id": ev_id,
                "kickoff": mev["start_time"],
                "league": lg_code,
                "home": h_m,
                "away": a_m
            })

        # Consensus 1X2 Probabilities (Pinnacle-weighted or median)
        if pinnacle_book and pinnacle_book.get("1x2"):
            # Heavy weight to Pinnacle
            pin_1x2 = pinnacle_book["1x2"]
            p_pin_h = pin_1x2["prob_h"]
            p_pin_d = pin_1x2["prob_d"]
            p_pin_a = pin_1x2["prob_a"]
            # Median of other books
            med_h = sorted(all_1x2_probs["h"])[len(all_1x2_probs["h"]) // 2] if all_1x2_probs["h"] else p_pin_h
            med_d = sorted(all_1x2_probs["d"])[len(all_1x2_probs["d"]) // 2] if all_1x2_probs["d"] else p_pin_d
            med_a = sorted(all_1x2_probs["a"])[len(all_1x2_probs["a"]) // 2] if all_1x2_probs["a"] else p_pin_a
            raw_c_h = 0.6 * p_pin_h + 0.4 * med_h
            raw_c_d = 0.6 * p_pin_d + 0.4 * med_d
            raw_c_a = 0.6 * p_pin_a + 0.4 * med_a
        elif all_1x2_probs["h"]:
            raw_c_h = sorted(all_1x2_probs["h"])[len(all_1x2_probs["h"]) // 2]
            raw_c_d = sorted(all_1x2_probs["d"])[len(all_1x2_probs["d"]) // 2]
            raw_c_a = sorted(all_1x2_probs["a"])[len(all_1x2_probs["a"]) // 2]
        elif mev.get("odds_1x2"):
            # Fallback to Macau Slot de-vigged
            m1x2 = mev["odds_1x2"]
            dev, _ = remove_margin_multiplicative([m1x2["h"], m1x2["d"], m1x2["a"]])
            raw_c_h, raw_c_d, raw_c_a = dev[0], dev[1], dev[2]
        else:
            raw_c_h, raw_c_d, raw_c_a = 0.38, 0.28, 0.34

        tot_c = raw_c_h + raw_c_d + raw_c_a
        cons_p_h = raw_c_h / tot_c
        cons_p_d = raw_c_d / tot_c
        cons_p_a = raw_c_a / tot_c

        # Consensus Over 2.5
        if all_ou25_probs["over"]:
            cons_p_o25 = sorted(all_ou25_probs["over"])[len(all_ou25_probs["over"]) // 2]
        elif mev.get("main_ou"):
            # Estimate from Macau OU line
            m_ou = mev["main_ou"]
            line = m_ou["line"]
            dev, _ = remove_margin_multiplicative([m_ou["over"], m_ou["under"]])
            cons_p_o25 = dev[0] if abs(line - 2.5) < 0.1 else 0.50
        else:
            cons_p_o25 = 0.50
        cons_p_u25 = 1.0 - cons_p_o25

        # Dixon-Coles pre-match probabilities for top-5 league
        dc_probs = None
        dc_matrix = None
        if lg_code in dc_models:
            model = dc_models[lg_code]
            t_map = model["teams_map"]
            alpha = model["alpha"]
            beta = model["beta"]
            gamma = model["gamma"]

            # Lookup team IDs
            h_id = None
            a_id = None
            for name, tid in t_map.items():
                if teams_match(h_m, name):
                    h_id = tid
                if teams_match(a_m, name):
                    a_id = tid

            if h_id is not None and a_id is not None:
                lh = math.exp(alpha.get(h_id, 0.0) - beta.get(a_id, 0.0) + gamma)
                la = math.exp(alpha.get(a_id, 0.0) - beta.get(h_id, 0.0))
                dc_matrix = calc_dc_matrix(lh, la)
                dc_probs = derive_probs_from_matrix(dc_matrix)

        # Blend Consensus (0.7) with Dixon-Coles (0.3)
        if dc_probs:
            blended_1x2 = blend_probabilities(
                [cons_p_h, cons_p_d, cons_p_a],
                [dc_probs["p_h"], dc_probs["p_d"], dc_probs["p_a"]],
                weight_consensus=0.7
            )
            fair_p_h, fair_p_d, fair_p_a = blended_1x2[0], blended_1x2[1], blended_1x2[2]
            fair_p_o25 = 0.7 * cons_p_o25 + 0.3 * dc_probs["p_o25"]
            xg_home = dc_probs["xg_h"]
            xg_away = dc_probs["xg_a"]
        else:
            fair_p_h, fair_p_d, fair_p_a = cons_p_h, cons_p_d, cons_p_a
            fair_p_o25 = cons_p_o25
            xg_home = round(1.2 + 0.6 * (fair_p_h - fair_p_a), 2)
            xg_away = round(1.0 - 0.5 * (fair_p_h - fair_p_a), 2)

        fair_p_u25 = 1.0 - fair_p_o25
        fair_odds_h = round(1.0 / fair_p_h, 2)
        fair_odds_d = round(1.0 / fair_p_d, 2)
        fair_odds_a = round(1.0 / fair_p_a, 2)

        # Step 5: Classify Macau Slot Markets
        # 1X2 Classification
        macau_1x2_classified = None
        match_opportunities = []

        if mev.get("odds_1x2"):
            m_h = mev["odds_1x2"]["h"]
            m_d = mev["odds_1x2"]["d"]
            m_a = mev["odds_1x2"]["a"]

            ev_h = (fair_p_h * m_h) - 1.0
            ev_d = (fair_p_d * m_d) - 1.0
            ev_a = (fair_p_a * m_a) - 1.0

            best_1x2_ev = max(ev_h, ev_d, ev_a)
            best_sel = "H" if best_1x2_ev == ev_h else ("D" if best_1x2_ev == ev_d else "A")
            sel_name = f"主勝 ({mev['home_zh']})" if best_sel == "H" else ("和局" if best_sel == "D" else f"客勝 ({mev['away_zh']})")
            sel_odds = m_h if best_sel == "H" else (m_d if best_sel == "D" else m_a)
            sel_fair = fair_odds_h if best_sel == "H" else (fair_odds_d if best_sel == "D" else fair_odds_a)
            sel_p = fair_p_h if best_sel == "H" else (fair_p_d if best_sel == "D" else fair_p_a)

            k_frac, k_units = calc_kelly_stake(sel_p, sel_odds)

            macau_1x2_classified = {
                "h": m_h, "d": m_d, "a": m_a,
                "margin": mev["odds_1x2"]["margin"],
                "fair_h": fair_odds_h, "fair_d": fair_odds_d, "fair_a": fair_odds_a,
                "ev_h": round(ev_h * 100.0, 1),
                "ev_d": round(ev_d * 100.0, 1),
                "ev_a": round(ev_a * 100.0, 1),
                "best_sel": best_sel,
                "max_ev": round(best_1x2_ev * 100.0, 1),
                "badge": classify_ev(best_1x2_ev)
            }

            match_opportunities.append({
                "market": "1X2",
                "market_name": "主客和",
                "selection": best_sel,
                "selection_name": sel_name,
                "line": None,
                "macau_odds": sel_odds,
                "fair_odds": sel_fair,
                "ev": round(best_1x2_ev, 4),
                "badge": classify_ev(best_1x2_ev),
                "kelly": {"fraction_pct": k_frac, "stake_units": k_units}
            })

        # Asian Handicap Classification
        macau_ah_classified = None
        if mev.get("main_ah"):
            mah = mev["main_ah"]
            line = mah["line"]
            m_ah_h = mah["h"]
            m_ah_a = mah["a"]

            # Calculate fair AH price and expected returns
            if dc_matrix:
                ah_stat = derive_ah_fair_from_matrix(dc_matrix, line)
                fair_ah_h = ah_stat["fair_h"]
                fair_ah_a = ah_stat["fair_a"]
                er_h = ah_stat["p_win"] * m_ah_h + ah_stat["p_hw"] * (1.0 + (m_ah_h - 1.0) / 2.0) + ah_stat["p_push"] * 1.0 + ah_stat["p_hl"] * 0.5
                er_a = ah_stat["p_loss"] * m_ah_a + ah_stat["p_hl"] * (1.0 + (m_ah_a - 1.0) / 2.0) + ah_stat["p_push"] * 1.0 + ah_stat["p_hw"] * 0.5
                ev_ah_h = er_h - 1.0
                ev_ah_a = er_a - 1.0
                win_rate_h = ah_stat["p_win"] + 0.5 * ah_stat["p_hw"]
                win_rate_a = ah_stat["p_loss"] + 0.5 * ah_stat["p_hl"]
            else:
                fair_ah_h = 1.95
                fair_ah_a = 1.95
                ev_ah_h = (m_ah_h / 1.95) - 1.0
                ev_ah_a = (m_ah_a / 1.95) - 1.0
                win_rate_h = 0.50
                win_rate_a = 0.50

            best_ah_ev = max(ev_ah_h, ev_ah_a)
            best_ah_sel = "H" if best_ah_ev == ev_ah_h else "A"
            best_ah_name = f"上盤 ({mev['home_zh']} {mah['hcap_disp']})" if best_ah_sel == "H" else f"下盤 ({mev['away_zh']})"
            sel_ah_odds = m_ah_h if best_ah_sel == "H" else m_ah_a
            sel_ah_fair = fair_ah_h if best_ah_sel == "H" else fair_ah_a
            sel_ah_p = win_rate_h if best_ah_sel == "H" else win_rate_a

            k_frac, k_units = calc_kelly_stake(sel_ah_p, sel_ah_odds)

            macau_ah_classified = {
                "line": line,
                "hcap_disp": mah["hcap_disp"],
                "h": m_ah_h, "a": m_ah_a,
                "margin": mah["margin"],
                "fair_h": fair_ah_h, "fair_a": fair_ah_a,
                "ev_h": round(ev_ah_h * 100.0, 1),
                "ev_a": round(ev_ah_a * 100.0, 1),
                "best_sel": best_ah_sel,
                "max_ev": round(best_ah_ev * 100.0, 1),
                "badge": classify_ev(best_ah_ev)
            }

            match_opportunities.append({
                "market": "AH",
                "market_name": "讓球",
                "selection": best_ah_sel,
                "selection_name": best_ah_name,
                "line": line,
                "macau_odds": sel_ah_odds,
                "fair_odds": sel_ah_fair,
                "ev": round(best_ah_ev, 4),
                "badge": classify_ev(best_ah_ev),
                "kelly": {"fraction_pct": k_frac, "stake_units": k_units}
            })

        # Over/Under Classification at Macau's exact line
        macau_ou_classified = None
        if mev.get("main_ou"):
            mou = mev["main_ou"]
            line = mou["line"]
            m_ou_o = mou["over"]
            m_ou_u = mou["under"]

            ou_line_probs = convert_ou_line_probs(fair_p_o25, line)
            er_o = calc_ou_expected_return(ou_line_probs, line, m_ou_o, is_over=True)
            er_u = calc_ou_expected_return(ou_line_probs, line, m_ou_u, is_over=False)

            ev_ou_o = er_o - 1.0
            ev_ou_u = er_u - 1.0

            # Estimate fair prices
            fair_ou_o = round(m_ou_o / er_o, 2) if er_o > 0.05 else 99.0
            fair_ou_u = round(m_ou_u / er_u, 2) if er_u > 0.05 else 99.0

            best_ou_ev = max(ev_ou_o, ev_ou_u)
            best_ou_sel = "Over" if best_ou_ev == ev_ou_o else "Under"
            best_ou_name = f"大波 (>{mou['hcap_disp']})" if best_ou_sel == "Over" else f"細波 (<{mou['hcap_disp']})"
            sel_ou_odds = m_ou_o if best_ou_sel == "Over" else m_ou_u
            sel_ou_fair = fair_ou_o if best_ou_sel == "Over" else fair_ou_u

            k_frac, k_units = calc_kelly_stake(0.50 + 0.5 * best_ou_ev, sel_ou_odds)

            macau_ou_classified = {
                "line": line,
                "hcap_disp": mou["hcap_disp"],
                "over": m_ou_o, "under": m_ou_u,
                "margin": mou["margin"],
                "fair_o": fair_ou_o, "fair_u": fair_ou_u,
                "ev_o": round(ev_ou_o * 100.0, 1),
                "ev_u": round(ev_ou_u * 100.0, 1),
                "best_sel": best_ou_sel,
                "max_ev": round(best_ou_ev * 100.0, 1),
                "badge": classify_ev(best_ou_ev)
            }

            match_opportunities.append({
                "market": "OU",
                "market_name": "大細",
                "selection": best_ou_sel,
                "selection_name": best_ou_name,
                "line": line,
                "macau_odds": sel_ou_odds,
                "fair_odds": sel_ou_fair,
                "ev": round(best_ou_ev, 4),
                "badge": classify_ev(best_ou_ev),
                "kelly": {"fraction_pct": k_frac, "stake_units": k_units}
            })

        # Overall Best Opportunity for this match card
        best_opp = None
        if match_opportunities:
            match_opportunities.sort(key=lambda o: o["ev"], reverse=True)
            best_opp = match_opportunities[0]
            # If positive EV > +3%, mark for track record
            for opp in match_opportunities:
                if opp["ev"] > 0.03:
                    all_value_bets.append({
                        "id": f"{mev['start_time'][:10]}_{lg_code}_{h_m[:4]}_{a_m[:4]}_{opp['market']}_{opp['selection']}",
                        "league": lg_code,
                        "league_name": mev["league_zh"],
                        "home": h_m,
                        "away": a_m,
                        "home_zh": mev["home_zh"],
                        "away_zh": mev["away_zh"],
                        "kickoff": mev["start_time"],
                        "market": opp["market"],
                        "market_name": opp["market_name"],
                        "selection": opp["selection"],
                        "selection_name": opp["selection_name"],
                        "line": opp.get("line"),
                        "macau_odds": opp["macau_odds"],
                        "fair_odds": opp["fair_odds"],
                        "ev": opp["ev"]
                    })

        # Bookmaker Discrepancy & Best Price across market
        discrepancies = []
        outliers = []
        best_market_prices = {"h": (m_h if mev.get("odds_1x2") else 1.0, "Macau Slot"), "d": (1.0, "Macau Slot"), "a": (1.0, "Macau Slot")}

        for b in books_list:
            b1 = b.get("1x2", {})
            for sel, price, fair in [("h", b1.get("h"), fair_odds_h), ("d", b1.get("d"), fair_odds_d), ("a", b1.get("a"), fair_odds_a)]:
                if price:
                    if price > best_market_prices[sel][0]:
                        best_market_prices[sel] = (price, b["title"])
                    disc = (price / fair) - 1.0
                    if disc > 0.04:  # 4% above consensus
                        outliers.append({
                            "book": b["title"],
                            "selection": sel.upper(),
                            "odds": price,
                            "discrepancy_pct": round(disc * 100.0, 1)
                        })

        fixture_obj = {
            "id": ev_id,
            "matchKey": match_key,
            "date": mev["start_time"][:10],
            "time": mev["start_time"][11:16],
            "kickoffIso": mev["kickoff_iso"],
            "dayLabel": format_day_label(mev["start_time"][:10], now_macau.date()),
            "league": lg_code,
            "leagueName": mev["league_zh"],
            "leagueEn": mev["league_en"],
            "home": h_m,
            "away": a_m,
            "homeZh": mev["home_zh"],
            "awayZh": mev["away_zh"],
            "xg": {"home": xg_home, "away": xg_away},
            "macau": {
                "odds_1x2": macau_1x2_classified,
                "main_ah": macau_ah_classified,
                "all_ah": mev.get("all_ah", []),
                "main_ou": macau_ou_classified,
                "all_ou": mev.get("all_ou", [])
            },
            "consensus": {
                "pinnaclePresent": pinnacle_book is not None,
                "booksCount": len(books_list),
                "fair_1x2": {"h": fair_odds_h, "d": fair_odds_d, "a": fair_odds_a},
                "prob_1x2": {"h": round(fair_p_h * 100.0, 1), "d": round(fair_p_d * 100.0, 1), "a": round(fair_p_a * 100.0, 1)},
                "prob_ou25": {"over": round(fair_p_o25 * 100.0, 1), "under": round(fair_p_u25 * 100.0, 1)}
            },
            "bestOpportunity": best_opp,
            "booksList": books_list[:8],  # Top 8 bookmakers for detail modal
            "outliers": outliers,
            "sparkline": snapshot_histories.get(match_key, [])
        }
        processed_fixtures.append(fixture_obj)

    # Sort fixtures by kickoff time
    processed_fixtures.sort(key=lambda f: f["kickoffIso"])

    # Step 6: Save snapshot and update track record
    print(f"[Pipeline] 5/7 Saving snapshot and updating track record ({len(all_value_bets)} value bets detected)...")
    save_snapshot(processed_fixtures, base_data_dir=DATA_DIR)
    track_record = update_track_record(all_value_bets, finished_matches=finished_matches_for_tracker, filepath=os.path.join(DATA_DIR, "track_record.json"))

    # Log unmatched matches
    unmatched_file = os.path.join(DATA_DIR, "unmatched.json")
    with open(unmatched_file, "w", encoding="utf-8") as f:
        json.dump(unmatched_events, f, ensure_ascii=False, indent=2)

    # Step 7: Write health status
    health_file = os.path.join(DATA_DIR, "health.json")
    with open(health_file, "w", encoding="utf-8") as f:
        json.dump(health_status, f, ensure_ascii=False, indent=2)

    print(f"[Pipeline] 6/7 Health status: {health_status['status']} ({len(health_status['issues'])} issues)")

    return {
        "generatedAt": now_iso_utc,
        "health": health_status,
        "macauFixtures": processed_fixtures,
        "trackRecord": track_record,
        "sourcesStatus": health_status["sources"]
    }

if __name__ == "__main__":
    res = run_pipeline()
    print(f"[Pipeline] Completed! Processed {len(res['macauFixtures'])} live fixtures.")
