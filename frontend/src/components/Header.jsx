import { useTranslation } from "react-i18next";
import { Menu, Globe, Sparkles } from "lucide-react";

export default function Header({ onOpenSidebar, pageTitle }) {
  const { t, i18n } = useTranslation();

  const isHindi = i18n.language === "hi";

  const setLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 h-16 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {pageTitle && (
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 truncate">
            {pageTitle}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Synthetic demo badge */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/90 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
          <span>{t("nav.demoBadge")}</span>
        </div>

        {/* Language switch pill: [ EN | हिं ] */}
        <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200/80 shadow-2xs text-xs font-semibold">
          <button
            onClick={() => setLanguage("en")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              !isHindi
                ? "bg-white text-teal-800 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("hi")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              isHindi
                ? "bg-white text-teal-800 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            हिं
          </button>
        </div>
      </div>
    </header>
  );
}
