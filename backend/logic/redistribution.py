"""
logic/redistribution.py
Greedy surplus->deficit matching by haversine distance.
Donor retains >=7 days stock after transfer.
"""
import math
from typing import List, Dict, Any


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def compute_redistribution(centre_stocks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    centre_stocks: list of dicts with keys:
        centre_id, centre_name, medicine, stock_qty, avg_daily_consumption,
        latitude, longitude
    Returns list of transfer recommendations.
    """
    recommendations = []

    # Group by medicine
    medicines = list({r["medicine"] for r in centre_stocks})

    for med in medicines:
        rows = [r for r in centre_stocks if r["medicine"] == med]

        for r in rows:
            avg = r["avg_daily_consumption"]
            r["days_left"] = (r["stock_qty"] / avg) if avg > 0 else 999

        surplus = [r for r in rows if r["days_left"] > 21]
        deficit = [r for r in rows if r["days_left"] < 5]

        # Sort deficit by urgency (fewest days first)
        deficit.sort(key=lambda x: x["days_left"])

        for def_row in deficit:
            if not surplus:
                break
            # Find nearest surplus centre
            surplus.sort(key=lambda s: haversine_km(
                def_row["latitude"], def_row["longitude"],
                s["latitude"], s["longitude"]
            ))

            for sur_row in surplus:
                avg_cons = sur_row["avg_daily_consumption"] or 1.0
                # Donor must retain 7 days after transfer
                safe_stock = sur_row["stock_qty"] - (7 * avg_cons)
                if safe_stock <= 0:
                    continue  # can't transfer without self-deficit

                # Transfer enough to bring deficit centre to ~14 days
                def_avg = def_row["avg_daily_consumption"] or 1.0
                needed = max(0, (14 - def_row["days_left"]) * def_avg)
                qty = min(needed, safe_stock)

                if qty < 1:
                    continue

                dist = haversine_km(
                    def_row["latitude"], def_row["longitude"],
                    sur_row["latitude"], sur_row["longitude"]
                )

                recommendations.append({
                    "from_centre_id": sur_row["centre_id"],
                    "from_centre_name": sur_row["centre_name"],
                    "to_centre_id": def_row["centre_id"],
                    "to_centre_name": def_row["centre_name"],
                    "medicine": med,
                    "quantity": round(qty, 1),
                    "distance_km": round(dist, 1),
                    "from_days_left": round(sur_row["days_left"], 1),
                    "to_days_left": round(def_row["days_left"], 1),
                    "reason": (
                        f"{def_row['centre_name']} has only {def_row['days_left']:.1f} days of "
                        f"{med} left; {sur_row['centre_name']} has surplus "
                        f"({sur_row['days_left']:.1f} days)."
                    ),
                })

                # Update simulated stock levels
                sur_row["stock_qty"] -= qty
                sur_row["days_left"] = sur_row["stock_qty"] / avg_cons
                def_row["stock_qty"] += qty
                def_row["days_left"] = def_row["stock_qty"] / def_avg
                break  # move to next deficit centre

    return recommendations
