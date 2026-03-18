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
  // ================= STATE =================
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [tehsils, setTehsils] = useState([]);
  const [mouzas, setMouzas] = useState([]);

  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedTehsil, setSelectedTehsil] = useState("");
  const [selectedMouza, setSelectedMouza] = useState("");
  const [viewBy, setViewBy] = useState("");

  const [loading, setLoading] = useState({
    divisions: false,
    districts: false,
    tehsils: false,
    mouzas: false,
  });

  const [errorMessage, setErrorMessage] = useState("");

  // ================= DERIVED VALUES (IMPORTANT: MUST BE ABOVE useEffect) =================
  const selectedDivisionOption = divisions.find(
    (item) => String(item.division_i) === String(selectedDivision)
  );

  const selectedDistrictOption = districts.find(
    (item) => String(item.id) === String(selectedDistrict)
  );

  const selectedTehsilOption = tehsils.find(
    (item) => String(item.id) === String(selectedTehsil)
  );

  const selectedMouzaOption = mouzas.find(
    (item) => String(item.mouza_id) === String(selectedMouza)
  );

  // ================= LOAD DIVISIONS =================
  useEffect(() => {
    let ignore = false;

    const loadDivisions = async () => {
      setLoading((prev) => ({ ...prev, divisions: true }));

      try {
        const data = await getDivisions();
        if (!ignore) {
          setDivisions(sortByLabel(data, "division"));
        }
      } catch {
        if (!ignore) {
          setDivisions([]);
          setErrorMessage("Unable to load divisions.");
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

  // ================= LOAD DISTRICTS =================
  useEffect(() => {
    if (!selectedDivision) return;

    let ignore = false;

    const loadDistricts = async () => {
      setLoading((prev) => ({ ...prev, districts: true }));

      try {
        const data = await getDistricts(selectedDivision);
        if (!ignore) {
          setDistricts(sortByLabel(data, "name"));
        }
      } catch {
        if (!ignore) {
          setDistricts([]);
          setErrorMessage("Unable to load districts.");
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

  // ================= LOAD TEHSILS =================
  useEffect(() => {
    if (!selectedDistrict) return;

    let ignore = false;

    const loadTehsils = async () => {
      setLoading((prev) => ({ ...prev, tehsils: true }));

      try {
        const data = await getTehsils(selectedDistrict);
        if (!ignore) {
          setTehsils(sortByLabel(data, "name"));
        }
      } catch {
        if (!ignore) {
          setTehsils([]);
          setErrorMessage("Unable to load tehsils.");
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

  // ================= LOAD MOUZAS =================
  useEffect(() => {
    if (!selectedTehsil) return;

    let ignore = false;

    const loadMouzas = async () => {
      setLoading((prev) => ({ ...prev, mouzas: true }));

      try {
        const tehsilParam = selectedTehsilOption?.name || selectedTehsil;

        const data = await getMouzas(tehsilParam);

        if (!ignore) {
          setMouzas(sortByLabel(data, "mouza"));
        }
      } catch {
        if (!ignore) {
          setMouzas([]);
          setErrorMessage("Unable to load mouzas.");
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
  }, [selectedTehsil, selectedTehsilOption]);

  // ================= MEMO DETAILS =================
  const selectedMouzaDetails = useMemo(() => {
    if (!selectedMouzaOption) return null;

    return {
      id: selectedMouzaOption.mouza_id,
      name: selectedMouzaOption.mouza,
      tehsil: selectedTehsilOption?.name,
      district: selectedDistrictOption?.name,
      division: selectedDivisionOption?.division,
    };
  }, [
    selectedDivisionOption,
    selectedDistrictOption,
    selectedTehsilOption,
    selectedMouzaOption,
  ]);

  // ================= HANDLERS =================
  const handleDivisionChange = (e) => {
    setSelectedDivision(e.target.value);
    setSelectedDistrict("");
    setSelectedTehsil("");
    setSelectedMouza("");
    setDistricts([]);
    setTehsils([]);
    setMouzas([]);
  };

  const handleDistrictChange = (e) => {
    setSelectedDistrict(e.target.value);
    setSelectedTehsil("");
    setSelectedMouza("");
    setTehsils([]);
    setMouzas([]);
  };

  const handleTehsilChange = (e) => {
    setSelectedTehsil(e.target.value);
    setSelectedMouza("");
    setMouzas([]);
  };

  const handleMouzaChange = (e) => {
    setSelectedMouza(e.target.value);
  };

  const handleViewByChange = (e) => {
    setViewBy(e.target.value);
  };

  const resetFilters = () => {
    setSelectedDivision("");
    setSelectedDistrict("");
    setSelectedTehsil("");
    setSelectedMouza("");
    setViewBy("");
    setDistricts([]);
    setTehsils([]);
    setMouzas([]);
  };

  // ================= RETURN =================
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
    selectedMouzaDetails,
    loading,
    errorMessage,
    handleDivisionChange,
    handleDistrictChange,
    handleTehsilChange,
    handleMouzaChange,
    handleViewByChange,
    resetFilters,
  };
}