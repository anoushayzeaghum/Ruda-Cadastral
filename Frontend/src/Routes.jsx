import { Routes, Route } from "react-router-dom";
import React from "react";
import MainLayout from "./layouts/MainLayout";
import MapPage from "./pages/Mapview/MapPage";

import Dashboard from "./pages/Dashboard/dashboard";

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<MapPage />} />
        {/* <Route
          path="/dashboard"
          element={<PlaceholderPage title="Dashboard" />}
        />
        <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
        <Route path="/data" element={<PlaceholderPage title="Data" />} />
        <Route path="/about" element={<PlaceholderPage title="About" />} /> */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
