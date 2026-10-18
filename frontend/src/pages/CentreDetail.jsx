import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import {
  ArrowLeft,
  Building2,
  Bed,
  Users,
  TestTubes,
  Pill,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import SeverityBadge from "../components/SeverityBadge";
import ErrorBox from "../components/ErrorBox";
import { CardSkeleton, TableSkeleton } from "../components/Skeleton";

const MEDICINES = [
  "ORS",
  "Paracetamol",
  "Amoxicillin",
  "Iron-Folic Acid",
  "Metformin",
  "Amlodipine",
  "Atenolol",
  "Cotrimoxazole",
  "Vitamin A",
  "Chloroquine",
];

// Circular SVG Health Index Ring
function ScoreRing({ score }) {
  const radius = 28;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const colorClass =
    score >= 75 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-rose-500";
  const bgClass =
    score >= 75 ? "text-emerald-100" : score >= 50 ? "text-amber-100" : "text-rose-100";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-20 h-20 -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          className={bgClass}
          fill="transparent"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-700`}
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold text-slate-900 leading-none">{score}</span>
        <span className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">/100</span>
      </div>
    </div>
  );
}

export default function CentreDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [centre, setCentre] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMed, setSelectedMed] = useState("ORS");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cRes, fRes] = await Promise.all([
        axios.get(`/api/centres/${id}`),
        axios.get(`/api/forecast/${id}`),
      ]);
      setCentre(cRes.data);
      setForecast(fRes.data);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-slate-200 animate-pulse rounded-lg w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <TableSkeleton rows={8} />
      </div>
    );
  }

  if (error) {
    return <ErrorBox message={error} onRetry={load} />;
  }

  if (!centre) return null;

  // Build stock table rows with 7-day lookback metrics
  const stockTableData = MEDICINES.map((med) => {
    const history = centre.stock_history?.[med] || [];
    const latest = history[history.length - 1];
    const avgCons = history.length
      ? history.reduce((a, r) => a + r.consumption, 0) / history.length
      : 0;
    const daysLeft = avgCons > 0 ? (latest?.stock_qty || 0) / avgCons : 999;
    const severity = daysLeft < 3 ? "critical" : daysLeft < 7 ? "warning" : "ok";
    return {
      med,
      stock: latest?.stock_qty || 0,
      avgCons: avgCons.toFixed(1),
      daysLeft: daysLeft.toFixed(1),
      daysLeftNum: daysLeft,
      severity,
    };
  });

  // Recharts footfall data (last 30 days actual + 14 days forecast)
  const histFF = (centre.footfall_history || []).slice(-30).map((r) => ({
    date: r.date.slice(5),
    actual: r.count,
  }));
  const forecastFF = (forecast?.footfall?.forecast || []).map((v, i) => ({
    date: forecast.forecast_dates[i].slice(5),
    forecast: Math.round(v),
  }));
  const ffChartData = [...histFF, ...forecastFF];

  // Selected drug stock vs consumption chart data
  const drugChartData = (centre.stock_history?.[selectedMed] || []).slice(-30).map((r) => ({
    date: r.date.slice(5),
    stock: r.stock_qty,
    consumption: r.consumption,
  }));

  const latestBed = centre.bed_history?.[centre.bed_history.length - 1];
  const latestAtt = centre.attendance_history?.[centre.attendance_history.length - 1];
  const latestTest = centre.test_history?.[centre.test_history.length - 1];

  const bedOccupied = latestBed?.occupied || 0;
  const bedCapacity = latestBed?.capacity || centre.bed_capacity || 10;
  const bedPct = Math.min(100, Math.round((bedOccupied / bedCapacity) * 100));

  const doctorsPresent = latestAtt?.present || 0;
  const doctorsPosted = latestAtt?.posted || 1;
  const absenceRate = Math.round(((doctorsPosted - doctorsPresent) / doctorsPosted) * 100);

  const TEST_KEYS = [
    { key: "malaria_rdt", label: t("entry.malariaRdt") },
    { key: "blood_test", label: t("entry.bloodTest") },
    { key: "x_ray", label: t("entry.xRay") },
    { key: "hiv_kit", label: t("entry.hivKit") },
    { key: "urine_test", label: t("entry.urineTest") },
  ];

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 hover:underline transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t("common.back")}</span>
        </Link>
      </div>

      {/* Facility Header Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {centre.name}
              </h1>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  centre.centre_type === "CHC"
                    ? "bg-teal-50 text-teal-800 border-teal-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {centre.centre_type}
              </span>
              <SeverityBadge severity={centre.marker === "green" ? "ok" : centre.marker} />
            </div>

            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {centre.district} District · Block: {centre.block || "District Central"} · Lat:{" "}
              {centre.latitude}, Lng: {centre.longitude}
            </p>
          </div>
        </div>

        {/* Health Score Gauge Ring */}
        <div className="flex items-center gap-4 bg-slate-50/80 border border-slate-100 rounded-xl px-5 py-3 self-start md:self-auto">
          <ScoreRing score={centre.score} />
          <div>
            <div className="font-bold text-slate-900 text-sm">{t("centre.score")}</div>
            <div className="text-xs text-slate-500">Aggregate district rating</div>
          </div>
        </div>
      </div>

      {/* Performance Warning Flags (if any) */}
      {centre.reasons?.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-amber-900 text-xs uppercase tracking-wider">
              Clinical &amp; Operational Flagged Observations
            </h4>
            <div className="flex flex-wrap gap-2 pt-1">
              {centre.reasons.map((r, i) => (
                <span
                  key={i}
                  className="inline-flex items-center text-xs font-medium bg-white text-amber-800 border border-amber-200/90 rounded-md px-2.5 py-1 shadow-2xs"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Key Stats Row: Bed Occupancy, Doctor Attendance, Diagnostic Kits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Bed Occupancy Card */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t("centre.bedGauge")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Bed className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-1 mb-2">
            <div className="text-2xl font-bold text-slate-900">
              {bedOccupied} <span className="text-sm font-normal text-slate-500">/ {bedCapacity} beds</span>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                bedPct > 85 ? "bg-red-50 text-red-700" : "bg-teal-50 text-teal-700"
              }`}
            >
              {bedPct}% Occupancy
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                bedPct > 85 ? "bg-red-500" : bedPct > 65 ? "bg-amber-500" : "bg-teal-600"
              }`}
              style={{ width: `${bedPct}%` }}
            />
          </div>
        </div>

        {/* Doctor Attendance Card */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t("centre.attendance")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-1 mb-2">
            <div className="text-2xl font-bold text-slate-900">
              {doctorsPresent} <span className="text-sm font-normal text-slate-500">/ {doctorsPosted} on duty</span>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                absenceRate > 20 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {absenceRate}% absent
            </span>
          </div>

          <div className="flex gap-1.5 pt-1">
            {Array.from({ length: doctorsPosted }).map((_, i) => (
              <div
                key={i}
                className={`h-2.5 flex-1 rounded-sm ${
                  i < doctorsPresent ? "bg-emerald-500" : "bg-amber-400"
                }`}
                title={i < doctorsPresent ? "Doctor Present" : "Doctor Absent"}
              />
            ))}
          </div>
        </div>

        {/* Diagnostic Kits Checklist */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t("centre.tests")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <TestTubes className="w-4 h-4" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {TEST_KEYS.map(({ key, label }) => {
              const available = latestTest?.[key];
              return (
                <div
                  key={key}
                  className={`flex items-center gap-1.5 p-1.5 rounded-md text-xs font-medium border ${
                    available
                      ? "bg-emerald-50/50 border-emerald-200/70 text-emerald-900"
                      : "bg-red-50/50 border-red-200/70 text-red-900"
                  }`}
                >
                  {available ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  )}
                  <span className="truncate">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footfall Projection Chart (Recharts) */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">
              {t("centre.forecastChart")}
            </h3>
            <p className="text-xs text-slate-500">
              Historical 30-day footfall with 14-day exponential projection
            </p>
          </div>

          {forecast?.footfall?.method && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
              <span>Model: {forecast.footfall.method.toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ffChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} stroke="#cbd5e1" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  borderRadius: "0.5rem",
                  boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Line
                type="monotone"
                dataKey="actual"
                name="Historical OPD Patients"
                stroke="#0d9488"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                name="14-Day Forecast Projection"
                stroke="#f97316"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Medicine Stock Table with Cover Progress Bars */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 text-base">
            {t("centre.stockHistory")}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            10 Essential drug inventory balances and depletion forecasts
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">{t("centre.medicine")}</th>
                <th className="py-3 px-4 text-right">{t("centre.stockQty")}</th>
                <th className="py-3 px-4 text-right">Avg Daily Burn</th>
                <th className="py-3 px-4 min-w-[150px]">Stock Runway</th>
                <th className="py-3 px-4 text-center">{t("centre.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {stockTableData.map(({ med, stock, avgCons, daysLeft, daysLeftNum, severity }) => {
                const isCrit = severity === "critical";
                const isWarn = severity === "warning";
                const pct = Math.min(100, Math.round((daysLeftNum / 21) * 100));

                return (
                  <tr key={med} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-slate-900">
                      {t(`medicines.${med}`)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                      {stock.toFixed(0)} <span className="text-xs text-slate-400">{t("common.units")}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-600 text-xs">
                      {avgCons} /day
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span
                          className={`font-bold ${
                            isCrit ? "text-red-600" : isWarn ? "text-amber-600" : "text-emerald-700"
                          }`}
                        >
                          {daysLeft === "999.0" ? "∞" : `${daysLeft} days`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {daysLeftNum > 21 ? "Surplus" : daysLeftNum > 7 ? "Adequate" : "Low"}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCrit ? "bg-red-500" : isWarn ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <SeverityBadge severity={severity} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Drug Trend Chart with Dropdown */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">
              Medicine Consumption History (Last 30 Days)
            </h3>
            <p className="text-xs text-slate-500">
              Inspect historical balance vs patient dispensing
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">{t("centre.selectMed")}:</span>
            <select
              value={selectedMed}
              onChange={(e) => setSelectedMed(e.target.value)}
              className="text-xs sm:text-sm font-medium border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
            >
              {MEDICINES.map((m) => (
                <option key={m} value={m}>
                  {t(`medicines.${m}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={drugChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} stroke="#cbd5e1" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  borderRadius: "0.5rem",
                  boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Bar dataKey="stock" fill="#0d9488" name="Stock Remaining" radius={[3, 3, 0, 0]} />
              <Bar dataKey="consumption" fill="#f97316" name="Daily Dispensed" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
