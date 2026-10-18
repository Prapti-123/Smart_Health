import { useTranslation } from "react-i18next";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

const SEVERITY_CONFIG = {
  critical: {
    classes: "bg-red-50 text-red-700 border-red-200/80 ring-red-500/10",
    icon: AlertCircle,
    dot: "bg-red-500",
    fallbackLabel: "Critical",
  },
  red: {
    classes: "bg-red-50 text-red-700 border-red-200/80 ring-red-500/10",
    icon: AlertCircle,
    dot: "bg-red-500",
    fallbackLabel: "Critical",
  },
  warning: {
    classes: "bg-amber-50 text-amber-700 border-amber-200/80 ring-amber-500/10",
    icon: AlertTriangle,
    dot: "bg-amber-500",
    fallbackLabel: "Warning",
  },
  amber: {
    classes: "bg-amber-50 text-amber-700 border-amber-200/80 ring-amber-500/10",
    icon: AlertTriangle,
    dot: "bg-amber-500",
    fallbackLabel: "Warning",
  },
  ok: {
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-emerald-500/10",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
    fallbackLabel: "Normal",
  },
  green: {
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-emerald-500/10",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
    fallbackLabel: "Normal",
  },
};

export default function SeverityBadge({ severity, showDot = true, showIcon = false }) {
  const { t } = useTranslation();
  const rawKey = (severity || "ok").toString().toLowerCase().trim();
  
  // Resolve config with explicit red check
  const isRed = rawKey === "red" || rawKey === "critical";
  const isAmber = rawKey === "amber" || rawKey === "warning";
  const config = isRed
    ? SEVERITY_CONFIG.critical
    : isAmber
    ? SEVERITY_CONFIG.warning
    : SEVERITY_CONFIG.ok;

  const Icon = config.icon;

  // Resolve localized text
  const label =
    t(`severity.${rawKey}`, { defaultValue: "" }) ||
    t(`severity.${isRed ? "critical" : isAmber ? "warning" : "ok"}`, { defaultValue: "" }) ||
    t(`overview.${rawKey}`, { defaultValue: "" }) ||
    config.fallbackLabel;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-xs ${config.classes}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
    </span>
  );
}
