import { useState } from "react";

export default function FiltersBar() {
  const [filters, setFilters] = useState({
    division: "",
    district: "",
    tehsil: "",
    mauza: "",
    societyType: "",
    searchSociety: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleReset = () => {
    setFilters({
      division: "",
      district: "",
      tehsil: "",
      mauza: "",
      societyType: "",
      searchSociety: "",
    });
  };

  return (
    <div className="filters-bar">
      <select name="division" value={filters.division} onChange={handleChange}>
        <option value="">--Division--</option>
        <option value="rawalpindi">Rawalpindi</option>
        <option value="gujrat">Gujrat</option>
        <option value="gujranwala">Gujranwala</option>
      </select>

      <select name="district" value={filters.district} onChange={handleChange}>
        <option value="">--District--</option>
        <option value="rawalpindi">Rawalpindi</option>
        <option value="lahore">Lahore</option>
        <option value="faisalabad">Faisalabad</option>
      </select>

      <select name="tehsil" value={filters.tehsil} onChange={handleChange}>
        <option value="">--Tehsil--</option>
        <option value="tehsil1">Tehsil 1</option>
        <option value="tehsil2">Tehsil 2</option>
      </select>

      <select name="mauza" value={filters.mauza} onChange={handleChange}>
        <option value="">--Mauza--</option>
        <option value="mauza1">Mauza 1</option>
        <option value="mauza2">Mauza 2</option>
      </select>

      <select
        name="societyType"
        value={filters.societyType}
        onChange={handleChange}
      >
        <option value="">--Society Type--</option>
        <option value="residential">Residential</option>
        <option value="commercial">Commercial</option>
        <option value="agricultural">Agricultural</option>
      </select>

      <input
        type="text"
        name="searchSociety"
        placeholder="Search Society"
        value={filters.searchSociety}
        onChange={handleChange}
        className="search-input"
      />

      <button className="reset-btn" onClick={handleReset}>
        🔄 Reset
      </button>
    </div>
  );
}
