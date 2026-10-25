#!/usr/bin/env python3
"""
math_engine.py - Core mathematical routines for Odds Lab v4.
Includes:
- Multiplicative and Power margin removal (de-vigging)
- Pinnacle-weighted / median consensus estimation
- Poisson expected goals solver for converting totals across arbitrary/quarter lines
- Consensus + Dixon-Coles fair probabilities blending (0.7 / 0.3)
- Exact Asian Handicap & Over/Under settlement & EV calculation (including quarter lines)
- EV classification thresholds (值博 > +3%, 一般 -3%..+3%, 唔值博 < -3%)
"""

import math

def remove_margin_multiplicative(odds_list):
    """
    Removes margin using proportional / multiplicative normalization.
    odds_list: list of float decimal odds [o1, o2, ...]
    Returns: list of fair probabilities summing to 1.0, and margin percentage.
    """
    if not odds_list or any(o <= 1.0 for o in odds_list):
        return None, 0.0
    inv = [1.0 / o for o in odds_list]
    overround = sum(inv)
    margin = overround - 1.0
    probs = [x / overround for x in inv]
    return probs, margin

def remove_margin_power(odds_list, max_iter=50, tol=1e-8):
    """
    Removes margin using power method (Shin-lite).
    Finds k > 1 such that sum( (1/o_i)^k ) == 1.
    """
    if not odds_list or any(o <= 1.0 for o in odds_list):
        return None, 0.0
    inv = [1.0 / o for o in odds_list]
    overround = sum(inv)
    margin = overround - 1.0
    if abs(overround - 1.0) < 1e-9:
        return inv, 0.0

    low = 1.0
    high = 5.0
    # Expand high if necessary
    while sum(x ** high for x in inv) > 1.0:
        high *= 2.0

    k = 1.0
    for _ in range(max_iter):
        mid = (low + high) / 2.0
        val = sum(x ** mid for x in inv)
        if abs(val - 1.0) < tol:
            k = mid
            break
        if val > 1.0:
            low = mid
        else:
            high = mid
        k = mid

    probs = [x ** k for x in inv]
    tot = sum(probs)
    return [p / tot for p in probs], margin

def solve_poisson_lambda_for_ou25(prob_over_25, max_iter=40, tol=1e-7):
    """
    Given the probability of Over 2.5 goals under a Poisson distribution,
    finds the expected total goals parameter lambda (mu).
    P(Goals <= 2) = exp(-mu) * (1 + mu + mu^2 / 2)
    P(Over 2.5) = 1 - P(Goals <= 2)
    """
    p = max(0.001, min(0.999, prob_over_25))
    low = 0.1
    high = 10.0

    for _ in range(max_iter):
        mid = (low + high) / 2.0
        p_under = math.exp(-mid) * (1.0 + mid + 0.5 * mid * mid)
        p_over = 1.0 - p_under
        diff = p_over - p
        if abs(diff) < tol:
            return mid
        if diff < 0:
            low = mid
        else:
            high = mid
    return (low + high) / 2.0

def poisson_ou_prob(total_mu, line):
    """
    Computes Over, Push, Under probabilities for a Poisson total goals distribution
    with mean total_mu at an integer or half-ball line.
    """
    mu = max(0.1, total_mu)
    # Check if integer line (e.g. 2.0, 3.0) or half line (e.g. 2.5)
    is_integer = abs(line - round(line)) < 1e-5
    k = int(round(line))

    # Calculate Poisson probabilities up to k+1
    poisson_pmf = []
    accum = 0.0
    for i in range(k + 2):
        val = (math.exp(-mu) * (mu ** i)) / math.factorial(i)
        poisson_pmf.append(val)
        accum += val

    if is_integer:
        p_push = poisson_pmf[k]
        p_under = sum(poisson_pmf[i] for i in range(k))
        p_over = max(0.0, 1.0 - p_under - p_push)
        return {"over": p_over, "push": p_push, "under": p_under}
    else:
        # Half line (e.g. 2.5)
        k_floor = math.floor(line)
        p_under = sum(poisson_pmf[i] for i in range(k_floor + 1))
        p_over = max(0.0, 1.0 - p_under)
        return {"over": p_over, "push": 0.0, "under": p_under}

def convert_ou_line_probs(prob_over_25, target_line):
    """
    Converts a consensus Over 2.5 probability into Over / Push / Under probabilities
    for any target line, correctly handling quarter lines (split stakes).
    target_line can be e.g. 2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 4.0, 4.25, etc.
    """
    mu = solve_poisson_lambda_for_ou25(prob_over_25)
    is_quarter = abs((target_line * 2) % 1) > 1e-5

    if is_quarter:
        sub1 = target_line - 0.25
        sub2 = target_line + 0.25
        res1 = poisson_ou_prob(mu, sub1)
        res2 = poisson_ou_prob(mu, sub2)
        # Quarter line is 50% split on sub1 and 50% split on sub2
        # For Over on 2.25 (split 2.0 and 2.5):
        # If goals == 2: sub1 pushes, sub2 loses -> half loss
        # If goals > 2: both win
        return {
            "mu": round(mu, 3),
            "target_line": target_line,
            "sub1": sub1,
            "sub2": sub2,
            "p1": res1,
            "p2": res2
        }
    else:
        res = poisson_ou_prob(mu, target_line)
        return {
            "mu": round(mu, 3),
            "target_line": target_line,
            "p": res
        }

def settle_ah_single(goal_diff, line, odds):
    """
    Single unit payoff for Asian handicap (home perspective).
    goal_diff: FTHG - FTAG
    line: handicap applied to home team
    odds: decimal odds
    Returns: payout multiplier (e.g. odds for full win, 1+(odds-1)/2 for half win, 1.0 push, 0.5 half loss, 0 loss)
    """
    l = round(line * 4) / 4
    is_quarter = abs((l * 2) % 1) > 1e-5

    def settle_sub(d, sub_l, o):
        x = d + sub_l
        if x > 1e-6:
            return o
        if abs(x) <= 1e-6:
            return 1.0
        return 0.0

    if is_quarter:
        m1 = settle_sub(goal_diff, l - 0.25, odds)
        m2 = settle_sub(goal_diff, l + 0.25, odds)
        return 0.5 * m1 + 0.5 * m2
    return settle_sub(goal_diff, l, odds)

def settle_ou_single(total_goals, line, odds, is_over=True):
    """
    Single unit payoff for Over/Under at any line (including quarter lines).
    """
    l = round(line * 4) / 4
    is_quarter = abs((l * 2) % 1) > 1e-5

    def settle_sub(g, sub_l, o, over):
        if over:
            if g > sub_l:
                return o
            if abs(g - sub_l) < 1e-6:
                return 1.0
            return 0.0
        else:
            if g < sub_l:
                return o
            if abs(g - sub_l) < 1e-6:
                return 1.0
            return 0.0

    if is_quarter:
        m1 = settle_sub(total_goals, l - 0.25, odds, is_over)
        m2 = settle_sub(total_goals, l + 0.25, odds, is_over)
        return 0.5 * m1 + 0.5 * m2
    return settle_sub(total_goals, l, odds, is_over)

def calc_ou_expected_return(ou_line_probs, line, odds, is_over=True):
    """
    Calculates expected return for Over/Under at line given Poisson probabilities.
    """
    is_quarter = abs((line * 2) % 1) > 1e-5
    if not is_quarter:
        p = ou_line_probs.get("p", {})
        p_over = p.get("over", 0.0)
        p_push = p.get("push", 0.0)
        p_under = p.get("under", 0.0)
        if is_over:
            return p_over * odds + p_push * 1.0
        else:
            return p_under * odds + p_push * 1.0
    else:
        p1 = ou_line_probs.get("p1", {})
        p2 = ou_line_probs.get("p2", {})
        if is_over:
            er1 = p1.get("over", 0.0) * odds + p1.get("push", 0.0) * 1.0
            er2 = p2.get("over", 0.0) * odds + p2.get("push", 0.0) * 1.0
        else:
            er1 = p1.get("under", 0.0) * odds + p1.get("push", 0.0) * 1.0
            er2 = p2.get("under", 0.0) * odds + p2.get("push", 0.0) * 1.0
        return 0.5 * er1 + 0.5 * er2

def blend_probabilities(consensus_probs, model_probs=None, weight_consensus=0.7):
    """
    Blends market consensus probabilities with Dixon-Coles model probabilities.
    consensus_probs: dict or list of probabilities
    model_probs: dict or list of probabilities (optional)
    """
    if not model_probs:
        return consensus_probs

    if isinstance(consensus_probs, list):
        blended = []
        wc = weight_consensus
        wm = 1.0 - wc
        for c, m in zip(consensus_probs, model_probs):
            blended.append(wc * c + wm * m)
        tot = sum(blended)
        return [b / tot for b in blended]
    elif isinstance(consensus_probs, dict):
        blended = {}
        wc = weight_consensus
        wm = 1.0 - wc
        keys = list(consensus_probs.keys())
        for k in keys:
            c = consensus_probs[k]
            m = model_probs.get(k, c)
            blended[k] = wc * c + wm * m
        tot = sum(blended.values())
        return {k: v / tot for k, v in blended.items()}
    return consensus_probs

def classify_ev(ev_fraction):
    """
    Classifies EV percentage into user-facing Cantonese label and badge class.
    EV > +3%: 值博 (positive value)
    -3% <= EV <= +3%: 一般 (neutral)
    EV < -3%: 唔值博 (negative value)
    """
    ev_pct = ev_fraction * 100.0
    if ev_pct > 3.0:
        return {
            "label": "值博",
            "tier": "value",
            "badgeClass": "badge-val-pos",
            "ev_pct": round(ev_pct, 1)
        }
    elif ev_pct < -3.0:
        return {
            "label": "唔值博",
            "tier": "avoid",
            "badgeClass": "badge-val-neg",
            "ev_pct": round(ev_pct, 1)
        }
    else:
        return {
            "label": "一般",
            "tier": "neutral",
            "badgeClass": "badge-val-neutral",
            "ev_pct": round(ev_pct, 1)
        }

def calc_kelly_stake(prob, odds, bankroll=100.0, fraction=0.25, max_cap=0.10):
    """
    Computes fractional Kelly stake percentage and units.
    """
    b = odds - 1.0
    if b <= 0 or prob <= 0:
        return 0.0, 0.0
    q = 1.0 - prob
    full_kelly = (b * prob - q) / b
    if full_kelly <= 0:
        return 0.0, 0.0
    fractional = min(max_cap, full_kelly * fraction)
    stake_units = round(bankroll * fractional, 2)
    return round(fractional * 100.0, 1), stake_units
