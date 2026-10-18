import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Overview from "./pages/Overview";
import CentreDetail from "./pages/CentreDetail";
import Alerts from "./pages/Alerts";
import Redistribution from "./pages/Redistribution";
import DataEntry from "./pages/DataEntry";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return t("overview.title");
    if (path.startsWith("/alerts")) return t("alerts.title");
    if (path.startsWith("/redistribution")) return t("redistribution.title");
    if (path.startsWith("/entry")) return t("entry.title");
    if (path.startsWith("/centres/")) return t("centre.title");
    return t("nav.title");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main layout with sidebar offset on desktop */}
      <div className="md:pl-64 flex flex-col flex-1 min-w-0">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          pageTitle={getPageTitle()}
        />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/centres/:id" element={<CentreDetail />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/redistribution" element={<Redistribution />} />
            <Route path="/entry" element={<DataEntry />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
