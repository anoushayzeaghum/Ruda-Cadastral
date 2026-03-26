import React from "react";

const topCards = [
  {
    title: "RUDA Owned Land",
    value: "25,800",
    unit: "Acres",
    tone: "green",
    featured: true,
    icon: "building",
  },
  {
    title: "State Land",
    value: "8,500",
    unit: "Acres",
    tone: "whiteGreen",
    icon: "state",
  },
  {
    title: "Private Land",
    value: "68,200",
    unit: "Acres",
    tone: "lightGreen",
    icon: "private",
  },
  {
    title: "Disputed Land",
    value: "3,200",
    unit: "Acres",
    tone: "danger",
    icon: "warning",
  },
  {
    title: "State Land",
    value: "8,500",
    unit: "Acres",
    tone: "blueGreen",
    featured: true,
    icon: "state",
  },
  {
    title: "Pirvte Land",
    value: "68,200",
    unit: "Acres",
    tone: "whiteGreen",
    icon: "private",
  },
  {
    title: "Under Acquisition",
    value: "12,400",
    unit: "Acres",
    tone: "softOlive",
    icon: "acquisition",
  },
  {
    title: "Encroached Land",
    value: "1,150",
    unit: "Acres",
    tone: "softDanger",
    icon: "encroach",
  },
];

const divisions = [
  { name: "Lahore Division", count: 78 },
  { name: "Sheikhupura Division", count: 32 },
  { name: "Nankana Sahib", count: 18 },
];

const actions = [
  "Add New Parcel",
  "Add Mutation Record",
  "Start Survey Entry",
  "Generate Report",
];

function Icon({ type, className = "w-5 h-5" }) {
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
    default:
      return null;
  }
}

function getCardTone(tone) {
  switch (tone) {
    case "green":
      return {
        box: "bg-gradient-to-r from-[#1f6b4f] via-[#2b7b59] to-[#2a6f54] text-white",
        value: "text-white",
        unit: "text-white/95",
        title: "text-white/95",
        icon: "text-white/90",
        overlay:
          "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.16),transparent_35%),linear-gradient(to_right,rgba(255,255,255,0.02),rgba(255,255,255,0.05))]",
      };
    case "whiteGreen":
      return {
        box: "bg-[#f7f7f3] text-[#224e3f]",
        value: "text-[#214f3b]",
        unit: "text-[#214f3b]",
        title: "text-[#213b33]",
        icon: "text-[#355f4e]",
        overlay:
          "before:absolute before:inset-0 before:bg-[linear-gradient(to_right,rgba(35,120,83,0.03),rgba(35,120,83,0.01))]",
      };
    case "lightGreen":
      return {
        box: "bg-gradient-to-r from-[#79b87a] via-[#9ac88d] to-[#b0d39f] text-white",
        value: "text-white",
        unit: "text-white/95",
        title: "text-white/95",
        icon: "text-white/90",
        overlay:
          "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.18),transparent_35%),linear-gradient(to_right,rgba(255,255,255,0.03),rgba(255,255,255,0.08))]",
      };
    case "danger":
      return {
        box: "bg-[#faf9f6] text-[#8c2e25]",
        value: "text-[#a13226]",
        unit: "text-[#7d322b]",
        title: "text-[#8b2f26]",
        icon: "text-[#b14534]",
        overlay:
          "before:absolute before:inset-0 before:bg-[linear-gradient(to_right,rgba(140,46,37,0.03),rgba(140,46,37,0.01))]",
      };
    case "blueGreen":
      return {
        box: "bg-gradient-to-r from-[#2e7180] via-[#5fa6a2] to-[#92c7b4] text-white",
        value: "text-white",
        unit: "text-white/95",
        title: "text-white/95",
        icon: "text-white/90",
        overlay:
          "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_78%_35%,rgba(255,255,255,0.18),transparent_40%),linear-gradient(to_right,rgba(255,255,255,0.03),rgba(255,255,255,0.09))]",
      };
    case "softOlive":
      return {
        box: "bg-gradient-to-r from-[#e7edd3] via-[#eef2dd] to-[#f4f5eb] text-[#758214]",
        value: "text-[#879215]",
        unit: "text-[#7a831c]",
        title: "text-[#7c8920]",
        icon: "text-[#76841c]",
        overlay:
          "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.5),transparent_35%)]",
      };
    case "softDanger":
      return {
        box: "bg-[#faf6f3] text-[#8f2f25]",
        value: "text-[#a43227]",
        unit: "text-[#7c3029]",
        title: "text-[#892f27]",
        icon: "text-[#972f24]",
        overlay:
          "before:absolute before:inset-0 before:bg-[linear-gradient(to_right,rgba(166,50,39,0.025),rgba(166,50,39,0.01))]",
      };
    default:
      return {
        box: "bg-white text-slate-800",
        value: "text-slate-900",
        unit: "text-slate-700",
        title: "text-slate-700",
        icon: "text-slate-600",
        overlay: "",
      };
  }
}

function StatCard({ card }) {
  const tone = getCardTone(card.tone);

  return (
    <div
      className={[
        "relative overflow-hidden rounded-[22px] border border-[#d8ddd5] shadow-[0_4px_14px_rgba(38,65,47,0.08)]",
        "px-6 pt-5 pb-4 min-h-[132px]",
        tone.box,
        tone.overlay,
      ].join(" ")}
    >
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className={`${tone.icon} shrink-0`}>
            <Icon type={card.icon} className="h-6 w-6" />
          </div>
          <h3 className={`text-[16px] md:text-[18px] font-medium tracking-[0.1px] ${tone.title}`}>
            {card.title}
          </h3>
        </div>

        <div className="mt-3 flex items-end gap-2 leading-none">
          <span className={`text-[44px] md:text-[54px] font-semibold tracking-[-1.8px] ${tone.value}`}>
            {card.value}
          </span>
          <span className={`pb-[8px] text-[18px] md:text-[20px] font-medium ${tone.unit}`}>
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
        "rounded-[22px] border border-[#d8ddd5] bg-[#fbfbf8]",
        "shadow-[0_4px_14px_rgba(38,65,47,0.08)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function SectionTitle({ icon, children, green = false }) {
  return (
    <div className="flex items-center gap-3">
      {icon ? (
        <span className={green ? "text-[#1d6f45]" : "text-[#415348]"}>
          {icon}
        </span>
      ) : null}
      <h3 className={`text-[18px] md:text-[22px] font-medium ${green ? "text-[#1d6f45]" : "text-[#223128]"}`}>
        {children}
      </h3>
    </div>
  );
}

function RowItem({ label, value, last = false }) {
  return (
    <div className={`flex items-center justify-between py-3 ${last ? "" : "border-b border-[#e8ece4]"}`}>
      <span className="text-[17px] md:text-[18px] text-[#2d342f]">{label}</span>
      <span className="text-[22px] md:text-[24px] font-medium text-[#223128]">{value}</span>
    </div>
  );
}

function ProgressBar({ value, total = 100, color = "bg-[#2f9a59]" }) {
  const width = `${Math.max(0, Math.min(100, (value / total) * 100))}%`;

  return (
    <div className="h-[12px] w-full overflow-hidden rounded-full bg-[#d7dfdb]">
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
          className={`h-[22px] w-[22px] rounded-[2px] border border-[#b5c6b8] ${
            i < filled ? "bg-[#2d8a4f]" : "bg-[#c9d4cf]"
          }`}
        />
      ))}
    </div>
  );
}

function CircularChart() {
  return (
    <div className="relative h-[130px] w-[130px] shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke="#dce6dd"
          strokeWidth="12"
        />
        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke="#2b8547"
          strokeWidth="12"
          strokeLinecap="butt"
          strokeDasharray="208 264"
        />
        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke="#78be78"
          strokeWidth="12"
          strokeLinecap="butt"
          strokeDasharray="56 264"
          strokeDashoffset="-208"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[22px] md:text-[24px] font-semibold text-[#1f5f35]">79%</span>
      </div>
    </div>
  );
}

function MiniMetric({ icon, value }) {
  return (
    <div className="flex items-center gap-3 text-[#253128]">
      <span className="text-[#536154]">{icon}</span>
      <span className="text-[18px] md:text-[20px] font-medium">{value}</span>
    </div>
  );
}

function MapMock() {
  return (
    <div className="relative h-[180px] w-full overflow-hidden rounded-[16px] border border-[#e0e6dd] bg-[#e8ede6]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.6),transparent_25%),radial-gradient(circle_at_80%_40%,rgba(255,255,255,0.35),transparent_22%),linear-gradient(135deg,#e9ede8_0%,#dfe6de_100%)]" />

      <svg viewBox="0 0 500 220" className="absolute inset-0 h-full w-full opacity-80">
        <path d="M0 55H500M0 105H500M0 155H500M70 0V220M150 0V220M240 0V220M330 0V220M430 0V220" stroke="#d7ded8" strokeWidth="1" />
        <path d="M0 28C72 48 145 38 220 52C290 65 355 35 430 42C464 45 482 48 500 58" stroke="#d4dad5" strokeWidth="2" fill="none" />
        <path d="M0 128C70 110 132 124 210 112C278 102 330 124 410 116C450 112 478 115 500 123" stroke="#d4dad5" strokeWidth="2" fill="none" />
      </svg>

      <svg viewBox="0 0 500 220" className="absolute inset-0 h-full w-full">
        <path
          d="M118 47L164 30L202 44L239 35L278 53L322 59L356 84L347 106L363 132L347 164L307 179L274 171L247 194L204 188L175 165L142 162L118 140L101 107L107 77Z"
          fill="#9ad0bb"
          stroke="#51635c"
          strokeWidth="3"
          opacity="0.95"
        />
        <path
          d="M118 140L145 145L172 157L188 175L169 185L145 184L124 171L112 157Z"
          fill="#d6b06a"
          opacity="0.95"
        />
        <path
          d="M169 70L205 61L235 78L232 110L210 122L177 112L160 89Z"
          fill="#f0df98"
          opacity="0.95"
        />
        <path
          d="M239 68L277 62L310 78L303 110L271 126L240 106Z"
          fill="#dfe9bf"
          opacity="0.98"
        />
        <path
          d="M77 86L107 77L118 140L102 145L82 128L72 106Z"
          fill="#3f88b8"
          opacity="0.95"
        />
        <path
          d="M333 74L356 84L347 106L363 132L347 164L321 155L313 128L320 96Z"
          fill="#a9c6b9"
          opacity="0.95"
        />
        <circle cx="222" cy="98" r="16" fill="#628f7c" opacity="0.9" />
        <circle cx="222" cy="98" r="8" fill="#efe0a2" opacity="0.95" />
      </svg>
    </div>
  );
}

export default function Statistics() {
  return (
    <section className="w-full rounded-[26px] border border-[#cdd7cd] bg-[linear-gradient(180deg,#d9e6dc_0%,#cfddd2_100%)] p-5 md:p-7 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]">
      <div className="space-y-5">
        {/* TOP 8 CARDS */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {topCards.map((card) => (
            <StatCard key={`${card.title}-${card.value}-${card.tone}`} card={card} />
          ))}
        </div>

        {/* MIDDLE PANELS */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_2.6fr_1.35fr]">
          <Panel className="px-5 py-4">
            <SectionTitle>Mouzas by Division</SectionTitle>

            <div className="mt-4">
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

          <Panel className="px-6 py-4">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_1px_1fr] xl:gap-6">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <SectionTitle green>Survey Progress</SectionTitle>

                  <div className="flex items-center gap-2 text-[18px] font-medium text-[#3a4c3e]">
                    <span>Total</span>
                    <Icon type="doc" className="h-5 w-5 text-[#627766]" />
                    <span>1200</span>
                    <span className="text-[#2c7444]">$</span>
                    <span className="text-[22px] font-semibold text-[#205f37]">82,400</span>
                  </div>
                </div>

                <div className="mt-5 space-y-5">
                  <div className="grid grid-cols-[1.1fr_auto_1.4fr] items-center gap-4">
                    <span className="text-[18px] text-[#334038]">Total Khasras</span>
                    <span className="text-[24px] font-semibold text-[#1e5e37]">82,400</span>
                    <ProgressBar value={72} color="bg-[#2e9456]" />
                  </div>

                  <div className="grid grid-cols-[1.1fr_auto_1.4fr] items-center gap-4">
                    <span className="text-[18px] text-[#334038]">Surveyed</span>
                    <span className="text-[24px] font-semibold text-[#1e5e37]">32,200</span>
                    <ProgressBar value={58} color="bg-[#4aa86f]" />
                  </div>

                  <div className="grid grid-cols-[1.1fr_auto_1.4fr] items-center gap-4">
                    <span className="text-[18px] text-[#334038]">Pending</span>
                    <span className="text-[24px] font-semibold text-[#1e5e37]">17,200</span>
                    <ProgressBar value={22} color="bg-[#2a7e49]" />
                  </div>
                </div>
              </div>

              <div className="hidden xl:block bg-[#dde5de]" />

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-[18px] md:text-[20px] font-medium text-[#2d342f]">
                    Land Disputes
                  </h4>
                  <div className="flex items-center gap-1 text-[16px] md:text-[18px] font-medium">
                    <span className="text-[#76a170]">$</span>
                    <span className="text-[22px] font-semibold text-[#1f5f35]">3,500</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-5">
                  <CircularChart />

                  <div className="space-y-3">
                    <MiniMetric icon={<Icon type="private" className="h-5 w-5" />} value="600%" />
                    <MiniMetric icon={<Icon type="state" className="h-5 w-5" />} value="92%" />
                    <MiniMetric icon={<Icon type="doc" className="h-5 w-5" />} value="25%" />
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="px-6 py-4">
            <SectionTitle icon={<Icon type="clipboard" className="h-6 w-6" />}>
              Digitization Status
            </SectionTitle>

            <div className="mt-5 space-y-5">
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4">
                <span className="text-[18px] text-[#334038]">Fard Records</span>
                <SegmentedBar value={80} />
                <span className="text-[20px] font-semibold text-[#1e5e37]">80%</span>
              </div>

              <div className="grid grid-cols-[1fr_110px_auto] items-center gap-4">
                <span className="text-[18px] text-[#334038]">Jamabandi</span>
                <ProgressBar value={72} color="bg-[#2e9456]" />
                <span className="text-[20px] font-semibold text-[#1e5e37]">72%</span>
              </div>

              <div className="grid grid-cols-[1fr_110px_auto] items-center gap-4">
                <span className="text-[18px] text-[#334038]">Mutation Registers</span>
                <ProgressBar value={63} color="bg-[#2f8650]" />
                <span className="text-[20px] font-semibold text-[#1e5e37]">63%</span>
              </div>
            </div>
          </Panel>
        </div>

        {/* BOTTOM PANELS */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1.35fr_1.1fr_1.3fr]">
          <Panel className="p-4">
            <MapMock />

            <div className="mt-3 flex flex-wrap items-center gap-6 rounded-[12px] border border-[#e5e9e2] bg-white/55 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-5 w-7 rounded-[4px] bg-[#4d8f69]" />
                <span className="text-[15px] md:text-[16px] text-[#2c352f]">Phase 1</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-5 w-7 rounded-[4px] bg-[#4283b8]" />
                <span className="text-[15px] md:text-[16px] text-[#2c352f]">Phase 2</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-5 w-7 rounded-[4px] bg-[#d4ac58]" />
                <span className="text-[15px] md:text-[16px] text-[#2c352f]">Phase 3</span>
              </div>
              <span className="ml-auto text-[18px] text-[#58655d]">...</span>
            </div>
          </Panel>

          <Panel className="px-5 py-4">
            <SectionTitle>Mouzas by Division</SectionTitle>

            <div className="mt-4">
              {divisions.map((item, index) => (
                <RowItem
                  key={`bottom-${item.name}`}
                  label={item.name}
                  value={item.count}
                  last={index === divisions.length - 1}
                />
              ))}
            </div>
          </Panel>

          <Panel className="px-5 py-4">
            <SectionTitle icon={<Icon type="user" className="h-6 w-6" />}>
              Survey Progress
            </SectionTitle>

            <div className="mt-4 space-y-4">
              <RowItem label="Total Khasras" value="82,400" />
              <RowItem label="Surveyed" value="65,200" />
              <RowItem label="Pending Mutations" value="13,400" />
              <RowItem label="Digitized Records" value="78%" last />
            </div>
          </Panel>

          <div className="flex flex-col gap-4">
            {actions.map((action) => (
              <button
                key={action}
                className="flex h-[56px] items-center justify-between rounded-[14px] border border-[#2f6f4e] bg-[#1f6f49] px-6 text-left text-white shadow-[0_3px_10px_rgba(28,88,58,0.18)] transition hover:bg-[#1b6542]"
              >
                <span className="flex items-center gap-3 text-[17px] md:text-[18px] font-medium">
                  <Icon type="plus" className="h-5 w-5" />
                  {action}
                </span>
                <Icon type="arrowRight" className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}