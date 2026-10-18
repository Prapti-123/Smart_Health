import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, ArrowRight } from "lucide-react";

const MARKER_COLORS = {
  red:   "#dc2626",
  amber: "#d97706",
  green: "#16a34a",
};

export default function HealthMap({ centres }) {
  const { t } = useTranslation();

  if (!centres || centres.length === 0) return null;

  // Geographic midpoint for monitored Chhattisgarh facilities
  const center = [20.95, 81.63];

  const counts = {
    green: centres.filter((c) => c.marker === "green").length,
    amber: centres.filter((c) => c.marker === "amber").length,
    red: centres.filter((c) => c.marker === "red").length,
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-sm sm:text-base">
              {t("overview.mapTitle")}
            </h2>
            <p className="text-xs text-slate-500">{t("overview.mapNote")}</p>
          </div>
        </div>

        {/* Legend status pills in header */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{t("overview.green")}: {counts.green}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{t("overview.amber")}: {counts.amber}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200/80">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>{t("overview.red")}: {counts.red}</span>
          </div>
        </div>
      </div>

      {/* Map canvas container */}
      <div className="bg-slate-100 relative">
        <MapContainer
          center={center}
          zoom={7}
          style={{ height: "460px", width: "100%", background: "#f1f5f9" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {centres.map((c) => (
            <CircleMarker
              key={c.id}
              center={[c.latitude, c.longitude]}
              radius={c.centre_type === "CHC" ? 11 : 7.5}
              pathOptions={{
                fillColor: MARKER_COLORS[c.marker] || "#64748b",
                color: "#ffffff",
                weight: 2,
                fillOpacity: 0.88,
              }}
            >
              <Popup className="health-popup">
                <div className="p-1 min-w-[180px]">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 mb-1.5">
                    <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                      {c.centre_type}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 mb-2">
                    {c.district} · {c.block}
                  </div>

                  <div className="space-y-1 text-xs mb-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Score:</span>
                      <span className="font-bold text-slate-900">{c.score}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Beds:</span>
                      <span className="font-medium text-slate-700">{c.bed_occupancy_pct}%</span>
                    </div>
                    {c.stock_alerts?.length > 0 && (
                      <div className="text-red-600 font-semibold text-[11px] pt-1">
                        ⚠️ {c.stock_alerts.length} critical medicine(s)
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/centres/${c.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline pt-1"
                  >
                    <span>{t("common.viewDetails")}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Legend footer note */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Large circle = CHC (30 beds) · Small circle = PHC (6 beds)</span>
        <span className="text-[11px] text-slate-400">Markers visible offline without tiles</span>
      </div>
    </div>
  );
}
