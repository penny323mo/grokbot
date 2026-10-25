#!/usr/bin/env python3
"""
record_tracker.py - Tracks detected "值博" (positive EV) opportunities and settlements.
- Records every 值博 opportunity at first detection
- Tracks closing price and consensus to compute Closing Line Value (CLV)
- Settles bets at 1u flat stake once match results are in
- Computes aggregate statistics: Total bets, Win rate, Total profit, ROI, Avg CLV
"""

import json
import os
from datetime import datetime, timezone
from math_engine import settle_ah_single, settle_ou_single

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

def update_track_record(value_bets, finished_matches=None, filepath="data/track_record.json"):
    """
    value_bets: list of dicts representing currently detected value bets
    finished_matches: dict mapping (home_canonical, away_canonical) -> (FTHG, FTAG)
    """
    record = load_track_record(filepath)
    existing_bets = {b["id"]: b for b in record.get("bets", [])}
    now_utc_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # 1. Ingest new value bets or update closing prices
    for vb in value_bets:
        bet_id = vb["id"]
        if bet_id not in existing_bets:
            existing_bets[bet_id] = {
                "id": bet_id,
                "first_detected_at": now_utc_str,
                "league": vb.get("league"),
                "league_name": vb.get("league_name"),
                "home": vb.get("home"),
                "away": vb.get("away"),
                "home_zh": vb.get("home_zh"),
                "away_zh": vb.get("away_zh"),
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
                "status": "pending",
                "score": None,
                "outcome": None,
                "profit_1u": None
            }
        else:
            # Update closing Macau price and closing consensus fair until settled
            bet = existing_bets[bet_id]
            if bet["status"] == "pending":
                bet["closing_macau_odds"] = vb.get("macau_odds") or bet["closing_macau_odds"]
                bet["closing_consensus_fair"] = vb.get("fair_odds") or bet["closing_consensus_fair"]
                # Calculate CLV: (initial_macau_odds / closing_consensus_fair) - 1.0
                if bet.get("initial_macau_odds") and bet.get("closing_consensus_fair"):
                    clv = (bet["initial_macau_odds"] / bet["closing_consensus_fair"]) - 1.0
                    bet["clv"] = round(clv, 4)

    # 2. Settle finished matches
    if finished_matches:
        for bet in existing_bets.values():
            if bet["status"] == "pending":
                key = (bet["home"], bet["away"])
                # Also check normalized or reverse lookup
                score = finished_matches.get(key)
                if not score:
                    # Try partial match
                    for (h, a), sc in finished_matches.items():
                        if (h in bet["home"] or bet["home"] in h) and (a in bet["away"] or bet["away"] in a):
                            score = sc
                            break

                if score:
                    fthg, ftag = score
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
                        diff = fthg - ftag
                        mult = settle_ah_single(diff, line, odds)
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
                        is_over = sel == "Over"
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
    half_won = sum(1 for b in settled if b.get("outcome") == "half_win")
    pushed = sum(1 for b in settled if b.get("outcome") == "push")
    half_lost = sum(1 for b in settled if b.get("outcome") == "half_loss")
    lost = sum(1 for b in settled if b.get("outcome") == "loss")

    total_profit = sum(b.get("profit_1u", 0.0) for b in settled)
    total_staked = float(len(settled))
    roi = (total_profit / total_staked) if total_staked > 0 else 0.0
    hit_rate = ((won + half_won * 0.5) / total_staked) if total_staked > 0 else 0.0

    clv_values = [b["clv"] for b in bets_list if b.get("clv") is not None]
    avg_clv = (sum(clv_values) / len(clv_values)) if clv_values else 0.0

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
        "total_staked": round(total_staked, 2),
        "total_profit": round(total_profit, 2),
        "roi": round(roi * 100.0, 1),
        "avg_clv": round(avg_clv * 100.0, 2)
    }

    record["summary"] = summary
    record["bets"] = bets_list
    save_track_record(record, filepath)
    return record
