import { useCallback, useRef, useState } from "react";
import MasterPlanHeader from "./MasterPlanHeader";
import MasterPlanSubHeader from "./MasterPlanSubHeader";
import MasterPlanLeftToolbar from "./MasterPlanLeftToolbar";
import FlyToMap from "../FlyToDedicated/FlyToMap";
import FlyToMapControls from "../FlyToDedicated/FlyToMapControls";

// ── Default state ────────────────────────────────────────────────────────────
// Top-level project hierarchy (phase / projectType / projectId) is required by
// MasterPlanSubHeader (which wraps MetaverseSubHeader).  All lower-level plot
// filters are kept so FlyToMap and shared layer components continue to work.
const DEFAULT_FILTERS = {
  // SubHeader hierarchy
  phase: "",
  projectType: "",
  projectId: "",

  // Plot / layer filters (used by FlyToMap and shared layer components)
  block: "",
  plotType: "",
  plotNo: "",
  area: "",
  parkfront: "",
  rd_facing: "",
  poss_st: "",
  plotStatus: "",
  tr_cate: "",
  tr_own: "",
  site_plan: "",
};

const DEFAULT_LAYER_VISIBILITY = {
  boundary: false,
  blockBoundary: false,
  masterPlan: false,
  spotLevel: false,
  contours: false,
  roads: false,
  plotLimits: false,
  topography: false,

  boundaryOpacity: 100,
  blockBoundaryOpacity: 100,
  masterPlanOpacity: 100,
  spotLevelOpacity: 100,
  contoursOpacity: 100,
  roadsOpacity: 100,
  plotLimitsOpacity: 100,
  topographyOpacity: 80,

  waterSupplyPoints: false,
  waterSupplyLines: false,
  sewagePoints: false,
  cameraLocations: false,
  notifiedBoundary: false,

  waterSupplyPointsOpacity: 100,
  waterSupplyLinesOpacity: 100,
  sewagePointsOpacity: 100,
  cameraLocationsOpacity: 100,
  notifiedBoundaryOpacity: 100,
};

const DEFAULT_ADMIN_BOUNDARY_VISIBILITY = {
  rudaBoundary: false,
  rudaMauzaBoundary: false,
  geodeticNetwork: false,
  proposedRoads: false,
  rtwPackage: false,
  rtwAlignment: false,
  stateLand: false,
  awardedLand: false,
  possessionLand: false,

  rudaBoundaryOpacity: 50,
  rudaMauzaBoundaryOpacity: 100,
  geodeticNetworkOpacity: 100,
  proposedRoadsOpacity: 100,
  rtwPackageOpacity: 100,
  rtwAlignmentOpacity: 100,
  stateLandOpacity: 100,
  awardedLandOpacity: 100,
  possessionLandOpacity: 100,
};

export default function MasterPlanDashboard() {
  const mapRef = useRef(null);

  const [isMapReady, setIsMapReady] = useState(false);
  const [activeTool, setActiveTool] = useState("layers");
  const [showMetaverseLegend, setShowMetaverseLegend] = useState(false);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [layerVisibility, setLayerVisibility] = useState(
    DEFAULT_LAYER_VISIBILITY,
  );
  const [adminBoundaryVisibility] = useState(DEFAULT_ADMIN_BOUNDARY_VISIBILITY);

  // ── Reset handler — clears only Master Plan page state ───────────────────
  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setLayerVisibility(DEFAULT_LAYER_VISIBILITY);
    setShowMetaverseLegend(false);
  }, []);

  const handleIntroComplete = useCallback(() => {}, []);

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#0f3d2e]">
      <MasterPlanHeader />

      <section className="relative h-[calc(100vh-56px)] w-full overflow-hidden">
        {/* Map — renders first so it fills the full area behind everything */}
        <FlyToMap
          mapRef={mapRef}
          isMapReady={isMapReady}
          setIsMapReady={setIsMapReady}
          filters={filters}
          layerVisibility={layerVisibility}
          setLayerVisibility={setLayerVisibility}
          adminBoundaryVisibility={adminBoundaryVisibility}
          onIntroComplete={handleIntroComplete}
        />

        {/* SubHeader — centred near the top of the map, matching GIS Metaverse */}
        <MasterPlanSubHeader
          filters={filters}
          setFilters={setFilters}
          setLayerVisibility={setLayerVisibility}
          onReset={handleReset}
          onCalendarClick={() => {
            // Placeholder — no calendar feature on Master Plan yet.
          }}
        />

        {/* Left toolbar */}
        <MasterPlanLeftToolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          map={isMapReady ? mapRef.current : null}
          filters={filters}
          setFilters={setFilters}
          layerVisibility={layerVisibility}
          setLayerVisibility={setLayerVisibility}
        />

        {/* Map controls — top-right overlay */}
        <FlyToMapControls
          map={isMapReady ? mapRef.current : null}
          showMetaverseLegend={showMetaverseLegend}
          setShowMetaverseLegend={setShowMetaverseLegend}
          adminBoundaryVisibility={adminBoundaryVisibility}
        />
      </section>
    </main>
  );
}
