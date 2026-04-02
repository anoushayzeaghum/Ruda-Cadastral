import React, { useEffect, useState } from "react";
import { getKhasras, getMouzas } from "../../services/api";
import ImportModal from "../../components/ImportModal";

export default function Khasra() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mouzas, setMouzas] = useState([]);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getKhasras();
        const features = res?.features ?? [];
        const props = features.map((f) => f.properties || {});
        setItems(props);
      } catch (err) {
        console.error("Failed to load khasras:", err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
    (async () => {
      try {
        const m = await getMouzas();
        const features = m?.features ?? [];
        setMouzas(features.map((f) => f.properties || {}));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6 bg-white dark:bg-[#07111a]">
        <h2 className="text-xl font-semibold">Khasra — Add / Edit</h2>
        <p className="text-sm text-gray-500 mt-1">
          Import a new khasra or edit an existing one.
        </p>

        <div className="mt-6 grid grid-cols-12 gap-4 items-center">
          <div className="col-span-4">
            <label className="block text-xs text-gray-500 mb-1">MOUZA</label>
            <select className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-[#0b1419]">
              <option value="">Select mouza</option>
              {mouzas.map((m) => (
                <option key={m.mouza_id ?? m.gid} value={m.mouza_id ?? m.gid}>
                  {m.mouza}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-5">
            <label className="block text-xs text-gray-500 mb-1">
              KHASRA LABEL
            </label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-[#0b1419]"
              placeholder="Enter khasra label"
            />
          </div>

          <div className="col-span-3 flex gap-3 justify-end">
            <ImportModal
              title="Import Khasra"
              open={showImport}
              onClose={() => setShowImport(false)}
            />
            <button
              onClick={() => setShowImport(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-md"
            >
              Import Khasra
            </button>
            <button className="border px-4 py-2 rounded-md">Clear</button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-6 bg-white dark:bg-[#07111a]">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Khasra List</h3>
          <input
            placeholder="Search by name .."
            className="border rounded-md px-3 py-2 text-sm w-64"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="py-6 text-center">Loading...</div>
          ) : items.length === 0 ? (
            <div className="py-6 text-center">No khasras found</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-sm text-gray-500">
                  <th className="py-3">#</th>
                  {Object.keys(items[0])
                    .filter(
                      (k) =>
                        ![
                          "geom",
                          "geometry",
                          "properties",
                          "features",
                        ].includes(k),
                    )
                    .map((col) => (
                      <th key={col} className="py-3">
                        {col}
                      </th>
                    ))}
                  <th className="py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d, idx) => (
                  <tr key={d.gid ?? d.khasra_id ?? idx} className="border-t">
                    <td className="py-3 w-12">{idx + 1}</td>
                    {Object.keys(items[0])
                      .filter(
                        (k) =>
                          ![
                            "geom",
                            "geometry",
                            "properties",
                            "features",
                          ].includes(k),
                      )
                      .map((col) => (
                        <td key={col} className="py-3">
                          {typeof d[col] === "object"
                            ? JSON.stringify(d[col])
                            : d[col]}
                        </td>
                      ))}
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
