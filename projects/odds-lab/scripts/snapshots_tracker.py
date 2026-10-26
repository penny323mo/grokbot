#!/usr/bin/env python3
"""
snapshots_tracker.py - Manages periodic odds snapshots in data/snapshots/.
- Appends each fetch as a compact snapshot JSON
- Prunes snapshots older than 14 days
- Extracts sparkline / line movement histories for upcoming matches
"""

import json
import os
import glob
from datetime import datetime, timezone, timedelta

def get_snapshots_dir(base_data_dir="data"):
    snapshots_dir = os.path.join(base_data_dir, "snapshots")
    os.makedirs(snapshots_dir, exist_ok=True)
    return snapshots_dir

def save_snapshot(fixtures, base_data_dir="data"):
    """
    Saves current Macau Slot & consensus lines into a compact JSON snapshot.
    fixtures: list of processed fixture dicts
    """
    snapshots_dir = get_snapshots_dir(base_data_dir)
    now_utc = datetime.now(timezone.utc)
    ts_str = now_utc.strftime("%Y-%m-%d_%H%M")
    filename = f"snapshot_{ts_str}.json"
    filepath = os.path.join(snapshots_dir, filename)

    snapshot_records = {}
    for f in fixtures:
        match_key = f.get("matchKey") or f.get("match_key") or f"{f.get('league')}_{f.get('home')}_{f.get('away')}"
        macau_obj = f.get("macau", {}) if isinstance(f.get("macau"), dict) else {}
        consensus_obj = f.get("consensus", {}) if isinstance(f.get("consensus"), dict) else {}
        snapshot_records[match_key] = {
            "time": now_utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "macau_1x2": macau_obj.get("odds_1x2") or f.get("odds_1x2"),
            "macau_ah": macau_obj.get("main_ah") or f.get("main_ah"),
            "macau_ou": macau_obj.get("main_ou") or f.get("main_ou"),
            "consensus_1x2": consensus_obj.get("fair_1x2") or f.get("consensus_1x2"),
            "consensus_ou25": consensus_obj.get("prob_ou25") or f.get("consensus_ou25"),
        }

    with open(filepath, "w", encoding="utf-8") as fp:
        json.dump({
            "timestamp": now_utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "matches": snapshot_records
        }, fp, separators=(',', ':'))

    # Prune snapshots older than 14 days
    prune_old_snapshots(snapshots_dir, max_days=14)
    return filepath

def prune_old_snapshots(snapshots_dir, max_days=14):
    """Deletes snapshot files older than max_days."""
    cutoff_dt = datetime.now(timezone.utc) - timedelta(days=max_days)
    pattern = os.path.join(snapshots_dir, "snapshot_*.json")
    for filepath in glob.glob(pattern):
        try:
            basename = os.path.basename(filepath)
            # format: snapshot_YYYY-MM-DD_HHMM.json
            date_part = basename.replace("snapshot_", "").replace(".json", "")
            file_dt = datetime.strptime(date_part[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
            if file_dt < cutoff_dt:
                os.remove(filepath)
                print(f"[Snapshots] Pruned old snapshot: {basename}")
        except Exception:
            # Fallback to mtime
            try:
                mtime = os.path.getmtime(filepath)
                file_dt = datetime.fromtimestamp(mtime, tz=timezone.utc)
                if file_dt < cutoff_dt:
                    os.remove(filepath)
            except Exception:
                pass

def load_snapshots_history(base_data_dir="data", max_points=10):
    """
    Loads recent snapshots and organizes history per match_key.
    Returns: dict mapping match_key -> list of timestamped lines
    """
    snapshots_dir = get_snapshots_dir(base_data_dir)
    pattern = os.path.join(snapshots_dir, "snapshot_*.json")
    files = sorted(glob.glob(pattern))
    if not files:
        return {}

    # Read up to the last 20 snapshot files
    recent_files = files[-20:]
    history_by_match = {}

    for fpath in recent_files:
        try:
            with open(fpath, "r", encoding="utf-8") as fp:
                snap = json.load(fp)
                matches = snap.get("matches", {})
                for m_key, rec in matches.items():
                    if m_key not in history_by_match:
                        history_by_match[m_key] = []
                    history_by_match[m_key].append(rec)
        except Exception:
            continue

    # Cap to max_points per match
    result = {}
    for m_key, hist in history_by_match.items():
        result[m_key] = hist[-max_points:]
    return result
