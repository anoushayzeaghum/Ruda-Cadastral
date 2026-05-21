import Sidebar from "./Sidebar";
import KPISection from "./KPISection";
import MapPanel from "./MapPanel";
import ChartsPanel from "./ChartsPanel";
import Header from "./Header";
import TehsilMouzaCard from "./TehsilMouzaCard";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(true);

  // ✅ Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") setDarkMode(false);
  }, []);

  // ✅ Apply theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <div className="h-screen bg-white dark:bg-[#0b0f14] text-gray-800 dark:text-white flex flex-col">
      <Header darkMode={darkMode} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-w-0 px-6 pt-6">
            <KPISection />
          </div>

          <div className="grid min-h-0 min-w-0 flex-1 grid-cols-4 gap-3 p-6 pt-4">
            <div className="col-span-2 h-full">
              <MapPanel darkMode={darkMode} />
            </div>

            <div className="col-span-2 h-full">
              <div className="mb-3">
                <TehsilMouzaCard />
              </div>
              <ChartsPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
