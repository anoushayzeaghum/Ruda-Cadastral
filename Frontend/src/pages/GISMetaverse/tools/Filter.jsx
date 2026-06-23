import { useEffect, useMemo, useState } from "react";
import { Filter as FilterIcon, X } from "lucide-react";
import { LAYER_PANEL_SCROLL } from "./Layers/_layerScroll";
import {
  getBlocks,
  // getPlotOptionsAll,
  getPlotOptions,
  getProjects,
  getPlotsGeoJSON,
  normalizeFeatures,
} from "../../../services/metaverseApi";

const initialSelectedFilters = {
  projectId: "",
  block: "",
  plotNo: "",
  plotType: "",
  area: "",
  parkfront: "",
  rd_facing: "",
  poss_st: "",
  plotStatus: "",
  tr_cate: "",
  tr_own: "",
  site_plan: "",
};

export default function Filter({
  filters,
  projectId,
  setLayerVisibility,
  onClose,
  onApply,
}) {
  const activeProjectId = filters?.projectId || projectId || "";

  const [projects, setProjects] = useState([]);
  const [blocks, setBlocks] = useState([]);

  const [plotOptions, setPlotOptions] = useState({
    plotTypes: [],
    plotNos: [],
    areas: [],
    parkFronts: [],
    roadFacing: [],
    possessionStatus: [],
    plotStatus: [],
    categories: [],
    owners: [],
    sitePlans: [],
  });

  const [selectedFilters, setSelectedFilters] = useState({
    ...initialSelectedFilters,
    projectId: activeProjectId,
    block: filters?.block || "",
    plotNo: filters?.plotNo || "",
    plotType: filters?.plotType || "",
    area: filters?.area || "",
    parkfront: filters?.parkfront || "",
    rd_facing: filters?.rd_facing || "",
    poss_st: filters?.poss_st || "",
    plotStatus: filters?.plotStatus || "",
    tr_cate: filters?.tr_cate || "",
    tr_own: filters?.tr_own || "",
    site_plan: filters?.site_plan || "",
  });

  const selectedProjectId = useMemo(
    () => selectedFilters.projectId || activeProjectId,
    [selectedFilters.projectId, activeProjectId],
  );

  /* ---------------- utils ---------------- */
  const normalizeSortValue = (value) => String(value ?? "").trim();

  const naturalSort = (items = [], getValue = (item) => item) =>
    [...items].sort((a, b) =>
      normalizeSortValue(getValue(a)).localeCompare(
        normalizeSortValue(getValue(b)),
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        },
      ),
    );

  const uniqueSorted = (arr = []) =>
    [...new Set(arr.filter(Boolean))].sort((a, b) =>
      String(a).localeCompare(String(b), undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );

  const areaToMarla = (value) => {
    const text = String(value || "")
      .toLowerCase()
      .trim();

    const number = parseFloat(text.match(/[\d.]+/)?.[0] || 0);

    if (text.includes("acre")) return number * 160; // 1 acre = 160 marla
    if (text.includes("kanal")) return number * 20; // 1 kanal = 20 marla
    if (text.includes("marla")) return number;

    return number;
  };
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await getProjects();
        setProjects(res || []);
      } catch (err) {
        console.error("Projects error:", err);
      }
    };

    loadProjects();
  }, []);

  useEffect(() => {
    setSelectedFilters((prev) => ({
      ...prev,
      projectId: activeProjectId || prev.projectId || "",
      block: filters?.block || prev.block || "",
      plotNo: filters?.plotNo || prev.plotNo || "",
      plotType: filters?.plotType || prev.plotType || "",
      area: filters?.area || prev.area || "",
      parkfront: filters?.parkfront || prev.parkfront || "",
      rd_facing: filters?.rd_facing || prev.rd_facing || "",
      poss_st: filters?.poss_st || prev.poss_st || "",
      plotStatus: filters?.plotStatus || prev.plotStatus || "",
      tr_cate: filters?.tr_cate || prev.tr_cate || "",
      tr_own: filters?.tr_own || prev.tr_own || "",
      site_plan: filters?.site_plan || prev.site_plan || "",
    }));
  }, [
    activeProjectId,
    filters?.block,
    filters?.plotNo,
    filters?.plotType,
    filters?.area,
    filters?.parkfront,
    filters?.rd_facing,
    filters?.poss_st,
    filters?.plotStatus,
    filters?.tr_cate,
    filters?.tr_own,
    filters?.site_plan,
  ]);

  useEffect(() => {
    const loadFilterData = async () => {
      try {
        if (!selectedProjectId) {
          setBlocks([]);
          setPlotOptions({
            plotTypes: [],
            plotNos: [],
            areas: [],
            parkFronts: [],
            roadFacing: [],
            possessionStatus: [],
            plotStatus: [],
            categories: [],
            owners: [],
            sitePlans: [],
          });
          return;
        }

        const [blockRes, plotRes] = await Promise.all([
          getBlocks(selectedProjectId),

          // ONLY filter by project and block
          getPlotsGeoJSON({
            project_id: selectedProjectId,
            block: selectedFilters.block || undefined,
          }),
        ]);

        const plots = normalizeFeatures(plotRes);

        // Type should always show all types
        const filteredForTypes = plots;

        // Area depends only on type
        const filteredForAreas = plots.filter(
          (p) =>
            !selectedFilters.plotType || p.type === selectedFilters.plotType,
        );

        // Plot No depends on type + area
        const filteredForPlotNos = plots.filter(
          (p) =>
            (!selectedFilters.plotType ||
              p.type === selectedFilters.plotType) &&
            (!selectedFilters.area || p.plot_area === selectedFilters.area),
        );

        // Park Front depends on type + area + plotNo
        const filteredForParkFronts = plots.filter(
          (p) =>
            (!selectedFilters.plotType ||
              p.type === selectedFilters.plotType) &&
            (!selectedFilters.area || p.plot_area === selectedFilters.area) &&
            (!selectedFilters.plotNo || p.plot_no === selectedFilters.plotNo),
        );

        setBlocks(blockRes || []);

        setPlotOptions({
          plotTypes: naturalSort([
            ...new Set(filteredForTypes.map((p) => p.type).filter(Boolean)),
          ]),

          areas: [
            ...new Set(
              filteredForAreas.map((p) => p.plot_area).filter(Boolean),
            ),
          ].sort((a, b) => areaToMarla(a) - areaToMarla(b)),

          plotNos: naturalSort([
            ...new Set(
              filteredForPlotNos.map((p) => p.plot_no).filter(Boolean),
            ),
          ]),

          parkFronts: naturalSort([
            ...new Set(
              filteredForParkFronts.map((p) => p.parkfront).filter(Boolean),
            ),
          ]),

          roadFacing: naturalSort([
            ...new Set(
              filteredForParkFronts.map((p) => p.rd_facing).filter(Boolean),
            ),
          ]),

          possessionStatus: naturalSort([
            ...new Set(
              filteredForParkFronts.map((p) => p.poss_st).filter(Boolean),
            ),
          ]),

          plotStatus: naturalSort([
            ...new Set(
              filteredForParkFronts.map((p) => p.canceled).filter(Boolean),
            ),
          ]),

          categories: naturalSort([
            ...new Set(
              filteredForParkFronts.map((p) => p.tr_cate).filter(Boolean),
            ),
          ]),

          owners: naturalSort([
            ...new Set(
              filteredForParkFronts.map((p) => p.tr_own).filter(Boolean),
            ),
          ]),

          sitePlans: naturalSort([
            ...new Set(
              filteredForParkFronts.map((p) => p.site_plan).filter(Boolean),
            ),
          ]),
        });
      } catch (err) {
        console.error("Filter API error:", err);
      }
    };

    loadFilterData();
  }, [
    selectedProjectId,
    selectedFilters.block,
    selectedFilters.plotType,
    selectedFilters.area,
  ]);

  const handleChange = (key, value) => {
    setSelectedFilters((prev) => {
      const updated = {
        ...prev,
        [key]: value,
      };

      // Project changed
      if (key === "projectId") {
        updated.block = "";
        updated.plotType = "";
        updated.area = "";
        updated.plotNo = "";
        updated.parkfront = "";
        updated.rd_facing = "";
        updated.poss_st = "";
        updated.plotStatus = "";
        updated.tr_cate = "";
        updated.tr_own = "";
        updated.site_plan = "";
      }

      // Block changed
      if (key === "block") {
        updated.plotType = "";
        updated.area = "";
        updated.plotNo = "";
        updated.parkfront = "";
        updated.rd_facing = "";
        updated.poss_st = "";
        updated.plotStatus = "";
        updated.tr_cate = "";
        updated.tr_own = "";
        updated.site_plan = "";
      }

      // Plot type changed
      if (key === "plotType") {
        updated.area = "";
        updated.plotNo = "";
        updated.parkfront = "";
        updated.rd_facing = "";
        updated.poss_st = "";
        updated.plotStatus = "";
        updated.tr_cate = "";
        updated.tr_own = "";
        updated.site_plan = "";
      }

      // Area changed
      if (key === "area") {
        updated.plotNo = "";
        updated.parkfront = "";
        updated.rd_facing = "";
        updated.poss_st = "";
        updated.plotStatus = "";
        updated.tr_cate = "";
        updated.tr_own = "";
        updated.site_plan = "";
      }

      // Plot No changed
      if (key === "plotNo") {
        updated.parkfront = "";
        updated.rd_facing = "";
        updated.poss_st = "";
        updated.plotStatus = "";
        updated.tr_cate = "";
        updated.tr_own = "";
        updated.site_plan = "";
      }

      return updated;
    });
  };
  const handleApply = () => {
    const cleanedFilters = {
      projectId: selectedFilters.projectId || "",
      block: selectedFilters.block || "",
      plotNo: selectedFilters.plotNo || "",
      plotType: selectedFilters.plotType || "",
      area: selectedFilters.area || "",
      parkfront: selectedFilters.parkfront || "",
      rd_facing: selectedFilters.rd_facing || "",
      poss_st: selectedFilters.poss_st || "",
      plotStatus: selectedFilters.plotStatus || "",
      tr_cate: selectedFilters.tr_cate || "",
      tr_own: selectedFilters.tr_own || "",
      site_plan: selectedFilters.site_plan || "",
    };

    if (cleanedFilters.projectId) {
      setLayerVisibility?.((prev) => ({
        ...prev,
        boundary: true,
        masterPlan: true,
        roads: true,
      }));
    }

    onApply?.(cleanedFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      ...initialSelectedFilters,
      projectId: activeProjectId || "",
    };

    setSelectedFilters(resetFilters);
    onApply?.(resetFilters);

    if (resetFilters.projectId) {
      setLayerVisibility?.((prev) => ({
        ...prev,
        boundary: true,
        masterPlan: true,
        roads: true,
      }));
    }
  };

  return (
    <div className="w-full text-white">
      <div className="flex items-center justify-between border-b border-[#343c4c] px-4 py-3">
        <div className="flex items-center gap-2 text-[13px] font-bold">
          <FilterIcon size={15} />
          <span>FILTER</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded bg-[#263244] p-1 hover:bg-[#334158]"
        >
          <X size={14} />
        </button>
      </div>

      <div
        className={`max-h-[calc(70vh-6.5rem)] p-4 sm:max-h-[min(360px,calc(100vh-180px))] ${LAYER_PANEL_SCROLL}`}
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Project Name
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#0f3d2e] bg-[#1f2937] px-2 text-xs text-white"
              value={selectedFilters.projectId || ""}
              onChange={(e) => handleChange("projectId", e.target.value)}
            >
              <option value="">Select Project</option>

              {naturalSort(projects, (p) => p.name || p.project_name).map(
                (p) => (
                  <option key={p.gid || p.id} value={p.gid || p.id}>
                    {p.name || p.project_name || `Project ${p.gid || p.id}`}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Block
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#0f3d2e] bg-[#1f2937] px-2 text-xs text-white"
              value={selectedFilters.block || ""}
              onChange={(e) => handleChange("block", e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Block</option>

              {naturalSort(
                blocks,
                (b) => b.block || b.name || b.block_name,
              ).map((b) => (
                <option
                  key={b.gid || b.id || b.block || b.name || b.block_name}
                  value={b.block || b.name || b.block_name}
                >
                  {b.block || b.name || b.block_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Type
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#0f3d2e] bg-[#1f2937] px-2 text-xs text-white"
              value={selectedFilters.plotType || ""}
              onChange={(e) => handleChange("plotType", e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Type</option>

              {naturalSort(plotOptions.plotTypes || []).map((t, i) => (
                <option key={`${t}-${i}`} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Area
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#0f3d2e] bg-[#1f2937] px-2 text-xs text-white"
              value={selectedFilters.area || ""}
              onChange={(e) => handleChange("area", e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Area</option>

              {[...(plotOptions.areas || [])]
                .sort((a, b) => areaToMarla(a) - areaToMarla(b))
                .map((a, i) => (
                  <option key={`${a}-${i}`} value={a}>
                    {a}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Plot No
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#0f3d2e] bg-[#1f2937] px-2 text-xs text-white"
              value={selectedFilters.plotNo || ""}
              onChange={(e) => handleChange("plotNo", e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Plot No</option>

              {naturalSort(plotOptions.plotNos || []).map((p, i) => (
                <option key={`${p}-${i}`} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Park Front
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#0f3d2e] bg-[#1f2937] px-2 text-xs text-white"
              value={selectedFilters.parkfront || ""}
              onChange={(e) => handleChange("parkfront", e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Park Front</option>

              {naturalSort(plotOptions.parkFronts || []).map((p, i) => (
                <option key={`${p}-${i}`} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Road Facing
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#0f3d2e] bg-[#1f2937] px-2 text-xs text-white"
              value={selectedFilters.rd_facing || ""}
              onChange={(e) => handleChange("rd_facing", e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Road Facing</option>

              {naturalSort(plotOptions.roadFacing || []).map((p, i) => (
                <option key={`${p}-${i}`} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Possession Status
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#0f3d2e] bg-[#1f2937] px-2 text-xs text-white"
              value={selectedFilters.poss_st || ""}
              onChange={(e) => handleChange("poss_st", e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Status</option>

              {naturalSort(plotOptions.possessionStatus || []).map((p, i) => (
                <option key={`${p}-${i}`} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Plot Status
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#0f3d2e] bg-[#1f2937] px-2 text-xs text-white"
              value={selectedFilters.plotStatus || ""}
              onChange={(e) => handleChange("plotStatus", e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Plot Status</option>

              {(plotOptions.plotStatus || []).map((p, i) => (
                <option key={`${p}-${i}`} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Category
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#0f3d2e] bg-[#1f2937] px-2 text-xs text-white"
              value={selectedFilters.tr_cate || ""}
              onChange={(e) => handleChange("tr_cate", e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Category</option>

              {naturalSort(plotOptions.categories || []).map((p, i) => (
                <option key={`${p}-${i}`} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Owner Name
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#0f3d2e] bg-[#1f2937] px-2 text-xs text-white"
              value={selectedFilters.tr_own || ""}
              onChange={(e) => handleChange("tr_own", e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Owner</option>

              {naturalSort(plotOptions.owners || []).map((p, i) => (
                <option key={`${p}-${i}`} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Site Plan
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#0f3d2e] bg-[#1f2937] px-2 text-xs text-white"
              value={selectedFilters.site_plan || ""}
              onChange={(e) => handleChange("site_plan", e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Site Plan</option>

              {naturalSort(plotOptions.sitePlans || []).map((p, i) => (
                <option key={`${p}-${i}`} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleApply}
              className="h-8 flex-1 rounded-md bg-[#8bd66f] text-xs font-bold text-[#111827]"
            >
              Apply
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="h-8 flex-1 rounded-md border border-[#0f3d2e] bg-[#1f2937] text-xs font-bold text-white"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
