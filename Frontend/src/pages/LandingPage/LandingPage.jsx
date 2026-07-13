import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Map,
  BarChart3,
  Box,
  Database,
  Mail,
  Phone,
  MapPin,
  ChevronUp,
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
  Landmark,
  Building2,
  HardHat,
  Cog,
  TrendingUp,
  Leaf,
  Network,
  RadioTower,
  ChartNoAxesCombined,
  MapPinned,
  Factory,
  Trees,
} from "lucide-react";

const HERO_SLIDES = [
  "/s11.png",
  "/s22.png",
  "/s33.png",
  "/s44.png",
  "/s55.png",
  "/s6.png",
  "/s7.png",
];

const NAV_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#apps", label: "GIS Apps" },
  { href: "#features", label: "Features" },
  { href: "#contact", label: "Contact" },
];

const STATS = [
  { value: "2,400+", label: "Parcels Mapped" },
  { value: "137", label: "Mauzas Covered" },
  { value: "340 km²", label: "Project Area" },
  { value: "99.8%", label: "Data Accuracy" },
];


const DECISION_AREAS = [
  {
    key: "land",
    number: "01",
    title: "Land & Estate Management",
    shortTitle: "Land & Estate",
    icon: Landmark,
    accent: "#8fd36f",
    glow: "rgba(143, 211, 111, 0.22)",
    bullets: [
      "Parcel & Khasra intelligence",
      "Ownership and compensation",
      "Asset inventory management",
    ],
  },
  {
    key: "planning",
    number: "02",
    title: "Architecture & Urban Planning",
    shortTitle: "Urban Planning",
    icon: Building2,
    accent: "#54c7ec",
    glow: "rgba(84, 199, 236, 0.22)",
    bullets: [
      "Master planning and zoning",
      "3D city visualization",
      "Scenario-based planning",
    ],
  },
  {
    key: "development",
    number: "03",
    title: "Development & Building Control",
    shortTitle: "Development Control",
    icon: HardHat,
    accent: "#c084fc",
    glow: "rgba(192, 132, 252, 0.22)",
    bullets: [
      "Building approvals",
      "Progress monitoring",
      "Digital records and compliance",
    ],
  },
  {
    key: "engineering",
    number: "04",
    title: "Engineering & Infrastructure",
    shortTitle: "Engineering",
    icon: Cog,
    accent: "#f5b942",
    glow: "rgba(245, 185, 66, 0.22)",
    bullets: [
      "Roads, bridges and utilities",
      "Drainage and water networks",
      "Asset maintenance planning",
    ],
  },
  {
    key: "commercial",
    number: "05",
    title: "Commercial & Business Strategy",
    shortTitle: "Commercial Strategy",
    icon: TrendingUp,
    accent: "#38d4d4",
    glow: "rgba(56, 212, 212, 0.22)",
    bullets: [
      "Investment opportunity mapping",
      "Land-value intelligence",
      "Feasibility and market analysis",
    ],
  },
  {
    key: "sustainability",
    number: "06",
    title: "Sustainability & Social Impact",
    shortTitle: "Sustainability",
    icon: Leaf,
    accent: "#a3e635",
    glow: "rgba(163, 230, 53, 0.22)",
    bullets: [
      "Environmental monitoring",
      "Green infrastructure",
      "Community and social impact",
    ],
  },
];

const PLATFORM_CAPABILITIES = [
  { label: "GIS", icon: MapPinned },
  { label: "BIM", icon: Box },
  { label: "3D Twin", icon: RadioTower },
  { label: "Analytics", icon: ChartNoAxesCombined },
  { label: "Decision Support", icon: Network },
];

const GIS_APPS = [
  {
    icon: <Layers size={22} />,
    title: "Cadastral Management System",
    desc: "Manage and visualize cadastral records, Khasra layers, mauza limits and administrative boundaries in one interactive GIS platform.",
    img: "/s1.png",
    route: "/Mapview",
    gradientFrom: "#49B84A",
    gradientTo: "#004225",
  },
  {
    icon: <Search size={22} />,
    title: "GIS Metaverse",
    desc: "Explore society-based raster and Vector datasets including Master plans and boundaries and other Raster data layers.",
    img: "/s2.png",
    route: "/gis-metaverse",
    gradientFrom: "#0B7A3B",
    gradientTo: "#004225",
  },
  {
    icon: <ClipboardList size={22} />,
    title: "3D GeoVerse",
    desc: "Experience cadastral and society data in an immersive 3D environment with land-use visualization.",
    img: "/s3.png",
    route: "/society-3d",
    gradientFrom: "#49B84A",
    gradientTo: "#0B7A3B",
  },
  {
    icon: <UploadCloud size={22} />,
    title: "3D BIM Model Viewer",
    desc: "Upload and position GLB or glTF models on the Cesium globe, manage BIM visibility, and explore project boundaries in an interactive 3D environment.",
    img: "/s7.png",
    route: "/society-3d-upload",
    gradientFrom: "#0B7A3B",
    gradientTo: "#00351F",
  },
  {
    icon: <FileText size={22} />,
    title: "Plot Demarcation Hub",
    desc: "Search plots, view demarcation details, verify and generate printable plot reports for cadastral documentation.",
    img: "/s4.png",
    route: "/demarcation",
    gradientFrom: "#49B84A",
    gradientTo: "#0B7A3B",
  },
  {
    icon: <Eye size={22} />,
    title: "System Administration Portal",
    desc: "Control and manage the complete cadastral system, including users, records, spatial datasets, dashboards, permissions and administrative workflows.",
    img: "/s5.png",
    route: "/dashboard",
    gradientFrom: "#49B84A",
    gradientTo: "#004225",
  },
  {
    icon: <Smartphone size={22} />,
    title: "Location Intelligence",
    desc: "Analyze spatial patterns, proximity relationships and location-based insights across parcels, infrastructure and project boundaries to support smarter cadastral and planning decisions.",
    img: "/s6.png",
    route: "/flyto-dashboard",
    gradientFrom: "#0B7A3B",
    gradientTo: "#004225",
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

function AppCard({ icon, title, desc, img, route, color, gradientFrom, gradientTo, index, onClick }) {
  const [ref, visible] = useInView();
  const [hovered, setHovered] = useState(false);

  return (
    <article
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100
        transition-all duration-500 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
        hover:-translate-y-2 hover:shadow-2xl
        ${route ? "cursor-pointer" : "cursor-default"}`}
      style={{ transitionDelay: `${(index % 4) * 80}ms` }}
    >
      <div className="relative h-44 xs:h-48 sm:h-56 overflow-hidden">
        <img
          src={img}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

        <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-white">
          {icon}
        </div>

        {route && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center gap-1 bg-white/90 text-slate-900 text-[10px] font-bold px-2.5 py-1 rounded-full">
              Open <ExternalLink size={10} />
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8">
          <h3 className="text-white font-black text-base leading-snug drop-shadow-lg">
            {title}
          </h3>
        </div>
      </div>

      <div className="p-5">
        <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>

        {route && (
          <div className="mt-4 flex items-center gap-1 text-[#0B7A3B] font-bold text-sm group-hover:gap-2 transition-all">
            Open App <ArrowRight size={13} />
          </div>
        )}
      </div>

      <div
        style={{
          height: "2px",
          width: hovered ? "100%" : "0%",
          background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`,
          transition: "width 500ms ease",
        }}
      />
    </article>
  );
}


function DecisionSupportCard({
  area,
  side = "left",
  delay = 0,
  compact = false,
}) {
  const Icon = area.icon;

  return (
    <div
      className={`group relative overflow-hidden border text-white backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 ${compact ? "rounded-xl px-3 py-2.5" : "rounded-2xl px-4 py-3.5"
        }`}
      style={{
        borderColor: `${area.accent}66`,
        background:
          "linear-gradient(135deg, rgba(3,26,20,.88), rgba(6,41,31,.72))",
        boxShadow: `0 16px 46px -24px ${area.glow}, inset 0 1px 0 rgba(255,255,255,.08)`,
        animation: `decisionCardIn 700ms ease-out ${delay}ms both, decisionFloat 6s ease-in-out ${delay + 900
          }ms infinite`,
      }}
    >
      {!compact && (
        <>
          <span
            className={`absolute top-1/2 hidden h-px w-11 -translate-y-1/2 xl:block ${side === "left" ? "-right-11" : "-left-11"
              }`}
            style={{
              background: `linear-gradient(${side === "left" ? "to right" : "to left"
                }, ${area.accent}, transparent)`,
            }}
          />
          <span
            className={`absolute top-1/2 hidden h-2 w-2 -translate-y-1/2 rounded-full xl:block ${side === "left" ? "-right-[47px]" : "-left-[47px]"
              }`}
            style={{
              backgroundColor: area.accent,
              boxShadow: `0 0 14px ${area.accent}`,
            }}
          />
        </>
      )}

      <div
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{
          background: `linear-gradient(to bottom, transparent, ${area.accent}, transparent)`,
        }}
      />

      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div
            className={`${compact ? "h-10 w-10" : "h-12 w-12"
              } flex items-center justify-center rounded-full border bg-[#031a14]/85`}
            style={{
              borderColor: area.accent,
              color: area.accent,
              boxShadow: `0 0 0 4px ${area.glow}, 0 0 20px ${area.glow}`,
            }}
          >
            <Icon size={compact ? 19 : 23} strokeWidth={1.9} />
          </div>

          <span
            className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-[#031a14] px-1 text-[8px] font-black text-[#031a14]"
            style={{ backgroundColor: area.accent }}
          >
            {area.number}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className={`${compact ? "text-[10px]" : "text-[12px]"
              } font-black uppercase leading-tight tracking-[0.045em]`}
            style={{ color: area.accent }}
          >
            {compact ? area.shortTitle : area.title}
          </h3>

          {!compact && (
            <ul className="mt-2 space-y-1">
              {area.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-start gap-1.5 text-[9.5px] leading-snug text-white/68"
                >
                  <span
                    className="mt-[5px] h-1 w-1 shrink-0 rounded-full"
                    style={{
                      backgroundColor: area.accent,
                      boxShadow: `0 0 6px ${area.accent}`,
                    }}
                  />
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div
        className="pointer-events-none absolute -bottom-12 -right-12 h-24 w-24 rounded-full opacity-30 blur-2xl transition-opacity duration-500 group-hover:opacity-50"
        style={{ backgroundColor: area.accent }}
      />
    </div>
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

  return (
    <div className="font-sans text-slate-800 bg-white overflow-x-hidden">
      <div className="bg-gradient-to-r from-[#00351f] via-[#004225] to-[#0B7A3B] text-white text-[9px] xs:text-[10px] sm:text-xs font-semibold tracking-widest flex items-center justify-center gap-2 sm:gap-4 py-1.5 sm:py-2 px-2 text-center">
        <span className="hidden sm:block w-10 md:w-14 h-px bg-white/40 shrink-0" />
        <span className="leading-tight">RUDA CADASTRAL PROJECT — RAVI URBAN DEVELOPMENT AUTHORITY</span>
        <span className="hidden sm:block w-10 md:w-14 h-px bg-white/40 shrink-0" />
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-white shadow-lg"
          : "bg-white/95 backdrop-blur-sm shadow-sm"
          }`}
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-5 flex items-center justify-between h-14 sm:h-16 md:h-20">
          <a href="#home" className="flex items-center gap-2 sm:gap-3 shrink-0">
            <img
              src="/Ruda_logo.jpg"
              alt="RUDA"
              className="h-8 sm:h-10 md:h-12 w-auto rounded object-contain"
            />
          </a>

          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className={`px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all ${activeSection === href.slice(1)
                  ? "bg-[#0B7A3B] text-white"
                  : "text-slate-700 hover:bg-[#edf8ef] hover:text-[#004225]"
                  }`}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate("/Mapview")}
              className="hidden sm:flex items-center gap-1.5 sm:gap-2 bg-[#0B7A3B] hover:bg-[#004225] text-white text-xs sm:text-sm font-bold px-3 sm:px-5 py-2 sm:py-2.5 rounded-full transition-all hover:shadow-lg hover:-translate-y-px"
            >
              Open Map <ArrowRight size={13} />
            </button>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-1.5 sm:p-2 rounded-lg bg-[#0B7A3B] text-white"
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
        className="relative min-h-screen overflow-hidden bg-[#010a07]"
      >
        {/* ── Background Slides with Cinematic Ken Burns ── */}
        {HERO_SLIDES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-[-12%] will-change-transform"
            style={{
              opacity: i === slideIndex ? 1 : 0,
              backgroundImage: `url('${src}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: i === slideIndex ? "saturate(1.1) brightness(0.6)" : "blur(6px) brightness(0.3)",
              transition: "opacity 2.5s cubic-bezier(0.4,0,0.2,1), filter 2.5s ease",
              animation:
                i === slideIndex
                  ? `cinemaKenBurns${i % 3} 14s cubic-bezier(0.25,0.1,0.25,1) forwards`
                  : "none",
            }}
          />
        ))}

        {/* ── All Keyframes ── */}
        <style>{`
          @keyframes cinemaKenBurns0 {
            0%   { transform: scale(1.12) translate3d(0, 0, 0); }
            100% { transform: scale(1.20) translate3d(-2%, -1%, 0); }
          }
          @keyframes cinemaKenBurns1 {
            0%   { transform: scale(1.18) translate3d(-3%, 0, 0); }
            100% { transform: scale(1.10) translate3d(1%, -1.5%, 0); }
          }
          @keyframes cinemaKenBurns2 {
            0%   { transform: scale(1.10) translate3d(1%, 1%, 0); }
            100% { transform: scale(1.18) translate3d(-1%, -0.5%, 0); }
          }

          @keyframes heroFadeUp {
            from { opacity: 0; transform: translateY(50px); filter: blur(10px); }
            to   { opacity: 1; transform: translateY(0); filter: blur(0px); }
          }
          @keyframes heroFadeRight {
            from { opacity: 0; transform: translateX(-40px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          @keyframes heroScaleIn {
            from { opacity: 0; transform: scale(0.85); }
            to   { opacity: 1; transform: scale(1); }
          }
          @keyframes heroLineExpand {
            from { width: 0; }
            to   { width: 80px; }
          }
          @keyframes orbFloat1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33%      { transform: translate(30px, -40px) scale(1.1); }
            66%      { transform: translate(-20px, 20px) scale(0.95); }
          }
          @keyframes orbFloat2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33%      { transform: translate(-40px, 30px) scale(0.9); }
            66%      { transform: translate(25px, -25px) scale(1.05); }
          }
          @keyframes orbFloat3 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50%      { transform: translate(20px, -30px) scale(1.15); }
          }
          @keyframes pulseGlow {
            0%, 100% { opacity: 0.4; }
            50%      { opacity: 0.8; }
          }
          @keyframes slideProgress {
            from { transform: scaleX(0); }
            to   { transform: scaleX(1); }
          }
          @keyframes scanlineMove {
            0%   { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
          }
          @keyframes cardSlideUp {
            from { opacity: 0; transform: translateY(30px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes statReveal {
            from { opacity: 0; transform: translateY(20px) scale(0.9); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes borderGlow {
            0%, 100% { opacity: 0.3; }
            50%      { opacity: 0.7; }
          }

          @keyframes decisionCardIn {
            from { opacity: 0; transform: translateY(18px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes decisionFloat {
            0%, 100% { transform: translateY(0); }
            50%      { transform: translateY(-5px); }
          }
          @keyframes platformPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(73, 184, 74, 0.05); }
            50%      { box-shadow: 0 0 38px 2px rgba(73, 184, 74, 0.2); }
          }

          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}</style>

        {/* ── Cinematic Overlay Stack ── */}
        {/* Heavy bottom-weighted gradient for depth */}
        <div className="absolute inset-0 z-[11]" style={{
          background: `
            linear-gradient(135deg, rgba(0,10,5,0.92) 0%, rgba(0,15,8,0.65) 40%, rgba(0,10,5,0.45) 60%, rgba(0,10,5,0.85) 100%),
            radial-gradient(ellipse 80% 50% at 30% 50%, rgba(11,122,59,0.08) 0%, transparent 70%)
          `
        }} />

        {/* Bottom fade to black */}
        <div className="absolute bottom-0 left-0 right-0 z-[12] h-[35%]" style={{
          background: "linear-gradient(to top, rgba(1,10,7,1) 0%, rgba(1,10,7,0.8) 40%, transparent 100%)"
        }} />

        {/* Diagonal accent line */}
        <div className="absolute inset-0 z-[12] pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-[30%] w-px h-full opacity-[0.07]"
            style={{ background: "linear-gradient(to bottom, transparent, #49B84A 30%, #49B84A 70%, transparent)" }}
          />
          <div className="absolute top-0 right-[31%] w-px h-full opacity-[0.04]"
            style={{ background: "linear-gradient(to bottom, transparent, #8fd36f 40%, #8fd36f 60%, transparent)" }}
          />
        </div>

        {/* Scanline effect */}
        <div className="absolute inset-0 z-[12] pointer-events-none overflow-hidden opacity-[0.015]">
          <div className="absolute left-0 right-0 h-[200px]"
            style={{
              background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(73,184,74,0.4) 2px, rgba(73,184,74,0.4) 4px)",
              animation: "scanlineMove 8s linear infinite",
            }}
          />
        </div>

        {/* Floating gradient orbs */}
        <div className="absolute top-[15%] left-[8%] z-[12] h-[300px] w-[300px] rounded-full pointer-events-none opacity-30"
          style={{
            background: "radial-gradient(circle, rgba(73,184,74,0.15) 0%, transparent 70%)",
            animation: "orbFloat1 20s ease-in-out infinite",
          }}
        />
        <div className="absolute top-[55%] right-[5%] z-[12] h-[400px] w-[400px] rounded-full pointer-events-none opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(11,122,59,0.12) 0%, transparent 70%)",
            animation: "orbFloat2 25s ease-in-out infinite",
          }}
        />
        <div className="absolute top-[30%] right-[25%] z-[12] h-[200px] w-[200px] rounded-full pointer-events-none opacity-25"
          style={{
            background: "radial-gradient(circle, rgba(143,211,111,0.1) 0%, transparent 70%)",
            animation: "orbFloat3 15s ease-in-out infinite",
          }}
        />

        {/* ── Main Hero Content ── */}
        <div className="relative z-20 mx-auto flex min-h-screen max-w-[1440px] flex-col justify-between px-5 sm:px-8 lg:px-12">

          {/* ── Upper Hero: Split Layout ── */}
          <div className="flex flex-1 flex-col lg:flex-row items-center lg:items-center gap-8 lg:gap-0 pt-8 sm:pt-12 lg:pt-16">

            {/* ── LEFT: Hero Text ── */}
            <div className="w-full lg:w-[55%] xl:w-[50%] text-center lg:text-left">

              {/* Platform badge */}
              <div
                className="inline-flex items-center gap-2 rounded-full border border-[#49B84A]/25 bg-[#0B7A3B]/10 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.22em] text-[#8fd36f] backdrop-blur-xl sm:px-5 sm:py-2.5 sm:text-[11px]"
                style={{ animation: "heroFadeUp 0.8s ease-out 0.2s both" }}
              >
                <Star size={12} fill="currentColor" className="drop-shadow-[0_0_8px_rgba(143,211,111,0.7)]" />
                Integrated GIS • BIM • Digital Twin
              </div>

              {/* Main Title */}
              <h1 className="mt-6 sm:mt-8 lg:mt-10">
                <span
                  className="block text-4xl font-black leading-[0.95] tracking-[-0.04em] text-white xs:text-5xl sm:text-6xl md:text-7xl lg:text-[76px] xl:text-[86px]"
                  style={{ animation: "heroFadeUp 1s cubic-bezier(0.22,1,0.36,1) 0.4s both" }}
                >
                  RUDA GIS
                </span>
                <span
                  className="mt-1 block text-4xl font-black leading-[0.95] tracking-[-0.04em] xs:text-5xl sm:text-6xl md:text-7xl lg:text-[76px] xl:text-[86px]"
                  style={{ animation: "heroFadeUp 1s cubic-bezier(0.22,1,0.36,1) 0.55s both" }}
                >
                  <span className="bg-gradient-to-r from-[#8fd36f] via-[#49B84A] to-[#2d9d3e] bg-clip-text text-transparent">
                    METAVERSE
                  </span>
                </span>
                <span
                  className="mt-2 block text-xl font-bold tracking-[0.12em] uppercase text-white/40 xs:text-2xl sm:text-3xl md:text-4xl"
                  style={{ animation: "heroFadeUp 1s cubic-bezier(0.22,1,0.36,1) 0.7s both" }}
                >
                  & Cadastral Portal
                </span>
              </h1>

              {/* Animated accent line */}
              <div
                className="mt-5 sm:mt-7 h-[2px] rounded-full mx-auto lg:mx-0 overflow-hidden"
                style={{
                  width: "80px",
                  background: "linear-gradient(90deg, #8fd36f, #49B84A, #0B7A3B)",
                  animation: "heroLineExpand 1s ease-out 0.9s both",
                }}
              />

              {/* Subtitle */}
              <p
                className="mt-5 sm:mt-7 max-w-lg mx-auto lg:mx-0 text-sm leading-[1.7] text-white/55 sm:text-base md:text-lg"
                style={{ animation: "heroFadeUp 0.9s ease-out 1s both" }}
              >
                A unified geospatial decision-support environment connecting
                land records, planning, BIM, engineering, investment,
                infrastructure and sustainability across the RUDA project area.
              </p>

              {/* CTA Buttons */}
              <div
                className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-center lg:items-start gap-3 sm:gap-4"
                style={{ animation: "heroFadeUp 0.9s ease-out 1.2s both" }}
              >
                <button
                  onClick={() => {
                    document.querySelector("#apps")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-full px-8 py-4 text-sm font-black text-white transition-all duration-300 hover:-translate-y-1 sm:text-base"
                  style={{
                    background: "linear-gradient(135deg, #0B7A3B 0%, #004225 100%)",
                    boxShadow: "0 0 30px rgba(73,184,74,0.25), 0 8px 32px -8px rgba(0,0,0,0.5)",
                  }}
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <Map size={18} className="relative z-10" />
                  <span className="relative z-10">Explore GIS Platforms</span>
                  <ArrowRight size={14} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                </button>

                <a
                  href="#about"
                  className="group flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-white/80 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/[0.08] hover:text-white sm:text-base"
                >
                  Learn More
                  <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </div>

              {/* Platform Capabilities — inline pills */}
              <div
                className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-2"
                style={{ animation: "heroFadeUp 0.8s ease-out 1.4s both" }}
              >
                {PLATFORM_CAPABILITIES.map((item, index) => {
                  const CapIcon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white/45 transition-all duration-300 hover:border-[#49B84A]/30 hover:text-white/70"
                    >
                      <CapIcon size={11} className="text-[#49B84A]/60" />
                      {item.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── RIGHT: Stats + Visual Panel ── */}
            <div
              className="w-full lg:w-[45%] xl:w-[50%] flex items-center justify-center lg:justify-end"
              style={{ animation: "heroScaleIn 1.2s ease-out 0.6s both" }}
            >
              <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl">
                {/* Glowing border frame */}
                <div className="absolute -inset-px rounded-2xl sm:rounded-3xl opacity-30"
                  style={{
                    background: "linear-gradient(135deg, #49B84A, transparent 40%, transparent 60%, #0B7A3B)",
                    animation: "borderGlow 4s ease-in-out infinite",
                  }}
                />

                {/* Stats panel */}
                <div className="relative rounded-2xl sm:rounded-3xl border border-white/[0.06] bg-[#010a07]/60 backdrop-blur-2xl p-5 sm:p-7 lg:p-8">
                  {/* Panel header */}
                  <div className="flex items-center justify-between mb-5 sm:mb-7">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-[#49B84A] shadow-[0_0_8px_rgba(73,184,74,0.6)]"
                        style={{ animation: "pulseGlow 2s ease-in-out infinite" }}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">Project Overview</span>
                    </div>
                    <span className="text-[9px] font-mono text-white/20">RUDA.v2.0</span>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {STATS.map(({ value, label }, i) => (
                      <div
                        key={label}
                        className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 sm:p-4 transition-all duration-300 hover:border-[#49B84A]/20 hover:bg-white/[0.04]"
                        style={{ animation: `statReveal 0.7s ease-out ${1.2 + i * 0.15}s both` }}
                      >
                        <div className="text-2xl sm:text-3xl font-black tracking-tight">
                          <span className="bg-gradient-to-br from-[#8fd36f] to-[#49B84A] bg-clip-text text-transparent">
                            {value}
                          </span>
                        </div>
                        <div className="mt-1.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.15em] text-white/35">
                          {label}
                        </div>
                        {/* Corner accent */}
                        <div className="absolute top-0 right-0 h-4 w-4 rounded-tr-xl rounded-bl-xl bg-gradient-to-bl from-[#49B84A]/10 to-transparent" />
                      </div>
                    ))}
                  </div>

                  {/* Mini slide preview */}
                  <div className="mt-5 sm:mt-6 flex items-center gap-3">
                    <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${((slideIndex + 1) / HERO_SLIDES.length) * 100}%`,
                          background: "linear-gradient(90deg, #8fd36f, #49B84A)",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-white/25">
                      {String(slideIndex + 1).padStart(2, "0")}/{String(HERO_SLIDES.length).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Slide dots */}
                  <div className="mt-3 flex items-center gap-1.5">
                    {HERO_SLIDES.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSlideIndex(i)}
                        aria-label={`Show hero slide ${i + 1}`}
                        className="rounded-full transition-all duration-500"
                        style={{
                          height: "4px",
                          width: i === slideIndex ? "20px" : "4px",
                          background: i === slideIndex
                            ? "linear-gradient(90deg, #8fd36f, #49B84A)"
                            : "rgba(255,255,255,0.12)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom: Decision Support Cards — Horizontal Scroll ── */}
          <div className="pb-6 sm:pb-8 lg:pb-10">
            {/* Section label */}
            <div
              className="mb-4 sm:mb-5 flex items-center gap-3"
              style={{ animation: "heroFadeRight 0.8s ease-out 1.6s both" }}
            >
              <span className="h-px w-8 bg-gradient-to-r from-[#49B84A]/50 to-transparent sm:w-12" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 sm:text-[10px]">
                Decision Support Areas
              </span>
            </div>

            {/* Cards — horizontal scroll on mobile, grid on desktop */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0">
              {DECISION_AREAS.map((area, index) => {
                const Icon = area.icon;
                return (
                  <div
                    key={area.key}
                    className="group relative min-w-[200px] flex-shrink-0 snap-start rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-3.5 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] lg:min-w-0"
                    style={{
                      animation: `cardSlideUp 0.6s ease-out ${1.7 + index * 0.1}s both`,
                    }}
                  >
                    {/* Top accent line */}
                    <div
                      className="absolute top-0 left-3 right-3 h-[1px] rounded-full"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${area.accent}40, transparent)`,
                      }}
                    />

                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{
                          background: `${area.accent}12`,
                          border: `1px solid ${area.accent}25`,
                          color: area.accent,
                        }}
                      >
                        <Icon size={15} strokeWidth={1.8} />
                      </div>
                      <div>
                        <span className="text-[7px] font-black tracking-[0.1em] text-white/20">{area.number}</span>
                        <h3
                          className="text-[10px] font-bold leading-tight tracking-wide"
                          style={{ color: area.accent }}
                        >
                          {area.shortTitle}
                        </h3>
                      </div>
                    </div>

                    {/* Bullets — hidden on small, visible on lg */}
                    <ul className="mt-2.5 hidden space-y-1 lg:block">
                      {area.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-1.5 text-[8px] leading-snug text-white/35">
                          <span
                            className="mt-[4px] h-1 w-1 shrink-0 rounded-full"
                            style={{ backgroundColor: area.accent, opacity: 0.5 }}
                          />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-10 sm:py-14 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 grid lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#edf8ef] text-[#004225] text-[10px] sm:text-xs font-bold tracking-wider uppercase px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-4">
              About the Platform
            </div>

            <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-3 sm:mb-4">
              RUDA Cadastral
              <span className="block text-[#0B7A3B]">GIS Platform</span>
            </h2>

            <div className="w-12 sm:w-16 h-1.5 bg-[#49B84A] rounded-full mb-5 sm:mb-8" />

            <div className="space-y-3 sm:space-y-5 text-slate-600 text-sm sm:text-base leading-relaxed">
              <p>
                The RUDA Cadastral Project is designed as a centralized
                geospatial platform for managing parcel-level information,
                cadastral boundaries, land records, and field verification data
                in a structured digital environment.
              </p>
              <p>
                The platform supports planners, survey teams, land record
                officials, GIS professionals, and decision-makers by bringing
                cadastral layers, administrative boundaries, survey evidence,
                imagery, and analytical dashboards into one integrated system.
              </p>
              <p>
                Through interactive maps, spatial dashboards, and field data
                workflows, the system improves visibility, coordination, and
                data-driven decision-making for cadastral operations within the
                RUDA project area.
              </p>
            </div>

            <button
              onClick={() => navigate("/Mapview/MapPage")}
              className="mt-7 sm:mt-10 inline-flex items-center gap-2 bg-[#0B7A3B] hover:bg-[#004225] text-white font-bold text-sm sm:text-base px-5 sm:px-7 py-3 sm:py-3.5 rounded-full transition-all hover:shadow-lg"
            >
              Open Cadastral Map <ArrowRight size={15} />
            </button>
          </div>

          <div className="relative mt-6 lg:mt-0">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="/ruda-lahore-map.webp"
                alt="RUDA project map"
                className="w-full h-[260px] xs:h-[300px] sm:h-[360px] md:h-[420px] object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextSibling.style.display = "flex";
                }}
              />

              <div className="hidden w-full h-[260px] xs:h-[300px] sm:h-[360px] md:h-[420px] bg-gradient-to-br from-[#004225] to-[#00351f] items-center justify-center">
                <Map size={80} className="text-white/30" />
              </div>

              <MapStatCard
                value="340 km²"
                label="Coverage Area"
                positionClass="top-2 left-2"
              />

              <MapStatCard
                value="2026"
                label="Active Platform"
                positionClass="bottom-2 right-2"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="apps" className="py-10 sm:py-14 md:py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-5">
          <div className="text-center mb-7 sm:mb-10">
            <div className="inline-flex items-center gap-2 bg-[#edf8ef] text-[#004225] text-[10px] sm:text-xs font-bold tracking-wider uppercase px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4">
              GIS Applications
            </div>

            <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-3 sm:mb-4">
              Explore RUDA GIS Apps
            </h2>

            <div className="w-12 sm:w-16 h-1.5 bg-[#49B84A] rounded-full mx-auto mb-4 sm:mb-4" />

            <p className="max-w-xl mx-auto text-slate-500 text-sm sm:text-base leading-relaxed px-2 sm:px-0">
              Interactive applications for cadastral mapping, land record
              review, field survey tracking and spatial decision support.
            </p>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {GIS_APPS.map(({ icon, title, desc, img, route, gradientFrom, gradientTo }, i) => (
              <AppCard
                key={title}
                index={i}
                icon={icon}
                title={title}
                desc={desc}
                img={img}
                route={route}
                gradientFrom={gradientFrom}
                gradientTo={gradientTo}
                onClick={() => route && navigate(route)}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative py-10 sm:py-14 md:py-16 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,53,31,0.94) 40%, rgba(0,66,37,0.78) 100%), url('/s3.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-5 flex flex-col lg:flex-row items-center gap-8 sm:gap-12">
          <div className="text-white lg:w-1/2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-[10px] sm:text-xs font-bold tracking-wider uppercase px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-4">
              Live Platform
            </div>

            <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-4 sm:mb-4">
              Start Exploring the
              <span className="block text-[#49B84A]">Cadastral Map</span>
            </h2>

            <p className="text-white/75 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 max-w-md mx-auto lg:mx-0">
              Access parcel-level data, administrative boundaries, survey layers
              and more — all in one interactive GIS environment.
            </p>

            <button
              onClick={() => navigate("/Mapview/MapPage")}
              className="inline-flex items-center gap-2 sm:gap-3 bg-[#0B7A3B] hover:bg-[#004225] text-white font-black text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 rounded-full transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <Map size={18} /> Launch Cadastral Map
            </button>
          </div>

          <div className="lg:w-1/2 w-full grid grid-cols-2 gap-2 sm:gap-3">
            {[
              ["2,400+", "Parcels Mapped"],
              ["137", "Mauzas Covered"],
              ["340 km²", "Project Area"],
              ["99.8%", "Data Accuracy"],
            ].map(([val, lbl]) => (
              <div
                key={lbl}
                className="bg-white/10 backdrop-blur border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white text-center"
              >
                <div className="text-2xl sm:text-3xl font-black text-[#49B84A] mb-1">
                  {val}
                </div>

                <div className="text-[9px] sm:text-xs font-semibold text-white/70 uppercase tracking-wide">
                  {lbl}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-10 sm:py-14 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-5">
          <div className="text-center mb-7 sm:mb-10">
            <div className="inline-flex items-center gap-2 bg-[#edf8ef] text-[#004225] text-[10px] sm:text-xs font-bold tracking-wider uppercase px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4">
              Platform Capabilities
            </div>

            <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-3 sm:mb-4">
              Platform Features
            </h2>

            <div className="w-12 sm:w-16 h-1.5 bg-[#49B84A] rounded-full mx-auto mb-4 sm:mb-4" />

            <p className="max-w-xl mx-auto text-slate-500 text-sm sm:text-base leading-relaxed px-2 sm:px-0">
              Purpose-built GIS capabilities for cadastral operations, field
              verification and land management decision support.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {FEATURES.map(({ icon, title, desc, bg, iconBg }) => (
              <div
                key={title}
                className={`${bg} rounded-2xl p-4 sm:p-5 md:p-7 group hover:shadow-md transition-all`}
              >
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl ${iconBg} flex items-center justify-center text-white mb-3 sm:mb-4 md:mb-5`}
                >
                  {icon}
                </div>

                <h3 className="font-black text-slate-900 text-xs sm:text-sm md:text-base mb-0 sm:mb-2">
                  {title}
                </h3>

                <p className="hidden sm:block text-slate-500 text-xs sm:text-[13px] leading-relaxed mt-1.5">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer id="contact" className="bg-[#00351f] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 pt-10 sm:pt-14 md:pt-16 pb-8 sm:pb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4 sm:mb-4">
              <img
                src="/Ruda_logo.jpg"
                alt="RUDA"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-contain bg-white p-1"
              />
              <img
                src="/gop_logo.png"
                alt="Govt of Punjab"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-contain bg-white p-1"
              />
            </div>

            <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-4">
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
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-[#49B84A] hover:text-white flex items-center justify-center transition-all"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-black text-sm sm:text-base mb-4 sm:mb-5">Quick Links</h3>

            <div className="flex flex-col gap-2 sm:gap-2.5">
              {NAV_LINKS.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="text-white/70 hover:text-[#49B84A] text-xs sm:text-sm transition-colors flex items-center gap-2"
                >
                  <ArrowRight size={11} /> {label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-black text-sm sm:text-base mb-4 sm:mb-5">Contact Info</h3>

            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex gap-3 text-white/70 text-xs sm:text-sm">
                <MapPin size={14} className="shrink-0 mt-0.5 text-[#49B84A]" />
                Ravi Urban Development Authority, Lahore, Pakistan
              </div>

              <div className="flex gap-3 text-white/70 text-xs sm:text-sm">
                <Phone size={14} className="shrink-0 text-[#49B84A]" />
                +92-42-99333531-6
              </div>

              <div className="flex gap-3 text-white/70 text-xs sm:text-sm">
                <Mail size={14} className="shrink-0 text-[#49B84A]" />
                info@ruda.gov.pk
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-black text-sm sm:text-base mb-4 sm:mb-5">Send a Message</h3>

            <form
              className="flex flex-col gap-2.5 sm:gap-3"
              onSubmit={(e) => e.preventDefault()}
            >
              {["Your Name", "Your Email", "Subject"].map((ph) => (
                <input
                  key={ph}
                  placeholder={ph}
                  className="bg-white/10 border border-white/15 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white placeholder-white/40 outline-none focus:border-[#49B84A] transition-colors"
                />
              ))}

              <textarea
                placeholder="Your Message"
                rows={3}
                className="bg-white/10 border border-white/15 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white placeholder-white/40 outline-none focus:border-[#49B84A] transition-colors resize-none"
              />

              <button
                type="submit"
                className="bg-[#0B7A3B] hover:bg-[#49B84A] text-white font-black text-xs sm:text-sm py-2.5 rounded-lg transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 py-4 sm:py-5 text-center text-white/50 text-[10px] sm:text-xs px-4">
          © 2026 Ravi Urban Development Authority (RUDA). All Rights Reserved.
          &nbsp;|&nbsp; Powered by NESPAK Construction Management Division
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