import Sidebar from "./Sidebar";
import KPISection from "./KPISection";
import Statistics, { FilterTab, Icon } from "./Statistics";
import Header from "./Header";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeFilter, setActiveFilter] = useState("land");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") setDarkMode(false);

    const savedSidebar = localStorage.getItem("sidebarOpen");
    if (savedSidebar !== null) {
      setSidebarOpen(savedSidebar === "true");
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", sidebarOpen);
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="h-screen overflow-hidden bg-white text-gray-800 dark:bg-[#0b0f14] dark:text-white">
      <div className="flex h-full flex-col">
        <Header
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          filterTabs={
            <div className="hidden md:flex items-center p-1 bg-white/95 dark:bg-slate-800/95 rounded-[12px] shadow-sm shrink-0">
              <FilterTab
                active={activeFilter === "land"}
                icon={<Icon type="land" className="h-4 w-4" />}
                label="Land Details"
                onClick={() => setActiveFilter("land")}
              />
              <FilterTab
                active={activeFilter === "mouza"}
                icon={<Icon type="mouza" className="h-4 w-4" />}
                label="Mouza Details"
                onClick={() => setActiveFilter("mouza")}
              />
            </div>
          }
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

          <main className="min-h-0 flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto px-3 pt-3 pb-3 xl:px-4 xl:pt-3 xl:pb-3">
              <div className="space-y-4">
                {/* Dashboard Page Header with Title on Left */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800/50 pb-3">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Dashboard Overview
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Real-time cadastral metrics, land records, and survey progress
                    </p>
                  </div>
                  {/* Mobile toggle (shows only on small screens since header toggle is hidden on mobile) */}
                  <div className="md:hidden flex items-center p-1 bg-[#f1f5f9] dark:bg-slate-800/50 rounded-[12px] self-start sm:self-auto shrink-0">
                    <FilterTab
                      active={activeFilter === "land"}
                      icon={<Icon type="land" className="h-4 w-4" />}
                      label="Land Details"
                      onClick={() => setActiveFilter("land")}
                    />
                    <FilterTab
                      active={activeFilter === "mouza"}
                      icon={<Icon type="mouza" className="h-4 w-4" />}
                      label="Mouza Details"
                      onClick={() => setActiveFilter("mouza")}
                    />
                  </div>
                </div>

                <KPISection activeFilter={activeFilter} />
                <Statistics activeFilter={activeFilter} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
