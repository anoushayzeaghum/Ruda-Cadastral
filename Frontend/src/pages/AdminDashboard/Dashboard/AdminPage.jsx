import { useEffect, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function AdminPage({ children, contentClassName = "" }) {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    setDarkMode(savedTheme === "dark");

    const savedSidebar = localStorage.getItem("sidebarOpen");
    if (savedSidebar !== null) setSidebarOpen(savedSidebar === "true");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", String(sidebarOpen));
  }, [sidebarOpen]);

  return (
    <div className="h-screen overflow-hidden bg-[#f4f6f8] text-slate-900 dark:bg-[#08110d] dark:text-white">
      <div className="flex h-full flex-col">
        <Header
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          sidebarOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen((value) => !value)}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Sidebar sidebarOpen={sidebarOpen} />
          <main className={`min-w-0 flex-1 overflow-y-auto ${contentClassName}`}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
