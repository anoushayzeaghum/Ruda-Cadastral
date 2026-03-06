import { Routes, Route, Navigate } from "react-router-dom";
import React, { useContext, useEffect } from "react";
import MapPage from "./pages/Mapview/MapPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
    </Routes>
  );
};

export default AppRoutes;
