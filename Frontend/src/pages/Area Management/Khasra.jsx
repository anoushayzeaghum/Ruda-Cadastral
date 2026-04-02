import React, { useEffect, useState } from "react";
import { getKhasras } from "../../services/api";

export default function Khasra() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

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
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6 bg-white dark:bg-[#07111a]">
        <h2 className="text-xl font-semibold">Khasra — Add / Edit</h2>
        <p className="text-sm text-gray-500 mt-1">Create a new khasra or edit an existing one.</p>

        <div className="mt-6 grid grid-cols-12 gap-4 items-center">
          <div className="col-span-4">
            <label className="block text-xs text-gray-500 mb-1">MOUZA</label>
            <select className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-[#0b1419]">
              <option>Select mouza</option>
            </select>
          </div>

          <div className="col-span-5">
            <label className="block text-xs text-gray-500 mb-1">KHASRA LABEL</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-[#0b1419]" placeholder="Enter khasra label" />
          </div>

          <div className="col-span-3 flex gap-3 justify-end">
            <button className="bg-red-600 text-white px-4 py-2 rounded-md">+ Create Khasra</button>
            <button className="border px-4 py-2 rounded-md">Clear</button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-6 bg-white dark:bg-[#07111a]">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Khasra List</h3>
          <input placeholder="Search by name .." className="border rounded-md px-3 py-2 text-sm w-64" />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-sm text-gray-500">
                <th className="py-3">#</th>
                <th className="py-3">Khasra</th>
                <th className="py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center">Loading...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center">No khasras found</td>
                </tr>
              ) : (
                items.map((d, idx) => (
                  <tr key={d.gid ?? d.khasra_id ?? idx} className="border-t">
                    <td className="py-3 w-12">{idx + 1}</td>
                    <td className="py-3 font-medium">{d.label ?? d.khasra_id ?? "-"}</td>
                    <td className="py-3 text-right">
                      <button className="text-sm px-3 py-1 mr-2 border rounded">Edit</button>
                      <button className="text-sm px-3 py-1 bg-red-50 text-red-600 border rounded">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
