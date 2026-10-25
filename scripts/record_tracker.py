#!/usr/bin/env python3
"""
record_tracker.py - Tracks detected "值博" (positive EV) opportunities and settlements.
- Records every 值博 opportunity at first detection
- Tracks closing Macau price and closing consensus until kickoff
- Freezes closing price at kickoff and calculates Closing Line Value (CLV)
- Settles bets at 1u flat stake ONLY when the actual match fixture result (date matched) exists
- Settle Asian Handicap correctly for both Home and Away (sel == "A") perspectives
- Computes aggregate statistics: Total bets, Win rate, Total profit, ROI, Avg CLV (over settled bets)
"""

import json
import os
import sys
import re
from datetime import datetime, timezone, timedelta

# Ensure parent directory is in sys.path for math_engine and team_names
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)
for p in (CURRENT_DIR, PARENT_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)

from math_engine import settle_ah_single, settle_ou_single
from team_names import teams_match, get_team_cantonese

def parse_kickoff_to_utc(kickoff_str):
    """Parses kickoff string (either ISO or 'YYYY-MM-DD HH:MM:SS' GMT+8) to UTC datetime."""
    if not kickoff_str:
        return None
    try:
        s = str(kickoff_str).strip()
        if "T" in s:
            clean = s.replace("Z", "+00:00")
            return datetime.fromisoformat(clean).astimezone(timezone.utc)
        dt = datetime.strptime(s[:19], "%Y-%m-%d %H:%M:%S")
        # Macau local time is GMT+8
        return dt.replace(tzinfo=timezone(timedelta(hours=8))).astimezone(timezone.utc)
    except Exception:
        return None

def load_track_record(filepath="data/track_record.json"):
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as fp:
                return json.load(fp)
        except Exception:
            pass
    return {
        "summary": {
            "total_bets": 0,
            "settled_bets": 0,
            "pending_bets": 0,
            "won": 0,
            "half_won": 0,
            "pushed": 0,
            "half_lost": 0,
            "lost": 0,
            "hit_rate": 0.0,
            "total_staked": 0.0,
            "total_profit": 0.0,
            "roi": 0.0,
            "avg_clv": 0.0
        },
        "bets": []
    }

def save_track_record(record, filepath="data/track_record.json"):
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as fp:
        json.dump(record, fp, ensure_ascii=False, indent=2)

def update_track_record(value_bets, finished_matches=None, filepath="data/track_record.json", current_time_utc=None):
    """
    value_bets: list of dicts representing currently detected value bets
    finished_matches: list of dicts: [{"date": "YYYY-MM-DD", "home": str, "away": str, "fthg": int, "ftag": int}]
                      or dict: (date_str, home, away) -> (fthg, ftag)
    current_time_utc: datetime in UTC (defaults to datetime.now(timezone.utc))
    """
    record = load_track_record(filepath)
    existing_bets = {b["id"]: b for b in record.get("bets", [])}
    now_utc = current_time_utc or datetime.now(timezone.utc)
    now_utc_str = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")

    # 1. Ingest new value bets or update closing prices
    for vb in value_bets:
        bet_id = vb["id"]
        # Ensure Chinese team names are valid
        h_zh = vb.get("home_zh") or ""
        a_zh = vb.get("away_zh") or ""
        if not re.search(r"[\u4e00-\u9fff]", h_zh) or "?" in h_zh:
            h_zh = get_team_cantonese(vb.get("home", ""))
        if not re.search(r"[\u4e00-\u9fff]", a_zh) or "?" in a_zh:
            a_zh = get_team_cantonese(vb.get("away", ""))

        if bet_id not in existing_bets:
            existing_bets[bet_id] = {
                "id": bet_id,
                "first_detected_at": now_utc_str,
                "league": vb.get("league"),
                "league_name": vb.get("league_name"),
                "home": vb.get("home"),
                "away": vb.get("away"),
                "home_zh": h_zh,
                "away_zh": a_zh,
                "kickoff": vb.get("kickoff"),
                "market": vb.get("market"),
                "market_name": vb.get("market_name"),
                "selection": vb.get("selection"),
                "selection_name": vb.get("selection_name"),
                "line": vb.get("line"),
                "initial_macau_odds": vb.get("macau_odds"),
                "initial_fair_odds": vb.get("fair_odds"),
                "initial_ev": vb.get("ev"),
                "closing_macau_odds": vb.get("macau_odds"),
                "closing_consensus_fair": vb.get("fair_odds"),
                "clv": 0.0,
                "clv_macau": 0.0,
                "clv_consensus": 0.0,
                "closing_frozen": False,
                "status": "pending",
                "score": None,
                "outcome": None,
                "profit_1u": None
            }
        else:
            bet = existing_bets[bet_id]
            # Ensure CJK names are clean
            if not re.search(r"[\u4e00-\u9fff]", bet.get("home_zh", "")) or "?" in bet.get("home_zh", ""):
                bet["home_zh"] = h_zh
            if not re.search(r"[\u4e00-\u9fff]", bet.get("away_zh", "")) or "?" in bet.get("away_zh", ""):
                bet["away_zh"] = a_zh

            # Check if kickoff has passed
            k_dt = parse_kickoff_to_utc(bet.get("kickoff"))
            is_past_kickoff = (k_dt is not None and now_utc >= k_dt)

            if bet["status"] == "pending":
                if not bet.get("closing_frozen", False):
                    if not is_past_kickoff:
                        # Pre-kickoff: update closing odds to latest market prices
                        if vb.get("macau_odds"):
                            bet["closing_macau_odds"] = vb.get("macau_odds")
                        if vb.get("fair_odds"):
                            bet["closing_consensus_fair"] = vb.get("fair_odds")
                    else:
                        # Match has kicked off: freeze closing prices permanently
                        bet["closing_frozen"] = True

                # Compute CLV
                init_m = bet.get("initial_macau_odds")
                close_m = bet.get("closing_macau_odds")
                close_fair = bet.get("closing_consensus_fair")

                if init_m and close_m and close_m > 0:
                    clv_m = (init_m / close_m) - 1.0
                    bet["clv_macau"] = round(clv_m, 4)
                    bet["clv"] = round(clv_m, 4)
                if init_m and close_fair and close_fair > 0:
                    bet["clv_consensus"] = round((init_m / close_fair) - 1.0, 4)

    # 2. Settle finished matches
    if finished_matches:
        # Standardize finished_matches format into a list of objects
        fm_list = []
        if isinstance(finished_matches, dict):
            for k, val in finished_matches.items():
                if isinstance(k, tuple):
                    if len(k) == 3:
                        # (date, home, away)
                        fm_list.append({"date": k[0], "home": k[1], "away": k[2], "fthg": val[0], "ftag": val[1]})
                    elif len(k) == 2:
                        # (home, away) without date -> cannot safely settle future matches!
                        # only allowed if val contains date info
                        pass
        elif isinstance(finished_matches, list):
            fm_list = finished_matches

        for bet in existing_bets.values():
            # If bet was wrongly marked settled in the past with future kickoff, reset to pending!
            k_dt = parse_kickoff_to_utc(bet.get("kickoff"))
            if k_dt and now_utc < k_dt and bet.get("status") == "settled":
                bet["status"] = "pending"
                bet["score"] = None
                bet["outcome"] = None
                bet["profit_1u"] = None
                bet["closing_frozen"] = False

            if bet["status"] == "pending":
                # Kickoff check: strictly do not settle if kickoff hasn't occurred yet
                if k_dt and now_utc < k_dt:
                    continue

                bet["closing_frozen"] = True
                init_m = bet.get("initial_macau_odds")
                close_m = bet.get("closing_macau_odds")
                if init_m and close_m and close_m > 0:
                    bet["clv"] = round((init_m / close_m) - 1.0, 4)
                    bet["clv_macau"] = bet["clv"]

                # Determine bet's kickoff calendar date in UTC / local
                bet_date_str = k_dt.strftime("%Y-%m-%d") if k_dt else str(bet.get("kickoff", ""))[:10]

                # Find matching result that occurred on the same date (±1 day timezone tolerance)
                matched_match = None
                for fm in fm_list:
                    fm_date = fm.get("date")
                    if not fm_date:
                        continue
                    try:
                        dt_bet = datetime.fromisoformat(bet_date_str[:10])
                        dt_fm = datetime.fromisoformat(fm_date[:10])
                        if abs((dt_bet - dt_fm).days) > 1:
                            # Not the same matchday/date! Ignore historical matches from months/years ago.
                            continue
                    except Exception:
                        continue

                    if teams_match(bet["home"], fm["home"]) and teams_match(bet["away"], fm["away"]):
                        matched_match = fm
                        break

                if matched_match:
                    fthg = int(matched_match["fthg"])
                    ftag = int(matched_match["ftag"])
                    bet["score"] = f"{fthg}-{ftag}"
                    odds = bet["initial_macau_odds"]
                    mkt = bet["market"]
                    sel = bet["selection"]

                    if mkt == "1X2":
                        actual = "H" if fthg > ftag else ("D" if fthg == ftag else "A")
                        if sel == actual:
                            bet["outcome"] = "win"
                            bet["profit_1u"] = round(odds - 1.0, 3)
                        else:
                            bet["outcome"] = "loss"
                            bet["profit_1u"] = -1.0

                    elif mkt == "AH":
                        line = bet.get("line", 0.0)
                        if sel == "A":
                            # Away perspective: goal difference is (ftag - fthg), handicap line is -line
                            mult = settle_ah_single(ftag - fthg, -float(line), odds)
                        else:
                            # Home perspective: goal difference is (fthg - ftag), handicap line is line
                            mult = settle_ah_single(fthg - ftag, float(line), odds)

                        bet["profit_1u"] = round(mult - 1.0, 3)
                        if mult == odds:
                            bet["outcome"] = "win"
                        elif mult > 1.0:
                            bet["outcome"] = "half_win"
                        elif mult == 1.0:
                            bet["outcome"] = "push"
                        elif mult == 0.5:
                            bet["outcome"] = "half_loss"
                        else:
                            bet["outcome"] = "loss"

                    elif mkt == "OU":
                        line = bet.get("line", 2.5)
                        tot_goals = fthg + ftag
                        is_over = (sel == "Over")
                        mult = settle_ou_single(tot_goals, line, odds, is_over)
                        bet["profit_1u"] = round(mult - 1.0, 3)
                        if mult == odds:
                            bet["outcome"] = "win"
                        elif mult > 1.0:
                            bet["outcome"] = "half_win"
                        elif mult == 1.0:
                            bet["outcome"] = "push"
                        elif mult == 0.5:
                            bet["outcome"] = "half_loss"
                        else:
                            bet["outcome"] = "loss"

                    bet["status"] = "settled"

    # 3. Recalculate summary metrics
    bets_list = list(existing_bets.values())
    # Sort: pending first, then by kickoff desc
    bets_list.sort(key=lambda b: (0 if b["status"] == "pending" else 1, b.get("kickoff", "")), reverse=True)

    settled = [b for b in bets_list if b["status"] == "settled"]
    pending = [b for b in bets_list if b["status"] == "pending"]

    won = sum(1 for b in settled if b.get("outcome") == "win")
    half_won = sum(1 for b in settled if b.get("outcome") in ("half_won", "half_win"))
    pushed = sum(1 for b in settled if b.get("outcome") == "push")
    half_lost = sum(1 for b in settled if b.get("outcome") in ("half_lost", "half_loss"))
    lost = sum(1 for b in settled if b.get("outcome") == "loss")

    total_profit = sum(b.get("profit_1u", 0.0) for b in settled)
    total_staked = float(len(settled))
    roi = (total_profit / total_staked) if total_staked > 0 else 0.0
    hit_rate = ((won + half_won * 0.5) / total_staked) if total_staked > 0 else 0.0

    # Average CLV over settled bets only (P1-8)
    settled_clvs = [b["clv"] for b in settled if b.get("clv") is not None]
    avg_clv = (sum(settled_clvs) / len(settled_clvs)) if settled_clvs else 0.0

    summary = {
        "total_bets": len(bets_list),
        "settled_bets": len(settled),
        "pending_bets": len(pending),
        "won": won,
        "half_won": half_won,
        "pushed": pushed,
        "half_lost": half_lost,
        "lost": lost,
        "hit_rate": round(hit_rate * 100.0, 1),
        "total_staked": round(total_staked, 1),
        "total_profit": round(total_profit, 2),
        "roi": round(roi * 100.0, 1),
        "avg_clv": round(avg_clv * 100.0, 2)
    }

    record["summary"] = summary
    record["bets"] = bets_list
    save_track_record(record, filepath)
    return record

if __name__ == "__main__":
    record = load_track_record()
    print(f"Loaded track record: {record['summary']['total_bets']} total bets, {record['summary']['settled_bets']} settled.")
