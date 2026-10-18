import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import {
  ClipboardCheck,
  Building2,
  Calendar,
  Users,
  Bed,
  TestTubes,
  Pill,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
} from "lucide-react";
import { CardSkeleton } from "../components/Skeleton";

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

const defaultStocks = MEDICINES.map((m) => ({
  medicine: m,
  stock_qty: "",
  consumption: "",
}));

export default function DataEntry() {
  const { t } = useTranslation();
  const [centres, setCentres] = useState([]);
  const [loadingCentres, setLoadingCentres] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // "success" | "error"
  const [statusMessage, setStatusMessage] = useState("");

  const [form, setForm] = useState({
    centre_id: "",
    record_date: new Date().toISOString().slice(0, 10),
    footfall: "",
    beds_occupied: "",
    doctors_posted: "",
    doctors_present: "",
    malaria_rdt: true,
    blood_test: true,
    x_ray: true,
    hiv_kit: true,
    urine_test: true,
    stocks: defaultStocks,
  });

  useEffect(() => {
    axios
      .get("/api/centres")
      .then((r) => {
        setCentres(r.data);
        setLoadingCentres(false);
      })
      .catch(() => {
        setLoadingCentres(false);
      });
  }, []);

  const setField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const setStockRow = (index, field, value) => {
    setForm((f) => {
      const stocks = [...f.stocks];
      stocks[index] = { ...stocks[index], [field]: value };
      return { ...f, stocks };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.centre_id) {
      setStatus("error");
      setStatusMessage("Please select a health centre before submitting.");
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      const payload = {
        centre_id: parseInt(form.centre_id),
        record_date: form.record_date,
        footfall: form.footfall ? parseInt(form.footfall) : undefined,
        beds_occupied: form.beds_occupied ? parseInt(form.beds_occupied) : undefined,
        doctors_posted: form.doctors_posted ? parseInt(form.doctors_posted) : undefined,
        doctors_present: form.doctors_present ? parseInt(form.doctors_present) : undefined,
        malaria_rdt: form.malaria_rdt,
        blood_test: form.blood_test,
        x_ray: form.x_ray,
        hiv_kit: form.hiv_kit,
        urine_test: form.urine_test,
        stocks: form.stocks
          .filter((s) => s.stock_qty !== "" || s.consumption !== "")
          .map((s) => ({
            medicine: s.medicine,
            stock_qty: parseFloat(s.stock_qty) || 0,
            consumption: parseFloat(s.consumption) || 0,
          })),
      };

      await axios.post("/api/entry", payload);
      setStatus("success");
      setStatusMessage(t("entry.success"));

      // Scroll to top to see notification
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Reset drug entries
      setForm((f) => ({
        ...f,
        footfall: "",
        beds_occupied: "",
        doctors_present: "",
        stocks: defaultStocks,
      }));
    } catch {
      setStatus("error");
      setStatusMessage(t("entry.error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCentres) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-10 bg-slate-200 animate-pulse rounded-lg w-1/3" />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const inputCls =
    "w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-2xs transition-colors";
  const labelCls = "block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("entry.title")}
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {t("entry.subtitle")}
        </p>
      </div>

      {/* Success Notification Banner */}
      {status === "success" && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-sm font-semibold">{statusMessage}</div>
        </div>
      )}

      {/* Error Notification Banner */}
      {status === "error" && (
        <div className="bg-red-50 border border-red-200 text-red-900 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="text-sm font-semibold">{statusMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Facility & Date Selection */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-900 text-base">
              1. Facility Identification &amp; Date
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                {t("entry.centre")} <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.centre_id}
                onChange={(e) => setField("centre_id", e.target.value)}
                className={inputCls}
              >
                <option value="">{t("entry.selectCentre")}</option>
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.centre_type}) - {c.district}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>{t("entry.date")}</label>
              <input
                type="date"
                required
                value={form.record_date}
                onChange={(e) => setField("record_date", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Daily Operations (Footfall, Beds, Staffing) */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Users className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-900 text-base">
              2. OPD Footfall &amp; Inpatient Operations
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>{t("entry.footfall")}</label>
              <input
                type="number"
                min="0"
                value={form.footfall}
                onChange={(e) => setField("footfall", e.target.value)}
                className={inputCls}
                placeholder="e.g. 45"
              />
            </div>

            <div>
              <label className={labelCls}>{t("entry.bedsOccupied")}</label>
              <input
                type="number"
                min="0"
                value={form.beds_occupied}
                onChange={(e) => setField("beds_occupied", e.target.value)}
                className={inputCls}
                placeholder="e.g. 4"
              />
            </div>

            <div>
              <label className={labelCls}>{t("entry.doctorsPosted")}</label>
              <input
                type="number"
                min="0"
                value={form.doctors_posted}
                onChange={(e) => setField("doctors_posted", e.target.value)}
                className={inputCls}
                placeholder="e.g. 2"
              />
            </div>

            <div>
              <label className={labelCls}>{t("entry.doctorsPresent")}</label>
              <input
                type="number"
                min="0"
                value={form.doctors_present}
                onChange={(e) => setField("doctors_present", e.target.value)}
                className={inputCls}
                placeholder="e.g. 2"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Diagnostic Kits Availability */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <TestTubes className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-900 text-base">
              3. Diagnostic Kit Availability
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: "malaria_rdt", label: t("entry.malariaRdt") },
              { key: "blood_test", label: t("entry.bloodTest") },
              { key: "x_ray", label: t("entry.xRay") },
              { key: "hiv_kit", label: t("entry.hivKit") },
              { key: "urine_test", label: t("entry.urineTest") },
            ].map(({ key, label }) => (
              <label
                key={key}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  form[key]
                    ? "bg-teal-50/60 border-teal-300 text-teal-950 font-medium"
                    : "bg-slate-50 border-slate-200 text-slate-500"
                }`}
              >
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => setField(key, e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 accent-teal-600"
                />
                <span className="text-xs sm:text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Section 4: Medicine Stock & Burn Rate */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold text-slate-900 text-base">
                4. Essential Medicine Stock Balance &amp; Daily Dispensed
              </h3>
            </div>
            <span className="text-xs text-slate-400">10 Monitored Drugs</span>
          </div>

          <div className="space-y-2.5">
            <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
              <div className="col-span-6 sm:col-span-5">Drug Formulation</div>
              <div className="col-span-3 sm:col-span-3 text-right">Balance (Units)</div>
              <div className="col-span-3 sm:col-span-4 text-right">Today's Dispensed</div>
            </div>

            {form.stocks.map((s, i) => (
              <div
                key={s.medicine}
                className="grid grid-cols-12 gap-2.5 items-center p-2 rounded-lg hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100"
              >
                <div className="col-span-6 sm:col-span-5 text-sm font-semibold text-slate-800">
                  {t(`medicines.${s.medicine}`)}
                </div>

                <div className="col-span-3 sm:col-span-3">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={s.stock_qty}
                    onChange={(e) => setStockRow(i, "stock_qty", e.target.value)}
                    placeholder="Balance"
                    className="w-full text-right bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="col-span-3 sm:col-span-4">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={s.consumption}
                    onChange={(e) => setStockRow(i, "consumption", e.target.value)}
                    placeholder="Dispensed"
                    className="w-full text-right bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t("common.loading")}</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{t("entry.submit")}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
