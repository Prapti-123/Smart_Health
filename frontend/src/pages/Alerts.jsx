import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import {
  AlertTriangle,
  AlertOctagon,
  Pill,
  ArrowRight,
  Filter,
  CheckCircle2,
} from "lucide-react";
import SeverityBadge from "../components/SeverityBadge";
import ErrorBox from "../components/ErrorBox";
import { TableSkeleton } from "../components/Skeleton";

export default function Alerts() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/stock/alerts");
      setData(res.data);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-slate-200 animate-pulse rounded-lg w-1/3" />
        <TableSkeleton rows={8} />
      </div>
    );
  }

  if (error) {
    return <ErrorBox message={error} onRetry={load} />;
  }

  const allAlerts = data?.alerts || [];
  const criticalCount = allAlerts.filter((a) => a.severity === "critical").length;
  const warningCount = allAlerts.filter((a) => a.severity === "warning").length;

  const filtered = allAlerts.filter((a) => {
    if (filter === "critical") return a.severity === "critical";
    if (filter === "warning") return a.severity === "warning";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("alerts.title")}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time stock exhaustion predictions based on consumption trends
          </p>
        </div>

        {/* Filter Pills */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold border border-slate-200/80 shadow-2xs">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === "all"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("alerts.filterAll")} ({allAlerts.length})
          </button>
          <button
            onClick={() => setFilter("critical")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              filter === "critical"
                ? "bg-red-50 text-red-700 shadow-xs font-bold border border-red-200/60"
                : "text-slate-600 hover:text-red-700"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>{t("alerts.criticalCount")} ({criticalCount})</span>
          </button>
          <button
            onClick={() => setFilter("warning")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              filter === "warning"
                ? "bg-amber-50 text-amber-700 shadow-xs font-bold border border-amber-200/60"
                : "text-slate-600 hover:text-amber-700"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{t("alerts.warningCount")} ({warningCount})</span>
          </button>
        </div>
      </div>

      {/* Main Alerts Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base mb-1">
              {t("alerts.noAlerts")}
            </h3>
            <p className="text-xs text-slate-500">
              All monitored essential medicines have over 7 days of supply available.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">{t("alerts.medicine")}</th>
                  <th className="py-3 px-4">{t("alerts.centre")}</th>
                  <th className="py-3 px-4">{t("alerts.progressBar")}</th>
                  <th className="py-3 px-4 text-right">{t("alerts.stockLeft")}</th>
                  <th className="py-3 px-4 text-right">{t("alerts.avgConsumption")}</th>
                  <th className="py-3 px-4 text-center">{t("centre.status")}</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((a, i) => {
                  const days = Math.max(0, a.days_of_stock_left);
                  // Calculate percentage for a 7-day scale progress bar
                  const pct = Math.min(100, Math.round((days / 7) * 100));
                  const isCritical = a.severity === "critical";

                  return (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      {/* Medicine Name */}
                      <td className="py-3.5 px-5 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isCritical
                                ? "bg-red-50 text-red-600"
                                : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            <Pill className="w-4 h-4" />
                          </div>
                          <span>{t(`medicines.${a.medicine}`)}</span>
                        </div>
                      </td>

                      {/* Centre Name and Location */}
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/centres/${a.centre_id}`}
                          className="font-medium text-slate-900 hover:text-teal-700 hover:underline block"
                        >
                          {a.centre_name}
                        </Link>
                        <span className="text-xs text-slate-500">
                          {a.centre_type} · {a.district}
                        </span>
                      </td>

                      {/* Stock Cover Progress Bar */}
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span
                            className={`font-bold ${
                              isCritical ? "text-red-600" : "text-amber-600"
                            }`}
                          >
                            {a.days_of_stock_left} {t("common.days")}
                          </span>
                          <span className="text-[10px] text-slate-400">of 7d threshold</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCritical ? "bg-red-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.max(5, pct)}%` }}
                          />
                        </div>
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                        {a.stock_qty.toFixed(0)}
                        <span className="text-xs text-slate-400 ml-1">{t("common.units")}</span>
                      </td>

                      {/* Avg Daily Burn */}
                      <td className="py-3.5 px-4 text-right text-slate-600 text-xs">
                        {a.avg_daily_consumption} /day
                      </td>

                      {/* Severity Pill */}
                      <td className="py-3.5 px-4 text-center">
                        <SeverityBadge severity={a.severity} />
                      </td>

                      {/* Action Link */}
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          to={`/centres/${a.centre_id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
                        >
                          <span>{t("common.viewDetails")}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
