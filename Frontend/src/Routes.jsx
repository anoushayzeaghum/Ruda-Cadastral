import { Routes, Route } from "react-router-dom";
import React from "react";
import MainLayout from "./layouts/MainLayout";
import MapPage from "./pages/Mapview/MapPage";
import PlaceholderPage from "./pages/PlaceholderPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<MapPage />} />
        <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
        <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
        <Route path="/data" element={<PlaceholderPage title="Data" />} />
        <Route path="/about" element={<PlaceholderPage title="About" />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
