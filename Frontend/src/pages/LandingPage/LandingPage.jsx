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
} from "lucide-react";

const HERO_SLIDES = ["/s1.png", "/s2.png", "/s3.png", "/s4.png", "/s5.png", "/s6.png", "/s7.png"];

const NAV_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#apps", label: "GIS Apps" },
  { href: "#features", label: "Features" },
  { href: "#team", label: "Our Team" },
  { href: "#contact", label: "Contact" },
];

const STATS = [
  { value: "2,400+", label: "Parcels Mapped" },
  { value: "18", label: "Mauzas Covered" },
  { value: "340 km²", label: "Project Area" },
  { value: "99.8%", label: "Data Accuracy" },
];

const GIS_APPS = [
  {
    icon: <Layers size={22} />,
    title: "Cadastral Management System",
    desc: "Manage and visualize cadastral records, Khasra layers, mauza limits and administrative boundaries in one interactive GIS platform.",
    img: "/s1.png",
    route: "/Mapview",
    color: "from-[#49B84A] to-[#004225]",
  },
  {
    icon: <Search size={22} />,
    title: "GeoLayer Data Explorer",
    desc: "Explore society-based raster and Vector datasets including Master plans and boundaries and other Raster data layers.",
    img: "/s2.png",
    route: "/society-map",
    color: "from-[#0B7A3B] to-[#004225]",
  },
  {
    icon: <ClipboardList size={22} />,
    title: "3D GeoVerse",
    desc: "Experience cadastral and society data in an immersive 3D environment with land-use visualization.",
    img: "/s3.png",
    route: "/society-3d",
    color: "from-[#49B84A] to-[#0B7A3B]",
  },
  {
    icon: <FileText size={22} />,
    title: "Plot Demarcation Hub",
    desc: "Search plots, view demarcation details, verify and generate printable plot reports for cadastral documentation.",
    img: "/s4.png",
    route: "/demarcation",
    color: "from-[#0B7A3B] to-[#00351f]",
  },
  {
    icon: <Eye size={22} />,
    title: "System Administration Portal",
    desc: "Control and manage the complete cadastral system, including users, records, spatial datasets, dashboards, permissions and administrative workflows.",
    img: "/s5.png",
    route: "/dashboard",
    color: "from-[#49B84A] to-[#004225]",
  },
  {
    icon: <Smartphone size={22} />,
    title: "Mobile Field Data / ODK",
    desc: "Collect, submit and manage mobile field survey data with GPS locations, parcel photos, verification notes and structured ODK-based cadastral forms.",
    img: "/s6.png",
    color: "from-[#0B7A3B] to-[#004225]",
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

const TEAM = [
  { name: "Project Director", role: "RUDA Cadastral Project", featured: true },
  { name: "Director GIS", role: "GIS & Spatial Data Management", featured: false },
  { name: "Cadastral Lead", role: "Parcel Mapping & Land Records", featured: false },
  { name: "Survey Manager", role: "Field Operations & GPS Control", featured: false },
];

function Avatar({ name, size = "md" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  const sz = size === "lg" ? "w-24 h-24 text-2xl" : "w-16 h-16 text-lg";

  return (
    <div
      className={`${sz} rounded-full bg-gradient-to-br from-[#49B84A] to-[#004225] flex items-center justify-center text-white font-bold shrink-0`}
    >
      {initials}
    </div>
  );
}

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

function AppCard({ icon, title, desc, img, route, color, index, onClick }) {
  const [ref, visible] = useInView();

  return (
    <article
      ref={ref}
      onClick={onClick}
      className={`group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100
        transition-all duration-500 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
        hover:-translate-y-2 hover:shadow-2xl
        ${route ? "cursor-pointer" : "cursor-default"}`}
      style={{ transitionDelay: `${(index % 4) * 80}ms` }}
    >
      <div className="relative h-56 overflow-hidden">
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
        className={`h-0.5 w-0 group-hover:w-full bg-gradient-to-r ${color} transition-all duration-500`}
      />
    </article>
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
      <div className="bg-gradient-to-r from-[#00351f] via-[#004225] to-[#0B7A3B] text-white text-xs font-semibold tracking-widest flex items-center justify-center gap-4 py-2">
        <span className="w-14 h-px bg-white/40" />
        RUDA CADASTRAL PROJECT — RAVI URBAN DEVELOPMENT AUTHORITY
        <span className="w-14 h-px bg-white/40" />
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white shadow-lg" : "bg-white/95 backdrop-blur-sm shadow-sm"
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-20">
          <a href="#home" className="flex items-center gap-3 shrink-0">
            <img
              src="/Ruda_logo.jpg"
              alt="RUDA"
              className="h-12 w-auto rounded object-contain"
            />
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeSection === href.slice(1)
                    ? "bg-[#0B7A3B] text-white"
                    : "text-slate-700 hover:bg-[#edf8ef] hover:text-[#004225]"
                }`}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/Mapview")}
              className="hidden sm:flex items-center gap-2 bg-[#0B7A3B] hover:bg-[#004225] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-all hover:shadow-lg hover:-translate-y-px"
            >
              Open Map <ArrowRight size={15} />
            </button>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg bg-[#0B7A3B] text-white"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
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
        className="relative min-h-[92vh] flex items-center justify-center overflow-hidden"
      >
        {HERO_SLIDES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-[1800ms] ease-in-out"
            style={{
              opacity: i === slideIndex ? 1 : 0,
              backgroundImage: `url('${src}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              animation:
                i === slideIndex ? "kenBurns 10s ease-in-out forwards" : "none",
            }}
          />
        ))}

        <style>{`
          @keyframes kenBurns {
            0%   { transform: scale(1)    translateX(0px)  translateY(0px);  }
            100% { transform: scale(1.08) translateX(-12px) translateY(-6px); }
          }
        `}</style>

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/85 z-10" />

        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlideIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === slideIndex
                  ? "w-6 h-2 bg-[#49B84A]"
                  : "w-2 h-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>

        <div className="relative z-20 max-w-5xl mx-auto px-5 text-center text-white py-24">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white/90 text-xs font-bold tracking-wider uppercase px-4 py-2 rounded-full mb-8">
            <Star size={12} fill="currentColor" className="text-[#49B84A]" />
            Geospatial Platform for RUDA Project Area
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.07] mb-8 tracking-tight">
            RUDA Cadastral
            <span className="block text-[#49B84A] mt-1">GIS Portal</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-white/85 leading-relaxed mb-12">
            A GIS-enabled cadastral platform for parcel mapping, land record
            visualization, field survey integration and decision support across
            the RUDA project area.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => {
                document
                  .querySelector("#apps")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-3 bg-[#0B7A3B] hover:bg-[#004225] text-white font-black text-base px-8 py-4 rounded-full transition-all hover:shadow-2xl hover:-translate-y-1"
            >
              <Map size={20} /> Explore GIS Platforms
            </button>

            <a
              href="#about"
              className="flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-base px-8 py-4 rounded-full transition-all backdrop-blur"
            >
              Learn More <ArrowRight size={18} />
            </a>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-black/45 backdrop-blur-sm border-t border-white/10 z-20">
          <div className="max-w-4xl mx-auto px-5 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-white text-center">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <div className="text-2xl sm:text-3xl font-black text-[#49B84A]">
                  {value}
                </div>
                <div className="text-xs font-semibold text-white/70 mt-1 uppercase tracking-wide">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-5 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#edf8ef] text-[#004225] text-xs font-bold tracking-wider uppercase px-4 py-2 rounded-full mb-6">
              About the Platform
            </div>

            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-4">
              RUDA Cadastral
              <span className="block text-[#0B7A3B]">GIS Platform</span>
            </h2>

            <div className="w-16 h-1.5 bg-[#49B84A] rounded-full mb-8" />

            <div className="space-y-5 text-slate-600 text-base leading-relaxed">
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
              className="mt-10 inline-flex items-center gap-2 bg-[#0B7A3B] hover:bg-[#004225] text-white font-bold px-7 py-3.5 rounded-full transition-all hover:shadow-lg"
            >
              Open Cadastral Map <ArrowRight size={16} />
            </button>
          </div>

          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="/ruda-lahore-map.webp"
                alt="RUDA project map"
                className="w-full h-[420px] object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextSibling.style.display = "flex";
                }}
              />

              <div className="hidden w-full h-[420px] bg-gradient-to-br from-[#004225] to-[#00351f] items-center justify-center">
                <Map size={80} className="text-white/30" />
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 bg-[#49B84A] text-white rounded-2xl p-5 shadow-xl">
              <div className="text-3xl font-black">2026</div>
              <div className="text-xs font-bold uppercase tracking-wide">
                Active Platform
              </div>
            </div>

            <div className="absolute -top-6 -right-6 bg-[#004225] text-white rounded-2xl px-5 py-4 shadow-xl">
              <div className="text-2xl font-black">340 km²</div>
              <div className="text-xs font-semibold opacity-80">
                Coverage Area
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="apps" className="py-28 bg-slate-50">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#edf8ef] text-[#004225] text-xs font-bold tracking-wider uppercase px-4 py-2 rounded-full mb-4">
              GIS Applications
            </div>

            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-4">
              Explore RUDA GIS Apps
            </h2>

            <div className="w-16 h-1.5 bg-[#49B84A] rounded-full mx-auto mb-6" />

            <p className="max-w-xl mx-auto text-slate-500 text-base leading-relaxed">
              Interactive applications for cadastral mapping, land record
              review, field survey tracking and spatial decision support.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {GIS_APPS.map(({ icon, title, desc, img, route, color }, i) => (
              <AppCard
                key={title}
                index={i}
                icon={icon}
                title={title}
                desc={desc}
                img={img}
                route={route}
                color={color}
                onClick={() => route && navigate(route)}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#edf8ef] text-[#004225] text-xs font-bold tracking-wider uppercase px-4 py-2 rounded-full mb-4">
              Platform Capabilities
            </div>

            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-4">
              Platform Features
            </h2>

            <div className="w-16 h-1.5 bg-[#49B84A] rounded-full mx-auto mb-6" />

            <p className="max-w-xl mx-auto text-slate-500 text-base leading-relaxed">
              Purpose-built GIS capabilities for cadastral operations, field
              verification and land management decision support.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc, bg, iconBg }) => (
              <div
                key={title}
                className={`${bg} rounded-2xl p-7 group hover:shadow-md transition-all`}
              >
                <div
                  className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center text-white mb-5`}
                >
                  {icon}
                </div>

                <h3 className="font-black text-slate-900 text-base mb-2">
                  {title}
                </h3>

                <p className="text-slate-500 text-[13px] leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative py-24 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,53,31,0.94) 40%, rgba(0,66,37,0.78) 100%), url('/s3.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-6xl mx-auto px-5 flex flex-col lg:flex-row items-center gap-12">
          <div className="text-white lg:w-1/2">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-xs font-bold tracking-wider uppercase px-4 py-2 rounded-full mb-6">
              Live Platform
            </div>

            <h2 className="text-4xl lg:text-5xl font-black leading-tight mb-6">
              Start Exploring the
              <span className="block text-[#49B84A]">Cadastral Map</span>
            </h2>

            <p className="text-white/75 text-base leading-relaxed mb-8 max-w-md">
              Access parcel-level data, administrative boundaries, survey layers
              and more — all in one interactive GIS environment.
            </p>

            <button
              onClick={() => navigate("/Mapview/MapPage")}
              className="inline-flex items-center gap-3 bg-[#0B7A3B] hover:bg-[#004225] text-white font-black text-base px-8 py-4 rounded-full transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <Map size={20} /> Launch Cadastral Map
            </button>
          </div>

          <div className="lg:w-1/2 grid grid-cols-2 gap-3">
            {[
              ["2,400+", "Parcels Mapped"],
              ["18", "Mauzas Covered"],
              ["340 km²", "Project Area"],
              ["99.8%", "Data Accuracy"],
            ].map(([val, lbl]) => (
              <div
                key={lbl}
                className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 text-white text-center"
              >
                <div className="text-3xl font-black text-[#49B84A] mb-1">
                  {val}
                </div>

                <div className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                  {lbl}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="team" className="py-28 bg-slate-50">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#edf8ef] text-[#004225] text-xs font-bold tracking-wider uppercase px-4 py-2 rounded-full mb-4">
              The Team
            </div>

            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-4">
              Meet Our Team
            </h2>

            <div className="w-16 h-1.5 bg-[#49B84A] rounded-full mx-auto" />
          </div>

          <div className="flex flex-col items-center mb-10">
            <Avatar name="Project Director" size="lg" />

            <div className="mt-4 text-center">
              <div className="font-black text-slate-900 text-lg">
                Project Director
              </div>

              <div className="text-sm text-[#0B7A3B] font-semibold mt-0.5">
                RUDA Cadastral Project
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {TEAM.filter((m) => !m.featured).map(({ name, role }) => (
              <div
                key={name}
                className="bg-white rounded-2xl p-6 text-center shadow-sm border border-slate-100"
              >
                <Avatar name={name} />

                <div className="mt-4">
                  <div className="font-bold text-slate-900 text-sm">{name}</div>
                  <div className="text-xs text-slate-500 mt-1">{role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer id="contact" className="bg-[#00351f] text-white">
        <div className="max-w-6xl mx-auto px-5 pt-16 pb-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <img
                src="/Ruda_logo.jpg"
                alt="RUDA"
                className="w-12 h-12 rounded-lg object-contain bg-white p-1"
              />
              <img
                src="/gop_logo.png"
                alt="Govt of Punjab"
                className="w-12 h-12 rounded-lg object-contain bg-white p-1"
              />
            </div>

            <p className="text-white/70 text-sm leading-relaxed mb-6">
              RUDA Cadastral Project is a GIS-enabled initiative for digital
              cadastral mapping, parcel intelligence and spatial decision
              support for the Ravi Urban Development Authority project area.
            </p>

            <div className="flex gap-2">
              {[
                { icon: <Facebook size={15} />, href: "#" },
                { icon: <Twitter size={15} />, href: "#" },
                { icon: <Linkedin size={15} />, href: "#" },
                { icon: <Instagram size={15} />, href: "#" },
              ].map(({ icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#49B84A] hover:text-white flex items-center justify-center transition-all"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-black text-base mb-5">Quick Links</h3>

            <div className="flex flex-col gap-2.5">
              {NAV_LINKS.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="text-white/70 hover:text-[#49B84A] text-sm transition-colors flex items-center gap-2"
                >
                  <ArrowRight size={12} /> {label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-black text-base mb-5">Contact Info</h3>

            <div className="flex flex-col gap-4">
              <div className="flex gap-3 text-white/70 text-sm">
                <MapPin size={16} className="shrink-0 mt-0.5 text-[#49B84A]" />
                Ravi Urban Development Authority, Lahore, Pakistan
              </div>

              <div className="flex gap-3 text-white/70 text-sm">
                <Phone size={16} className="shrink-0 text-[#49B84A]" />
                +92-42-99333531-6
              </div>

              <div className="flex gap-3 text-white/70 text-sm">
                <Mail size={16} className="shrink-0 text-[#49B84A]" />
                info@ruda.gov.pk
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-black text-base mb-5">Send a Message</h3>

            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => e.preventDefault()}
            >
              {["Your Name", "Your Email", "Subject"].map((ph) => (
                <input
                  key={ph}
                  placeholder={ph}
                  className="bg-white/10 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-[#49B84A] transition-colors"
                />
              ))}

              <textarea
                placeholder="Your Message"
                rows={3}
                className="bg-white/10 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-[#49B84A] transition-colors resize-none"
              />

              <button
                type="submit"
                className="bg-[#0B7A3B] hover:bg-[#49B84A] text-white font-black text-sm py-2.5 rounded-lg transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 py-5 text-center text-white/50 text-xs">
          © 2026 Ravi Urban Development Authority (RUDA). All Rights Reserved.
          &nbsp;|&nbsp; Powered by NESPAK Geomatics &amp; GIS Section
        </div>
      </footer>

      {showTop && (
        <a
          href="#home"
          className="fixed right-6 bottom-6 z-50 w-11 h-11 bg-[#0B7A3B] hover:bg-[#004225] text-white rounded-full flex items-center justify-center shadow-xl transition-all hover:-translate-y-1"
          aria-label="Back to top"
        >
          <ChevronUp size={20} strokeWidth={2.5} />
        </a>
      )}
    </div>
  );
}