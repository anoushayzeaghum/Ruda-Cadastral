import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import RudaLogo from "../../assets/RUDA L&M.png";
import NespakLogo from "../../assets/Nespak.png";
import RudaFooterLogo from "../../assets/Ruda.png";
import GopHeaderLogo from "../../assets/govtpunjab.png";
import {
  Map,
  BarChart3,
  Box,
  Database,
  Mail,
  Phone,
  MapPin,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ArrowRight,
  Layers,
  Search,
  ClipboardList,
  FileText,
  Eye,
  Smartphone,
  Star,
  Shield,
  Zap,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  ExternalLink,
  UploadCloud,
  Radio,
  Users,
  Leaf,
} from "lucide-react";

const HERO_SLIDES = [
  // "/s11.png",
  "/s22.png",
  "/s33.png",
  "/s44.png",
  "/s55.png",
  "/s6.png",
  // "/s7.png",
];

const NAV_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#apps", label: "Metaverse Components" },
  { href: "#features", label: "Features" },
  { href: "#contact", label: "Contact" },
];

const STAT_GROUPS = [
  {
    key: "lis",
    title: "Land Information System",
    stats: [
      { value: "2", label: "Total Districts" },
      { value: "10", label: "Total Tehsil" },
      { value: "173", label: "Total Mauza" },
      { value: "237,754", label: "Total Khasra" },
    ],
  },
  {
    key: "metaverse",
    title: "RUDA Metaverse",
    stats: [
      { value: "6", label: "Total Zones" },
      { value: "5", label: "Total Phases" },
      { value: "9", label: "Total Precincts" },
      { value: "70%", label: "Principal Zoning" },
    ],
  },
  {
    key: "rtw",
    title: "RTW Packages",
    stats: [
      { value: "20", label: "Total Packages" },
      { value: "19", label: "Total Projects" },
      { value: "5", label: "Total Phases" },
    ],
  },
  {
    key: "chaharbagh",
    title: "Chahar Bagh Phase 1",
    stats: [
      { value: "68%", label: "Residential" },
      { value: "12%", label: "Commercial" },
      { value: "9%", label: "Green Spaces" },
      { value: "11%", label: "Utilities" },
    ],
  },
];

const DECISION_AREAS = [
  {
    key: "land",
    number: "01",
    title: "Land Acquisition & Estate Management",
    shortTitle: "Land & Estate",
    icon: MapPin,
    accent: "#9BE35C",
    image: "/LandingCard1.png",
    bullets: [
      "Land Evaluation, Acquisition, Demarcation & Mutation",
"GIS & Geospatial Intelligence",
"Estate Inventory, Monitoring & Management",
    ],
  },
  {
    key: "planning",
    number: "02",
    title: "Architecture & Urban Planning",
    shortTitle: "Urban Planning",
    icon: Layers,
    accent: "#3FC6FF",
    image: "/LandingCard2.png",
    bullets: [
      "Master planning, zoning & land-use analysis",
      "3D city modeling, urban design & scenario simulation",
    ],
  },
  {
    key: "development",
    number: "03",
    title: "Development & Building Control",
    shortTitle: "Building Control",
    icon: ClipboardList,
    accent: "#B781FF",
    image: "/LandingCard3.png",
    bullets: [
      "Transaction Advisory — Investment, JVs & PPPs",
"Business Growth & Sales — Partnerships, Sales & Customer Services",
"Marketing & Branding — Lead Generation & Brand Visibility"
    ],
  },
  {
    key: "engineering",
    number: "04",
    title: "Engineering",
    shortTitle: "Engineering",
    icon: Zap,
    accent: "#FFAA22",
    image: "/LandingCard4.png",
    bullets: [
      "Ravi River Flood Protection & Resilience",
      "Integrated Infrastructure Development",
      "Sustainable & Resilient Urban Infrastructure",
    ],
  },
  {
    key: "commercial",
    number: "05",
    title: "Commercial & Business Strategy",
    shortTitle: "Commercial Strategy",
    icon: BarChart3,
    accent: "#27E1EA",
    image: "/LandingCard5.png",
    bullets: [
      "Development & Land Use Control — Enforce regulations and master plan",
"Regulatory Enforcement — Control illegal development and protect public interest",
"Revenue & Environment — Ensure fee collection and environmental protection"
    ],
  },
  {
    key: "sustainability",
    number: "06",
    title: "Special Initiatives, CSR and Diversity",
    shortTitle: "Special Initiatives & CSR",
    icon: Leaf,
    accent: "#9BE84F",
    image: "/LandingCard6.png",
    bullets: [
      "Socially Responsible, Inclusive, and Sustainable Urban Development",
      "Transforming Communities through Impactful CSR Initiatives",
      "Creating a Supportive Environment and Promoting Community Welfare & Development"
    ],
  },
];

const TOP_PILLARS = [
  { label: "Transparent ", icon: Shield },
  { label: "Data-driven ", icon: BarChart3 },
  { label: "Livability", icon: Users },
  { label: "Sustainable ", icon: Leaf },
];

const RAVI_CITY_PILLARS = [
  { label: "Transparent ", icon: Shield },
  { label: "Data-driven ", icon: BarChart3 },
  { label: "Livability", icon: Users },
  { label: "Sustainable ", icon: Leaf },
  // { label: "Transparent Governance", icon: Shield },
  // { label: "Data-driven Decisions", icon: BarChart3 },
  // { label: "Better Livability", icon: Users },
  // { label: "Sustainable Future", icon: Leaf },
];

const CORE_CAPABILITIES = [
  { label: "Integrated Data", icon: Database },
  { label: "Real-time Monitoring", icon: Radio },
  { label: "Collaborative Decisions", icon: Users },
  { label: "Sustainable Future", icon: Leaf },
];

const TEAM_MEMBERS = [
  {
    id: 1,
    name: "Imran Amin",
    designation: "Chief Executive Officer",
    image: "/Ruda_Official/Imran-Amin (CEO).webp",
  },
  {
    id: 2,
    name: "Brig. Mansoor",
    designation: "Chief Operating Officer",
    image: "/Ruda_Official/Brig-Mansoor (COO).webp",
  },
  {
    id: 3,
    name: "Brig Bakhtiar Akram SI(M) (Retd)",
    designation: "Executive Director — Land Acquisition & Estate",
    image:
      "/Ruda_Official/ED BAKHTIAR (ED Land Acquisition & Estate).jpeg",
  },
  {
    id: 5,
    name: "Nizam ud Din",
    designation: "Director GIS",
    image: "/Ruda_Official/Nizam-ud-Din.PNG",
  },
  {
    id: 6,
    name: "Umar Javaid",
    designation: "Assistant Director GIS",
    image: "/Ruda_Official/Umar_Javaid.PNG",
  },
];

const GIS_APPS = [
  {
    icon: <Search size={22} />,
    title: "RUDA GIS Metaverse",
    desc: "Explore society-based raster and Vector datasets including Master plans and boundaries and other Raster data layers.",
    images: ["/2.1.png", "/2.2.png", "/2.3.png"],
    route: "/gis-metaverse",
    gradientFrom: "#0B7A3B",
    gradientTo: "#004225",
    tags: ["GIS", "Vector & Raster"],
  },
  {
    icon: <Layers size={22} />,
    title: "Land Information System ",
    desc: "Manage and visualize cadastral records, Khasra layers, mauza limits and administrative boundaries in one interactive GIS platform.",
    images: ["/s1.png", "/S1.2.png", "/S1.3.png"],
    route: "/Mapview",
    gradientFrom: "#49B84A",
    gradientTo: "#004225",
    tags: ["Cadastral", "Land Records"],
  },
  {
    icon: <Smartphone size={22} />,
    title: "RUDA Masterplan",
    desc: "Analyze spatial patterns, proximity relationships and location-based insights across parcels, infrastructure and project boundaries to support smarter cadastral and planning decisions.",
    images: ["/s6.png", "/s6.1.png", "/s6.2.png", "/s6.3.png"],
    route: "/masterplan",
    gradientFrom: "#0B7A3B",
    gradientTo: "#004225",
    tags: ["Location", "Analytics"],
  },
  {
    icon: <Eye size={22} />,
    title: "Metaverse KPIs",
    desc: "Control and manage the complete cadastral system, including users, records, spatial datasets, dashboards, permissions and administrative workflows.",
    images: ["/s5.png"],
    route: "/dashboard",
    gradientFrom: "#49B84A",
    gradientTo: "#004225",
    tags: ["Admin", "Management"],
  },
  {
    icon: <FileText size={22} />,
    title: "Plot Information System",
    desc: "Search plots, view demarcation details, verify and generate printable plot reports for cadastral documentation.",
    images: ["/s4.png", "/s4.1.png", "/s4.2.png"],
    route: "/demarcation",
    gradientFrom: "#49B84A",
    gradientTo: "#0B7A3B",
    tags: ["Plots", "Reports"],
  },
  {
    icon: <ClipboardList size={22} />,
    title: "3D GeoVerse",
    desc: "Experience cadastral and society data in an immersive 3D environment with land-use visualization.",
    images: ["/s3.png", "/s3.1.png", "/s3.2.png"],
    route: "/society-3d",
    gradientFrom: "#49B84A",
    gradientTo: "#0B7A3B",
    tags: ["3D", "Visualization"],
  },
  {
    icon: <UploadCloud size={22} />,
    title: "3D BIM Model Viewer",
    desc: "Upload and position GLB or glTF models on the Cesium globe, manage BIM visibility, and explore project boundaries in an interactive 3D environment.",
    images: ["/s7.png"],
    route: "/society-3d-upload",
    gradientFrom: "#0B7A3B",
    gradientTo: "#00351F",
    tags: ["BIM", "Cesium"],
  },
  {
    icon: <Smartphone size={22} />,
    title: "Location Intelligence",
    desc: "Analyze spatial patterns, proximity relationships and location-based insights across parcels, infrastructure and project boundaries to support smarter cadastral and planning decisions.",
    images: ["/s6.png", "/s6.1.png", "/s6.2.png", "/s6.3.png"],
    route: "/flyto-dashboard",
    gradientFrom: "#0B7A3B",
    gradientTo: "#004225",
    tags: ["Location", "Analytics"],
  },
];

const FEATURES = [
  {
    icon: <Map size={26} />,
    title: "Interactive Mapping",
    desc: "Explore parcel boundaries and cadastral data through intuitive map controls and layered visualization.",
    bg: "bg-[#edf8ef]",
    iconBg: "bg-[#0B7A3B]",
  },
  {
    icon: <BarChart3 size={26} />,
    title: "Data Analytics",
    desc: "Generate insights for verified area, pending surveys, parcel categories and project progress.",
    bg: "bg-[#f0f9f1]",
    iconBg: "bg-[#004225]",
  },
  {
    icon: <Box size={26} />,
    title: "3D Visualization",
    desc: "Support visual review of infrastructure, terrain context and project planning layers in immersive 3D.",
    bg: "bg-[#edf8ef]",
    iconBg: "bg-[#49B84A]",
  },
  {
    icon: <Database size={26} />,
    title: "Real-time Data",
    desc: "Integrate field survey observations, GPS evidence and centralized cadastral records seamlessly.",
    bg: "bg-[#f0f9f1]",
    iconBg: "bg-[#0B7A3B]",
  },
  {
    icon: <Shield size={26} />,
    title: "Secure Access",
    desc: "Role-based access control ensures the right data reaches the right teams at the right time.",
    bg: "bg-[#edf8ef]",
    iconBg: "bg-[#004225]",
  },
  {
    icon: <Zap size={26} />,
    title: "High Performance",
    desc: "Optimized tile serving and spatial indexing deliver fast map loads even for large datasets.",
    bg: "bg-[#f0f9f1]",
    iconBg: "bg-[#49B84A]",
  },
];

function useInView(options = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.15, ...options },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return [ref, visible];
}

function AppCard({
  icon,
  title,
  desc,
  images = [],
  route,
  gradientFrom,
  gradientTo,
  tags = [],
  index,
  onClick,
}) {
  const [ref, visible] = useInView();
  const [hovered, setHovered] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(null);
  const [fading, setFading] = useState(false);
  const intervalRef = useRef(null);

  /* start / stop slideshow on hover */
  useEffect(() => {
    if (hovered && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setSlideIdx((cur) => {
          const next = (cur + 1) % images.length;
          setPrevIdx(cur);
          setFading(true);
          setTimeout(() => {
            setPrevIdx(null);
            setFading(false);
          }, 650);
          return next;
        });
      }, 1600);
    } else {
      clearInterval(intervalRef.current);
      setSlideIdx(0);
      setPrevIdx(null);
      setFading(false);
    }
    return () => clearInterval(intervalRef.current);
  }, [hovered, images.length]);

  return (
    <article
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative flex h-full min-h-[300px] overflow-hidden rounded-[14px] border border-[#197553]/70 bg-[#031812] text-white
        shadow-[0_18px_45px_-24px_rgba(0,0,0,0.9)]
        transition-all duration-500 ease-out
        ${visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}
        hover:-translate-y-1.5 hover:border-[#48d37a]/90
        hover:shadow-[0_20px_48px_-18px_rgba(28,191,103,0.42)]
        ${route ? "cursor-pointer" : "cursor-default"}`}
      style={{ transitionDelay: `${(index % 4) * 80}ms` }}
    >
      <div className="flex w-full flex-col">
        {/* ── image area ── */}
        <div className="relative h-40 overflow-hidden sm:h-44">
          {/* outgoing slide */}
          {prevIdx !== null && (
            <img
              key={`prev-${prevIdx}`}
              src={images[prevIdx]}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                opacity: fading ? 0 : 1,
                transition: "opacity 650ms ease-in-out",
              }}
            />
          )}

          {/* current slide */}
          <img
            key={`cur-${slideIdx}`}
            src={images[slideIdx]}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              opacity: 1,
              transform: hovered ? "scale(1.06)" : "scale(1)",
              transition: "transform 700ms ease-in-out",
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#031812] via-[#031812]/10 to-black/20" />

          {/* slide indicator dots — only when >1 image */}
          {images.length > 1 && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
              {images.map((_, i) => (
                <span
                  key={i}
                  className="block rounded-full transition-all duration-400"
                  style={{
                    width: i === slideIdx ? "14px" : "5px",
                    height: "5px",
                    background: i === slideIdx ? "#70D84F" : "rgba(255,255,255,0.3)",
                    boxShadow: i === slideIdx ? "0 0 6px #70D84F" : "none",
                  }}
                />
              ))}
            </div>
          )}

          <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-black/35 text-white/85 backdrop-blur-md">
            {icon}
          </div>

          {route && (
            <div className="absolute right-3 top-3">
              <div className="flex items-center gap-1 rounded-full border border-white/20 bg-white/90 px-2.5 py-1 text-[9px] font-bold text-slate-800 shadow-md">
                Open
                <ExternalLink size={9} />
              </div>
            </div>
          )}
        </div>

        <div className="relative -mt-7 flex flex-1 flex-col px-4 pb-4 pt-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#55d985]/35 bg-gradient-to-br from-[#3cc96f] to-[#0b7a3b] text-white shadow-[0_8px_18px_-9px_rgba(60,201,111,0.9)]">
              {icon}
            </div>
            <h3 className="min-w-0 text-[14px] font-black leading-tight text-white sm:text-sm">
              {title}
            </h3>
          </div>

          <p className="mt-2.5 line-clamp-3 text-[10px] leading-relaxed text-white/65 sm:text-[11px]">
            {desc}
          </p>

          <div className="mt-auto flex items-end justify-between gap-3 pt-4">
            <div className="flex min-w-0 flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-[#2f9b61]/25 bg-[#0b5b35]/35 px-2 py-1 text-[8px] font-bold text-[#75df9d]"
                >
                  {tag}
                </span>
              ))}
            </div>

            {route && (
              <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#28a863]/70 px-2.5 py-1.5 text-[9px] font-bold text-[#72e49b] transition-all duration-300 group-hover:border-[#5be68c] group-hover:bg-[#0b7a3b]/35 group-hover:text-white">
                Open App
                <ArrowRight size={10} />
              </div>
            )}
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 h-[2px] transition-all duration-500"
          style={{
            width: hovered ? "100%" : "0%",
            background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`,
          }}
        />
      </div>
    </article>
  );
}

function DecisionSupportCard({ area, delay = 0, compact = false }) {
  const Icon = area.icon;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative w-full overflow-hidden text-white shadow-[0_20px_52px_-24px_rgba(0,0,0,0.95)] transition-all duration-500 ease-out
        hover:-translate-y-1 hover:scale-[1.012]
        ${compact
          ? "rounded-xl px-3 py-3"
          : "h-full rounded-[18px] px-4 py-4"
        }`}
      style={{
        border: `1px solid ${hovered ? area.accent : `${area.accent}B8`}`,
        backgroundImage: `linear-gradient(90deg, rgba(1,17,14,.92) 0%, rgba(2,25,20,.82) 58%, rgba(2,20,16,.34) 100%), url('${area.image}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        boxShadow: hovered
          ? `0 0 26px ${area.accent}55, 0 18px 44px -20px ${area.accent}AA, inset 0 0 30px ${area.accent}14`
          : `0 16px 38px -24px ${area.accent}70, inset 0 0 28px rgba(255,255,255,.02)`,
        animation: `decisionCardIn 700ms ease-out ${delay}ms both`,
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${area.accent}, transparent)`,
        }}
      />

      <div
        className="absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ backgroundColor: `${area.accent}30` }}
      />

      {/* Icon badge — top-right */}
      <div
        className={`${compact
          ? "right-3 top-3 h-9 w-9"
          : "right-4 top-3.5 h-10 w-10"
          } absolute z-20 flex items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-300 group-hover:scale-105`}
        style={{
          borderColor: `${area.accent}80`,
          backgroundColor: `${area.accent}18`,
          color: area.accent,
          boxShadow: `0 0 18px ${area.accent}28`,
        }}
      >
        <Icon size={compact ? 17 : 19} strokeWidth={2} />
      </div>

      {/* Content row: number badge + text */}
      <div className="relative z-10 flex h-full flex-col justify-center gap-0 pr-12">
        {/* Number + Title row */}
        <div className="flex items-start gap-3">
          {/* Number badge */}
          <div
            className={`${compact
              ? "h-9 w-9 text-sm"
              : "h-11 w-11 text-base 2xl:h-12 2xl:w-12"
              } flex shrink-0 items-center justify-center rounded-full border-2 font-black`}
            style={{
              borderColor: area.accent,
              color: "white",
              backgroundColor: `${area.accent}20`,
              boxShadow: `0 0 18px ${area.accent}30`,
            }}
          >
            {Number(area.number)}
          </div>

          {/* Title */}
          <h3
            className={`${compact
              ? "text-[11px]"
              : "text-[11.5px] 2xl:text-[12.5px]"
              } flex min-h-[2.6em] items-center font-black uppercase leading-[1.18] tracking-[0.025em]`}
          >
            {compact ? area.shortTitle : area.title}
          </h3>
        </div>

        {/* Bullets */}
        <ul className={`${compact ? "mt-2 space-y-[5px] pl-[3.25rem]" : "mt-2 space-y-[5px] pl-[3.5rem]"}`}>
          {area.bullets.map((bullet) => (
            <li
              key={bullet}
              className="flex items-start gap-2 text-[10px] leading-[1.35] text-white/88 2xl:text-[10.5px]"
            >
              <span
                className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: area.accent,
                  boxShadow: `0 0 7px ${area.accent}80`,
                }}
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RaviCityVisionPanel() {
  return (
    <div className="w-[350px] text-left text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)]">
      <div className="text-[14px] font-black uppercase leading-[1.08] tracking-[0.06em] text-white/[0.92] 2xl:text-[15px]">
        <span className="block whitespace-nowrap">Building a Smart,</span>
        <span className="block whitespace-nowrap">
          Sustainable &amp; Inclusive
        </span>
      </div>

      <div className="mt-1 text-[26px] font-black uppercase leading-none tracking-[0.04em] text-[#70D84F] 2xl:text-[28px]">
        Ravi City
      </div>

      {/* <div className="mt-3 grid grid-cols-5 gap-1.5">
        {RAVI_CITY_PILLARS.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="flex min-w-0 flex-col items-center text-center"
            >
              <Icon
                size={24}
                strokeWidth={1.9}
                className="text-[#8FEA67] drop-shadow-[0_0_10px_rgba(143,234,103,0.55)]"
              />

              <span className="mt-1 max-w-[76px] text-[7px] font-bold uppercase leading-tight tracking-[0.06em] text-white/[0.82] sm:text-[8px]">
                {item.label}
              </span>
            </div>
          );
        })}
      </div> */}
    </div>
  );
}

function HeroPillar({ item }) {
  const Icon = item.icon;

  return (
    <div className="group flex min-w-0 flex-col items-center text-center text-white">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#49B84A]/70 bg-[#061b17]/[0.78] text-[#8FEA67] shadow-[0_0_26px_rgba(73,184,74,.2)] backdrop-blur-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#8FEA67] sm:h-12 sm:w-12">
        <span className="absolute inset-[4px] rounded-full border border-white/10" />
        <Icon size={19} strokeWidth={1.8} />
      </div>
      <span className="mt-1.5 max-w-[82px] text-[7px] font-bold uppercase leading-tight tracking-[0.08em] text-white/[0.76] sm:text-[8px]">
        {item.label}
      </span>
    </div>
  );
}

function CapabilityNode({ item }) {
  const Icon = item.icon;

  return (
    <div className="group flex w-[82px] min-w-0 flex-col items-center text-center text-white sm:w-[104px]">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#49B84A]/70 bg-[#061b17]/[0.78] text-[#8FEA67] shadow-[0_0_26px_rgba(73,184,74,.2)] backdrop-blur-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#8FEA67] sm:h-12 sm:w-12">
        <span className="absolute inset-[4px] rounded-full border border-white/10" />
        <Icon size={19} strokeWidth={1.8} />
      </div>
      <span className="mt-1.5 max-w-[100px] text-[7px] font-bold uppercase leading-tight tracking-[0.08em] text-white/[0.76] sm:text-[8px]">
        {item.label}
      </span>
    </div>
  );
}

function TeamMemberCard({ member, index }) {
  return (
    <article
      className="
        group relative mx-auto w-full max-w-[345px]
        overflow-hidden rounded-[22px]
        border border-white/20
        bg-white/[0.12] backdrop-blur-xl
        shadow-[0_20px_55px_-28px_rgba(0,0,0,.9)]
        transition-all duration-500
        hover:-translate-y-1.5
        hover:border-[#8FEA67]
        hover:bg-white/[0.16]
      "
      style={{
        animation: `teamCardReveal 700ms ease-out ${index * 110}ms both`,
      }}
    >
      {/* Top Accent */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#8FEA67] to-transparent" />

      <div className="relative p-[10px]">
        {/* IMAGE */}
        <div className="relative mx-auto aspect-square w-[88%] max-w-[265px] overflow-hidden rounded-[20px] border border-white/10 bg-[#061b17]">
          {member.image ? (
            <img
              src={member.image}
              alt={member.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#03130f]">
              <Users size={28} className="text-[#8FEA67]" />
            </div>
          )}

          {/* Number */}
          <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-[11px] font-bold text-white backdrop-blur">
            {String(index + 1).padStart(2, "0")}
          </div>
        </div>

        {/* TEXT */}
        <div className="px-3 pb-3 pt-3 text-center">
          {/* NAME (FIXED SIZE) */}
          <h3 className="text-[18px] font-extrabold text-white leading-tight">
            {member.name}
          </h3>

          {/* DESIGNATION (FIXED SIZE) */}
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8FEA67]">
            {member.designation}
          </p>

          {/* LINE */}
          <div className="mx-auto mt-4 h-[2px] w-16 bg-gradient-to-r from-transparent via-[#8FEA67] to-transparent" />
        </div>
      </div>
    </article>
  );
}

function MapStatCard({ value, label, positionClass }) {
  return (
    <div className={`absolute z-10 ${positionClass}`}>
      <div className="relative overflow-hidden rounded-xl bg-white/97 px-3 py-2 shadow-[0_8px_24px_-8px_rgba(0,53,31,0.4)] ring-1 ring-[#004225]/10 backdrop-blur-md">
        <div className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-[#49B84A] via-[#0B7A3B] to-[#004225]" />
        <div className="pl-1.5">
          <div className="text-lg font-black leading-none tracking-tight text-[#004225]">
            {value}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="h-px flex-1 bg-gradient-to-r from-[#49B84A]/50 to-transparent" />
            <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#0B7A3B]">
              {label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [activeSection, setActive] = useState("home");
  const [slideIndex, setSlideIndex] = useState(0);
  const [teamStartIndex, setTeamStartIndex] = useState(0);
  const [featureStartIndex, setFeatureStartIndex] = useState(0);
  const [statGroupIndex, setStatGroupIndex] = useState(0);
  const [statFade, setStatFade] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowTop(window.scrollY > 400);

      const offsets = NAV_LINKS.map(({ href }) => {
        const el = document.querySelector(href);
        return el
          ? { id: href.slice(1), top: el.getBoundingClientRect().top }
          : null;
      }).filter(Boolean);

      const current = offsets.filter((o) => o.top <= 120).at(-1);
      if (current) setActive(current.id);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTeamStartIndex((current) => (current + 1) % TEAM_MEMBERS.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setStatFade(false);
      setTimeout(() => {
        setStatGroupIndex((i) => (i + 1) % STAT_GROUPS.length);
        setStatFade(true);
      }, 350);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const goToStatGroup = (index) => {
    setStatFade(false);
    setTimeout(() => {
      setStatGroupIndex(index);
      setStatFade(true);
    }, 350);
  };

  return (
    <div className="font-sans text-slate-800 bg-white overflow-x-hidden">
      <div className="bg-gradient-to-r from-[#00351f] via-[#004225] to-[#0B7A3B] text-white text-[9px] xs:text-[10px] sm:text-xs font-semibold tracking-widest flex items-center justify-center gap-2 sm:gap-4 py-1.5 sm:py-2 px-2 text-center">
        <span className="hidden sm:block w-10 md:w-14 h-px bg-white/40 shrink-0" />
        <span className="leading-tight">
          GIS METAVERSE PLATFORM — RAVI URBAN DEVELOPMENT AUTHORITY
        </span>
        <span className="hidden sm:block w-10 md:w-14 h-px bg-white/40 shrink-0" />
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-white shadow-lg"
          : "bg-white/95 backdrop-blur-sm shadow-sm"
          }`}
      >
        <div className="mx-auto grid h-14 max-w-[1500px] grid-cols-[auto_1fr_auto] items-center gap-3 px-3 sm:h-16 sm:px-5 md:grid-cols-[230px_minmax(0,1fr)_230px] lg:grid-cols-[270px_minmax(0,1fr)_270px] lg:px-7">
          <div className="flex items-center justify-start">
            <a
              href="#home"
              aria-label="Government of Punjab home"
              className="flex shrink-0 items-center"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white p-1 shadow-[0_7px_18px_-10px_rgba(0,0,0,0.5)] ring-1 ring-[#0B7A3B]/15 sm:h-[52px] sm:w-[52px]">
                <img
                  src={GopHeaderLogo}
                  alt="Government of Punjab"
                  className="h-full w-full rounded-full object-contain"
                />
              </div>
            </a>
          </div>

          <nav className="hidden items-center justify-center gap-0.5 md:flex lg:gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all lg:px-4 lg:text-sm ${activeSection === href.slice(1)
                  ? "bg-[#0B7A3B] text-white"
                  : "text-slate-700 hover:bg-[#edf8ef] hover:text-[#004225]"
                  }`}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
            <button
              onClick={() => navigate("/Mapview")}
              className="hidden items-center gap-1.5 rounded-full bg-[#0B7A3B] px-3 py-2 text-xs font-bold text-white transition-all hover:-translate-y-px hover:bg-[#004225] hover:shadow-lg sm:flex sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              Open Map <ArrowRight size={13} />
            </button>

            <a
              href="#home"
              aria-label="Ravi Urban Development Authority home"
              className="flex shrink-0 items-center"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white p-1 shadow-[0_7px_18px_-10px_rgba(0,0,0,0.5)] ring-1 ring-[#0B7A3B]/15 sm:h-[52px] sm:w-[52px]">
                <img
                  src={RudaFooterLogo}
                  alt="Ravi Urban Development Authority"
                  className="h-full w-full rounded-full object-contain"
                />
              </div>
            </a>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg bg-[#0B7A3B] p-1.5 text-white md:hidden sm:p-2"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-5 py-4 flex flex-col gap-1 shadow-xl">
            {NAV_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-[#edf8ef] hover:text-[#004225] transition-colors"
              >
                {label}
              </a>
            ))}

            <button
              onClick={() => navigate("/Mapview")}
              className="mt-2 flex items-center justify-center gap-2 bg-[#0B7A3B] text-white text-sm font-bold px-5 py-3 rounded-full"
            >
              Open Map <ArrowRight size={15} />
            </button>
          </div>
        )}
      </header>

      <section
        id="home"
        className="relative min-h-[908px] overflow-hidden bg-[#03130f] sm:min-h-[988px] xl:min-h-[874px]"
      >
        {HERO_SLIDES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out will-change-transform"
            style={{
              opacity: i === slideIndex ? 1 : 0,
              backgroundImage: `url('${src}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              animation:
                i === slideIndex
                  ? `${i % 2 === 0 ? "heroPanLeft" : "heroPanRight"} 9s ease-in-out forwards`
                  : "none",
            }}
          />
        ))}

        <style>{`
          @keyframes heroPanLeft {
            0% { transform: translate3d(0, 0, 0) scale(1.04); }
            100% { transform: translate3d(-2.2%, 0, 0) scale(1.04); }
          }

          @keyframes heroPanRight {
            0% { transform: translate3d(-2.2%, 0, 0) scale(1.04); }
            100% { transform: translate3d(0, 0, 0) scale(1.04); }
          }

          @keyframes decisionCardIn {
            from {
              opacity: 0;
              transform: translateY(18px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes platformPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(73, 184, 74, 0.03); }
            50% { box-shadow: 0 0 46px 2px rgba(73, 184, 74, 0.14); }
          }

          @keyframes dataLine {
            0% { opacity: .2; transform: scaleX(.84); }
            50% { opacity: .85; transform: scaleX(1); }
            100% { opacity: .2; transform: scaleX(.84); }
          }


          @keyframes teamCardReveal {
            from {
              opacity: 0;
              transform: translateY(26px) scale(.97);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes teamCarouselMove {
            from {
              opacity: 0;
              transform: translateX(-46px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes featureCarouselMove {
            from {
              opacity: 0;
              transform: translateX(28px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .hero-motion-safe {
              animation: none !important;
              transition-duration: 0ms !important;
            }
          }
        `}</style>

        <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(20,144,93,0.07),transparent_40%),linear-gradient(to_bottom,rgba(0,8,12,0.34),rgba(0,20,20,0.30)_42%,rgba(1,12,10,0.62))]" />
        <div className="absolute inset-0 z-10 opacity-15 [background-image:linear-gradient(rgba(104,223,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(104,223,255,.035)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="absolute left-1/2 top-[185px] z-10 h-[390px] w-[58%] -translate-x-1/2 rounded-full bg-[#0B7A3B]/[0.045] blur-[100px]" />

        <div className="relative z-20 mx-auto flex min-h-[908px] max-w-[1700px] flex-col px-4 pb-24 pt-1 sm:min-h-[988px] sm:px-6 sm:pb-28 sm:pt-7 xl:min-h-[874px] xl:px-7">
          <div className="relative mx-auto w-full max-w-[1600px]">
            <div className="mx-auto max-w-[1450px] text-center">
              {/* <div className="text-[11px] font-bold uppercase leading-relaxed tracking-[0.12em] text-white/[0.84] sm:text-[13px] lg:text-[14px] xl:whitespace-nowrap">
                An Integrated, Immersive &amp; Intelligent Platform for
                Planning, Monitoring, Collaboration &amp; Sustainable
                Development
              </div> */}

              <div className="mt-0 flex items-center justify-center gap-3">
                <span className="h-px w-14 bg-gradient-to-r from-transparent to-[#8FEA67]/75 sm:w-20" />
                <span className="text-[12px] font-black uppercase tracking-[0.22em] text-[#8FEA67] sm:text-[14px]">
                  One City. One Data. One Platform.
                </span>
                <span className="h-px w-14 bg-gradient-to-l from-transparent to-[#8FEA67]/75 sm:w-20" />
              </div>
            </div>

            <div className="relative mt-2 min-h-[76px] xl:min-h-[108px]">
              <div className="absolute left-0 top-0 hidden items-start gap-4 xl:flex">
                <a href="#home" className="shrink-0" aria-label="RUDA home">
                  <img
                    src={RudaLogo}
                    alt="RUDA"
                    className="h-20 w-auto object-contain drop-shadow-[0_8px_22px_rgba(0,0,0,0.45)] 2xl:h-24"
                  />
                </a>

                <div className="pt-1">
                  <RaviCityVisionPanel />
                </div>
              </div>

              <div className="flex justify-center lg:justify-end lg:pr-2">
                <div className="grid grid-cols-4 gap-3 sm:gap-4 xl:gap-5">
                  {TOP_PILLARS.map((item) => (
                    <HeroPillar key={item.label} item={item} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-1 grid flex-1 items-center gap-5 xl:items-start xl:grid-cols-[350px_minmax(0,1fr)_350px] 2xl:grid-cols-[380px_minmax(0,1fr)_380px] 2xl:gap-6">
            <div className="hidden h-[510px] grid-rows-3 gap-4 xl:grid 2xl:h-[540px]">
              {DECISION_AREAS.slice(0, 3).map((area, index) => (
                <DecisionSupportCard
                  key={area.key}
                  area={area}
                  delay={index * 130}
                />
              ))}
            </div>

            <div
              className="relative mx-auto w-full max-w-[790px] text-center text-white"
              style={{ animation: "platformPulse 6s ease-in-out infinite" }}
            >
              {/* Move this complete heading section slightly upward */}
              <div className="transition-transform duration-300 xl:-translate-y-[28px] 2xl:-translate-y-[34px]">
                <div className="mx-auto inline-flex items-center gap-2 rounded-lg border border-[#45C8FF]/[0.45] bg-[#03191d]/[0.72] px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#77DDFF] shadow-[0_0_26px_rgba(69,200,255,.12)] backdrop-blur-xl sm:text-[11px]">
                  <Star
                    size={11}
                    fill="currentColor"
                    className="text-[#8FEA67]"
                  />
                  Integrated GIS Decision Platform
                </div>

                <div className="mt-2 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/60 sm:text-[9px]">
                  Real-time 3D <span className="mx-1 text-[#8FEA67]">|</span>
                  Interactive <span className="mx-1 text-[#8FEA67]">|</span>
                  Intelligent <span className="mx-1 text-[#8FEA67]">|</span>
                  Immersive
                </div>

                <h1 className="mt-4 text-3xl font-black leading-[1.02] tracking-[-0.035em] drop-shadow-[0_8px_30px_rgba(0,0,0,.85)] xs:text-4xl sm:text-5xl md:text-6xl 2xl:text-[68px]">
                  RUDA GIS
                  <span className="mt-1 block text-[#70D84F] sm:mt-2">
                    METAVERSE
                  </span>
                </h1>

                <p className="mx-auto mt-4 max-w-2xl px-2 text-xs leading-relaxed text-white/[0.78] sm:mt-5 sm:text-sm md:text-[15px]">
                  An Integrated, Immersive &amp; Intelligent Platform for
                  Planning, Monitoring, Collaboration &amp; Sustainable
                  Development
                </p>
              </div>

              {/* Move capability icons and both buttons downward */}
              <div className="transition-transform duration-300 xl:translate-y-[30px] 2xl:translate-y-[36px]">
                <div className="relative mx-auto mt-5 max-w-[610px] sm:mt-6">
                  <div
                    className="absolute left-[8%] right-[8%] top-6 hidden h-px origin-center bg-gradient-to-r from-transparent via-[#8FEA67]/[0.55] to-transparent sm:block"
                    style={{ animation: "dataLine 3.8s ease-in-out infinite" }}
                  />

                  <div className="relative flex flex-wrap items-start justify-center gap-x-1 gap-y-3 sm:flex-nowrap sm:justify-between">
                    {CORE_CAPABILITIES.map((item) => (
                      <CapabilityNode key={item.label} item={item} />
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-col justify-center gap-2.5 xs:flex-row sm:mt-5 sm:gap-4">
                  <button
                    onClick={() => {
                      document
                        .querySelector("#apps")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex items-center justify-center gap-2.5 rounded-full bg-[#0B7A3B] px-6 py-3 text-xs font-black text-white shadow-[0_16px_34px_-15px_rgba(73,184,74,.9)] transition-all hover:-translate-y-1 hover:bg-[#004225] hover:shadow-2xl sm:px-7 sm:py-3.5 sm:text-sm"
                  >
                    <Map size={16} />
                    Explore GIS Platforms
                  </button>

                  <a
                    href="#about"
                    className="flex items-center justify-center gap-2.5 rounded-full border border-white/[0.28] bg-white/[0.08] px-6 py-3 text-xs font-bold text-white backdrop-blur-xl transition-all hover:-translate-y-1 hover:bg-white/[0.16] sm:px-7 sm:py-3.5 sm:text-sm"
                  >
                    Learn More
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            </div>

            <div className="hidden h-[510px] grid-rows-3 gap-4 xl:grid 2xl:h-[540px]">
              {DECISION_AREAS.slice(3).map((area, index) => (
                <DecisionSupportCard
                  key={area.key}
                  area={area}
                  delay={(index + 3) * 130}
                />
              ))}
            </div>
          </div>

          <div className="mx-auto mt-3 grid w-full max-w-5xl grid-cols-1 gap-2 xs:grid-cols-2 lg:grid-cols-3 xl:hidden">
            {DECISION_AREAS.map((area, index) => (
              <DecisionSupportCard
                key={area.key}
                area={area}
                compact
                delay={index * 80}
              />
            ))}
          </div>

          <div className="mt-3 flex justify-center gap-2">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                aria-label={`Show hero slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${i === slideIndex
                  ? "h-2 w-7 bg-[#70D84F]"
                  : "h-2 w-2 bg-white/35 hover:bg-white/70"
                  }`}
              />
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-30 overflow-hidden border-t border-[#70D84F]/30">
          {/* Light sage-green background for high contrast stat bar */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(236,250,240,0.97),rgba(220,245,230,0.97)_48%,rgba(236,250,240,0.97))] backdrop-blur-[3px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(112,216,79,0.10),transparent_60%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#70D84F]/60 to-transparent" />

          <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-1.5 px-3 py-2 sm:flex-row sm:items-center sm:gap-5 sm:px-5 sm:py-3">
            <div className="shrink-0 text-center sm:border-r sm:border-[#0a2e1a]/15 sm:pr-5 sm:text-left">
              <div className="text-[12px] font-black uppercase leading-tight tracking-[0.18em] text-[#0a2e1a] sm:text-[14px]">
                {STAT_GROUPS[statGroupIndex].title}
              </div>
            </div>

            <div
              className={`grid flex-1 gap-3 text-center transition-all duration-300 ease-out sm:gap-3 ${STAT_GROUPS[statGroupIndex].stats.length === 3
                ? "grid-cols-3"
                : "grid-cols-2 sm:grid-cols-4"
                } ${statFade
                  ? "translate-y-0 opacity-100"
                  : "translate-y-1 opacity-0"
                }`}
            >
              {STAT_GROUPS[statGroupIndex].stats.map(({ value, label }) => (
                <div
                  key={label}
                  className="
                    rounded-xl
                    border border-[#70D84F]/30
                    bg-white/90
                    px-3 py-2
                    shadow-[0_4px_16px_-4px_rgba(0,0,0,0.35)]
                    backdrop-blur-md
                    transition-all duration-300
                    hover:bg-white hover:border-[#70D84F]/60 hover:shadow-[0_6px_20px_-4px_rgba(112,216,79,0.35)]
                  "
                >
                  <div className="text-[22px] sm:text-[30px] font-black text-[#0a2e1a] leading-none">
                    {value}
                  </div>

                  <div className="mt-1 text-[8px] sm:text-[10px] uppercase tracking-[0.15em] text-[#1a4a2e]/80">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex justify-center gap-2 pb-1.5 sm:pb-2">
            {STAT_GROUPS.map((group, i) => (
              <button
                key={group.key}
                type="button"
                onClick={() => goToStatGroup(i)}
                aria-label={`Show ${group.title} stats`}
                className={`rounded-full transition-all duration-300 ${i === statGroupIndex
                  ? "h-1.5 w-6 bg-[#70D84F] shadow-[0_0_10px_rgba(112,216,79,0.72)]"
                  : "h-1.5 w-1.5 bg-white/30 hover:bg-white/65"
                  }`}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        id="about"
        className="relative overflow-hidden bg-white py-10 sm:py-14 md:py-16"
      >
        <div className="relative mx-auto max-w-7xl px-4 pt-10 sm:px-5">
          <div className="grid items-stretch gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#edf8ef] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#004225] sm:px-4 sm:py-2 sm:text-xs">
                About the Platform
              </div>

              <h2 className="mt-5 text-3xl font-black leading-[0.98] tracking-[-0.03em] text-slate-900 xs:text-4xl sm:text-5xl lg:text-[58px]">
                RUDA GIS
                <span className="mt-1 block text-[#0B7A3B]">METAVERSE</span>
              </h2>

              <div className="mt-4 h-1.5 w-14 rounded-full bg-[#49B84A] sm:w-16" />

              <p className="mt-6 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base text-justify">
                A unified geospatial ecosystem that connects cadastral records,
                planning layers, field information, analytics and immersive 3D
                environments in one intelligent platform. Through interactive
                maps, spatial dashboards, and field data workflows, the system
                improves visibility, coordination, and data-driven
                decision-making for cadastral operations within the RUDA project
                area.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: BarChart3,
                    title: "Geospatial Data & Metaverse",
                    text: "Transform spatial data into insights, scenarios and planning decisions.",
                    route: "/gis-metaverse",
                  },
                  {
                    icon: Layers,
                    title: "Cadastral Management",
                    text: "Manage parcels, boundaries, land records and field verification data.",
                    route: "/Mapview",
                  },
                  {
                    icon: Box,
                    title: "Digital Twin & BIM",
                    text: "Explore terrain, buildings, infrastructure and BIM models in 3D.",
                    route: "/society-3d-upload",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      onClick={() => navigate(item.route)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          navigate(item.route);
                        }
                      }}
                      className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_34px_-24px_rgba(0,66,37,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-[#49B84A]/60 hover:shadow-[0_18px_38px_-20px_rgba(11,122,59,0.35)]"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B7A3B] to-[#004225] text-white shadow-lg shadow-[#0B7A3B]/20">
                        <Icon size={18} strokeWidth={2} />
                      </div>

                      <h3 className="mt-4 text-[13px] font-black leading-tight text-slate-900 sm:text-sm">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
                        {item.text}
                      </p>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => navigate("/Mapview")}
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#0B7A3B] px-5 py-3 text-sm font-black text-white shadow-[0_14px_28px_-14px_rgba(11,122,59,0.75)] transition-all hover:-translate-y-0.5 hover:bg-[#004225] sm:px-7 sm:py-3.5 sm:text-base"
              >
                Explore the Platform <ArrowRight size={16} />
              </button>
            </div>

            <div className="relative flex h-full flex-col pt-8 lg:pt-12">
              {/* <div className="mb-1 grid grid-cols-5 gap-2 sm:gap-3">
                {CORE_CAPABILITIES.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="flex min-w-0 flex-col items-center text-center"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#8ad9df]/60 bg-[#eefafb] text-[#2f9eaa] shadow-sm sm:h-12 sm:w-12">
                        <Icon size={18} strokeWidth={1.9} />
                      </div>

                      <span className="mt-2 text-[11px] font-normal normal-case leading-relaxed tracking-normal text-slate-600 sm:text-xs">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div> */}

              <div className="relative flex-1 overflow-hidden pt-1">
                <img
                  src="/RudaMasterplanMap.png"
                  alt="RUDA project map"
                  className="h-[420px] w-full rounded-[22px] object-contain object-top xs:h-[50px] sm:h-[550px] lg:h-full lg:min-h-[550px]"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextSibling.style.display = "flex";
                  }}
                />

                <div className="hidden h-[460px] w-full items-center justify-center rounded-[22px] bg-gradient-to-br from-[#edf8ef] to-[#dff3e6] xs:h-[520px] sm:h-[600px] lg:h-full lg:min-h-[610px]">
                  <Map size={86} className="text-[#0B7A3B]/30" />
                </div>

                <MapStatCard
                  value="340 Km²"
                  label="Coverage Area"
                  positionClass="bottom-6 right-6"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="apps" className="py-10 sm:py-14 md:py-16 bg-slate-50">
        <div className="max-w-8xl mx-auto px-4 sm:px-5">
          <div className="text-center mb-7 sm:mb-10">
            {/* <div className="inline-flex items-center gap-2 bg-[#edf8ef] text-[#004225] text-[10px] sm:text-xs font-bold tracking-wider uppercase px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4">
              GIS Applications
            </div> */}

            <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-3 sm:mb-4">
              RUDA GIS METAVERSE COMPONENTS
            </h2>

            <div className="w-12 sm:w-16 h-1.5 bg-[#49B84A] rounded-full mx-auto mb-4 sm:mb-6" />

            <p className="max-w-xl mx-auto text-slate-500 text-sm sm:text-base leading-relaxed px-2 sm:px-0">
              Interactive applications for cadastral mapping, land record
              review, field survey tracking and spatial decision support.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
            {GIS_APPS.map(
              (
                {
                  icon,
                  title,
                  desc,
                  images,
                  route,
                  gradientFrom,
                  gradientTo,
                  tags,
                },
                i,
              ) => (
                <div
                  key={title}
                  className="w-full xs:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.95rem)]"
                >
                  <AppCard
                    index={i}
                    icon={icon}
                    title={title}
                    desc={desc}
                    images={images}
                    route={route}
                    gradientFrom={gradientFrom}
                    gradientTo={gradientTo}
                    tags={tags}
                    onClick={() => route && navigate(route)}
                  />
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section
        className="relative overflow-hidden py-12 sm:py-16 md:py-20"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(0,45,27,0.96), rgba(0,66,37,0.86)), url('/s3.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(143,234,103,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(143,234,103,.045)_1px,transparent_1px)] [background-size:38px_38px]" />
        <div className="absolute left-1/2 top-8 h-64 w-64 -translate-x-1/2 rounded-full bg-[#49B84A]/15 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-5">
          <div className="mx-auto max-w-3xl text-center text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#A4F47F] backdrop-blur-xl sm:text-xs">
              <Users size={14} />
              Leadership &amp; Project Team
            </div>

            <h2 className="mt-5 text-3xl font-black leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl">
              Meet the Team Behind
              <span className="mt-1 block text-[#70D84F]">
                RUDA GIS Metaverse
              </span>
            </h2>


          </div>

          <div className="relative mt-8">
            <div className="overflow-hidden px-1 sm:px-12">
              <div
                key={teamStartIndex}
                className="grid grid-cols-1 justify-items-center gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
                style={{ animation: "teamCarouselMove 620ms ease-out both" }}
              >
                {Array.from({ length: 3 }, (_, offset) => {
                  const memberIndex =
                    (teamStartIndex + offset) % TEAM_MEMBERS.length;
                  const member = TEAM_MEMBERS[memberIndex];

                  return (
                    <TeamMemberCard
                      key={`${member.id}-${teamStartIndex}`}
                      member={member}
                      index={memberIndex}
                    />
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setTeamStartIndex(
                  (current) =>
                    (current - 1 + TEAM_MEMBERS.length) % TEAM_MEMBERS.length,
                )
              }
              aria-label="Show previous team members"
              className="absolute left-0 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#06251b]/90 text-white shadow-xl backdrop-blur-xl transition-all hover:-translate-y-[55%] hover:border-[#8FEA67]/70 hover:bg-[#0B7A3B] sm:flex"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              type="button"
              onClick={() =>
                setTeamStartIndex(
                  (current) => (current + 1) % TEAM_MEMBERS.length,
                )
              }
              aria-label="Show next team members"
              className="absolute right-0 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#06251b]/90 text-white shadow-xl backdrop-blur-xl transition-all hover:-translate-y-[55%] hover:border-[#8FEA67]/70 hover:bg-[#0B7A3B] sm:flex"
            >
              <ChevronRight size={22} />
            </button>

            <div className="mt-5 flex items-center justify-center gap-3 sm:hidden">
              <button
                type="button"
                onClick={() =>
                  setTeamStartIndex(
                    (current) =>
                      (current - 1 + TEAM_MEMBERS.length) % TEAM_MEMBERS.length,
                  )
                }
                aria-label="Show previous team members"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white backdrop-blur-xl"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                onClick={() =>
                  setTeamStartIndex(
                    (current) => (current + 1) % TEAM_MEMBERS.length,
                  )
                }
                aria-label="Show next team members"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white backdrop-blur-xl"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="mt-5 flex justify-center gap-2">
              {TEAM_MEMBERS.map((member, index) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setTeamStartIndex(index)}
                  aria-label={`Show team member group starting from ${index + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${index === teamStartIndex
                    ? "w-7 bg-[#8FEA67]"
                    : "w-2 bg-white/30 hover:bg-white/60"
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="relative overflow-hidden bg-[#f7faf8] py-12 sm:py-16 md:py-20"
      >
        <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_18%_22%,rgba(73,184,74,.12),transparent_28%),radial-gradient(circle_at_82%_78%,rgba(11,122,59,.10),transparent_30%)]" />
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(0,66,37,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(0,66,37,.035)_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="relative mx-auto max-w-[1500px] px-4 sm:px-5 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0B7A3B]/15 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#004225] shadow-sm sm:text-xs">
              <Zap size={14} className="text-[#49B84A]" />
              Platform Capabilities
            </div>

            <h2 className="mt-5 text-3xl font-black leading-[0.98] tracking-[-0.035em] text-slate-900 xs:text-4xl sm:text-5xl lg:text-[58px]">
              Built for Smarter
              <span className="mt-1 block text-[#0B7A3B]">
                Spatial Decisions
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              A connected set of GIS, analytics, 3D and data-management tools
              designed to turn complex cadastral and planning information into
              clear, actionable intelligence.
            </p>
          </div>

          <div className="relative mt-10 sm:mt-12">
            <div className="overflow-hidden px-1 sm:px-12 lg:px-14">
              <div
                key={featureStartIndex}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5"
                style={{ animation: "featureCarouselMove 450ms ease-out both" }}
              >
                {Array.from({ length: 4 }, (_, offset) => {
                  const featureIndex =
                    (featureStartIndex + offset) % FEATURES.length;
                  const { icon, title, desc } = FEATURES[featureIndex];

                  return (
                    <article
                      key={`${title}-${featureStartIndex}`}
                      className="group relative min-h-[250px] overflow-hidden rounded-[24px] border border-[#0B7A3B]/10 bg-white p-5 shadow-[0_20px_45px_-30px_rgba(0,66,37,.5)] transition-all duration-500 hover:-translate-y-2 hover:border-[#49B84A]/55 hover:shadow-[0_28px_55px_-28px_rgba(11,122,59,.38)] sm:p-6"
                    >
                      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#49B84A]/10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-[#49B84A]/20" />
                      <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-[#49B84A] to-[#004225] transition-transform duration-500 group-hover:scale-x-100" />

                      <div className="relative flex items-start justify-between gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B7A3B] to-[#004225] text-white shadow-[0_12px_24px_-12px_rgba(0,66,37,.85)] transition-transform duration-500 group-hover:rotate-3 group-hover:scale-110">
                          {icon}
                        </div>
                        <span className="text-sm font-black tracking-[0.15em] text-[#0B7A3B]/25">
                          {String(featureIndex + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <h3 className="relative mt-5 text-lg font-black text-slate-900">
                        {title}
                      </h3>
                      <p className="relative mt-2 text-sm leading-relaxed text-slate-500">
                        {desc}
                      </p>

                      <div className="relative mt-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#0B7A3B]">
                        Explore capability
                        <ArrowRight
                          size={13}
                          className="transition-transform duration-300 group-hover:translate-x-1.5"
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setFeatureStartIndex(
                  (current) =>
                    (current - 1 + FEATURES.length) % FEATURES.length,
                )
              }
              aria-label="Show previous platform capabilities"
              className="absolute left-0 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#0B7A3B]/15 bg-white text-[#004225] shadow-[0_12px_30px_-12px_rgba(0,66,37,.45)] transition-all hover:-translate-y-[55%] hover:border-[#49B84A]/70 hover:bg-[#0B7A3B] hover:text-white sm:flex"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              type="button"
              onClick={() =>
                setFeatureStartIndex(
                  (current) => (current + 1) % FEATURES.length,
                )
              }
              aria-label="Show next platform capabilities"
              className="absolute right-0 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#0B7A3B]/15 bg-white text-[#004225] shadow-[0_12px_30px_-12px_rgba(0,66,37,.45)] transition-all hover:-translate-y-[55%] hover:border-[#49B84A]/70 hover:bg-[#0B7A3B] hover:text-white sm:flex"
            >
              <ChevronRight size={22} />
            </button>

            <div className="mt-6 flex items-center justify-center gap-3 sm:hidden">
              <button
                type="button"
                onClick={() =>
                  setFeatureStartIndex(
                    (current) =>
                      (current - 1 + FEATURES.length) % FEATURES.length,
                  )
                }
                aria-label="Show previous platform capabilities"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#0B7A3B]/15 bg-white text-[#004225] shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                onClick={() =>
                  setFeatureStartIndex(
                    (current) => (current + 1) % FEATURES.length,
                  )
                }
                aria-label="Show next platform capabilities"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#0B7A3B]/15 bg-white text-[#004225] shadow-sm"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="mt-6 flex justify-center gap-2">
              {FEATURES.map((feature, index) => (
                <button
                  key={feature.title}
                  type="button"
                  onClick={() => setFeatureStartIndex(index)}
                  aria-label={`Show capability group starting from ${index + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${index === featureStartIndex
                    ? "w-7 bg-[#0B7A3B]"
                    : "w-2 bg-[#0B7A3B]/20 hover:bg-[#0B7A3B]/45"
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="bg-[#00351f] text-white">
        <div className="mx-auto grid max-w-[1420px] grid-cols-1 gap-8 px-8 pb-8 pt-10 sm:grid-cols-2 sm:px-12 sm:pb-12 sm:pt-14 lg:grid-cols-[1.15fr_0.58fr_0.86fr_1.65fr] lg:gap-6 xl:gap-8 xl:px-16">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-2.5 lg:flex-nowrap lg:gap-2.5 xl:gap-3">
              {[
                {
                  src: RudaFooterLogo,
                  alt: "Ravi Urban Development Authority",
                },
                {
                  src: GopHeaderLogo,
                  alt: "Government of Punjab",
                },
                {
                  src: NespakLogo,
                  alt: "NESPAK",
                },
                {
                  src: RudaLogo,
                  alt: "RUDA GIS Directorate",
                },
              ].map((logo) => (
                <div
                  key={logo.alt}
                  className="
      flex
      h-[64px] w-[64px]
      sm:h-[70px] sm:w-[70px]
      shrink-0
      items-center
      justify-center
      rounded-full
      bg-white
      p-[2px]
      shadow-md
      ring-1
      ring-white/20
      transition-all
      duration-300
      hover:scale-105
    "
                >
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    className="h-[92%] w-[92%] rounded-full object-contain"
                  />
                </div>
              ))}
            </div>

            <p className="mb-4 max-w-md text-xs leading-relaxed text-white/70 sm:mb-6 sm:text-sm">
              RUDA Cadastral Project is a GIS-enabled initiative for digital
              cadastral mapping, parcel intelligence and spatial decision
              support for the Ravi Urban Development Authority project area.
            </p>

            <div className="flex gap-2">
              {[
                { icon: <Facebook size={14} />, href: "#" },
                { icon: <Twitter size={14} />, href: "#" },
                { icon: <Linkedin size={14} />, href: "#" },
                { icon: <Instagram size={14} />, href: "#" },
              ].map(({ icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-all hover:bg-[#49B84A] hover:text-white sm:h-9 sm:w-9"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          <div className="ml-4">
            <h3 className="mb-4 text-sm font-black sm:mb-5 sm:text-base">
              Quick Links
            </h3>

            <div className="flex flex-col gap-2 sm:gap-2.5">
              {NAV_LINKS.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="flex items-center gap-2 text-xs text-white/70 transition-colors hover:text-[#49B84A] sm:text-sm"
                >
                  <ArrowRight size={11} /> {label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-black sm:mb-5 sm:text-base">
              Contact Info
            </h3>

            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex gap-2.5 text-xs text-white/70 sm:text-sm">
                <MapPin size={14} className="mt-0.5 shrink-0 text-[#49B84A]" />
                <span>
                  152-A, Ali Block, Land Accquisition &amp; Estate Management
                  Office, Garden Town, RUDA, Lahore, Pakistan
                </span>
              </div>

              <div className="flex gap-2.5 text-xs text-white/70 sm:text-sm">
                <Phone size={14} className="shrink-0 text-[#49B84A]" />
                <span>+92-42-99333531-6 Ext. 608</span>
              </div>

              <div className="flex gap-2.5 text-xs text-white/70 sm:text-sm">
                <Mail size={14} className="shrink-0 text-[#49B84A]" />
                <span>info@ruda.gov.pk</span>
              </div>
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
              <div>
                <h3 className="text-sm font-black sm:text-base">
                  Office Location
                </h3>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/45 sm:text-[10px]">
                  Land Acquisition &amp; Estate Management
                </p>
              </div>

              <a
                href="https://www.google.com/maps/search/?api=1&query=RUDA+LA%26EM+Office%2C+152-A+Ali+Block%2C+Garden+Town%2C+Lahore%2C+Pakistan"
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#8FEA67]/25 bg-[#8FEA67]/10 px-3 py-1.5 text-[10px] font-bold text-[#8FEA67] transition-all hover:-translate-y-0.5 hover:border-[#8FEA67]/55 hover:bg-[#8FEA67]/20 hover:text-white sm:text-xs"
              >
                Open in Maps
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.85)]">
              <div className="relative overflow-hidden">
                <iframe
                  title="RUDA LA&EM Office location"
                  src="https://www.google.com/maps?q=RUDA+LA%26EM+Office%2C+152-A+Ali+Block%2C+Garden+Town%2C+Lahore%2C+Pakistan&z=17&output=embed"
                  className="h-[270px] w-full border-0 sm:h-[300px] lg:h-[285px] xl:h-[310px]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />

                {/* Custom location label so the office name is always visible,
                    even when Google does not render a place-name label. */}
                {/* Custom location label so the office name is always visible,
    even when Google does not render a place-name label. */}

              </div>

              <div className="border-t border-white/10 bg-black/10 px-3 py-3">
                <div className="flex items-start gap-2">

                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-white sm:text-xs">
                      RUDA LA&amp;EM Office
                    </p>
                    <p className="mt-1 text-[10px] leading-relaxed text-white/65 sm:text-xs">
                      152-A, Ali Block, Garden Town, Lahore, Pakistan
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 px-4 py-4 text-center text-[10px] text-white/50 sm:py-5 sm:text-xs">
          © 2026 GIS Directorate, LA&amp;EM - Ravi Urban Development Authority
          (RUDA). All Rights Reserved. &nbsp;|&nbsp; Powered by NESPAK
          Construction Management Division
        </div>
      </footer>

      {showTop && (
        <a
          href="#home"
          className="fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50 w-9 h-9 sm:w-11 sm:h-11 bg-[#0B7A3B] hover:bg-[#004225] text-white rounded-full flex items-center justify-center shadow-xl transition-all hover:-translate-y-1"
          aria-label="Back to top"
        >
          <ChevronUp size={18} strokeWidth={2.5} />
        </a>
      )}
    </div>
  );
}