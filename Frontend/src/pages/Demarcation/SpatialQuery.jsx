import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
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

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "38px",
    height: "38px",
    borderColor: state.isFocused ? "#0c6d30" : "#d5dbe1",
    boxShadow: state.isFocused ? "0 0 0 1px #0a5a27" : "none",
    borderRadius: "4px",
    fontSize: "14px",
    color: "#4b5563",
    "&:hover": {
      borderColor: state.isFocused ? "#0c6d30" : "#d5dbe1",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    height: "38px",
    padding: "0 12px",
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: "38px",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#4b5563",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#4b5563",
  }),
  menu: (base) => ({
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
            .sort((a, b) => (a.label || "").localeCompare(b.label || "")) 
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
            .sort((a, b) => (a.label || "").localeCompare(b.label || ""))
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
        const options = await getPlotOptions({
          project_id: selectedProjectId,
          block_id: selectedBlockId || undefined,
          block: selectedBlockName || undefined,
          type: filters?.plotType || undefined,
        });

        if (!mounted) return;
        setPlotTypes(
          (options.plotTypes || []).sort((a, b) =>
            a.localeCompare(b, undefined, {
              numeric: true,
              sensitivity: "base",
            })
          )
        );
        setPlotNos(
          (options.plotNos || []).sort((a, b) =>
            a.localeCompare(b, undefined, {
              numeric: true,
              sensitivity: "base",
            })
          )
        );
      } catch (error) {
        console.error("Failed to load plot options", error);
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
    <div className="bg-white border border-[#b8c2cc] shadow-[0_0_0_1px_rgba(0,0,0,0.02)] h-[460px]">
      <div className="h-[56px] border-b border-[#d4dbe2] px-4 flex items-center">
        <h2 className="text-[17px] font-bold uppercase tracking-wide text-[#5b5b5b]">
          Spatial Query
        </h2>
      </div>

      <div className="p-4 h-[calc(100%-56px)]">
        <div className="space-y-3">
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
            placeholder="Select Project"
            isSearchable
            isDisabled={!projects.length}
          />

          <Select
            classNamePrefix="spatial-select"
            styles={selectStyles}
            options={blocks}
            value={
              blocks.find(
                (item) =>
                  String(item.value) ===
                  String(
                    filters?.selectedBlock?.value || selectedBlockName || "",
                  ),
              ) || null
            }
            onChange={(opt) => {
              update({
                selectedBlock: opt,
                blockId: opt?.raw?.gid || opt?.raw?.block_id || "",
                block: opt?.raw?.block || opt?.label || "",
                plotType: "",
                plotNo: "",
                selectedParcelNumber: "",
              });
            }}
            placeholder="Select Block"
            isSearchable
            isDisabled={!selectedProjectId || !blocks.length}
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
            placeholder="Select Plot Type"
            isSearchable
            isDisabled={!selectedProjectId || loading || !plotTypes.length}
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
            placeholder="Select Plot No"
            isSearchable
            isDisabled={!selectedProjectId || loading || !plotNos.length}
          />

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              disabled={!canSearch}
              onClick={handleSearch}
              className="h-9 rounded bg-green-700 text-white text-sm font-medium shadow-sm hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Search
            </button>

            <button
              type="button"
              onClick={clearAll}
              className="h-9 rounded bg-green-700 text-white text-sm font-medium shadow-sm hover:bg-green-800"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .inputStyle {
          width: 100%;
          height: 38px;
          border: 1px solid #d5dbe1;
          border-radius: 4px;
          background: white;
          padding: 0 12px;
          font-size: 14px;
          color: #4b5563;
          outline: none;
        }
        .inputStyle:focus {
          border-color: #0c6d30;
          box-shadow: 0 0 0 1px #0a5a27;
        }
      `}</style>
    </div>
  );
}
