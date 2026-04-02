import React, { useEffect, useMemo, useState } from "react";
import { Search, Pencil, Trash2, Plus, ChevronDown } from "lucide-react";
import { getDivisions } from "../../services/api";

export default function Division() {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getDivisions();
        setDivisions(res || []);
      } catch (err) {
        console.error("Failed to load divisions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  const filteredDivisions = useMemo(() => {
    if (!search.trim()) return divisions;

    return divisions.filter((d) =>
      String(d.division ?? d.name ?? "")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [divisions, search]);

  return (
    <div className="min-h-screen bg-[#f6f7fb] px-4 py-6 md:px-6">
      <div className="mx-auto w-full max-w-[1400px] space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-[18px] font-bold leading-none text-[#243b6b] md:text-[20px]">
            Division – Add / Edit
          </h1>
          <p className="mt-2 text-[14px] text-[#7b8497]">
            Create a new division or edit an existing one.
          </p>
        </div>

        {/* Form Card */}
        <div className="overflow-hidden rounded-[18px] border border-[#e7eaf1] bg-white shadow-[0_2px_10px_rgba(17,24,39,0.04)]">
          <div className="h-[5px] w-full bg-[#ef233c]" />

          <div className="px-6 py-7 md:px-7">
            <h2 className="text-[22px] font-extrabold uppercase tracking-[1.8px] text-[#66708b]">
              Basic Information
            </h2>

            <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-12 xl:items-end">
              {/* Province */}
              <div className="xl:col-span-4">
                <label className="mb-2 block text-[13px] font-bold uppercase tracking-[1px] text-[#7f8798]">
                  Province <span className="text-[#ef233c]">*</span>
                </label>

                <div className="relative">
                  <select className="h-[46px] w-full appearance-none rounded-[10px] border border-[#e2e6ee] bg-white px-4 pr-12 text-[15px] text-[#7d8698] outline-none transition focus:border-[#cfd6e3]">
                    <option>Select province</option>
                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#a0a8b8]"
                  />
                </div>
              </div>

              {/* Division Name */}
              <div className="xl:col-span-4">
                <label className="mb-2 block text-[13px] font-bold uppercase tracking-[1px] text-[#7f8798]">
                  Division Name <span className="text-[#1da53f]">*</span>
                </label>

                <input
                  type="text"
                  placeholder="Enter division name"
                  className="h-[46px] w-full rounded-[10px] border border-[#e2e6ee] bg-white px-4 text-[15px] text-[#4b5565] placeholder:text-[#a0a8b8] outline-none transition focus:border-[#cfd6e3]"
                />
              </div>

              {/* Buttons */}
              <div className="xl:col-span-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-start xl:justify-end">
                  <button className="inline-flex h-[46px] items-center justify-center gap-2 rounded-[8px] bg-[#ef233c] px-6 text-[16px] font-semibold text-white shadow-sm transition hover:bg-[#db1f35]">
                    <Plus size={18} strokeWidth={2.5} />
                    <span>Create Division</span>
                  </button>

                  <button className="inline-flex h-[46px] items-center justify-center rounded-[8px] border border-[#f1c8cd] bg-white px-8 text-[15px] font-semibold text-[#ef233c] transition hover:bg-red-50">
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* List Section */}
        <div>
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h3 className="text-[18px] font-bold text-[#243b6b]">Division List</h3>

            <div className="relative w-full md:w-[320px]">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8d96a8]"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name .."
                className="h-[46px] w-full rounded-[10px] border border-[#e2e6ee] bg-white pl-11 pr-4 text-[15px] text-[#4b5565] placeholder:text-[#9ca3af] outline-none transition focus:border-[#cfd6e3]"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-[16px] border border-[#e7eaf1] bg-white shadow-[0_2px_10px_rgba(17,24,39,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="border-b border-[#edf0f5] bg-white">
                    <th className="px-6 py-4 text-left text-[15px] font-bold text-[#74809a]">
                      #
                    </th>
                    <th className="px-6 py-4 text-left text-[15px] font-bold text-[#74809a]">
                      Province
                    </th>
                    <th className="px-6 py-4 text-left text-[15px] font-bold text-[#74809a]">
                      Division
                    </th>
                    <th className="px-6 py-4 text-right text-[15px] font-bold text-[#74809a]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-[15px] text-[#7b8497]"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : filteredDivisions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-[15px] text-[#7b8497]"
                      >
                        No divisions found
                      </td>
                    </tr>
                  ) : (
                    filteredDivisions.map((d, idx) => {
                      const provinceName =
                        d.province ?? d.province_name ?? "Punjab";
                      const provinceShort =
                        d.province_code ??
                        provinceName?.slice(0, 2)?.toUpperCase() ??
                        "PU";

                      return (
                        <tr
                          key={d.id ?? d.gid ?? idx}
                          className="border-b border-[#edf0f5] last:border-b-0"
                        >
                          <td className="px-6 py-4 text-[17px] font-semibold text-[#2f3b52]">
                            {idx + 1}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f3f5f9] text-[15px] font-bold text-[#6f7b8e]">
                                {provinceShort}
                              </div>
                              <span className="text-[18px] font-medium text-[#445066]">
                                {provinceName}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-[18px] font-semibold text-[#243b6b]">
                            {d.division ?? d.name ?? "-"}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-3">
                              <button className="inline-flex h-[42px] items-center gap-2 rounded-[10px] border border-[#e8ebf2] bg-white px-5 text-[15px] font-semibold text-[#3f4d63] transition hover:bg-[#f8fafc]">
                                <Pencil size={17} />
                                <span>Edit</span>
                              </button>

                              <button className="inline-flex h-[42px] items-center gap-2 rounded-[10px] border border-[#f3d6db] bg-white px-5 text-[15px] font-semibold text-[#ef233c] transition hover:bg-red-50">
                                <Trash2 size={17} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}