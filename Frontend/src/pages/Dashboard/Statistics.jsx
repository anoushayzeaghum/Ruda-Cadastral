import React, { useState } from "react";
import MapPanel from "./MapPanel";
import BarChart from "./BarChart";

/* ── Land Detail Cards ── */
const landCards = [
  {
    title: "RUDA Owned Land",
    value: "18,600",
    unit: "Acres",
    tone: "green",
    icon: "building",
  },
  {
    title: "Disputed Land",
    value: "2,900",
    unit: "Acres",
    tone: "danger",
    icon: "warning",
  },
  {
    title: "Under Acquisition",
    value: "12,400",
    unit: "Acres",
    tone: "softDanger",
    icon: "acquisition",
  },
  {
    title: "Encroached Land",
    value: "980",
    unit: "Acres",
    tone: "green",
    icon: "encroach",
  },
];

/* ── Mouza Detail Cards ── */
const mouzaCards = [
  {
    title: "Total Mouzas",
    value: "170",
    unit: "Mouzas",
    tone: "green",
    icon: "state",
  },
  {
    title: "Surveyed Mouzas",
    value: "128",
    unit: "Mouzas",
    tone: "green",
    icon: "clipboard",
  },
  {
    title: "Pending Survey",
    value: "42",
    unit: "Mouzas",
    tone: "danger",
    icon: "warning",
  },
  {
    title: "Total Tehsils",
    value: "6",
    unit: "Tehsils",
    tone: "blueGreen",
    icon: "building",
  },
];

const divisions = [
  { name: "Lahore Division", count: 96 },
  { name: "Sheikhupura Division", count: 54 },
  { name: "Nankana Sahib", count: 18 },
];

const actions = [
  "Add New Parcel",
  "Add Mutation Record",
  "Start Survey Entry",
  "Generate Report",
];

export function Icon({ type, className = "w-5 h-5" }) {
  const common = "currentColor";

  switch (type) {
    case "building":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M3 20H21" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M5 9L12 4L19 9" stroke={common} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.5 10.5V18" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M10 10.5V18" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M14 10.5V18" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M17.5 10.5V18" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "state":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M4 20H20" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M5 10H19V20H5V10Z" stroke={common} strokeWidth="1.8" />
          <path d="M3.5 10L12 5L20.5 10" stroke={common} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 13V17" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 13V17" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 13V17" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "private":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M4 20H20" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M6 10.5L12 5L18 10.5" stroke={common} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 10.5V20" stroke={common} strokeWidth="1.8" />
          <path d="M17 10.5V20" stroke={common} strokeWidth="1.8" />
          <path d="M10 20V14H14V20" stroke={common} strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "warning":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M12 4L21 20H3L12 4Z" stroke={common} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 9V13.5" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="17.2" r="1" fill={common} />
        </svg>
      );
    case "acquisition":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <rect x="4" y="6" width="16" height="13" rx="1.5" stroke={common} strokeWidth="1.8" />
          <path d="M8 6V4.5" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 6V4.5" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4 10H20" stroke={common} strokeWidth="1.8" />
          <path d="M8 14H12" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "encroach":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M3 20H21" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M5 20V10" stroke={common} strokeWidth="1.8" />
          <path d="M9 20V10" stroke={common} strokeWidth="1.8" />
          <path d="M13 20V10" stroke={common} strokeWidth="1.8" />
          <path d="M17 20V10" stroke={common} strokeWidth="1.8" />
          <path d="M4 10H18" stroke={common} strokeWidth="1.8" />
          <path d="M6 7.5H8.5" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M10.5 7.5H13" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M15 7.5H17.5" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "clipboard":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <rect x="6" y="5" width="12" height="15" rx="2" stroke={common} strokeWidth="1.8" />
          <path d="M9 5.5C9 4.67 9.67 4 10.5 4H13.5C14.33 4 15 4.67 15 5.5V6H9V5.5Z" stroke={common} strokeWidth="1.8" />
          <path d="M9 10H15" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9 13.5H15" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "user":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <circle cx="12" cy="8" r="3.2" stroke={common} strokeWidth="1.8" />
          <path d="M5.5 19C6.6 15.9 8.9 14.5 12 14.5C15.1 14.5 17.4 15.9 18.5 19" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "plus":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M12 5V19" stroke={common} strokeWidth="2" strokeLinecap="round" />
          <path d="M5 12H19" stroke={common} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "arrowRight":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M9 6L15 12L9 18" stroke={common} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "doc":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M7 3.8H13.8L18 8V20A1.8 1.8 0 0 1 16.2 21.8H7.8A1.8 1.8 0 0 1 6 20V5.6A1.8 1.8 0 0 1 7.8 3.8H7Z" stroke={common} strokeWidth="1.8" />
          <path d="M13 4V8H17" stroke={common} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 12H15" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9 15H13.5" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "land":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M2 20L8 14L13 17L22 8" stroke={common} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 8H22V14" stroke={common} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "mouza":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke={common} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M2 17L12 22L22 17" stroke={common} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 12L12 17L22 12" stroke={common} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

function getCardTone(tone) {
  const baseBox = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800";
  const baseValue = "text-slate-900 dark:text-white";
  const baseUnit = "text-slate-500 dark:text-slate-400";
  const baseTitle = "text-slate-500 dark:text-slate-400";

  switch (tone) {
    case "green":
      return { box: baseBox, value: baseValue, unit: baseUnit, title: baseTitle, icon: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 p-1.5 rounded-lg", overlay: "" };
    case "whiteGreen":
    case "lightGreen":
      return { box: baseBox, value: baseValue, unit: baseUnit, title: baseTitle, icon: "text-teal-500 bg-teal-50 dark:bg-teal-500/10 p-1.5 rounded-lg", overlay: "" };
    case "danger":
    case "softDanger":
      return { box: baseBox, value: baseValue, unit: baseUnit, title: baseTitle, icon: "text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-1.5 rounded-lg", overlay: "" };
    case "blueGreen":
      return { box: baseBox, value: baseValue, unit: baseUnit, title: baseTitle, icon: "text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 p-1.5 rounded-lg", overlay: "" };
    default:
      return { box: baseBox, value: baseValue, unit: baseUnit, title: baseTitle, icon: "text-slate-500 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg", overlay: "" };
  }
}

function StatCard({ card }) {
  const tone = getCardTone(card.tone);

  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border px-4 py-4 min-h-0",
        "shadow-sm transition-shadow duration-300 hover:shadow-md",
        tone.box,
        tone.overlay,
      ].join(" ")}
    >
      <div className="relative z-10 flex-col justify-start gap-1">
        <div className="flex items-center gap-3">
          <div className={`${tone.icon} shrink-0`}>
            <Icon type={card.icon} className="h-5 w-5" />
          </div>
          <h3
            className={`text-[13px] md:text-[14px] font-medium tracking-tight ${tone.title}`}
          >
            {card.title}
          </h3>
        </div>

        <div className="mt-3 flex items-end gap-1.5 leading-none">
          <span
            className={`text-[20px] md:text-[24px] font-bold tracking-tight ${tone.value}`}
          >
            {card.value}
          </span>
          <span
            className={`pb-0.5 text-[12px] md:text-[13px] font-medium ${tone.unit}`}
          >
            {card.unit}
          </span>
        </div>
      </div>
    </div>
  );
}

function Panel({ className = "", children }) {
  return (
    <div
      className={[
        "rounded-2xl bg-white dark:bg-slate-900",
        "border border-slate-200 dark:border-slate-800",
        "shadow-sm transition-shadow duration-300 hover:shadow-md",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function SectionTitle({ icon, children, green = false }) {
  return (
    <div className="flex items-center gap-2.5">
      {icon ? (
        <span className={green ? "text-emerald-600 dark:text-emerald-500" : "text-slate-600 dark:text-slate-400"}>
          {icon}
        </span>
      ) : null}
      <h3
        className={`text-[15px] md:text-[16px] font-semibold ${green ? "text-emerald-600 dark:text-emerald-500" : "text-slate-800 dark:text-slate-100"}`}
      >
        {children}
      </h3>
    </div>
  );
}

function RowItem({ label, value, last = false }) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${last ? "" : "border-b border-slate-100 dark:border-slate-800"}`}
    >
      <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">{label}</span>
      <span className="text-[14px] font-semibold text-slate-900 dark:text-white">
        {value}
      </span>
    </div>
  );
}

function ProgressBar({ value, total = 100, color = "bg-teal-500" }) {
  const width = `${Math.max(0, Math.min(100, (value / total) * 100))}%`;

  return (
    <div className="h-[9px] w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div className={`h-full rounded-full ${color}`} style={{ width }} />
    </div>
  );
}

function SegmentedBar({ value, segments = 4 }) {
  const filled = Math.round((value / 100) * segments);

  return (
    <div className="flex items-center gap-[3px]">
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={`h-[16px] w-[16px] rounded-[2px] border border-slate-200 dark:border-slate-700 ${
            i < filled ? "bg-emerald-500 border-emerald-500" : "bg-slate-100 dark:bg-slate-800"
          }`}
        />
      ))}
    </div>
  );
}

function CircularChart() {
  return (
    <div className="relative h-[92px] w-[92px] shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r="42" fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="12" />
        <circle cx="60" cy="60" r="42" fill="none" className="stroke-emerald-500" strokeWidth="12" strokeLinecap="butt" strokeDasharray="208 264" />
        <circle cx="60" cy="60" r="42" fill="none" className="stroke-teal-400" strokeWidth="12" strokeLinecap="butt" strokeDasharray="56 264" strokeDashoffset="-208" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[18px] font-semibold text-slate-900 dark:text-white">79%</span>
      </div>
    </div>
  );
}

function MiniMetric({ icon, value }) {
  return (
    <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
      <span className="text-slate-400 dark:text-slate-500">{icon}</span>
      <span className="text-[12px] md:text-[13px] font-medium">{value}</span>
    </div>
  );
}

export function FilterTab({ active, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex items-center gap-2 px-6 py-2.5 rounded-full text-[14px] font-semibold transition-all duration-200 border-none select-none",
        active
          ? "bg-[#10b981] hover:bg-[#059669] text-white shadow-sm"
          : "bg-[#f1f5f9] hover:bg-[#e2e8f0] dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

export default function Statistics({ activeFilter = "land" }) {
  const activeCards = activeFilter === "land" ? landCards : mouzaCards;

  return (
    <section className="w-full">
      <div className="space-y-3.5">
        {/* ── Row 1: Map + Filtered Cards ── */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_2.8fr]">
          <Panel className="p-0 bg-white dark:bg-slate-900 border-none shadow-none">
            <div className="h-[260px] sm:h-[320px] xl:h-full min-h-[220px] overflow-hidden rounded-[18px]">
              <MapPanel darkMode={false} />
            </div>
          </Panel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {activeCards.map((card) => (
              <StatCard
                key={`${card.title}-${card.value}-${card.tone}`}
                card={card}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.02fr_2.4fr_1.2fr]">
          <Panel className="px-4 py-3.5">
            <SectionTitle>Mauzas by Division</SectionTitle>

            <div className="mt-2">
              {divisions.map((item, index) => (
                <RowItem
                  key={item.name}
                  label={item.name}
                  value={item.count}
                  last={index === divisions.length - 1}
                />
              ))}
            </div>
          </Panel>

          <Panel className="px-4 py-3.5">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1px_0.95fr] xl:gap-4">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <SectionTitle green>Survey Progress</SectionTitle>

                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                      <span>Total</span>
                      <Icon type="doc" className="h-4 w-4" />
                      <span>780</span>
                      <span className="text-emerald-500 font-bold">$</span>
                      <span className="text-[18px] font-bold text-slate-900 dark:text-white">
                        52,000
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-3">
                    <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[1.05fr_auto_1.25fr] sm:items-center sm:gap-3">
                      <div className="flex justify-between items-center sm:contents">
                        <span className="text-[12px] font-medium text-slate-600 dark:text-slate-400">
                          Total Khasras
                        </span>
                        <span className="text-[16px] font-bold text-slate-900 dark:text-white">
                          52,000
                        </span>
                      </div>
                      <ProgressBar value={100} color="bg-emerald-500" />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[1.05fr_auto_1.25fr] sm:items-center sm:gap-3">
                      <div className="flex justify-between items-center sm:contents">
                        <span className="text-[12px] font-medium text-slate-600 dark:text-slate-400">Surveyed</span>
                        <span className="text-[16px] font-bold text-slate-900 dark:text-white">
                          31,200
                        </span>
                      </div>
                      <ProgressBar value={60} color="bg-teal-500" />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[1.05fr_auto_1.25fr] sm:items-center sm:gap-3">
                      <div className="flex justify-between items-center sm:contents">
                        <span className="text-[12px] font-medium text-slate-600 dark:text-slate-400">Pending</span>
                        <span className="text-[16px] font-bold text-slate-900 dark:text-white">
                          20,800
                        </span>
                      </div>
                      <ProgressBar value={40} color="bg-cyan-500" />
                    </div>
                  </div>
                </div>

                <div className="hidden xl:block bg-slate-200 dark:bg-slate-800" />

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-[15px] md:text-[16px] font-semibold text-slate-900 dark:text-white">
                      Land Disputes
                    </h4>
                    <div className="flex items-center gap-1 text-[13px] font-medium">
                      <span className="text-emerald-500 font-bold">$</span>
                      <span className="text-[18px] font-bold text-slate-900 dark:text-white">
                        2,900
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    <CircularChart />

                    <div className="space-y-3">
                      <MiniMetric
                        icon={<Icon type="private" className="h-4 w-4" />}
                        value="1,850 Cases"
                      />
                      <MiniMetric
                        icon={<Icon type="state" className="h-4 w-4" />}
                        value="740 Cases"
                      />
                      <MiniMetric
                        icon={<Icon type="doc" className="h-4 w-4" />}
                        value="310 Pending"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel className="px-4 py-4">
              <SectionTitle icon={<Icon type="clipboard" className="h-5 w-5" />}>
                Digitization Status
              </SectionTitle>

              <div className="mt-3 space-y-3">
                <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-3">
                  <div className="flex justify-between items-center sm:contents">
                    <span className="text-[12px] font-medium text-slate-600 dark:text-slate-400">Fard Records</span>
                    <span className="text-[16px] font-semibold text-slate-900 dark:text-white sm:order-last">
                      76%
                    </span>
                  </div>
                  <div className="flex sm:justify-start">
                    <SegmentedBar value={76} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[1fr_95px_auto] sm:items-center sm:gap-3">
                  <div className="flex justify-between items-center sm:contents">
                    <span className="text-[12px] font-medium text-slate-600 dark:text-slate-400">Jamabandi</span>
                    <span className="text-[16px] font-semibold text-slate-900 dark:text-white sm:order-last">
                      68%
                    </span>
                  </div>
                  <ProgressBar value={68} color="bg-emerald-500" />
                </div>

              <div className="grid grid-cols-[1fr_95px_auto] items-center gap-3">
                <span className="text-[12px] text-[#334038]">
                  Mutation Registers
                </span>
                <ProgressBar value={59} color="bg-[#2f8650]" />
                <span className="text-[16px] font-semibold text-[#1e5e37]">
                  59%
                </span>
              </div>
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.4fr_1.2fr_1fr_1.12fr]">
          <Panel className="p-0 bg-white border-none shadow-none">
            <div className="h-full min-h-[220px]">
              <BarChart />
            </div>
          </Panel>

          <Panel className="px-4 py-3.5">
            <SectionTitle>Mauzas by Division</SectionTitle>

              <div className="mt-2">
                {divisions.map((item, index) => (
                  <RowItem
                    key={item.name}
                    label={item.name}
                    value={item.count}
                    last={index === divisions.length - 1}
                  />
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">Total</span>
                  <span className="text-[16px] font-bold text-emerald-600 dark:text-emerald-400">168</span>
                </div>
              </div>
            </Panel>

            <Panel className="px-4 py-4">
              <SectionTitle green>Survey Progress by Mouza</SectionTitle>

              <div className="mt-3 space-y-3">
                <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[1.05fr_auto_1.25fr] sm:items-center sm:gap-3">
                  <div className="flex justify-between items-center sm:contents">
                    <span className="text-[12px] font-medium text-slate-600 dark:text-slate-400">
                      Total Mouzas
                    </span>
                    <span className="text-[16px] font-bold text-slate-900 dark:text-white">
                      170
                    </span>
                  </div>
                  <ProgressBar value={100} color="bg-emerald-500" />
                </div>

                <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[1.05fr_auto_1.25fr] sm:items-center sm:gap-3">
                  <div className="flex justify-between items-center sm:contents">
                    <span className="text-[12px] font-medium text-slate-600 dark:text-slate-400">Surveyed</span>
                    <span className="text-[16px] font-bold text-slate-900 dark:text-white">
                      128
                    </span>
                  </div>
                  <ProgressBar value={75} color="bg-teal-500" />
                </div>

                <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[1.05fr_auto_1.25fr] sm:items-center sm:gap-3">
                  <div className="flex justify-between items-center sm:contents">
                    <span className="text-[12px] font-medium text-slate-600 dark:text-slate-400">Pending</span>
                    <span className="text-[16px] font-bold text-slate-900 dark:text-white">
                      42
                    </span>
                  </div>
                  <ProgressBar value={25} color="bg-cyan-500" />
                </div>
              </div>
            </Panel>

            <Panel className="px-4 py-4">
              <SectionTitle icon={<Icon type="clipboard" className="h-5 w-5" />}>
                Digitization Status
              </SectionTitle>

              <div className="mt-3 space-y-3">
                <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-3">
                  <div className="flex justify-between items-center sm:contents">
                    <span className="text-[12px] font-medium text-slate-600 dark:text-slate-400">Fard Records</span>
                    <span className="text-[16px] font-semibold text-slate-900 dark:text-white sm:order-last">
                      76%
                    </span>
                  </div>
                  <div className="flex sm:justify-start">
                    <SegmentedBar value={76} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[1fr_95px_auto] sm:items-center sm:gap-3">
                  <div className="flex justify-between items-center sm:contents">
                    <span className="text-[12px] font-medium text-slate-600 dark:text-slate-400">Jamabandi</span>
                    <span className="text-[16px] font-semibold text-slate-900 dark:text-white sm:order-last">
                      68%
                    </span>
                  </div>
                  <ProgressBar value={68} color="bg-emerald-500" />
                </div>

                <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[1fr_95px_auto] sm:items-center sm:gap-3">
                  <div className="flex justify-between items-center sm:contents">
                    <span className="text-[12px] font-medium text-slate-600 dark:text-slate-400">
                      Mutation Registers
                    </span>
                    <span className="text-[16px] font-semibold text-slate-900 dark:text-white sm:order-last">
                      59%
                    </span>
                  </div>
                  <ProgressBar value={59} color="bg-teal-500" />
                </div>
              </div>
            </Panel>
          </div>

        {/* ── Row 3: Bar Chart + Quick Actions (always visible) ── */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[2.4fr_1.2fr]">
          <Panel className="p-0 bg-white dark:bg-slate-900 border-none shadow-none">
            <div className="h-[280px] sm:h-[320px] xl:h-full">
              <BarChart />
            </div>
          </Panel>

          <div className="flex flex-col gap-3">
            {actions.map((action) => (
              <button
                key={action}
                className="flex h-[40px] items-center justify-between rounded-xl border border-emerald-600 bg-emerald-600 px-4 text-left text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md"
              >
                <span className="flex items-center gap-1.5 text-[13px] font-medium">
                  <Icon type="plus" className="h-4 w-4" />
                  {action}
                </span>
                <Icon type="arrowRight" className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
