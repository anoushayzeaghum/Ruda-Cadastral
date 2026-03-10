import { Outlet, useLocation } from "react-router-dom";
import Header from "../pages/Mapview/Header";
import useCadastralFilters from "../hooks/useCadastralFilters";

export default function MainLayout() {
  const location = useLocation();
  const filters = useCadastralFilters();
  const isMapRoute = location.pathname === "/";

  return (
    <div className="app-layout">
      <Header filters={isMapRoute ? filters : null} />
      <main className="app-layout__main">
        <Outlet context={isMapRoute ? { filters } : {}} />
      </main>
    </div>
  );
}
