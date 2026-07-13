import { useEffect, useMemo, useState } from "react";

import Society3DHeader from "./Society3DHeader";
import Society3DSubHeader from "./Society3DSubHeader";
import Society3DMapview from "./Society3DMapview";
import Society3DLeftToolbar from "./Society3DLeftToolbar";
import Society3DInfoPanel from "./Society3DInfoPanel";
import { getItemId, getProjects } from "./api";

const initialLayers = {
  projectBoundary: { visible: false, opacity: 35 },
  masterPlan: { visible: false, opacity: 15 },
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
  const [bimLayers, setBimLayers] = useState({ chaharBaghBim: true });

  const [uploadedModel, setUploadedModel] = useState({
    name: "",
    url: "",
    error: "",
    settings: {
      longitude: 74.2484,
      latitude: 31.5204,
      height: 0,
      heading: 0,
      pitch: 0,
      roll: 0,
      scale: 1,
      visible: true,
    },
  });
  const [captureMapCenterSignal, setCaptureMapCenterSignal] = useState(0);
  const [flyToModelSignal, setFlyToModelSignal] = useState(0);

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

    if (!projectId) {
      setLayers(initialLayers);
      return;
    }

    // After project selection, show only its boundary. No land-use 3D model is generated.
    setLayers((prev) => ({
      ...prev,
      projectBoundary: { ...prev.projectBoundary, visible: true },
      masterPlan: { ...prev.masterPlan, visible: false },
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

  const closeInfoPanel = () => {
    setInfoPanelOpen(false);
    setSelectedFeature(null);
    setClearSelectionSignal((prev) => prev + 1);
  };

  const handleModelFileSelect = (file) => {
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["glb", "gltf"].includes(extension)) {
      setUploadedModel((prev) => ({
        ...prev,
        error: "Unsupported file. Upload a .glb or self-contained .gltf model.",
      }));
      return;
    }

    setUploadedModel((prev) => {
      if (prev.url) URL.revokeObjectURL(prev.url);
      return {
        ...prev,
        name: file.name,
        url: URL.createObjectURL(file),
        error: "",
        settings: { ...prev.settings, visible: true },
      };
    });
  };

  const handleModelSettingsChange = (patch) => {
    setUploadedModel((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  };

  const handleMapCenterCaptured = ({ longitude, latitude, height = 0 }) => {
    handleModelSettingsChange({ longitude, latitude, height });
  };

  const removeUploadedModel = () => {
    setUploadedModel((prev) => {
      if (prev.url) URL.revokeObjectURL(prev.url);
      return {
        ...prev,
        name: "",
        url: "",
        error: "",
      };
    });
  };

  useEffect(() => {
    return () => {
      if (uploadedModel.url) URL.revokeObjectURL(uploadedModel.url);
    };
  }, [uploadedModel.url]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-950">
      <Society3DHeader />

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <Society3DMapview
          selectedProject={selectedProjectItem}
          layers={layers}
          basemap={basemap}
          activePanel={activePanel}
          onToolPanelToggle={handleToolPanelToggle}
          onFeatureSelect={handleFeatureSelect}
          clearSelectionSignal={clearSelectionSignal}
          uploadedModel={uploadedModel}
          captureMapCenterSignal={captureMapCenterSignal}
          flyToModelSignal={flyToModelSignal}
          onMapCenterCaptured={handleMapCenterCaptured}
          bimLayers={bimLayers}
          onUploadedModelError={(error) =>
            setUploadedModel((prev) =>
              prev.error === error ? prev : { ...prev, error },
            )
          }
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
          bimPanelOpen={bimPanelOpen}
          setBimPanelOpen={setBimPanelOpen}
          bimLayers={bimLayers}
          setBimLayers={setBimLayers}
          uploadedModel={uploadedModel}
          onModelFileSelect={handleModelFileSelect}
          onModelSettingsChange={handleModelSettingsChange}
          onUseMapCenter={() => setCaptureMapCenterSignal((prev) => prev + 1)}
          onFlyToModel={() => setFlyToModelSignal((prev) => prev + 1)}
          onRemoveModel={removeUploadedModel}
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

