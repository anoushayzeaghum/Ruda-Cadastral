import React, { useEffect, useState } from "react";
import { getMouzas, getTehsils } from "../../services/api";
import ImportModal from "../../components/ImportModal";

export default function Mouza() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tehsils, setTehsils] = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [showFields, setShowFields] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getMouzas();
        const features = res?.features ?? [];
        const props = features.map((f) => f.properties || {});
        setItems(props);
      } catch (err) {
        console.error("Failed to load mouzas:", err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
    (async () => {
      try {
        const t = await getTehsils();
        setTehsils(t || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6 bg-white dark:bg-[#07111a]">
        <h2 className="text-xl font-semibold">Mouza — Add / Edit</h2>
        <p className="text-sm text-gray-500 mt-1">
          Import a new mouza or edit an existing one.
        </p>

        <div className="mt-6 grid grid-cols-12 gap-4 items-center">
          <div className="col-span-4">
            <label className="block text-xs text-gray-500 mb-1">TEHSIL</label>
            <select className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-[#0b1419]">
              <option value="">Select tehsil</option>
              {tehsils.map((t) => (
                <option key={t.id ?? t.gid} value={t.id ?? t.gid}>
                  {t.name ?? t.tehsil}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-5">
            <label className="block text-xs text-gray-500 mb-1">
              MOUZA NAME
            </label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-[#0b1419]"
              placeholder="Enter mouza name"
            />
          </div>

          <div className="col-span-3 flex gap-3 justify-end">
            <ImportModal
              title="Import Mouza"
              open={showImport}
              onClose={() => setShowImport(false)}
            />
            <button
              onClick={() => setShowImport(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-md"
            >
              Import Mouza
            </button>
            <button className="border px-4 py-2 rounded-md">Clear</button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-6 bg-white dark:bg-[#07111a]">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Mouza List</h3>
          <div className="flex items-center gap-2">
            <input
              placeholder="Search by name .."
              className="border rounded-md px-3 py-2 text-sm w-64"
            />
            <button
              title="Show fields"
              onClick={() => setShowFields(true)}
              className="p-2 border rounded-md"
            >
              <svg
                width="18"
                height="14"
                viewBox="0 0 18 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="1"
                  y="1"
                  width="16"
                  height="2"
                  rx="1"
                  fill="currentColor"
                />
                <rect
                  x="1"
                  y="6"
                  width="16"
                  height="2"
                  rx="1"
                  fill="currentColor"
                />
                <rect
                  x="1"
                  y="11"
                  width="16"
                  height="2"
                  rx="1"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="py-6 text-center">Loading...</div>
          ) : items.length === 0 ? (
            <div className="py-6 text-center">No mouzas found</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-sm text-gray-500">
                  <th className="py-3">#</th>
                  <th className="py-3">District</th>
                  <th className="py-3">District DC</th>
                  <th className="py-3">Tehsil</th>
                  <th className="py-3">Tehsil DC</th>
                  <th className="py-3">Moza</th>
                  <th className="py-3">Moza TM</th>
                  <th className="py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d, idx) => (
                  <tr key={d.mouza_id ?? d.gid ?? idx} className="border-t">
                    <td className="py-3 w-12">{idx + 1}</td>
                    <td className="py-3">{d.district}</td>
                    <td className="py-3">
                      {String(d.dist_id ?? "").toUpperCase()}
                    </td>
                    <td className="py-3">{d.tehsil}</td>
                    <td className="py-3">
                      {String(d.tehsil_id ?? "").toUpperCase()}
                    </td>
                    <td className="py-3">{d.mouza}</td>
                    <td className="py-3">
                      {String(d.mouza_id ?? "").toUpperCase()}
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
      {showFields && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-[#07111a] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Available Fields</h3>
              <button
                onClick={() => setShowFields(false)}
                className="text-gray-500"
              >
                Close
              </button>
            </div>

            <div className="mt-4 overflow-auto max-h-96">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-sm text-gray-500">
                    <th className="py-2">Field</th>
                    <th className="py-2">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {(items[0] ? Object.keys(items[0]) : []).map((k) => (
                    <tr key={k} className="border-t">
                      <td className="py-2">{k}</td>
                      <td className="py-2">{typeof items[0][k]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
