"""
logic/scoring.py
Per-centre performance score for flagging bottom performers.
Score 0-100 (higher = better).
"""
from typing import Dict, Any


def compute_score(metrics: Dict[str, Any]) -> Dict[str, Any]:
    """
    metrics keys:
        stockout_rate       0-1  (fraction of medicine-days with 0 stock)
        absence_rate        0-1  (fraction of doctor-days absent)
        bed_occupancy       0-1  (avg bed occupancy - high is bad)
        test_unavail_rate   0-1  (fraction of test-days unavailable)
    Returns score (0-100) and list of reasons.
    """
    so_rate   = metrics.get("stockout_rate", 0)
    abs_rate  = metrics.get("absence_rate", 0)
    bed_occ   = metrics.get("bed_occupancy", 0)
    test_rate = metrics.get("test_unavail_rate", 0)

    # Weighted penalty (out of 100)
    stockout_penalty = so_rate * 35
    absence_penalty  = abs_rate * 25
    # Bed occupancy >80% is bad; penalise proportion above 0.8
    bed_penalty      = max(0, (bed_occ - 0.80) / 0.20) * 20
    test_penalty     = test_rate * 20

    score = max(0, 100 - stockout_penalty - absence_penalty - bed_penalty - test_penalty)

    reasons = []
    if so_rate > 0.15:
        reasons.append(f"Stock-outs on {so_rate*100:.0f}% of medicine-days")
    if abs_rate > 0.20:
        reasons.append(f"Doctor absent {abs_rate*100:.0f}% of days")
    if bed_occ > 0.90:
        reasons.append(f"Beds full {bed_occ*100:.0f}% capacity")
    elif bed_occ > 0.80:
        reasons.append(f"High bed occupancy ({bed_occ*100:.0f}%)")
    if test_rate > 0.20:
        reasons.append(f"Tests unavailable {test_rate*100:.0f}% of days")

    return {"score": round(score, 1), "reasons": reasons}
