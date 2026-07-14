import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import RudaLogo from "../../assets/RUDA L&M.png";
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
    icon: MapPin,
    accent: "#8fd36f",
    bullets: ["Parcel & Khasra intelligence", "Ownership and compensation", "Asset inventory management"],
  },
  {
    key: "planning",
    number: "02",
    title: "Architecture & Urban Planning",
    shortTitle: "Urban Planning",
    icon: Layers,
    accent: "#54c7ec",
    bullets: ["Master planning and zoning", "3D city visualization", "Scenario-based planning"],
  },
  {
    key: "development",
    number: "03",
    title: "Development & Building Control",
    shortTitle: "Development Control",
    icon: Box,
    accent: "#c084fc",
    bullets: ["Building approvals", "Progress monitoring", "Digital records and compliance"],
  },
  {
    key: "engineering",
    number: "04",
    title: "Engineering & Infrastructure",
    shortTitle: "Engineering",
    icon: Database,
    accent: "#f5b942",
    bullets: ["Roads, bridges and utilities", "Drainage and water networks", "Asset maintenance planning"],
  },
  {
    key: "commercial",
    number: "05",
    title: "Commercial & Business Strategy",
    shortTitle: "Commercial Strategy",
    icon: BarChart3,
    accent: "#38d4d4",
    bullets: ["Investment opportunity mapping", "Land-value intelligence", "Feasibility and market analysis"],
  },
  {
    key: "sustainability",
    number: "06",
    title: "Sustainability & Social Impact",
    shortTitle: "Sustainability",
    icon: Shield,
    accent: "#a3e635",
    bullets: ["Environmental monitoring", "Green infrastructure", "Community and social impact"],
  },
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
      className={`group relative overflow-hidden border border-white/20 bg-[#031a14]/72 text-white shadow-[0_18px_55px_-22px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-white/35 hover:bg-[#06291f]/88 ${compact ? "rounded-xl p-3" : "rounded-2xl p-4"
        }`}
      style={{
        animation: `decisionCardIn 700ms ease-out ${delay}ms both, decisionFloat 6s ease-in-out ${delay + 900}ms infinite`,
      }}
    >
      {!compact && (
        <span
          className={`absolute top-1/2 hidden h-px w-10 -translate-y-1/2 lg:block ${side === "left" ? "-right-10" : "-left-10"
            }`}
          style={{
            background: `linear-gradient(${side === "left" ? "to right" : "to left"}, ${area.accent}, transparent)`,
          }}
        />
      )}

      <div
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: area.accent }}
      />

      <div className="flex items-start gap-3">
        <div
          className={`${compact ? "h-9 w-9" : "h-11 w-11"} flex shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10`}
          style={{ color: area.accent }}
        >
          <Icon size={compact ? 18 : 21} strokeWidth={2.1} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-black tracking-[0.18em]"
              style={{ color: area.accent }}
            >
              {area.number}
            </span>
            <span className="h-px flex-1 bg-white/15" />
          </div>

          <h3 className={`${compact ? "mt-1 text-[11px]" : "mt-1.5 text-sm"} font-black uppercase leading-tight tracking-wide`}>
            {compact ? area.shortTitle : area.title}
          </h3>

          {!compact && (
            <ul className="mt-2 space-y-1">
              {area.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-start gap-1.5 text-[10px] leading-snug text-white/67"
                >
                  <span
                    className="mt-[5px] h-1 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: area.accent }}
                  />
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
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
              src={RudaLogo}
              alt="RUDA"
              className="h-10 sm:h-12 md:h-16 w-auto object-contain"
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
        className="relative min-h-[760px] overflow-hidden bg-[#020e0a] sm:min-h-[860px] lg:min-h-[920px]"
      >
        {/* ── Cinematic Ken Burns slideshow ── */}
        {HERO_SLIDES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out will-change-transform"
            style={{
              opacity: i === slideIndex ? 1 : 0,
              backgroundImage: `url('${src}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              transform: "scale(1.08)",
              animation:
                i === slideIndex
                  ? `heroKenBurns${i % 3} 12s ease-in-out forwards`
                  : "none",
            }}
          />
        ))}

        <style>{`
          @keyframes heroKenBurns0 {
            0%   { transform: scale(1.08) translate3d(0, 0, 0); }
            100% { transform: scale(1.02) translate3d(-1.5%, -0.5%, 0); }
          }
          @keyframes heroKenBurns1 {
            0%   { transform: scale(1.05) translate3d(-1%, 0, 0); }
            100% { transform: scale(1.10) translate3d(0.5%, -0.8%, 0); }
          }
          @keyframes heroKenBurns2 {
            0%   { transform: scale(1.10) translate3d(0.5%, -0.5%, 0); }
            100% { transform: scale(1.04) translate3d(-0.5%, 0.3%, 0); }
          }

          @keyframes heroTextReveal {
            0%   { opacity: 0; transform: translateY(32px) scale(0.97); filter: blur(6px); }
            100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          }

          @keyframes heroBadgeFade {
            0%   { opacity: 0; transform: translateY(14px); }
            100% { opacity: 1; transform: translateY(0); }
          }

          @keyframes heroOrbFloat {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33%      { transform: translate(12px, -18px) scale(1.04); }
            66%      { transform: translate(-8px, 10px) scale(0.97); }
          }

          @keyframes heroOrbFloat2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            40%      { transform: translate(-15px, 12px) scale(1.06); }
            70%      { transform: translate(10px, -8px) scale(0.95); }
          }

          @keyframes heroShimmer {
            0%   { background-position: -200% center; }
            100% { background-position: 200% center; }
          }

          @keyframes slideProgress {
            0%   { width: 0%; }
            100% { width: 100%; }
          }

          @keyframes heroPulseRing {
            0%   { transform: scale(0.95); opacity: 0.7; }
            50%  { transform: scale(1.1); opacity: 0.2; }
            100% { transform: scale(0.95); opacity: 0.7; }
          }

          @keyframes decisionCardIn {
            from { opacity: 0; transform: translateY(18px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          @keyframes decisionFloat {
            0%, 100% { transform: translateY(0); }
            50%      { transform: translateY(-5px); }
          }

          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: 0ms !important;
              transition-duration: 0ms !important;
            }
          }
        `}</style>

        {/* ── Cinematic overlay stack ── */}
        <div className="absolute inset-0 z-[5] bg-gradient-to-b from-[#020e0a]/60 via-[#031a13]/55 to-[#020e0a]/95" />
        <div className="absolute inset-0 z-[6] bg-[radial-gradient(ellipse_70%_50%_at_50%_40%,rgba(11,122,59,0.14),transparent)]" />
        <div className="absolute inset-0 z-[6] bg-[radial-gradient(circle_at_20%_80%,rgba(73,184,74,0.06),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 z-[7] opacity-[0.035] mix-blend-overlay [background-image:repeating-conic-gradient(rgba(255,255,255,0.06)_0%,transparent_1%,transparent_2%,rgba(255,255,255,0.04)_3%)] [background-size:96px_96px]" />
        <div className="absolute inset-0 z-[7] opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:52px_52px]" />

        {/* ── Floating glow orbs ── */}
        <div
          className="pointer-events-none absolute -left-32 top-[15%] z-[8] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(73,184,74,0.12),transparent_65%)] blur-2xl"
          style={{ animation: "heroOrbFloat 18s ease-in-out infinite" }}
        />
        <div
          className="pointer-events-none absolute -right-24 top-[35%] z-[8] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(56,212,212,0.08),transparent_65%)] blur-2xl"
          style={{ animation: "heroOrbFloat2 22s ease-in-out infinite" }}
        />
        <div
          className="pointer-events-none absolute bottom-[20%] left-[40%] z-[8] h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,rgba(143,211,111,0.07),transparent_60%)] blur-3xl"
          style={{ animation: "heroOrbFloat 14s ease-in-out 3s infinite" }}
        />

        {/* ── Main hero content ── */}
        <div className="relative z-20 mx-auto flex min-h-[760px] max-w-[1500px] flex-col px-4 pb-28 pt-10 sm:min-h-[860px] sm:px-6 sm:pb-32 sm:pt-14 lg:min-h-[920px] lg:px-8 lg:pb-36">
          <div className="relative flex flex-1 items-center justify-center">

            {/* ── Left decision cards ── */}
            <div className="pointer-events-none absolute inset-y-12 left-0 hidden w-[280px] flex-col justify-center gap-5 xl:flex 2xl:w-[310px]">
              {DECISION_AREAS.slice(0, 3).map((area, index) => (
                <DecisionSupportCard
                  key={area.key}
                  area={area}
                  side="left"
                  delay={800 + index * 180}
                />
              ))}
            </div>

            {/* ── Right decision cards ── */}
            <div className="pointer-events-none absolute inset-y-12 right-0 hidden w-[280px] flex-col justify-center gap-5 xl:flex 2xl:w-[310px]">
              {DECISION_AREAS.slice(3).map((area, index) => (
                <DecisionSupportCard
                  key={area.key}
                  area={area}
                  side="right"
                  delay={800 + (index + 3) * 180}
                />
              ))}
            </div>

            {/* ── Center hero block ── */}
            <div className="relative mx-auto w-full max-w-4xl text-center text-white xl:max-w-[780px]">

              {/* Platform badge */}
              <div
                className="mx-auto mb-5 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 backdrop-blur-xl sm:mb-7 sm:px-5 sm:py-2.5"
                style={{ animation: "heroBadgeFade 800ms ease-out 200ms both" }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#49B84A] opacity-75" style={{ animation: "heroPulseRing 2s ease-in-out infinite" }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#6fdb5a]" />
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/80 sm:text-[11px]">
                  Integrated GIS • BIM • Digital Twin Platform
                </span>
              </div>

              {/* Capability pills */}
              <div
                className="mb-5 flex flex-wrap items-center justify-center gap-2 sm:mb-7"
                style={{ animation: "heroBadgeFade 800ms ease-out 400ms both" }}
              >
                {["GIS", "BIM", "3D Twin", "Analytics", "Decision Support"].map(
                  (item, index) => (
                    <div
                      key={item}
                      className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/60 backdrop-blur-sm transition-all duration-300 hover:border-[#49B84A]/30 hover:bg-[#49B84A]/[0.08] hover:text-white/90 sm:text-[10px]"
                    >
                      <span className="h-1 w-1 rounded-full bg-[#49B84A] transition-all duration-300 group-hover:h-1.5 group-hover:w-1.5 group-hover:shadow-[0_0_6px_rgba(73,184,74,0.6)]" />
                      {item}
                      {index < 4 && (
                        <ArrowRight size={8} className="text-white/20 transition-colors group-hover:text-[#49B84A]/50" />
                      )}
                    </div>
                  ),
                )}
              </div>

              {/* Main heading with staggered reveal */}
              <h1
                className="text-4xl font-black leading-[0.98] tracking-[-0.04em] xs:text-5xl sm:text-6xl md:text-7xl lg:text-[82px]"
                style={{ animation: "heroTextReveal 1000ms cubic-bezier(0.16, 1, 0.3, 1) 300ms both" }}
              >
                <span className="inline-block bg-gradient-to-b from-green via-white to-white/70 bg-clip-text text-transparent drop-shadow-[0_4px_32px_rgba(0,0,0,0.5)]">
                  RUDA GIS METAVERSE
                </span>

              </h1>

              {/* Decorative divider */}
              <div
                className="mx-auto mt-6 flex items-center justify-center gap-3 sm:mt-8"
                style={{ animation: "heroBadgeFade 800ms ease-out 700ms both" }}
              >
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#49B84A]/40 sm:w-16" />
                <span className="h-1.5 w-1.5 rotate-45 border border-[#49B84A]/50 bg-[#49B84A]/20" />
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#49B84A]/40 sm:w-16" />
              </div>

              {/* Subheading */}
              <p
                className="mx-auto mt-5 max-w-2xl px-2 text-sm leading-[1.7] text-white/65 sm:mt-7 sm:text-base md:text-lg"
                style={{
                  animation: "heroTextReveal 900ms cubic-bezier(0.16, 1, 0.3, 1) 750ms both",
                  fontWeight: 400,
                  letterSpacing: "0.01em",
                }}
              >
                A unified geospatial decision-support environment connecting
                land records, planning, BIM, engineering, investment,
                infrastructure and sustainability across the RUDA project area.
              </p>

              {/* CTA buttons */}
              <div
                className="mt-7 flex flex-col justify-center gap-3 xs:flex-row sm:mt-10 sm:gap-4"
                style={{ animation: "heroTextReveal 800ms cubic-bezier(0.16, 1, 0.3, 1) 950ms both" }}
              >
                <button
                  onClick={() => {
                    document
                      .querySelector("#apps")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group relative flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-[#0B7A3B] via-[#0d8f47] to-[#0B7A3B] px-7 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_12px_40px_-12px_rgba(73,184,74,0.6)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-12px_rgba(73,184,74,0.8)] sm:px-9 sm:py-4 sm:text-sm"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ backgroundSize: "200% 100%", animation: "heroShimmer 2s ease-in-out infinite" }} />
                  <Map size={16} className="relative" />
                  <span className="relative">Explore GIS Platforms</span>
                </button>

                <a
                  href="#about"
                  className="group flex items-center justify-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-white/90 backdrop-blur-xl transition-all duration-500 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.08] sm:px-9 sm:py-4 sm:text-sm"
                >
                  Learn More
                  <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          </div>

          {/* ── Mobile decision cards ── */}
          <div className="mx-auto mt-7 grid w-full max-w-4xl grid-cols-2 gap-2.5 xl:hidden sm:grid-cols-3">
            {DECISION_AREAS.map((area, index) => (
              <DecisionSupportCard
                key={area.key}
                area={area}
                compact
                delay={index * 90}
              />
            ))}
          </div>

          {/* ── Slide progress indicator ── */}
          <div className="mt-8 flex items-center justify-center gap-1.5">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                aria-label={`Show hero slide ${i + 1}`}
                className={`relative overflow-hidden rounded-full transition-all duration-500 ${i === slideIndex
                  ? "h-1.5 w-10 bg-white/15"
                  : "h-1.5 w-1.5 bg-white/20 hover:bg-white/40"
                  }`}
              >
                {i === slideIndex && (
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#49B84A] to-[#6fdb5a]"
                    style={{ animation: "slideProgress 5s linear forwards" }}
                    key={`progress-${slideIndex}`}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="absolute bottom-0 left-0 right-0 z-30">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#49B84A]/25 to-transparent" />
          <div className="bg-[#020e0a]/80 backdrop-blur-2xl">
            <div className="mx-auto grid max-w-5xl grid-cols-2 gap-1 px-3 py-3.5 text-center text-white sm:grid-cols-4 sm:gap-3 sm:px-5 sm:py-5">
              {STATS.map(({ value, label }, i) => (
                <div key={label} className="group relative py-1.5 transition-colors duration-300">
                  {i > 0 && (
                    <span className="absolute left-0 top-1/2 hidden h-6 w-px -translate-y-1/2 bg-white/[0.07] sm:block" />
                  )}
                  <div className="text-lg font-black tracking-tight xs:text-xl sm:text-3xl">
                    <span className="bg-gradient-to-b from-[#6fdb5a] to-[#49B84A] bg-clip-text text-transparent transition-all duration-300 group-hover:from-[#8fed7a] group-hover:to-[#6fdb5a]">
                      {value}
                    </span>
                  </div>
                  <div className="mt-1 text-[7px] font-semibold uppercase tracking-[0.16em] text-white/40 transition-colors duration-300 group-hover:text-white/60 xs:text-[8px] sm:mt-1.5 sm:text-[10px]">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-10 sm:py-14 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 grid lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#edf8ef] text-[#004225] text-[10px] sm:text-xs font-bold tracking-wider uppercase px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6">
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

            <div className="w-12 sm:w-16 h-1.5 bg-[#49B84A] rounded-full mx-auto mb-4 sm:mb-6" />

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
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-[10px] sm:text-xs font-bold tracking-wider uppercase px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6">
              Live Platform
            </div>

            <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-4 sm:mb-6">
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

            <div className="w-12 sm:w-16 h-1.5 bg-[#49B84A] rounded-full mx-auto mb-4 sm:mb-6" />

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
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <img
                src={RudaLogo}
                alt="RUDA"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-contain bg-white p-1"
              />
              <img
                src="/gop_logo.png"
                alt="Govt of Punjab"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-contain bg-white p-1"
              />
            </div>

            <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
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