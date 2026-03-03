import { Routes, Route, Navigate } from "react-router-dom";
import React, { useContext, useEffect } from "react";
import MapView from "./pages/Mapview/Mapview";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MapView />} />
    </Routes>
  );
};

export default AppRoutes;
