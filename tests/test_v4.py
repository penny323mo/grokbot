#!/usr/bin/env python3
"""
test_v4.py - Unit tests for Odds Lab v4 Python modules:
- Asian Handicap quarter-line settlement (0, ±0.25, ±0.5, ±0.75, ±1.0)
- Over/Under quarter-line settlement (2.0, 2.25, 2.5, 2.75, 3.0)
- Multiplicative and Power de-vigging margin removal
- Poisson expected goals solver and totals line conversion
- Team name normalization and cross-source matching
- EV classification thresholds (+3% / -3%)
- Data and health schema validation
"""

import unittest
import json
import os
import sys

# Add root and scripts directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scripts")))

from math_engine import (
    remove_margin_multiplicative, remove_margin_power,
    solve_poisson_lambda_for_ou25, convert_ou_line_probs,
    settle_ah_single, settle_ou_single, classify_ev, calc_kelly_stake
)
from team_names import (
    TEAM_NAMES, get_team_cantonese, normalize_team_name,
    teams_match, strip_accents
)

class TestOddsLabV4(unittest.TestCase):

    def test_margin_removal_multiplicative(self):
        # Bet365 typical 1X2 market: 2.00, 3.40, 3.80
        odds = [2.00, 3.40, 3.80]
        probs, margin = remove_margin_multiplicative(odds)
        self.assertAlmostEqual(sum(probs), 1.0, places=7)
        self.assertGreater(margin, 0.0)
        self.assertLess(margin, 0.15)
        # Probabilities should be strictly proportional to inverse odds
        self.assertAlmostEqual(probs[0] / probs[1], (1.0/odds[0]) / (1.0/odds[1]), places=5)

    def test_margin_removal_power(self):
        odds = [1.80, 2.05]
        probs, margin = remove_margin_power(odds)
        self.assertAlmostEqual(sum(probs), 1.0, places=6)
        self.assertGreater(probs[0], probs[1])

    def test_poisson_lambda_solver_and_conversion(self):
        # Over 2.5 = 50% implies around 2.67 expected goals
        mu = solve_poisson_lambda_for_ou25(0.50)
        self.assertAlmostEqual(mu, 2.674, delta=0.01)

        # Convert to 2.25 line (quarter line: split 2.0 and 2.5)
        res = convert_ou_line_probs(0.50, 2.25)
        self.assertEqual(res["target_line"], 2.25)
        self.assertEqual(res["sub1"], 2.0)
        self.assertEqual(res["sub2"], 2.5)
        self.assertIn("p1", res)
        self.assertIn("p2", res)

    def test_ah_quarter_line_settlement(self):
        # Line -0.75 @ odds 2.00 (half on -0.5, half on -1.0)
        # Home wins by 2: both -0.5 and -1.0 win -> Full Win (payoff 2.0)
        self.assertEqual(settle_ah_single(2, -0.75, 2.0), 2.0)
        # Home wins by 1: -0.5 wins, -1.0 pushes -> Half Win (0.5 * 2.0 + 0.5 * 1.0 = 1.5)
        self.assertEqual(settle_ah_single(1, -0.75, 2.0), 1.5)
        # Draw (0): both lose -> Full Loss (0.0)
        self.assertEqual(settle_ah_single(0, -0.75, 2.0), 0.0)

        # Line +0.75 @ odds 2.00 (away perspective of -0.75)
        # Home wins by 1 (diff -1 for away): +0.5 loses, +1.0 pushes -> Half Loss (0.5)
        self.assertEqual(settle_ah_single(-1, 0.75, 2.0), 0.5)

        # Line -0.25 @ odds 2.00 (half on 0, half on -0.5)
        # Home wins by 1: both win -> Full Win (2.0)
        self.assertEqual(settle_ah_single(1, -0.25, 2.0), 2.0)
        # Draw (0): 0 pushes, -0.5 loses -> Half Loss (0.5 * 1.0 + 0.5 * 0.0 = 0.5)
        self.assertEqual(settle_ah_single(0, -0.25, 2.0), 0.5)
        # Loss (-1): both lose -> Full Loss (0.0)
        self.assertEqual(settle_ah_single(-1, -0.25, 2.0), 0.0)

    def test_ou_quarter_line_settlement(self):
        # Over 2.25 @ 2.00 (split 2.0 and 2.5)
        # 3 goals: both win -> Full Win (2.0)
        self.assertEqual(settle_ou_single(3, 2.25, 2.0, is_over=True), 2.0)
        # 2 goals: 2.0 pushes (0.5 return), 2.5 loses (0.0) -> Half Loss (0.5)
        self.assertEqual(settle_ou_single(2, 2.25, 2.0, is_over=True), 0.5)
        # 1 goal: both lose -> Full Loss (0.0)
        self.assertEqual(settle_ou_single(1, 2.25, 2.0, is_over=True), 0.0)

        # Under 2.25 @ 2.00
        # 2 goals: 2.0 pushes (0.5 * 1.0), 2.5 wins (0.5 * 2.0) -> Half Win (1.5)
        self.assertEqual(settle_ou_single(2, 2.25, 2.0, is_over=False), 1.5)

    def test_ev_classification_labels(self):
        # Values strictly following the specification:
        # > +3% -> 值博
        # -3% .. +3% -> 一般
        # < -3% -> 唔值博
        pos = classify_ev(0.045)
        self.assertEqual(pos["label"], "值博")
        self.assertEqual(pos["tier"], "value")

        neutral_high = classify_ev(0.025)
        self.assertEqual(neutral_high["label"], "一般")
        self.assertEqual(neutral_high["tier"], "neutral")

        neutral_low = classify_ev(-0.025)
        self.assertEqual(neutral_low["label"], "一般")
        self.assertEqual(neutral_low["tier"], "neutral")

        neg = classify_ev(-0.05)
        self.assertEqual(neg["label"], "唔值博")
        self.assertEqual(neg["tier"], "avoid")

    def test_team_name_normalization_and_matching(self):
        # Strips accents and aliases
        self.assertEqual(strip_accents("Alavés"), "Alaves")
        self.assertEqual(strip_accents("Málaga"), "Malaga")
        self.assertEqual(strip_accents("Bayern München"), "Bayern Munchen")

        # Cross-source matching
        self.assertTrue(teams_match("Brighton Hove Albion", "Brighton and Hove Albion"))
        self.assertTrue(teams_match("Newcastle Utd", "Newcastle United"))
        self.assertTrue(teams_match("Paris St Germain", "Paris Saint Germain"))
        self.assertTrue(teams_match("AS Monaco", "Monaco"))
        self.assertTrue(teams_match("Bayer 04 Leverkusen", "Bayer Leverkusen"))
        self.assertTrue(teams_match("Athletic Bilbao", "Ath Bilbao"))
        self.assertTrue(teams_match("Atalanta BC", "Atalanta"))

    def test_schema_and_health_file(self):
        health_path = os.path.join(os.path.dirname(__file__), "..", "data", "health.json")
        self.assertTrue(os.path.exists(health_path), "data/health.json must exist")
        with open(health_path, "r", encoding="utf-8") as f:
            h = json.load(f)
        self.assertIn("status", h)
        self.assertIn("checked_at", h)
        self.assertIn("sources", h)
        self.assertIn("macau_slot", h["sources"])
        self.assertIn("the_odds_api", h["sources"])

if __name__ == "__main__":
    unittest.main()
