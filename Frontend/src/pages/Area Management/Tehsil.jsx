import React, { useEffect, useMemo, useState } from "react";
import { getTehsils, getDistricts } from "../../services/api";
import ImportModal from "../../components/ImportModal";

export default function Tehsil() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const fetchTehsils = async () => {
    try {
      setLoading(true);
      const res = await getTehsils();
      setItems(res || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getTehsils();
        setItems(res || []);
      } catch (err) {
        console.error("Failed to load tehsils:", err);
      } finally {
        setLoading(false);
      }
    };

    fetch();

    (async () => {
      try {
        const d = await getDistricts();
        setDistricts(d || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      const tehsil = String(item.tehsil ?? item.name ?? "").toLowerCase();
      const tehsilId = String(
        item.tehsil_id ?? item.id ?? item.gid ?? "",
      ).toLowerCase();
      const district = String(item.district ?? "").toLowerCase();
      const districtId = String(
        item.dist_id ?? item.district_id ?? "",
      ).toLowerCase();
      return (
        tehsil.includes(q) ||
        tehsilId.includes(q) ||
        district.includes(q) ||
        districtId.includes(q)
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
        <h2 className="text-xl font-semibold">Tehsil — Add / Edit</h2>
        <p className="text-sm text-gray-500 mt-1">
          Import a new tehsil or edit an existing one.
        </p>

        <div className="mt-6 grid grid-cols-12 gap-4 items-center">
          <div className="col-span-4">
            <label className="block text-xs text-gray-500 mb-1">DISTRICT</label>
            <select className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-[#0b1419]">
              <option value="">Select district</option>
              {districts.map((dv) => (
                <option key={dv.id ?? dv.gid} value={dv.id ?? dv.gid}>
                  {dv.name ?? dv.district}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-5">
            <label className="block text-xs text-gray-500 mb-1">
              TEHSIL NAME
            </label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-[#0b1419]"
              placeholder="Enter tehsil name"
            />
          </div>

          <div className="col-span-3 flex gap-3 justify-end">
            <ImportModal
              title="Import Tehsil"
              open={showImport}
              onClose={() => setShowImport(false)}
              type="tehsil"
              onSuccess={fetchTehsils}
            />
            <button
              onClick={() => setShowImport(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-md"
            >
              Import Tehsil
            </button>
            <button className="border px-4 py-2 rounded-md">Clear</button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-6 bg-white dark:bg-[#07111a]">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Tehsil List</h3>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tehsil/district .."
            className="border rounded-md px-3 py-2 text-sm w-64 bg-white dark:bg-[#0b1419]"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="py-6 text-center">Loading...</div>
          ) : filteredItems.length === 0 ? (
            <div className="py-6 text-center">No tehsils found</div>
          ) : (
            <>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-sm text-gray-500">
                    <th className="py-3">Sr. No</th>
                    <th className="py-3">Tehsil</th>
                    <th className="py-3">Tehsil ID</th>
                    <th className="py-3">District</th>
                    <th className="py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((d, idx) => (
                    <tr
                      key={d.id ?? d.gid ?? d.tehsil_id ?? idx}
                      className="border-t"
                    >
                      <td className="py-3 w-20">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>

                      <td className="py-3">{d.tehsil ?? d.name ?? "-"}</td>

                      <td className="py-3">
                        {String(
                          d.tehsil_id ?? d.id ?? d.gid ?? "",
                        ).toUpperCase()}
                      </td>

                      <td className="py-3">{d.district ?? "-"}</td>

                      <td className="py-3 text-right">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
