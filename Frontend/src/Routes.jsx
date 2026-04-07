import { Routes, Route } from "react-router-dom";
import React from "react";
import MainLayout from "./layouts/MainLayout";
import MapPage from "./pages/Mapview/MapPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Division from "./pages/Area Management/Division";
import District from "./pages/Area Management/District";
import Tehsil from "./pages/Area Management/Tehsil";
import Mouza from "./pages/Area Management/Mouza";
import Khasra from "./pages/Area Management/Khasra";
import AreaLayout from "./layouts/AreaLayout";
import Demarcation from "./pages/Demarcation/Demarcation";
import ProtectedRoute from "./pages/Auth/ProtectedRoute";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/demarcation" element={<Demarcation />} />
          <Route path="/mapview" element={<MapPage />} />

          <Route path="/area" element={<AreaLayout />}>
            <Route path="division" element={<Division />} />
            <Route path="district" element={<District />} />
            <Route path="tehsil" element={<Tehsil />} />
            <Route path="mouza" element={<Mouza />} />
            <Route path="khasra" element={<Khasra />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
