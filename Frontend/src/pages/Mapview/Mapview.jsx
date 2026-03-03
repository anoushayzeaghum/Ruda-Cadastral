import Header from "./Header";
import FiltersBar from "./FiltersBar";
import MapContainer from "./MapContainer";
import SidePanel from "./SidePanel";
import "./styles/mapview.css";

export default function MapView() {
  return (
    <div className="mapview-wrapper">
      <Header />
      <FiltersBar />

      <div className="map-layout">
        <MapContainer />
        <SidePanel />
      </div>
    </div>
  );
}
