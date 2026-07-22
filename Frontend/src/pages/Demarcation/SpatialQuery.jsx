import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { Search, RotateCcw } from "lucide-react";
import {
  getBlocks,
  getPlotOptions,
  getProjects,
} from "../../services/metaverseApi";

const toOption = (item, valueKeys = [], labelKeys = []) => {
  const value = valueKeys
    .map((key) => item?.[key])
    .find((v) => v !== undefined && v !== null && v !== "");
  const label = labelKeys
    .map((key) => item?.[key])
    .find((v) => v !== undefined && v !== null && v !== "");
  return {
    value,
    label: label || String(value || "Select"),
    raw: item,
  };
};

// Compact pill styling to match the MetaverseSubHeader search bar
const selectStyles = {
  container: (base) => ({
    ...base,
    minWidth: "120px",
    maxWidth: "190px",
    flex: "1 1 auto",
  }),
  control: (base, state) => ({
    ...base,
    minHeight: "30px",
    height: "30px",
    background: "#ffffff",
    borderColor: "#2f3a4d",
    boxShadow: state.isFocused ? "0 0 0 1px #0a5a27" : "none",
    borderRadius: "6px",
    cursor: "pointer",
  }),
  valueContainer: (base) => ({
    ...base,
    height: "30px",
    padding: "0 8px",
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
    color: "#06291f",
    fontSize: "11px",
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: "30px",
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: "0 6px",
    color: "#06291f",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#06291f",
    fontWeight: 600,
    fontSize: "11px",
    whiteSpace: "nowrap",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#06291f",
    fontWeight: 600,
    fontSize: "11px",
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
    fontSize: "12px",
    minWidth: "200px",
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

export default function SpatialQuery({
  filters = {},
  onFiltersChange = () => {},
}) {
  const [projects, setProjects] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [plotTypes, setPlotTypes] = useState([]);
  const [plotNos, setPlotNos] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedProjectId =
    filters?.selectedProject?.value || filters?.projectId || "";
  const selectedBlockId =
    filters?.selectedBlock?.raw?.gid || filters?.blockId || "";
  const selectedBlockName =
    filters?.selectedBlock?.raw?.block || filters?.block || "";

  useEffect(() => {
    let mounted = true;

    async function loadProjects() {
      try {
        const res = await getProjects();
        if (!mounted) return;
        setProjects(
          res
            .map((item) =>
              toOption(
                item,
                ["gid", "id", "project_id"],
                ["name", "brief_name", "type"],
              ),
            )
            .filter((item) => item.value !== undefined && item.value !== null)
            .sort((a, b) => (a.label || "").localeCompare(b.label || "")),
        );
      } catch (error) {
        console.error("Failed to load projects", error);
        if (mounted) setProjects([]);
      }
    }

    loadProjects();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadBlocks() {
      if (!selectedProjectId) {
        setBlocks([]);
        return;
      }

      try {
        const res = await getBlocks(selectedProjectId);
        if (!mounted) return;
        setBlocks(
          res
            .map((item) =>
              toOption(
                item,
                ["gid", "block_id", "id", "block"],
                ["block", "name"],
              ),
            )
            .filter((item) => item.value !== undefined && item.value !== null)
            .sort((a, b) => (a.label || "").localeCompare(b.label || "")),
        );
      } catch (error) {
        console.error("Failed to load blocks", error);
        if (mounted) setBlocks([]);
      }
    }

    loadBlocks();
    return () => {
      mounted = false;
    };
  }, [selectedProjectId]);

  useEffect(() => {
    let mounted = true;

    async function loadPlotOptions() {
      if (!selectedProjectId) {
        setPlotTypes([]);
        setPlotNos([]);
        return;
      }

      setLoading(true);

      try {
        //
        // STEP 1
        // Project + Block => Plot Types
        //
        const typeRes = await getPlotOptions({
          project_id: selectedProjectId,
          block_id: selectedBlockId || undefined,
          block: selectedBlockName || undefined,
        });

        if (!mounted) return;

        setPlotTypes(
          [...new Set(typeRes.plotTypes || [])].sort((a, b) =>
            a.localeCompare(b, undefined, {
              numeric: true,
              sensitivity: "base",
            }),
          ),
        );

        //
        // STEP 2
        // Project + Block + Plot Type => Plot Nos
        //
        if (filters?.plotType) {
          const plotRes = await getPlotOptions({
            project_id: selectedProjectId,
            block_id: selectedBlockId || undefined,
            block: selectedBlockName || undefined,
            type: filters.plotType,
          });

          if (!mounted) return;

          setPlotNos(
            [...new Set(plotRes.plotNos || [])].sort((a, b) =>
              a.localeCompare(b, undefined, {
                numeric: true,
                sensitivity: "base",
              }),
            ),
          );
        } else {
          setPlotNos([]);
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setPlotTypes([]);
          setPlotNos([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPlotOptions();

    return () => {
      mounted = false;
    };
  }, [
    selectedProjectId,
    selectedBlockId,
    selectedBlockName,
    filters?.plotType,
  ]);

  const canSearch = useMemo(
    () => Boolean(selectedProjectId),
    [selectedProjectId],
  );

  const update = (patch) => onFiltersChange(patch);

  const clearAll = () => {
    update({
      selectedProject: null,
      selectedBlock: null,
      projectId: "",
      projectName: "",
      blockId: "",
      block: "",
      plotType: "",
      plotNo: "",
      selectedParcelNumber: "",
      searchNonce: Date.now(),
    });
  };

  const handleSearch = () => {
    update({
      projectId: selectedProjectId,
      blockId: selectedBlockId,
      block: selectedBlockName,
      selectedParcelNumber: filters?.plotNo || "",
      searchNonce: Date.now(),
    });
  };

  return (
    <div className="flex w-full items-center gap-1.5 overflow-x-auto rounded-lg bg-[#06291f] px-2 py-1.5 shadow-xl sm:gap-2 sm:px-3 sm:py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <span className="shrink-0 whitespace-nowrap pr-1 text-[11px] font-bold uppercase tracking-wide text-white/90 sm:pr-2 sm:text-[13px]">
        Spatial Query
      </span>

      <Select
        classNamePrefix="spatial-select"
        styles={selectStyles}
        options={projects}
        value={
          projects.find(
            (item) => String(item.value) === String(selectedProjectId),
          ) || null
        }
        onChange={(opt) => {
          update({
            selectedProject: opt,
            projectId: opt?.value || "",
            projectName: opt?.label || "",
            selectedBlock: null,
            blockId: "",
            block: "",
            plotType: "",
            plotNo: "",
            selectedParcelNumber: "",
          });
        }}
        placeholder="Project"
        isSearchable
        isDisabled={!projects.length}
        menuPortalTarget={
          typeof document !== "undefined" ? document.body : null
        }
        menuPosition="fixed"
      />

      <Select
        classNamePrefix="spatial-select"
        styles={selectStyles}
        options={blocks}
        value={
          blocks.find(
            (item) =>
              String(item.value) ===
              String(filters?.selectedBlock?.value || selectedBlockName || ""),
          ) || null
        }
        onChange={(opt) => {
          update({
            selectedBlock: opt,
            blockId: opt?.raw?.gid || "",
            block: opt?.raw?.block || "",
            plotType: "",
            plotNo: "",
            selectedParcelNumber: "",
          });
        }}
        placeholder="Block"
        isSearchable
        isDisabled={!selectedProjectId || !blocks.length}
        menuPortalTarget={
          typeof document !== "undefined" ? document.body : null
        }
        menuPosition="fixed"
      />

      <Select
        classNamePrefix="spatial-select"
        styles={selectStyles}
        options={plotTypes.map((type) => ({ value: type, label: type }))}
        value={
          filters?.plotType
            ? { value: filters.plotType, label: filters.plotType }
            : null
        }
        onChange={(opt) => {
          update({
            plotType: opt?.value || "",
            plotNo: "",
            selectedParcelNumber: "",
          });
        }}
        placeholder="Plot Type"
        isSearchable
        isDisabled={!selectedProjectId || loading || !plotTypes.length}
        menuPortalTarget={
          typeof document !== "undefined" ? document.body : null
        }
        menuPosition="fixed"
      />

      <Select
        classNamePrefix="spatial-select"
        styles={selectStyles}
        options={plotNos.map((plotNo) => ({
          value: plotNo,
          label: plotNo,
        }))}
        value={
          filters?.plotNo
            ? { value: filters.plotNo, label: filters.plotNo }
            : null
        }
        onChange={(opt) =>
          update({
            plotNo: opt?.value || "",
            selectedParcelNumber: opt?.value || "",
          })
        }
        placeholder="Plot No"
        isSearchable
        isDisabled={!selectedProjectId || loading || !plotNos.length}
        menuPortalTarget={
          typeof document !== "undefined" ? document.body : null
        }
        menuPosition="fixed"
      />

      <button
        type="button"
        title="Search"
        disabled={!canSearch}
        onClick={handleSearch}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#06291f] transition hover:bg-[#b6bdc8] disabled:cursor-not-allowed disabled:opacity-40 sm:h-8 sm:w-8"
      >
        <Search size={14} strokeWidth={2.4} className="sm:hidden" />
        <Search size={16} strokeWidth={2.4} className="hidden sm:block" />
      </button>

      <button
        type="button"
        title="Clear"
        onClick={clearAll}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#06291f] transition hover:bg-[#b6bdc8] sm:h-8 sm:w-8"
      >
        <RotateCcw size={14} strokeWidth={2.4} className="sm:hidden" />
        <RotateCcw size={16} strokeWidth={2.4} className="hidden sm:block" />
      </button>
    </div>
  );
}
