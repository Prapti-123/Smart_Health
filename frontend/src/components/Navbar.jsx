import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: "/", label: t("nav.overview") },
    { to: "/alerts", label: t("nav.alerts") },
    { to: "/redistribution", label: t("nav.redistribution") },
    { to: "/entry", label: t("nav.dataEntry") },
  ];

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === "en" ? "hi" : "en");
  };

  const isActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <nav className="bg-blue-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏥</span>
            <div>
              <div className="font-bold text-lg leading-tight">{t("nav.title")}</div>
              <div className="text-xs text-blue-200 leading-tight">{t("nav.subtitle")}</div>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(l.to)
                    ? "bg-blue-900 text-white"
                    : "text-blue-100 hover:bg-blue-600"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <button
              onClick={toggleLang}
              className="ml-4 px-3 py-1.5 bg-blue-500 hover:bg-blue-400 rounded-full text-sm font-semibold transition-colors"
            >
              {i18n.language === "en" ? "हिन्दी" : "English"}
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-blue-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-3 space-y-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive(l.to) ? "bg-blue-900" : "hover:bg-blue-600"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <button
              onClick={toggleLang}
              className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600"
            >
              {i18n.language === "en" ? "हिन्दी में बदलें" : "Switch to English"}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
