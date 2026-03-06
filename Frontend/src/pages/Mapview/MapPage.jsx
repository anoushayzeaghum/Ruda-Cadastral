import { useState } from "react";
import Header from "./Header";
import FilterPanel from "./FilterPanel";
import MapView from "./MapView";

export default function MapPage() {

  const [selectedMouza, setSelectedMouza] = useState(null);

  return (
    <div className="h-screen w-screen relative">

      <Header />

      <FilterPanel onMouzaSelect={setSelectedMouza} />

      <MapView mouzaId={selectedMouza} />

    </div>
  );
}