import React, { useEffect, useMemo, useState } from "react";
import { getKhasras, getMauzas } from "../../services/api";
import ImportModal from "../../components/ImportModal";

export default function Khasra() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mauzas, setMauzas] = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [revenueStateType, setRevenueStateType] = useState("");

  const itemsPerPage = 10;

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getKhasras();
        const features = res?.features ?? [];
        const props = features.map((f) => ({
          ...(f.properties || {}),
          khasra_id: f.properties?.khasra_id ?? f.id ?? f.properties?.gid,
        }));
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
        const m = await getMauzas();
        const features = m?.features ?? [];
        setMauzas(
          features.map((f) => ({
            ...(f.properties || {}),
            mauza_id: f.properties?.mauza_id ?? f.id,
          })),
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      return (
        String(item.type ?? "")
          .toLowerCase()
          .includes(q) ||
        String(item.m ?? "")
          .toLowerCase()
          .includes(q) ||
        String(item.k ?? "")
          .toLowerCase()
          .includes(q) ||
        String(item.sk ?? "")
          .toLowerCase()
          .includes(q) ||
        String(item.karam ?? "")
          .toLowerCase()
          .includes(q) ||
        String(item.tehsil ?? "")
          .toLowerCase()
          .includes(q) ||
        String(item.district ?? "")
          .toLowerCase()
          .includes(q)
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

        <div className="mt-6 grid grid-cols-12 gap-4 items-end">
          <div className="col-span-3">
            <label className="block text-xs text-gray-500 mb-1">MOUZA</label>
            <select className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-[#0b1419]">
              <option value="">Select mauza</option>
              {mauzas.map((m) => (
                <option key={m.mauza_id ?? m.gid} value={m.mauza_id ?? m.gid}>
                  {m.mauza}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-3">
            <label className="block text-xs text-gray-500 mb-1">
              KHASRA LABEL
            </label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-[#0b1419]"
              placeholder="Enter khasra label"
            />
          </div>

          <div className="col-span-3">
            <label className="block text-xs text-gray-500 mb-1">
              REVENUE STATE TYPE
            </label>
            <select
              value={revenueStateType}
              onChange={(e) => setRevenueStateType(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-[#0b1419]"
            >
              <option value="">Select revenue state type</option>
              <option value="MU">MU</option>
              <option value="QB">QB</option>
            </select>
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

        <div className="mt-4 grid grid-cols-12 gap-4">
          <div className="col-span-4">
            <p className="mt-2 text-sm text-gray-500 text-red-600 leading-relaxed ">
              *MU stands for Murabba Bandi and QB stands for Qilla Bandi.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-6 bg-white dark:bg-[#07111a]">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-semibold whitespace-nowrap">Khasra List</h3>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by type, murabba, khasra, tehsil .."
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
            <div dir="ltr" className="min-w-[1100px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-sm text-gray-500">
                    <th className="py-2 px-2 whitespace-nowrap">Sr. No</th>
                    <th className="py-2 px-2 whitespace-nowrap">Type</th>
                    <th className="py-2 px-2 whitespace-nowrap">Murabba</th>
                    <th className="py-2 px-2 whitespace-nowrap">Khasra</th>
                    {/* <th className="py-2 px-2 whitespace-nowrap">Sub-Khasra</th> */}
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
                    <tr key={d.khasra_id ?? d.gid ?? idx} className="border-t">
                      <td className="py-2 px-2 whitespace-nowrap">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        {d.type ?? "-"}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        {d.m ?? "-"}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        {d.k ?? "-"}
                      </td>
                      {/* <td className="py-2 px-2 whitespace-nowrap">
                        {d.sk ?? "-"}
                      </td> */}
                      <td>
                        {d.karam !== null && d.karam !== undefined
                          ? Number(d.karam).toFixed(2)
                          : "-"}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        {d.mauza ?? "-"}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        {d.tehsil ?? "-"}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        {d.district ?? "-"}
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
