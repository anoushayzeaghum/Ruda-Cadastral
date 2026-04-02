import { Routes, Route } from "react-router-dom";
import React from "react";
import MainLayout from "./layouts/MainLayout";
import MapPage from "./pages/Mapview/MapPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import Login from "./pages/Auth/Login";
import Division from "./pages/Area Management/Division";
import District from "./pages/Area Management/District";
import Tehsil from "./pages/Area Management/Tehsil";
import Mouza from "./pages/Area Management/Mouza";
import Khasra from "./pages/Area Management/Khasra";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mapview" element={<MapPage />} />
        {/* Area Management pages */}
        <Route path="/area/division" element={<Division />} />
        <Route path="/area/district" element={<District />} />
        <Route path="/area/tehsil" element={<Tehsil />} />
        <Route path="/area/mouza" element={<Mouza />} />
        <Route path="/area/khasra" element={<Khasra />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
