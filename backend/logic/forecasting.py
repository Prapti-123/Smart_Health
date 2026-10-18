"""
logic/forecasting.py
Exponential smoothing (Holt/Simple ETS) with 7-day MA fallback.
No seasonality - 60 days insufficient for seasonal fit.
"""
import numpy as np
import warnings
from typing import List, Tuple

MIN_DATA_POINTS = 14


def _moving_average(series: List[float], horizon: int, window: int = 7) -> Tuple[List[float], str]:
    """7-day moving average fallback."""
    if len(series) == 0:
        return [0.0] * horizon, "moving_average"
    tail = series[-window:] if len(series) >= window else series
    avg = float(np.mean(tail))
    return [max(0.0, avg)] * horizon, "moving_average"


def forecast_series(
    series: List[float],
    horizon: int = 14,
) -> Tuple[List[float], str]:
    """
    Forecast `horizon` steps ahead.
    Returns (forecast_list, method) where method is 'ets' or 'moving_average'.
    Clips all values to >= 0.
    No seasonality (60-day data insufficient for seasonal fit).
    """
    if len(series) < MIN_DATA_POINTS:
        return _moving_average(series, horizon)

    try:
        from statsmodels.tsa.holtwinters import ExponentialSmoothing
        arr = np.array(series, dtype=float)

        with warnings.catch_warnings():
            warnings.simplefilter("ignore")

            # Try Holt (trend, no seasonality) first
            try:
                model = ExponentialSmoothing(arr, trend="add", seasonal=None)
                fit = model.fit(optimized=True)
                preds = fit.forecast(horizon).tolist()
                preds = [max(0.0, p) for p in preds]
                return preds, "ets"
            except Exception:
                pass

            # Fallback to Simple ETS (no trend, no seasonality)
            try:
                model = ExponentialSmoothing(arr, trend=None, seasonal=None)
                fit = model.fit(optimized=True)
                preds = fit.forecast(horizon).tolist()
                preds = [max(0.0, p) for p in preds]
                return preds, "ets"
            except Exception:
                pass

    except ImportError:
        pass

    return _moving_average(series, horizon)
