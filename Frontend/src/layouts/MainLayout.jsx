import { Outlet, useLocation } from "react-router-dom";
import useCadastralFilters from "../hooks/useCadastralFilters";

export default function MainLayout() {
  const location = useLocation();
  const filters = useCadastralFilters();
  const isMapRoute = location.pathname === "/mapview";

  return (
    <div className="app-layout">
      <main className="app-layout__main">
        <Outlet context={isMapRoute ? { filters } : {}} />
      </main>
    </div>
  );
}
