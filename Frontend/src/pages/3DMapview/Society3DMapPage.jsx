import { useEffect, useMemo, useState } from "react";

import Society3DHeader from "./Society3DHeader";
import Society3DSubHeader from "./Society3DSubHeader";
import Society3DMapview from "./Society3DMapview";
import Society3DLeftToolbar from "./Society3DLeftToolbar";
import Society3DInfoPanel from "./Society3DInfoPanel";
import { getItemId, getProjects } from "./api";
import { getFeatureId } from "./cesiumHelpers";

const initialLayers = {
  projectBoundary: { visible: false, opacity: 35 },
  masterPlan: { visible: false, opacity: 15 },
  plots3d: { visible: false, opacity: 100 },
  buildings3d: { visible: false, opacity: 100 },
  roads: { visible: false, opacity: 100 },
  greenSpaces: { visible: false, opacity: 100 },
  spotLevel: { visible: false, opacity: 100 },
  contours: { visible: false, opacity: 100 },
};

export default function Society3DMapPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectError, setProjectError] = useState("");

  const [layers, setLayers] = useState(initialLayers);
  const [basemap, setBasemap] = useState("Streets");
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [clearSelectionSignal, setClearSelectionSignal] = useState(0);
  const [activePanel, setActivePanel] = useState(null);
  const [bimPanelOpen, setBimPanelOpen] = useState(false);
  const [bimLayers, setBimLayers] = useState({ manholesModel: false });

  const [extrusion, setExtrusion] = useState({
    heightFeet: 100,
    color: "#22d3ee",
    extrudeFrom: "base",
  });
  const [appliedExtrusions, setAppliedExtrusions] = useState({});

  useEffect(() => {
    let mounted = true;

    const loadProjects = async () => {
      try {
        setProjectLoading(true);
        setProjectError("");
        const data = await getProjects();

        if (!mounted) return;
        setProjects(Array.isArray(data) ? data : []);
        setSelectedProject("");
      } catch (err) {
        console.error("Failed to load projects", err);
        if (mounted) {
          setProjects([]);
          setProjectError("Failed to load projects.");
        }
      } finally {
        if (mounted) setProjectLoading(false);
      }
    };

    loadProjects();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedProjectItem = useMemo(() => {
    if (!selectedProject) return null;
    return (
      projects.find((project) => String(getItemId(project)) === String(selectedProject)) ||
      null
    );
  }, [projects, selectedProject]);

  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    setSelectedFeature(null);
    setInfoPanelOpen(false);
    setClearSelectionSignal((prev) => prev + 1);
    setAppliedExtrusions({});

    if (!projectId) {
      setLayers(initialLayers);
      return;
    }

    // Nothing loads on page start. After user selects a project, show its boundary and 3D model.
    setLayers((prev) => ({
      ...prev,
      projectBoundary: { ...prev.projectBoundary, visible: true },
      masterPlan: { ...prev.masterPlan, visible: false },
      plots3d: { ...prev.plots3d, visible: true },
      buildings3d: { ...prev.buildings3d, visible: false },
      roads: { ...prev.roads, visible: false },
      greenSpaces: { ...prev.greenSpaces, visible: false },
      spotLevel: { ...prev.spotLevel, visible: false },
      contours: { ...prev.contours, visible: false },
    }));
  };

  const handleFeatureSelect = (feature) => {
    setSelectedFeature(feature);
    setInfoPanelOpen(Boolean(feature));
  };

  const handleToolPanelToggle = (panelName) => {
    setActivePanel((prev) => (prev === panelName ? null : panelName));
  };

  useEffect(() => {
    setBimPanelOpen(activePanel === "bim");
  }, [activePanel]);

  const applyExtrusionToSelected = () => {
    if (!selectedFeature) return;

    const featureId = getFeatureId(selectedFeature);
    const heightFeet = Number(extrusion.heightFeet || 35);

    setAppliedExtrusions((prev) => ({
      ...prev,
      [featureId]: {
        heightMeters: heightFeet * 0.3048,
        color: extrusion.color,
        extrudeFrom: extrusion.extrudeFrom,
      },
    }));
  };

  const clearExtrusions = () => {
    setAppliedExtrusions({});
  };

  const closeInfoPanel = () => {
    setInfoPanelOpen(false);
    setSelectedFeature(null);
    setClearSelectionSignal((prev) => prev + 1);
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-950">
      <Society3DHeader />

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <Society3DMapview
          selectedProject={selectedProjectItem}
          layers={layers}
          basemap={basemap}
          extrusion={extrusion}
          appliedExtrusions={appliedExtrusions}
          activePanel={activePanel}
          onToolPanelToggle={handleToolPanelToggle}
          onFeatureSelect={handleFeatureSelect}
          clearSelectionSignal={clearSelectionSignal}
        />

        <Society3DSubHeader
          projects={projects}
          selectedProject={selectedProject}
          onProjectChange={handleProjectChange}
          loading={{ projects: projectLoading }}
        />

        <Society3DLeftToolbar
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          layers={layers}
          setLayers={setLayers}
          basemap={basemap}
          setBasemap={setBasemap}
          selectedProject={selectedProjectItem}
          extrusion={extrusion}
          setExtrusion={setExtrusion}
          bimPanelOpen={bimPanelOpen}
          setBimPanelOpen={setBimPanelOpen}
          bimLayers={bimLayers}
          setBimLayers={setBimLayers}
          selectedFeature={selectedFeature}
          onApplyToSelected={applyExtrusionToSelected}
          onClearExtrusions={clearExtrusions}
        />

        <Society3DInfoPanel
          feature={selectedFeature}
          isOpen={infoPanelOpen}
          onClose={closeInfoPanel}
        />

        {projectError && (
          <div className="absolute left-1/2 top-[88px] z-40 -translate-x-1/2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 shadow">
            {projectError}
          </div>
        )}
      </main>
    </div>
  );
}

