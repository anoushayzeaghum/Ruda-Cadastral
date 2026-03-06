import Header from "./Header";
import FilterPanel from "./FilterPanel";
import MapView from "./MapView";

export default function MapPage() {
  return (
    <div className="h-screen flex flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <FilterPanel />
        <MapView />
      </div>
    </div>
  );
}