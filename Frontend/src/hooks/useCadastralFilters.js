import { useEffect, useMemo, useState } from "react";
import {
  getDistricts,
  getTehsils,
  getMauzas,
} from "../services/api";

const sortByLabel = (items, key) =>
  [...items].sort((a, b) => {
    const left = String(a?.[key] ?? "").trim();
    const right = String(b?.[key] ?? "").trim();
    return left.localeCompare(right);
  });

const dedupeBy = (items, key) => {
  const seen = new Set();
  return items.filter((item) => {
    const value = String(item?.[key] ?? "");
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

const toId = (valueOrEvent) => {
  if (
    valueOrEvent &&
    typeof valueOrEvent === "object" &&
    "target" in valueOrEvent
  ) {
    return String(valueOrEvent.target.value ?? "");
  }
  return String(valueOrEvent ?? "");
};

const toggleId = (list, id) =>
  list.includes(id) ? list.filter((item) => item !== id) : [...list, id];

export default function useCadastralFilters(enabled = true) {
  const [districts, setDistricts] = useState([]);
  const [tehsils, setTehsils] = useState([]);
  const [mauzas, setMauzas] = useState([]);

  const [selectedDistrict, setSelectedDistrict] = useState([]);
  const [selectedTehsil, setSelectedTehsil] = useState([]);
  const [selectedMauza, setSelectedMauza] = useState("");
  const [viewBy, setViewBy] = useState(""); // For Khasra/Murabba selection

  const [loading, setLoading] = useState({
    districts: false,
    tehsils: false,
    mauzas: false,
  });
  const [errorMessage, setErrorMessage] = useState("");

useEffect(() => {

  if (!enabled) {
    // console.log("Filters are disabled");
    return;
  }

  let ignore = false;

  const loadDistricts = async () => {
  
    setLoading((prev) => ({ ...prev, districts: true }));
    setErrorMessage("");

    try {
      const data = await getDistricts();

      if (!ignore) {
        setDistricts(sortByLabel(data, "name"));
      }
    } catch (err) {
      console.error("District API Error:", err);
    } finally {
      if (!ignore) {
        setLoading((prev) => ({
          ...prev,
          districts: false,
        }));
      }
    }
  };

  loadDistricts();

  return () => {
    ignore = true;
  };
}, [enabled]);

  useEffect(() => {
    if (!selectedDistrict.length) return undefined;

    let ignore = false;

    const loadTehsils = async () => {
      setLoading((prev) => ({ ...prev, tehsils: true }));
      setErrorMessage("");

      try {
        const responses = await Promise.all(
          selectedDistrict.map((districtId) => getTehsils(districtId)),
        );
        const data = dedupeBy(responses.flat(), "id");
        if (!ignore) {
          setTehsils(sortByLabel(data, "name"));
        }
      } catch {
        if (!ignore) {
          setTehsils([]);
          setErrorMessage("Unable to load tehsils for the selected district.");
        }
      } finally {
        if (!ignore) {
          setLoading((prev) => ({ ...prev, tehsils: false }));
        }
      }
    };

    loadTehsils();

    return () => {
      ignore = true;
    };
  }, [selectedDistrict]);

  useEffect(() => {
    if (!selectedTehsil.length) return undefined;

    let ignore = false;

    const loadMauzas = async () => {
      setLoading((prev) => ({ ...prev, mauzas: true }));
      setErrorMessage("");

      try {
        console.log(selectedTehsil);
        const responses = await Promise.all(
          selectedTehsil.map((tehsil) => getMauzas(tehsil)),
        );

        const allFeatures = responses.flatMap((fc) => fc.features);

        const data = allFeatures.map((f) => ({
          id: f.id,
          mauza_id: f.id, // or f.properties.mauza_id if exists
          geometry: f.geometry,
          ...f.properties,
        }));

        const unique = dedupeBy(data, "mauza_id");

        // Filter mauzas to only those belonging to the currently selected district(s)
        const filtered = unique.filter((m) =>
          selectedDistrict.includes(String(m.dist_id ?? m.district_id ?? ""))
        );

        if (!ignore) {
          setMauzas(sortByLabel(filtered.length ? filtered : unique, "mauza"));
        }
      } catch {
        if (!ignore) {
          setMauzas([]);
          setErrorMessage("Unable to load mauzas for the selected tehsil.");
        }
      } finally {
        if (!ignore) {
          setLoading((prev) => ({ ...prev, mauzas: false }));
        }
      }
    };

    loadMauzas();

    return () => {
      ignore = true;
    };
  }, [selectedTehsil]);
  // useEffect(() => {
  //   console.log("Districts:", districts);
  // }, [districts]);

  const selectedDistrictPrimary = selectedDistrict[0] ?? "";
  const selectedTehsilPrimary = selectedTehsil[0] ?? "";

  const selectedDistrictOption = districts.find(
    (item) => String(item.id) === String(selectedDistrictPrimary),
  );
  const selectedTehsilOption = tehsils.find(
    (item) => String(item.id) === String(selectedTehsilPrimary),
  );
  const selectedMauzaOption = mauzas.find(
    (item) => String(item.mauza_id) === String(selectedMauza),
  );
  const selectedDistrictOptions = districts.filter((item) =>
    selectedDistrict.includes(String(item.id)),
  );
  const selectedTehsilOptions = tehsils.filter((item) =>
    selectedTehsil.includes(String(item.id)),
  );

  const selectedMauzaDetails = useMemo(() => {
    if (!selectedMauzaOption) return null;

    return {
      // include both legacy `id/name` and the `mauza`/`mauza_id` keys
      id: selectedMauzaOption.mauza_id,
      mauza_id: selectedMauzaOption.mauza_id,
      name: selectedMauzaOption.mauza,
      mauza: selectedMauzaOption.mauza,
      tehsil: selectedTehsilOption?.name ?? selectedMauzaOption.tehsil,
      tehsil_id: selectedMauzaOption.tehsil_id,
      district: selectedDistrictOption?.name ?? selectedMauzaOption.district,
      dist_id: selectedMauzaOption.dist_id,
    };
  }, [
    selectedDistrictOption,
    selectedMauzaOption,
    selectedTehsilOption,
  ]);

  const resetFilters = () => {
    setSelectedDistrict([]);
    setSelectedTehsil([]);
    setSelectedMauza("");
    setViewBy("");
    setTehsils([]);
    setMauzas([]);
    setErrorMessage("");
  };

  const handleDistrictChange = (valueOrEvent) => {
    const id = toId(valueOrEvent);
    if (!id) return;
    setSelectedDistrict((prev) => toggleId(prev, id));
    setSelectedTehsil([]);
    setSelectedMauza("");
    setViewBy("");
    setTehsils([]);
    setMauzas([]);
    setErrorMessage("");
  };

  const handleTehsilChange = (valueOrEvent) => {
    const id = toId(valueOrEvent);
    if (!id) return;
    setSelectedTehsil((prev) => toggleId(prev, id));
    setSelectedMauza("");
    setViewBy("");
    setMauzas([]);
    setErrorMessage("");
  };

  const handleMauzaChange = (e) => {
    const value = String(e.target.value ?? "");
    setSelectedMauza(value);
    // Automatically switch to 'khasra' view when a mauza is selected,
    // clear view when mauza is cleared.
    setViewBy(value ? "khasra" : "");
  };

  const handleViewByChange = (e) => {
    setViewBy(e.target.value);
  };

  return {
    districts,
    tehsils,
    mauzas,
    selectedDistrict,
    selectedTehsil,
    selectedMauza,
    viewBy,
    selectedDistrictOption,
    selectedTehsilOption,
    selectedDistrictOptions,
    selectedTehsilOptions,
    selectedMauzaOption,
    selectedMauzaDetails,
    loading,
    errorMessage,
    hasSelection: Boolean(
      selectedDistrict.length ||
      selectedTehsil.length ||
      selectedMauza,
    ),
    handleDistrictChange,
    handleTehsilChange,
    handleMauzaChange,
    handleViewByChange,
    resetFilters,
  };
}
