import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  AlertTriangle,
  ArrowLeftRight,
  ClipboardEdit,
  Activity,
  ShieldCheck,
} from "lucide-react";

export default function Sidebar({ isOpen, onClose }) {
  const { t } = useTranslation();

  const navItems = [
    { to: "/", label: t("nav.overview"), icon: LayoutDashboard },
    { to: "/alerts", label: t("nav.alerts"), icon: AlertTriangle },
    { to: "/redistribution", label: t("nav.redistribution"), icon: ArrowLeftRight },
    { to: "/entry", label: t("nav.dataEntry"), icon: ClipboardEdit },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <div className="font-bold text-slate-900 text-base leading-snug tracking-tight">
              {t("nav.title")}
            </div>
            <div className="text-[11px] font-medium text-teal-700 truncate">
              {t("nav.state")}
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-teal-50 text-teal-800 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-teal-600" : "text-slate-400"
                    }`}
                  />
                  <span className="truncate">{label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-4 bg-teal-600 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="truncate">{t("nav.subtitle")}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            v1.2 · Chhattisgarh Health MIS
          </div>
        </div>
      </aside>
    </>
  );
}
