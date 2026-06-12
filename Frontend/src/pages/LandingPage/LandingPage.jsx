import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const goToMapPage = () => {
    navigate("/Mapview/MapPage");
  };

  const apps = [
    {
      img: "/assets/images/cadastral-map.svg",
      title: "Cadastral Web Map",
      desc: "Explore parcel boundaries, Khasra layers, mauza limits, administrative boundaries and contextual GIS layers in one interactive map.",
      onClick: goToMapPage,
    },
    {
      img: "/assets/images/parcel-search.svg",
      title: "Parcel Search & Verification",
      desc: "Search parcels using cadastral identifiers, location references, mauza information, survey status and verification attributes.",
    },
    {
      img: "/assets/images/field-survey.svg",
      title: "Field Survey Dashboard",
      desc: "Monitor field teams, survey progress, GPS observations, verification remarks, evidence attachments and pending cadastral checks.",
    },
    {
      img: "/assets/images/land-records.svg",
      title: "Land Record & Ownership Insights",
      desc: "Review land status, ownership references, parcel attributes, acquisition categories and record-linked spatial summaries.",
    },
    {
      img: "/assets/images/change-detection.svg",
      title: "Change Detection & Monitoring",
      desc: "Compare imagery, survey layers and field observations to support encroachment monitoring, land-use review and progress tracking.",
    },
    {
      img: "https://logo.clearbit.com/getodk.org",
      fallback: "/assets/logos/odk-logo.svg",
      title: "Mobile Field Data Collection / ODK",
      desc: "Collect standardized field data with GPS locations, parcel photos, verification notes and structured cadastral survey forms.",
    },
    {
      img: "https://logo.clearbit.com/geonode.org",
      fallback: "/assets/logos/geonode-logo.svg",
      title: "RUDA GeoNode Data Catalog",
      desc: "Organize, discover and share cadastral datasets, GIS layers, maps and project documentation.",
      small: true,
    },
    {
      img: "https://logo.clearbit.com/geoserver.org",
      fallback: "/assets/logos/geoserver-logo.svg",
      title: "RUDA GeoServer Services",
      desc: "Publish and manage cadastral map services, WMS/WFS layers, spatial datasets and secure GIS services.",
      small: true,
    },
  ];

  const features = [
    {
      icon: "fa-solid fa-map-location-dot",
      title: "Interactive Mapping",
      desc: "Explore parcel boundaries and cadastral data through intuitive map controls and layered visualization.",
    },
    {
      icon: "fa-solid fa-chart-bar",
      title: "Data Analytics",
      desc: "Generate insights for verified area, pending surveys, parcel categories and project progress.",
    },
    {
      icon: "fa-solid fa-cube",
      title: "3D Visualization",
      desc: "Support visual review of infrastructure, terrain context and project planning layers.",
    },
    {
      icon: "fa-solid fa-database",
      title: "Real-time Data",
      desc: "Integrate field survey observations, GPS evidence and centralized cadastral records.",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-['Inter'] text-[#1d2939]">
      <div className="flex h-9 items-center justify-center gap-5 bg-[#06351f] text-xs font-bold tracking-[0.25em] text-white">
        <span className="h-px w-20 bg-white/40"></span>
        <span>RUDA CADASTRAL PROJECT</span>
        <span className="h-px w-20 bg-white/40"></span>
      </div>

      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "bg-white shadow-lg"
            : "bg-white/95 shadow-md backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-3">
          <a href="#home" className="flex items-center">
            <img
              src="/assets/Ruda.png"
              alt="RUDA Logo"
              className="h-[70px] w-auto object-contain"
            />
          </a>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="block rounded-md border border-gray-200 px-3 py-2 text-[#06351f] md:hidden"
            aria-label="Toggle menu"
          >
            <i className="fa-solid fa-bars"></i>
          </button>

          <nav
            className={`absolute left-0 top-full w-full flex-col bg-white px-5 py-4 shadow-lg md:static md:flex md:w-auto md:flex-row md:items-center md:gap-2 md:bg-transparent md:p-0 md:shadow-none ${
              menuOpen ? "flex" : "hidden"
            }`}
          >
            {[
              ["#home", "fa-solid fa-house", "Home"],
              ["#about", "fa-solid fa-circle-info", "About"],
              ["#apps", "fa-solid fa-layer-group", "GIS Apps"],
              ["#features", "fa-solid fa-star", "Features"],
              ["#team", "fa-solid fa-users", "Our Team"],
              ["#contact", "fa-solid fa-envelope", "Contact"],
            ].map(([href, icon, label], index) => (
              <a
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  index === 0
                    ? "bg-[#06351f] text-white"
                    : "text-[#1d2939] hover:bg-[#e9f5ee] hover:text-[#06351f]"
                }`}
              >
                <i className={icon}></i>
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main>
        <section
          id="home"
          className="relative flex min-h-[680px] items-center overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage: "url('/assets/images/hero-bg.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#052b1a]/95 via-[#0b4a2d]/80 to-[#0b4a2d]/45"></div>

          <div className="relative z-10 mx-auto w-full max-w-[1200px] px-5 py-24">
            <div className="max-w-[760px]">
              <h1 className="mb-6 text-5xl font-extrabold leading-tight text-white md:text-7xl">
                RUDA Cadastral GIS Portal
              </h1>

              <p className="mb-8 max-w-[680px] text-lg leading-8 text-white/90">
                A GIS-enabled cadastral platform for parcel mapping, land record
                visualization, field survey integration, and decision support
                across the RUDA project area.
              </p>

              <a
                href="#apps"
                className="inline-flex items-center gap-3 rounded-full bg-[#f6c453] px-7 py-4 text-sm font-extrabold text-[#06351f] shadow-xl transition hover:-translate-y-1 hover:bg-white"
              >
                <i className="fa-solid fa-map-location-dot"></i>
                Explore GIS Platforms
              </a>

              <div className="mt-12 flex gap-3">
                <span className="h-3 w-8 rounded-full bg-[#f6c453]"></span>
                <span className="h-3 w-3 rounded-full bg-white/70"></span>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="bg-white px-5 py-24">
          <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-4xl font-extrabold text-[#06351f]">
                About RUDA Cadastral GIS Platform
              </h2>

              <p className="mb-5 text-[16px] leading-8 text-[#475467]">
                The RUDA Cadastral Project is designed as a centralized
                geospatial platform for managing parcel-level information,
                cadastral boundaries, land records, and field verification data
                in a structured digital environment.
              </p>

              <p className="mb-5 text-[16px] leading-8 text-[#475467]">
                The platform supports planners, survey teams, land record
                officials, GIS professionals, and decision-makers by bringing
                cadastral layers, administrative boundaries, survey evidence,
                imagery, infrastructure alignments, and analytical dashboards
                into one integrated system.
              </p>

              <p className="text-[16px] leading-8 text-[#475467]">
                Through interactive maps, spatial dashboards, and field data
                workflows, the system improves visibility, coordination, and
                data-driven decision-making for cadastral operations within the
                RUDA project area.
              </p>
            </div>

            <div className="rounded-[28px] bg-[#f4f7f5] p-8 shadow-xl">
              <img
                src="/assets/images/about-dashboard.svg"
                alt="RUDA cadastral dashboard"
                className="h-auto w-full"
              />
            </div>
          </div>
        </section>

        <section id="apps" className="bg-[#f4f7f5] px-5 py-24">
          <div className="mx-auto max-w-[1200px]">
            <h2 className="mb-4 text-center text-4xl font-extrabold text-[#06351f]">
              Explore RUDA GIS Apps
            </h2>

            <p className="mx-auto mb-14 max-w-[760px] text-center text-[16px] leading-8 text-[#667085]">
              Interactive applications for cadastral mapping, land record
              review, field survey tracking, and spatial decision support.
            </p>

            <div className="grid gap-7 md:grid-cols-2">
              {apps.map((app, index) => (
                <article
                  key={index}
                  onClick={app.onClick}
                  className={`group flex cursor-pointer gap-6 rounded-[24px] bg-white p-6 shadow-md transition hover:-translate-y-2 hover:shadow-2xl ${
                    app.small ? "min-h-[150px]" : "min-h-[190px]"
                  }`}
                >
                  <div className="flex h-[110px] w-[120px] shrink-0 items-center justify-center rounded-[20px] bg-[#e9f5ee] p-4">
                    <img
                      src={app.img}
                      alt={app.title}
                      onError={(e) => {
                        if (app.fallback) e.currentTarget.src = app.fallback;
                      }}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div>
                    <h3 className="mb-3 text-xl font-extrabold text-[#06351f]">
                      {app.title}
                    </h3>

                    <p className="text-sm leading-7 text-[#667085]">
                      {app.desc}
                    </p>

                    {app.title === "Cadastral Web Map" && (
                      <button className="mt-4 rounded-full bg-[#06351f] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#0b5c38]">
                        Open Cadastral Dashboard
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="bg-white px-5 py-24">
          <div className="mx-auto max-w-[1200px]">
            <h2 className="mb-4 text-center text-4xl font-extrabold text-[#06351f]">
              Platform Features
            </h2>

            <p className="mx-auto mb-14 max-w-[760px] text-center text-[16px] leading-8 text-[#667085]">
              Purpose-built GIS capabilities for cadastral operations, field
              verification and land management decision support.
            </p>

            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="rounded-[24px] bg-[#f4f7f5] p-8 text-center shadow-md transition hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#06351f] text-2xl text-white">
                    <i className={feature.icon}></i>
                  </div>

                  <h3 className="mb-3 text-xl font-extrabold text-[#06351f]">
                    {feature.title}
                  </h3>

                  <p className="text-sm leading-7 text-[#667085]">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="team" className="bg-[#f4f7f5] px-5 py-24">
          <div className="mx-auto max-w-[1200px]">
            <h2 className="mb-14 text-4xl font-extrabold text-[#06351f]">
              Meet Our Team
            </h2>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  img: "/assets/images/team-2.svg",
                  title: "Director GIS",
                  desc: "GIS & Spatial Data Management",
                },
                {
                  img: "/assets/images/team-1.svg",
                  title: "Project Director",
                  desc: "RUDA Cadastral Project",
                  featured: true,
                },
                {
                  img: "/assets/images/team-3.svg",
                  title: "Cadastral Lead",
                  desc: "Parcel Mapping & Land Records",
                },
              ].map((member, index) => (
                <div
                  key={index}
                  className={`rounded-[28px] bg-white p-8 text-center shadow-lg transition hover:-translate-y-2 ${
                    member.featured ? "scale-105 border-4 border-[#f6c453]" : ""
                  }`}
                >
                  <img
                    src={member.img}
                    alt={member.title}
                    className="mx-auto mb-5 h-[180px] w-[180px] rounded-full object-contain"
                  />

                  <h4 className="mb-2 text-xl font-extrabold text-[#06351f]">
                    {member.title}
                  </h4>

                  <p className="text-sm font-medium text-[#667085]">
                    {member.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="bg-[#052b1a] px-5 pt-20 text-white">
        <div className="mx-auto grid max-w-[1200px] gap-10 pb-12 lg:grid-cols-4">
          <div>
            <div className="mb-6 flex items-center gap-4">
              <img
                src="/assets/Nespak.png"
                alt="NESPAK official logo"
                className="h-14 w-auto rounded bg-white p-1"
              />
              <img
                src="/assets/Ruda.png"
                alt="RUDA official logo"
                className="h-14 w-auto rounded bg-white p-1"
              />
              <img
                src="/assets/govtpunjab.png"
                alt="Government of Punjab official emblem"
                className="h-14 w-auto rounded bg-white p-1"
              />
            </div>

            <p className="mb-6 text-sm leading-7 text-white/75">
              RUDA Cadastral Project is a GIS-enabled initiative for digital
              cadastral mapping, parcel intelligence, field verification, and
              spatial decision support for the Ravi Urban Development Authority
              project area.
            </p>

            <div className="flex gap-3">
              {[
                "fab fa-facebook-f",
                "fab fa-x-twitter",
                "fab fa-linkedin-in",
                "fab fa-instagram",
              ].map((icon) => (
                <a
                  key={icon}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-[#f6c453] hover:text-[#06351f]"
                >
                  <i className={icon}></i>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-6 text-xl font-extrabold">Quick Links</h3>
            {["Home", "About", "GIS Apps", "Features", "Our Team", "Contact"].map(
              (item) => (
                <a
                  key={item}
                  href={`#${item
                    .toLowerCase()
                    .replace("gis apps", "apps")
                    .replace("our team", "team")
                    .replace(" ", "-")}`}
                  className="mb-3 block text-sm text-white/75 transition hover:text-[#f6c453]"
                >
                  {item}
                </a>
              )
            )}
          </div>

          <div>
            <h3 className="mb-6 text-xl font-extrabold">Contact Info</h3>

            <p className="mb-4 flex gap-3 text-sm leading-6 text-white/75">
              <i className="fa-solid fa-location-dot mt-1 text-[#f6c453]"></i>
              Ravi Urban Development Authority, Lahore, Pakistan
            </p>

            <p className="mb-4 flex gap-3 text-sm leading-6 text-white/75">
              <i className="fa-solid fa-phone mt-1 text-[#f6c453]"></i>
              +92-42-99333531-6
            </p>

            <p className="flex gap-3 text-sm leading-6 text-white/75">
              <i className="fa-solid fa-envelope mt-1 text-[#f6c453]"></i>
              info@ruda.gov.pk
            </p>
          </div>

          <div>
            <h3 className="mb-6 text-xl font-extrabold">Send Us a Message</h3>

            <form className="space-y-3">
              <input
                placeholder="Your Name"
                className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#f6c453]"
              />
              <input
                placeholder="Your Email"
                className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#f6c453]"
              />
              <input
                placeholder="Subject"
                className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#f6c453]"
              />
              <textarea
                placeholder="Your Message"
                rows="4"
                className="w-full resize-none rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#f6c453]"
              ></textarea>

              <button
                type="button"
                className="w-full rounded-lg bg-[#f6c453] px-5 py-3 text-sm font-extrabold text-[#06351f] transition hover:bg-white"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>

        <div className="mx-auto max-w-[1200px] border-t border-white/10 py-5 text-center text-sm text-white/60">
          © 2026 Ravi Urban Development Authority (RUDA). All Rights Reserved. |
          Powered by NESPAK Geomatics & GIS Section
        </div>
      </footer>

      <a
        href="#home"
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#f6c453] text-[#06351f] shadow-xl transition hover:-translate-y-1"
      >
        <i className="fa-solid fa-chevron-up"></i>
      </a>
    </div>
  );
};

export default LandingPage;