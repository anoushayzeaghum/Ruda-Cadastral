import { Outlet } from "react-router-dom";
import Header from "../pages/Mapview/Header";

export default function MainLayout() {
  return (
    <div className="app-layout">
      <Header />
      <main className="app-layout__main">
        <Outlet />
      </main>
    </div>
  );
}
