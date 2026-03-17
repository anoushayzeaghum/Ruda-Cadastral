import { Routes, Route } from "react-router-dom";
import React from "react";
import MainLayout from "./layouts/MainLayout";
import MapPage from "./pages/Mapview/MapPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import Login from "./pages/Auth/Login";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mapview" element={<MapPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
