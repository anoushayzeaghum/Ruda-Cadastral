import { Outlet, useLocation } from "react-router-dom";
import useCadastralFilters from "../hooks/useCadastralFilters";

export default function MainLayout() {
  const location = useLocation();

const enableFilters = [
  "/mapview",
  "/cadastral-map",
].includes(location.pathname.toLowerCase());

  const filters = useCadastralFilters(enableFilters);

  return (
    <div className="app-layout">
      <main className="app-layout__main">
        <Outlet context={{ filters }} />
      </main>
    </div>
  );
}