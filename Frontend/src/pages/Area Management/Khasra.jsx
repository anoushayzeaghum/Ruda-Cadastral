import React, { useEffect, useMemo, useState } from "react";
import { getKhasras } from "../../services/api";
import ImportModal from "../../components/ImportModal";

const asFeatureRows = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.features)) return data.features;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.features)) return data.data.features;
  return [];
};

const featureToProperties = (feature) => {
  const properties = feature?.properties ?? feature ?? {};

  return {
    ...properties,
    // KhasraSerializer uses gid as the GeoJSON feature id.
    gid: properties?.gid ?? feature?.id ?? null,
    // Do not replace khasra_id with feature.id; they are different DB fields.
    khasra_id: properties?.khasra_id ?? null,
  };
};

const firstDisplayValue = (...values) => {
  const value = values.find(
    (item) => item !== null && item !== undefined && String(item).trim() !== "",
  );

  return value ?? "-";
};

// Follow the actual Khasra model: join_shp is also the first value used by __str__.
const getKhasraLabel = (item) =>
  firstDisplayValue(item?.join_shp, item?.sk, item?.kh, item?.khasra_id);

const getMauzaLabel = (item) =>
  firstDisplayValue(item?.mauza_name, item?.mauza, item?.mauza_id);

const getTehsilLabel = (item) =>
  firstDisplayValue(item?.tehsil_name, item?.tehsil, item?.tehsil_id);

const getDistrictLabel = (item) =>
  firstDisplayValue(item?.district_name, item?.district, item?.dist_id);

const formatKaram = (value) => {
  if (value === null || value === undefined || value === "") return "-";

  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : String(value);
};

export default function Khasra() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const fetchKhasras = async () => {
    try {
      setLoading(true);

      const res = await getKhasras();
      const rows = asFeatureRows(res).map(featureToProperties);

      setItems(rows);
    } catch (err) {
      console.error("Failed to load khasras:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKhasras();
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      const searchableValues = [
        item?.type,
        getKhasraLabel(item),
        item?.sk,
        item?.karam,
        getMauzaLabel(item),
        getTehsilLabel(item),
        getDistrictLabel(item),
        item?.join_shp,
        item?.khasra_id,
      ];

      return searchableValues.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(q),
      );
    });
  }, [items, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / itemsPerPage),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6 bg-white dark:bg-[#07111a]">
        <h2 className="text-xl font-semibold">Khasra — Add / Edit</h2>
        <p className="text-sm text-gray-500 mt-1">
          Import a new khasra or edit an existing one.
        </p>

        <div className="mt-6 flex justify-end">
          <ImportModal
            title="Import Khasra"
            open={showImport}
            onClose={() => setShowImport(false)}
            type="khasra"
            onSuccess={fetchKhasras}
          />
          <button
            onClick={() => setShowImport(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md"
          >
            Import Khasra
          </button>
        </div>
      </div>

      <div className="rounded-lg border p-6 bg-white dark:bg-[#07111a]">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-semibold whitespace-nowrap">Khasra List</h3>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by type, khasra, mauza, tehsil .."
            className="border rounded-md px-3 py-2 text-sm w-72 bg-white dark:bg-[#0b1419]"
          />
        </div>

        <div className="mt-4 overflow-x-auto" dir="rtl">
          {loading ? (
            <div className="py-6 text-center" dir="ltr">
              Loading...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-6 text-center" dir="ltr">
              No khasras found
            </div>
          ) : (
            <div dir="ltr" className="min-w-[1000px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-sm text-gray-500">
                    <th className="py-2 px-2 whitespace-nowrap">Sr. No</th>
                    <th className="py-2 px-2 whitespace-nowrap">Type</th>
                    <th className="py-2 px-2 whitespace-nowrap">Khasra</th>
                    <th className="py-2 px-2 whitespace-nowrap">Karam</th>
                    <th className="py-2 px-2 whitespace-nowrap">Mauza</th>
                    <th className="py-2 px-2 whitespace-nowrap">Tehsil</th>
                    <th className="py-2 px-2 whitespace-nowrap">District</th>
                    <th className="py-2 px-2 text-right whitespace-nowrap">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((d, idx) => (
                    <tr key={d.gid ?? d.khasra_id ?? idx} className="border-t">
                      <td className="py-2 px-2 whitespace-nowrap">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        {firstDisplayValue(d.type)}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        {getKhasraLabel(d)}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        {formatKaram(d.karam)}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        {getMauzaLabel(d)}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        {getTehsilLabel(d)}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        {getDistrictLabel(d)}
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap">
                        <button className="text-sm px-3 py-1 mr-2 border rounded">
                          Edit
                        </button>
                        <button className="text-sm px-3 py-1 bg-red-50 text-red-600 border rounded">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredItems.length)}{" "}
                  of {filteredItems.length}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ←
                  </button>

                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
