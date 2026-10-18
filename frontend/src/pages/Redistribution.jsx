import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import {
  ArrowRight,
  ArrowLeftRight,
  CheckCircle2,
  Navigation,
  Pill,
  ShieldCheck,
  Check,
  Clock,
  Sparkles,
} from "lucide-react";
import ErrorBox from "../components/ErrorBox";
import { CardSkeleton } from "../components/Skeleton";

export default function Redistribution() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvedSet, setApprovedSet] = useState(new Set());

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/redistribution");
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

  const handleApprove = (idx) => {
    setApprovedSet((prev) => new Set([...prev, idx]));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-slate-200 animate-pulse rounded-lg w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorBox message={error} onRetry={load} />;
  }

  const recs = data?.recommendations || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("redistribution.title")}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {t("redistribution.subtitle")}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold shadow-2xs">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>{recs.length} {t("redistribution.totalRecs")}</span>
        </div>
      </div>

      {recs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center max-w-md mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-900 text-base mb-1">
            {t("redistribution.noRecs")}
          </h3>
          <p className="text-xs text-slate-500">
            All facilities have adequate medicine stocks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {recs.map((rec, i) => {
            const isApproved = approvedSet.has(i);

            return (
              <div
                key={i}
                className={`bg-white rounded-xl shadow-xs border p-5 sm:p-6 transition-all flex flex-col justify-between ${
                  isApproved
                    ? "border-emerald-300 bg-emerald-50/20"
                    : "border-slate-200/90 hover:shadow-sm hover:border-slate-300"
                }`}
              >
                <div>
                  {/* Card Header: Drug and Distance */}
                  <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-base">
                          {t(`medicines.${rec.medicine}`)}
                        </span>
                        <div className="text-xs text-slate-400">
                          Transfer ID: #TR-{rec.from_centre_id}-{rec.to_centre_id}-{i + 1}
                        </div>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                      <Navigation className="w-3.5 h-3.5 text-teal-600" />
                      <span>{rec.distance_km} {t("common.km")}</span>
                    </div>
                  </div>

                  {/* Transfer Route: From -> To */}
                  <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center my-4 py-1">
                    {/* From Facility */}
                    <div className="sm:col-span-5 bg-slate-50 border border-slate-200/70 rounded-lg p-3">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        {t("redistribution.from")}
                      </div>
                      <Link
                        to={`/centres/${rec.from_centre_id}`}
                        className="font-bold text-slate-900 hover:text-teal-700 text-sm truncate block"
                      >
                        {rec.from_centre_name}
                      </Link>
                      <div className="text-xs font-medium text-emerald-700 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{rec.from_days_left}d cover ({t("redistribution.retainsCover")} &gt;7d)</span>
                      </div>
                    </div>

                    {/* Arrow Icon */}
                    <div className="sm:col-span-1 flex justify-center text-teal-600">
                      <div className="w-7 h-7 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>

                    {/* To Facility */}
                    <div className="sm:col-span-5 bg-red-50/60 border border-red-200/80 rounded-lg p-3">
                      <div className="text-[11px] font-semibold text-red-500 uppercase tracking-wider mb-1">
                        {t("redistribution.to")}
                      </div>
                      <Link
                        to={`/centres/${rec.to_centre_id}`}
                        className="font-bold text-slate-900 hover:text-red-700 text-sm truncate block"
                      >
                        {rec.to_centre_name}
                      </Link>
                      <div className="text-xs font-medium text-red-600 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span>Only {rec.to_days_left}d cover remaining</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Rationale */}
                  <div className="bg-slate-50/80 border border-slate-200/70 rounded-lg p-3 space-y-1.5 mb-4 text-xs">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">{t("redistribution.quantity")}:</span>
                      <span className="font-bold text-teal-800 text-base">
                        {rec.quantity} {t("common.units")}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed pt-1 border-t border-slate-200/50">
                      <strong className="text-slate-700 font-semibold">{t("redistribution.reason")}: </strong>
                      {rec.reason}
                    </p>
                  </div>
                </div>

                {/* Approve Button */}
                <button
                  onClick={() => handleApprove(i)}
                  disabled={isApproved}
                  className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-xs ${
                    isApproved
                      ? "bg-emerald-600 text-white cursor-default shadow-xs"
                      : "bg-teal-600 hover:bg-teal-700 text-white active:scale-[0.99]"
                  }`}
                >
                  {isApproved ? (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>{t("redistribution.approved")}</span>
                    </>
                  ) : (
                    <>
                      <ArrowLeftRight className="w-4 h-4" />
                      <span>{t("redistribution.approve")}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
