import { Routes, Route } from "react-router-dom";
import React from "react";
import MainLayout from "./layouts/MainLayout";
import MapPage from "./pages/Mapview/MapPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import District from "./pages/Area Management/District";
import Tehsil from "./pages/Area Management/Tehsil";
import Mauza from "./pages/Area Management/Mauza";
import Khasra from "./pages/Area Management/Khasra";
import Murabba from "./pages/Area Management/Murabba";
import AreaLayout from "./layouts/AreaLayout";
import Demarcation from "./pages/Demarcation/Demarcation";
import ProtectedRoute from "./pages/Auth/ProtectedRoute";
import LandingPage from "./pages/LandingPage/LandingPage";
import SocietyMapPage from "./pages/SocietyMapDashboard/SocietyMapPage";
import Society3DMapPage from "./pages/3DMapview/Society3DMapPage";
import MetaverseDashboard from "./pages/GISMetaverse/MetaverseDashboard";
import FlyToDashboard from "./pages/FlyToDedicated/FlyToDashboard";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Main page after login */}
          <Route path="/" element={<LandingPage />} />

          {/* Optional direct landing route */}
          <Route path="/landing" element={<LandingPage />} />

          {/* Admin dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/demarcation" element={<Demarcation />} />
          <Route path="/mapview" element={<MapPage />} />
          <Route path="/cadastral-map" element={<MapPage />} />
          <Route path="/society-map" element={<SocietyMapPage />} />
          <Route path="/society-3d" element={<Society3DMapPage />} />
          <Route path="/gis-metaverse" element={<MetaverseDashboard />} />
          <Route path="/flyto-dashboard" element={<FlyToDashboard />} />

          <Route path="/area" element={<AreaLayout />}>
            <Route path="district" element={<District />} />
            <Route path="tehsil" element={<Tehsil />} />
            <Route path="mauza" element={<Mauza />} />
            <Route path="khasra" element={<Khasra />} />
            <Route path="murabba" element={<Murabba />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
