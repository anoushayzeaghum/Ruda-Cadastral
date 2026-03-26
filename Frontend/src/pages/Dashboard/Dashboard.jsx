import Sidebar from "./Sidebar";
import KPISection from "./KPISection";
import Statistics from "./Statistics";
import Header from "./Header";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Sidebar sidebarOpen={sidebarOpen} />

          <main className="min-h-0 flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto px-4 pt-4 pb-4 xl:px-5 xl:pt-4 xl:pb-4">
              <div className="space-y-4">
                <KPISection />
                <Statistics />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}