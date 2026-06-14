import React, { useEffect, useMemo, useState } from "react";
import { getDistricts } from "../../services/api";
import ImportModal from "../../components/ImportModal";

export default function District() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState("");

  
  const fetchDistricts = async () => {
    try {
      setLoading(true);
      const res = await getDistricts();
      setItems(res || []);
    } catch (err) {
      console.error("Failed to load districts:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDistricts();
  }, []);

  const handleImportSuccess = () => {
    fetchDistricts(); // reload data after import
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getDistricts();
        setItems(res || []);
      } catch (err) {
        console.error("Failed to load districts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetch();

  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      const district = String(item.district ?? item.name ?? "").toLowerCase();
      const districtId = String(
        item.district_id ?? item.dist_id ?? item.id ?? item.gid ?? "",
      ).toLowerCase();
      return (
        district.includes(q) ||
        districtId.includes(q)
      );
    });
  }, [items, search]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6 bg-white dark:bg-[#07111a]">
        <h2 className="text-xl font-semibold">District — Add / Edit</h2>
        <p className="text-sm text-gray-500 mt-1">
          Import a new district or edit an existing one.
        </p>

        <div className="mt-6 grid grid-cols-12 gap-4 items-center">
          <div className="col-span-6">
            <label className="block text-xs text-gray-500 mb-1">
              DISTRICT NAME
            </label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-[#0b1419]"
              placeholder="Enter district name"
            />
          </div>

          <div className="col-span-6 flex gap-3 justify-end">
            <ImportModal
              title="Import District"
              open={showImport}
              onClose={() => setShowImport(false)}
              type="district"
              onSuccess={handleImportSuccess}
            />
            <button
              onClick={() => setShowImport(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-md"
            >
              Import District
            </button>
            <button className="border px-4 py-2 rounded-md">Clear</button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-6 bg-white dark:bg-[#07111a]">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">District List</h3>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by district .."
            className="border rounded-md px-3 py-2 text-sm w-64 bg-white dark:bg-[#0b1419]"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="py-6 text-center">Loading...</div>
          ) : filteredItems.length === 0 ? (
            <div className="py-6 text-center">No districts found</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-sm text-gray-500">
                  <th className="py-3">Sr. No</th>
                  <th className="py-3">District</th>
                  <th className="py-3">District ID</th>
                  <th className="py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((d, idx) => (
                  <tr
                    key={d.id ?? d.gid ?? d.district_id ?? idx}
                    className="border-t"
                  >
                    <td className="py-3 w-20">{idx + 1}</td>
                    <td className="py-3">{d.district ?? d.name ?? "-"}</td>
                    <td className="py-3">
                      {String(
                        d.district_id ?? d.dist_id ?? d.id ?? d.gid ?? "",
                      ).toUpperCase()}
                    </td>
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
          )}
        </div>
      </div>
    </div>
  );
}
