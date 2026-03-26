import { useEffect, useMemo, useState } from "react";
import {
  getDivisions,
  getDistricts,
  getTehsils,
  getMouzas,
} from "../services/api";

const sortByLabel = (items, key) =>
  [...items].sort((a, b) => {
    const left = String(a?.[key] ?? "").trim();
    const right = String(b?.[key] ?? "").trim();
    return left.localeCompare(right);
  });

export default function useCadastralFilters() {
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [tehsils, setTehsils] = useState([]);
  const [mouzas, setMouzas] = useState([]);

  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedTehsil, setSelectedTehsil] = useState("");
  const [selectedMouza, setSelectedMouza] = useState("");
  const [viewBy, setViewBy] = useState(""); // For Khasra/Murabba selection

  const [loading, setLoading] = useState({
    divisions: false,
    districts: false,
    tehsils: false,
    mouzas: false,
  });
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadDivisions = async () => {
      setLoading((prev) => ({ ...prev, divisions: true }));
      setErrorMessage("");

      try {
        const data = await getDivisions();
        if (!ignore) {
          setDivisions(sortByLabel(data, "division"));
        }
      } catch {
        if (!ignore) {
          setDivisions([]);
          setErrorMessage("Unable to load divisions right now.");
        }
      } finally {
        if (!ignore) {
          setLoading((prev) => ({ ...prev, divisions: false }));
        }
      }
    };

    loadDivisions();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedDivision) return undefined;

    let ignore = false;

    const loadDistricts = async () => {
      setLoading((prev) => ({ ...prev, districts: true }));
      setErrorMessage("");

      try {
        const data = await getDistricts(selectedDivision);
        if (!ignore) {
          setDistricts(sortByLabel(data, "name"));
        }
      } catch {
        if (!ignore) {
          setDistricts([]);
          setErrorMessage(
            "Unable to load districts for the selected division.",
          );
        }
      } finally {
        if (!ignore) {
          setLoading((prev) => ({ ...prev, districts: false }));
        }
      }
    };

    loadDistricts();

    return () => {
      ignore = true;
    };
  }, [selectedDivision]);

  useEffect(() => {
    if (!selectedDistrict) return undefined;

    let ignore = false;

    const loadTehsils = async () => {
      setLoading((prev) => ({ ...prev, tehsils: true }));
      setErrorMessage("");

      try {
        const data = await getTehsils(selectedDistrict);
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
    if (!selectedTehsil) return undefined;

    let ignore = false;

    const loadMouzas = async () => {
      setLoading((prev) => ({ ...prev, mouzas: true }));
      setErrorMessage("");

      try {
        const data = await getMouzas(selectedTehsil);
        if (!ignore) {
          setMouzas(sortByLabel(data, "mouza"));
        }
      } catch {
        if (!ignore) {
          setMouzas([]);
          setErrorMessage("Unable to load mouzas for the selected tehsil.");
        }
      } finally {
        if (!ignore) {
          setLoading((prev) => ({ ...prev, mouzas: false }));
        }
      }
    };

    loadMouzas();

    return () => {
      ignore = true;
    };
  }, [selectedTehsil]);

  const selectedDivisionOption = divisions.find(
    (item) => String(item.division_i) === String(selectedDivision),
  );
  const selectedDistrictOption = districts.find(
    (item) => String(item.id) === String(selectedDistrict),
  );
  const selectedTehsilOption = tehsils.find(
    (item) => String(item.id) === String(selectedTehsil),
  );
  const selectedMouzaOption = mouzas.find(
    (item) => String(item.mouza_id) === String(selectedMouza),
  );

  const selectedMouzaDetails = useMemo(() => {
    if (!selectedMouzaOption) return null;

    return {
      // include both legacy `id/name` and the `mouza`/`mouza_id` keys
      id: selectedMouzaOption.mouza_id,
      mouza_id: selectedMouzaOption.mouza_id,
      name: selectedMouzaOption.mouza,
      mouza: selectedMouzaOption.mouza,
      tehsil: selectedTehsilOption?.name ?? selectedMouzaOption.tehsil,
      tehsil_id: selectedMouzaOption.tehsil_id,
      district: selectedDistrictOption?.name ?? selectedMouzaOption.district,
      dist_id: selectedMouzaOption.dist_id,
      division: selectedDivisionOption?.division ?? "",
      division_id: selectedDivisionOption?.division_i ?? "",
    };
  }, [
    selectedDivisionOption,
    selectedDistrictOption,
    selectedMouzaOption,
    selectedTehsilOption,
  ]);

  const resetFilters = () => {
    setSelectedDivision("");
    setSelectedDistrict("");
    setSelectedTehsil("");
    setSelectedMouza("");
    setViewBy("");
    setDistricts([]);
    setTehsils([]);
    setMouzas([]);
    setErrorMessage("");
  };

  const handleDivisionChange = (e) => {
    const id = e.target.value;

    setSelectedDivision(id);
    setSelectedDistrict("");
    setSelectedTehsil("");
    setSelectedMouza("");
    setDistricts([]);
    setTehsils([]);
    setMouzas([]);
    setErrorMessage("");
  };

  const handleDistrictChange = (e) => {
    const id = e.target.value;

    setSelectedDistrict(id);
    setSelectedTehsil("");
    setSelectedMouza("");
    setTehsils([]);
    setMouzas([]);
    setErrorMessage("");
  };

  const handleTehsilChange = (e) => {
    const id = e.target.value;

    setSelectedTehsil(id);
    setSelectedMouza("");
    setMouzas([]);
    setErrorMessage("");
  };

  const handleMouzaChange = (e) => {
    setSelectedMouza(e.target.value);
    setViewBy(""); // Reset view by when mouza changes
  };

  const handleViewByChange = (e) => {
    setViewBy(e.target.value);
  };

  return {
    divisions,
    districts,
    tehsils,
    mouzas,
    selectedDivision,
    selectedDistrict,
    selectedTehsil,
    selectedMouza,
    viewBy,
    selectedDivisionOption,
    selectedDistrictOption,
    selectedTehsilOption,
    selectedMouzaOption,
    selectedMouzaDetails,
    loading,
    errorMessage,
    hasSelection: Boolean(
      selectedDivision || selectedDistrict || selectedTehsil || selectedMouza,
    ),
    handleDivisionChange,
    handleDistrictChange,
    handleTehsilChange,
    handleMouzaChange,
    handleViewByChange,
    resetFilters,
  };
}
