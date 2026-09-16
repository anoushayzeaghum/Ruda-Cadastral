import React from "react";
import { Navigate, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import AreaLayout from "./layouts/AreaLayout";
import ProtectedRoute from "./pages/Auth/ProtectedRoute";

import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import LandingPage from "./pages/LandingPage/LandingPage";
import MapPage from "./pages/Mapview/MapPage";
import Demarcation from "./pages/Demarcation/Demarcation";
import SocietyMapPage from "./pages/SocietyMapDashboard/SocietyMapPage";
import Society3DMapPage from "./pages/3DMapview/Society3DMapPage";
import Society3DMapUploadPage from "./pages/Cesium3DModelUpload/Society3DMapPage";
import MetaverseDashboard from "./pages/GISMetaverse/MetaverseDashboard";
import MetaverseKMZLogs from "./pages/GISMetaverse/tools/Layers/KMZLogs";
import FlyToDashboard from "./pages/FlyToDedicated/FlyToDashboard";
import MasterPlanDashboard from "./pages/MasterPlan/MasterPlanDashboard";
import VirtualTourPage from "./pages/VirtualTour/VirtualTourPage";

// ============================================================
// NEW RUDA ADMIN DASHBOARD
// src/pages/AdminDashboard/Dashboard/
// ============================================================
import Dashboard from "./pages/AdminDashboard/Dashboard/Dashboard";

// ============================================================
// NEW ADMIN UI PAGES
// src/pages/AdminDashboard/Admin/
// ============================================================
import DataManagement from "./pages/AdminDashboard/Admin/DataManagement";
import ShapefileImport from "./pages/AdminDashboard/Admin/ShapefileImport";
import PlotManagement from "./pages/AdminDashboard/Admin/PlotManagement";
import PlotDetails from "./pages/AdminDashboard/Admin/PlotDetails";
import TransferPlotData from "./pages/AdminDashboard/Admin/TransferPlotData";
import Transfers from "./pages/AdminDashboard/Admin/Transfers";
import SimpleAdminPage from "./pages/AdminDashboard/Admin/SimpleAdminPage";
import AdminKMZLogs from "./pages/AdminDashboard/Admin/KMZMapLogs";

// ============================================================
// AREA / SHAPEFILE MODULES
// src/pages/AdminDashboard/Area Management/
// ============================================================
import District from "./pages/AdminDashboard/Area Management/District";
import Tehsil from "./pages/AdminDashboard/Area Management/Tehsil";
import Mauza from "./pages/AdminDashboard/Area Management/Mauza";
import Khasra from "./pages/AdminDashboard/Area Management/Khasra";
import Murabba from "./pages/AdminDashboard/Area Management/Murabba";
import Square from "./pages/AdminDashboard/Area Management/Square";
import Acre from "./pages/AdminDashboard/Area Management/Acre";
import Trijunction from "./pages/AdminDashboard/Area Management/Trijunction";
import FieldPoints from "./pages/AdminDashboard/Area Management/FieldPoints";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public entry points */}
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Everything below requires authentication */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* ====================================================
              ADMIN DASHBOARD
             ==================================================== */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* ====================================================
              DATA MANAGEMENT
             ==================================================== */}
          <Route path="/data-management" element={<DataManagement />} />
          <Route path="/data-management/import" element={<ShapefileImport />} />

          {/* ====================================================
              PLOT MANAGEMENT
             ==================================================== */}
          <Route path="/plot-management" element={<PlotManagement />} />
          <Route path="/plot-management/details" element={<PlotDetails />} />
          <Route
            path="/plot-management/transfer"
            element={<TransferPlotData />}
          />

          {/* ====================================================
              TRANSFERS
             ==================================================== */}
          <Route path="/transfers" element={<Transfers />} />

          {/* ====================================================
              ADMIN PLACEHOLDER PAGES
             ==================================================== */}
          <Route
            path="/reports"
            element={
              <SimpleAdminPage
                title="Reports"
                description="View and manage RUDA GIS reports."
              />
            }
          />
          <Route
            path="/users"
            element={
              <SimpleAdminPage
                title="Users"
                description="Manage administration portal users and access."
              />
            }
          />
          <Route
            path="/settings"
            element={
              <SimpleAdminPage
                title="Settings"
                description="Manage RUDA GIS administration settings."
              />
            }
          />
          <Route path="/kmz-logs" element={<AdminKMZLogs />} />

          {/* ====================================================
              EXISTING APPLICATION ROUTES
             ==================================================== */}
          <Route path="/demarcation" element={<Demarcation />} />
          <Route path="/Mapview" element={<MapPage />} />
          <Route path="/cadastral-map" element={<MapPage />} />
          <Route path="/society-map" element={<SocietyMapPage />} />
          <Route path="/society-3d" element={<Society3DMapPage />} />
          <Route path="/gis-metaverse" element={<MetaverseDashboard />} />
          <Route
            path="/gis-metaverse/kmz-logs"
            element={<MetaverseKMZLogs />}
          />
          <Route path="/virtual-tour" element={<VirtualTourPage />} />
          <Route path="/flyto-dashboard" element={<FlyToDashboard />} />
          <Route path="/masterplan" element={<MasterPlanDashboard />} />
          <Route
            path="/society-3d-upload"
            element={<Society3DMapUploadPage />}
          />

          {/* ====================================================
              SHAPEFILE / AREA MANAGEMENT ROUTES
              The new Import Center links to these URLs.
             ==================================================== */}
          <Route path="/area" element={<AreaLayout />}>
            <Route path="district" element={<District />} />
            <Route path="tehsil" element={<Tehsil />} />
            <Route path="mauza" element={<Mauza />} />
            <Route path="khasra" element={<Khasra />} />
            <Route path="square" element={<Square />} />
            <Route path="acre" element={<Acre />} />
            <Route path="trijunction" element={<Trijunction />} />
            <Route path="fieldpoints" element={<FieldPoints />} />
            <Route path="murabba" element={<Murabba />} />
            <Route
              path="society-3d-upload"
              element={<Society3DMapUploadPage />}
            />
          </Route>
        </Route>
      </Route>

      {/* Optional fallback */}
      <Route path="*" element={<Navigate to="/landing" replace />} />
    </Routes>
  );
};

export default AppRoutes;
