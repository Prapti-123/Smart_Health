import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import {
  Building2,
  AlertOctagon,
  Bed,
  UserX,
  FileText,
  Search,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Filter,
} from "lucide-react";
import KPICard from "../components/KPICard";
import HealthMap from "../components/HealthMap";
import SeverityBadge from "../components/SeverityBadge";
import ErrorBox from "../components/ErrorBox";
import { CardSkeleton, MapSkeleton, TableSkeleton } from "../components/Skeleton";

export default function Overview() {
  const { t, i18n } = useTranslation();
  const [centres, setCentres] = useState([]);
  const [flags, setFlags] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cRes, fRes, sRes] = await Promise.all([
        axios.get("/api/centres"),
        axios.get("/api/flags"),
        axios.get("/api/summary"),
      ]);
      setCentres(cRes.data);
      setFlags(fRes.data);
      setSummary(sRes.data);
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
        <div className="h-24 bg-slate-200 animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <MapSkeleton />
          </div>
          <div className="lg:col-span-4">
            <CardSkeleton />
          </div>
        </div>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  if (error) {
    return <ErrorBox message={error} onRetry={load} />;
  }

  const criticalCentres = centres.filter((c) => c.marker === "red").length;
  const avgBed = centres.length
    ? Math.round(centres.reduce((a, c) => a + c.bed_occupancy_pct, 0) / centres.length)
    : 0;
  const avgAbsence = centres.length
    ? Math.round(centres.reduce((a, c) => a + c.absence_rate_pct, 0) / centres.length)
    : 0;

  const currentSummaryText =
    summary?.summary?.[i18n.language] || summary?.summary?.["en"] || "";

  const filteredCentres = centres.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.block && c.block.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === "ALL" || c.centre_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* 1. District Executive Briefing (Highlighted Card at Top) */}
      {summary && (
        <div className="bg-gradient-to-r from-teal-50 via-emerald-50/70 to-slate-50 border border-teal-200/80 rounded-xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <h2 className="font-bold text-teal-950 text-base tracking-tight">
                  {t("overview.districtBriefing")}
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white text-teal-800 border border-teal-200/80 shadow-2xs">
                  {summary.date}
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                {currentSummaryText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Row of 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Building2}
          label={t("overview.totalCentres")}
          value={centres.length}
          chipText="30 facilities"
          chipColor="teal"
          iconBg="bg-teal-50 text-teal-700"
        />

        <KPICard
          icon={AlertOctagon}
          label={t("overview.criticalAlerts")}
          value={criticalCentres}
          chipText={criticalCentres > 0 ? "Urgent attention" : "Normal"}
          chipColor={criticalCentres > 0 ? "red" : "emerald"}
          iconBg={criticalCentres > 0 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}
        />

        <KPICard
          icon={Bed}
          label={t("overview.bedsOccupied")}
          value={avgBed}
          unit="%"
          chipText={avgBed > 80 ? "High Load" : "Capacity OK"}
          chipColor={avgBed > 80 ? "amber" : "teal"}
          iconBg="bg-teal-50 text-teal-700"
        />

        <KPICard
          icon={UserX}
          label={t("overview.doctorAbsence")}
          value={avgAbsence}
          unit="%"
          chipText={avgAbsence > 15 ? "High Absence" : "Staffed"}
          chipColor={avgAbsence > 15 ? "amber" : "teal"}
          iconBg="bg-teal-50 text-teal-700"
        />
      </div>

      {/* 3. Map (Left) & Flagged Centres (Right) 2-column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map card */}
        <div className="lg:col-span-7 xl:col-span-8">
          <HealthMap centres={centres} />
        </div>

        {/* Flagged centres card */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col h-full">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                  {t("overview.flaggedCentres")}
                </h3>
                <p className="text-xs text-slate-500">
                  {flags?.flagged?.length || 0} facilities below performance threshold
                </p>
              </div>
            </div>
            <Link
              to="/alerts"
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
            >
              {t("alerts.title")}
            </Link>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[460px]">
            {flags?.flagged?.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No underperforming facilities flagged.
              </div>
            ) : (
              flags?.flagged?.map((c) => (
                <div
                  key={c.centre_id}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/centres/${c.centre_id}`}
                        className="font-semibold text-slate-900 hover:text-teal-700 hover:underline text-sm truncate"
                      >
                        {c.centre_name}
                      </Link>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {c.centre_type}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mt-0.5">
                      {c.district}
                    </div>

                    {/* Reasons list */}
                    <div className="mt-2 space-y-1">
                      {c.reasons?.map((reason, idx) => (
                        <div
                          key={idx}
                          className="text-xs text-rose-700 bg-rose-50/80 border border-rose-200/60 rounded px-2 py-0.5 flex items-center gap-1.5"
                        >
                          <span className="w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                          <span className="truncate">{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block text-xl font-bold ${
                        c.score < 40 ? "text-rose-600" : "text-amber-600"
                      }`}
                    >
                      {c.score}
                    </span>
                    <div className="text-[10px] text-slate-400 font-medium">/100</div>
                    <Link
                      to={`/centres/${c.centre_id}`}
                      className="mt-2 inline-flex items-center gap-0.5 text-xs font-semibold text-teal-700 hover:text-teal-800"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Facilities Directory Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">
              {t("overview.allCentres")}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive list of all 30 healthcare units in Chhattisgarh district
            </p>
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t("overview.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg w-52 sm:w-64 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
              />
            </div>

            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium border border-slate-200/80">
              {["ALL", "PHC", "CHC"].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    typeFilter === type
                      ? "bg-white text-teal-800 font-bold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {type === "ALL" ? "All" : type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">Facility Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredCentres.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                    No matching facilities found.
                  </td>
                </tr>
              ) : (
                filteredCentres.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-5 font-medium text-slate-900">
                      <Link
                        to={`/centres/${c.id}`}
                        className="hover:text-teal-700 hover:underline"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                          c.centre_type === "CHC"
                            ? "bg-teal-50 text-teal-800 border border-teal-200/70"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {c.centre_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {c.district} {c.block ? `· ${c.block}` : ""}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span
                        className={
                          c.score >= 75
                            ? "text-emerald-700"
                            : c.score >= 50
                            ? "text-amber-700"
                            : "text-rose-700"
                        }
                      >
                        {c.score}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <SeverityBadge severity={c.marker === "green" ? "ok" : c.marker} />
                    </td>
                    <td className="py-3 px-5 text-right">
                      <Link
                        to={`/centres/${c.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
                      >
                        <span>{t("common.viewDetails")}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
