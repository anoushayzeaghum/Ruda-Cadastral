import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../pages/Dashboard/Sidebar";
import Header from "../pages/Dashboard/Header";

export default function AreaLayout() {
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

  const toggleSidebar = () => setSidebarOpen((s) => !s);

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
            <div className="h-full overflow-y-auto px-3 pt-3 pb-3 xl:px-4 xl:pt-3 xl:pb-3">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
