import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const goToMapPage = () => {
    navigate("/Mapview/MapPage");
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          font-family: 'Inter', sans-serif;
          color: #183526;
          background: #fff;
        }

        .landing-page {
          width: 100%;
          overflow-x: hidden;
        }

        .container {
          width: min(1180px, 90%);
          margin: auto;
        }

        .top-strip {
          height: 38px;
          background: linear-gradient(90deg, #003f25, #097947);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          font-weight: 800;
          letter-spacing: 1px;
          font-size: 15px;
        }

        .top-strip span:first-child,
        .top-strip span:last-child {
          width: 70px;
          height: 1px;
          background: rgba(255,255,255,0.5);
        }

        .site-header {
          background: #fff;
          box-shadow: 0 5px 24px rgba(0,0,0,0.08);
          position: sticky;
          top: 0;
          z-index: 999;
        }

        .nav-wrap {
          height: 92px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand img {
          width: 82px;
          height: auto;
        }

        .nav-menu {
          display: flex;
          align-items: center;
          gap: 34px;
        }

        .nav-menu a {
          text-decoration: none;
          color: #06351f;
          font-size: 17px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 7px;
          position: relative;
          padding-bottom: 8px;
        }

        .nav-menu a.active::after,
        .nav-menu a:hover::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 4px;
          border-radius: 10px;
          background: #d7ab19;
        }

        .menu-toggle {
          display: none;
          border: none;
          background: #06351f;
          color: white;
          font-size: 20px;
          padding: 10px 13px;
          border-radius: 6px;
          cursor: pointer;
        }

        .hero {
          position: relative;
          min-height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          overflow: hidden;
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25)),
            url('/assets/images/hero-bg.jpg') center/cover no-repeat;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          color: white;
          padding: 100px 0;
        }

        .hero-content h1 {
          font-size: clamp(44px, 5vw, 72px);
          line-height: 1.1;
          font-weight: 900;
          margin-bottom: 28px;
        }

        .hero-content p {
          max-width: 880px;
          margin: 0 auto 45px;
          font-size: 23px;
          line-height: 1.55;
          font-weight: 500;
        }

        .primary-btn {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          background: #d9ab17;
          color: #172514;
          text-decoration: none;
          padding: 20px 48px;
          border-radius: 50px;
          font-size: 18px;
          font-weight: 900;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: 0.25s ease;
        }

        .primary-btn:hover {
          transform: translateY(-3px);
          background: #f2c021;
        }

        .slider-dots {
          display: none;
        }

        .section {
          padding: 92px 0;
        }

        .two-col {
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .section-title {
          font-size: clamp(34px, 4vw, 52px);
          line-height: 1.15;
          color: #004124;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: 55px;
          position: relative;
        }

        .section-title::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -25px;
          width: 95px;
          height: 5px;
          background: #d9ab17;
          border-radius: 10px;
        }

        .section-title.centered {
          text-align: center;
          margin-bottom: 18px;
        }

        .section-title.centered::after {
          left: 50%;
          transform: translateX(-50%);
          bottom: -14px;
        }

        .section-subtitle {
          text-align: center;
          max-width: 620px;
          margin: 34px auto 58px;
          color: #6f7f75;
          font-size: 14px;
          line-height: 1.8;
        }

        .about-section p {
          color: #30443a;
          font-size: 19px;
          line-height: 1.85;
          margin-bottom: 20px;
        }

        .about-image {
          background: #f2f6f3;
          border-radius: 28px;
          padding: 45px;
          box-shadow: 0 18px 40px rgba(0,0,0,0.08);
        }

        .about-image img {
          width: 100%;
          display: block;
        }

        .apps-section {
          background: #fff;
        }

        .apps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }

        .app-card {
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,0.10);
          transition: 0.25s ease;
          min-height: 250px;
          cursor: pointer;
        }

        .app-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 14px 34px rgba(0,0,0,0.15);
        }

        .app-card img {
          width: 100%;
          height: 118px;
          object-fit: contain;
          background: #f8faf8;
          padding: 16px;
          display: block;
        }

        .app-card .service-logo-card {
          object-fit: contain;
          padding: 30px;
        }

        .app-card div {
          padding: 22px;
        }

        .app-card h3 {
          color: #003f25;
          font-size: 16px;
          font-weight: 900;
          margin-bottom: 12px;
        }

        .app-card p {
          color: #66736b;
          font-size: 13px;
          line-height: 1.7;
        }

        .features-section {
          background: #fff;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 28px;
        }

        .feature-card {
          background: #fff;
          border-radius: 8px;
          padding: 38px 24px;
          text-align: center;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          transition: 0.25s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
        }

        .feature-card i {
          color: #6f9d38;
          font-size: 34px;
          margin-bottom: 22px;
        }

        .feature-card h3 {
          color: #003f25;
          font-size: 16px;
          font-weight: 900;
          margin-bottom: 12px;
        }

        .feature-card p {
          color: #6f7f75;
          font-size: 13px;
          line-height: 1.7;
        }

        .team-section {
          background: #f3faf6;
        }

        .team-row {
          display: flex;
          justify-content: center;
          align-items: end;
          gap: 90px;
          margin-top: 70px;
        }

        .team-member {
          text-align: center;
        }

        .team-member img {
          width: 82px;
          height: 82px;
          border-radius: 50%;
          margin-bottom: 14px;
        }

        .team-member.featured img {
          width: 120px;
          height: 120px;
          border: 4px solid #d9ab17;
          padding: 8px;
        }

        .team-member h4 {
          color: #003f25;
          font-size: 15px;
          font-weight: 900;
          margin-bottom: 5px;
        }

        .team-member p {
          color: #627269;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .footer {
          background: #00351f;
          color: white;
          padding-top: 70px;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1.3fr 0.7fr 1fr 1fr;
          gap: 45px;
          padding-bottom: 45px;
        }

        .footer-logos {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .footer-logos img {
          width: 60px;
          height: 60px;
          object-fit: contain;
          background: white;
          border-radius: 8px;
          padding: 6px;
        }

        .footer p {
          color: rgba(255,255,255,0.78);
          font-size: 14px;
          line-height: 1.8;
          margin-bottom: 14px;
        }

        .footer h3 {
          font-size: 20px;
          margin-bottom: 24px;
          color: #fff;
        }

        .footer a {
          display: block;
          color: rgba(255,255,255,0.78);
          text-decoration: none;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .footer a:hover {
          color: #d9ab17;
        }

        .socials {
          display: flex;
          gap: 10px;
          margin-top: 22px;
        }

        .socials a {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255,255,255,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0;
        }

        .footer form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer input,
        .footer textarea {
          width: 100%;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.09);
          color: white;
          padding: 12px 14px;
          border-radius: 5px;
          outline: none;
          font-family: inherit;
        }

        .footer textarea {
          min-height: 100px;
          resize: vertical;
        }

        .footer input::placeholder,
        .footer textarea::placeholder {
          color: rgba(255,255,255,0.55);
        }

        .footer button {
          border: none;
          background: #d9ab17;
          color: #102011;
          font-weight: 900;
          padding: 13px;
          border-radius: 5px;
          cursor: pointer;
        }

        .copyright {
          border-top: 1px solid rgba(255,255,255,0.12);
          padding: 20px 0;
          text-align: center;
          color: rgba(255,255,255,0.65);
          font-size: 13px;
        }

        .back-to-top {
          position: fixed;
          right: 24px;
          bottom: 24px;
          width: 45px;
          height: 45px;
          background: #d9ab17;
          color: #06351f;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          z-index: 1000;
          box-shadow: 0 6px 18px rgba(0,0,0,0.22);
        }

        @media (max-width: 992px) {
          .menu-toggle {
            display: block;
          }

          .nav-menu {
            position: absolute;
            left: 0;
            top: 130px;
            width: 100%;
            background: #fff;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            padding: 22px 6%;
            box-shadow: 0 12px 28px rgba(0,0,0,0.12);
            display: none;
          }

          .nav-menu.open {
            display: flex;
          }

          .two-col,
          .footer-grid {
            grid-template-columns: 1fr;
          }

          .apps-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .feature-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .team-row {
            gap: 40px;
          }
        }

        @media (max-width: 640px) {
          .top-strip {
            font-size: 11px;
            letter-spacing: 0.5px;
          }

          .top-strip span:first-child,
          .top-strip span:last-child {
            width: 35px;
          }

          .hero-content p {
            font-size: 17px;
          }

          .apps-grid,
          .feature-grid {
            grid-template-columns: 1fr;
          }

          .team-row {
            flex-direction: column;
            align-items: center;
          }

          .primary-btn {
            padding: 16px 28px;
            font-size: 14px;
          }
        }
      `}</style>

      <div className="landing-page">
        <div className="top-strip">
          <span></span>
          <span>RUDA CADASTRAL PROJECT</span>
          <span></span>
        </div>

        <header className="site-header">
          <div className="container nav-wrap">
            <a className="brand" href="#home">
              <img src="/assets/Ruda.png" alt="RUDA Logo" />
            </a>

            <button
              className="menu-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <i className="fa-solid fa-bars"></i>
            </button>

            <nav className={`nav-menu ${menuOpen ? "open" : ""}`}>
              <a className="active" href="#home">
                <i className="fa-solid fa-house"></i> Home
              </a>
              <a href="#about">
                <i className="fa-solid fa-circle-info"></i> About
              </a>
              <a href="#apps">
                <i className="fa-solid fa-layer-group"></i> GIS Apps
              </a>
              <a href="#features">
                <i className="fa-solid fa-star"></i> Features
              </a>
              <a href="#team">
                <i className="fa-solid fa-users"></i> Our Team
              </a>
              <a href="#contact">
                <i className="fa-solid fa-envelope"></i> Contact
              </a>
            </nav>
          </div>
        </header>

        <main>
          <section id="home" className="hero">
            <div className="hero-bg"></div>
            <div className="container hero-content">
              <h1>RUDA Cadastral GIS Portal</h1>
              <p>
                A GIS-enabled cadastral platform for parcel mapping, land record
                visualization, field survey integration, and decision support
                across the RUDA project area.
              </p>
              <a className="primary-btn" href="#apps">
                <i className="fa-solid fa-map-location-dot"></i>
                Explore GIS Platforms
              </a>
            </div>
          </section>

          <section id="about" className="section about-section">
            <div className="container two-col">
              <div>
                <h2 className="section-title">
                  About RUDA Cadastral GIS Platform
                </h2>
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
                  imagery, infrastructure alignments, and analytical dashboards
                  into one integrated system.
                </p>
                <p>
                  Through interactive maps, spatial dashboards, and field data
                  workflows, the system improves visibility, coordination, and
                  data-driven decision-making for cadastral operations within the
                  RUDA project area.
                </p>
              </div>

              <div className="about-image">
                <img
                  src="/assets/images/about-dashboard.svg"
                  alt="RUDA cadastral dashboard"
                />
              </div>
            </div>
          </section>

          <section id="apps" className="section apps-section">
            <div className="container">
              <h2 className="section-title centered">Explore RUDA GIS Apps</h2>
              <p className="section-subtitle">
                Interactive applications for cadastral mapping, land record
                review, field survey tracking, and spatial decision support.
              </p>

              <div className="apps-grid">
                <article className="app-card" onClick={goToMapPage}>
                  <img src="/assets/images/cadastral-map.svg" alt="" />
                  <div>
                    <h3>Cadastral Web Map</h3>
                    <p>
                      Explore parcel boundaries, Khasra layers, mauza limits,
                      administrative boundaries and contextual GIS layers in one
                      interactive map.
                    </p>
                  </div>
                </article>

                <article className="app-card">
                  <img src="/assets/images/parcel-search.svg" alt="" />
                  <div>
                    <h3>Parcel Search & Verification</h3>
                    <p>
                      Search parcels using cadastral identifiers, location
                      references, mauza information, survey status and
                      verification attributes.
                    </p>
                  </div>
                </article>

                <article className="app-card">
                  <img src="/assets/images/field-survey.svg" alt="" />
                  <div>
                    <h3>Field Survey Dashboard</h3>
                    <p>
                      Monitor field teams, survey progress, GPS observations,
                      verification remarks, evidence attachments and pending
                      cadastral checks.
                    </p>
                  </div>
                </article>

                <article className="app-card">
                  <img src="/assets/images/land-records.svg" alt="" />
                  <div>
                    <h3>Land Record & Ownership Insights</h3>
                    <p>
                      Review land status, ownership references, parcel
                      attributes, acquisition categories and record-linked
                      spatial summaries.
                    </p>
                  </div>
                </article>

                <article className="app-card">
                  <img src="/assets/images/change-detection.svg" alt="" />
                  <div>
                    <h3>Change Detection & Monitoring</h3>
                    <p>
                      Compare imagery, survey layers and field observations to
                      support encroachment monitoring, land-use review and
                      progress tracking.
                    </p>
                  </div>
                </article>

                <article className="app-card">
                  <img
                    className="service-logo-card"
                    src="https://logo.clearbit.com/getodk.org"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/logos/odk-logo.svg";
                    }}
                    alt="ODK official logo"
                  />
                  <div>
                    <h3>Mobile Field Data Collection / ODK</h3>
                    <p>
                      Collect standardized field data with GPS locations, parcel
                      photos, verification notes and structured cadastral survey
                      forms.
                    </p>
                  </div>
                </article>

                <article className="app-card">
                  <img
                    className="service-logo-card"
                    src="https://logo.clearbit.com/geonode.org"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/logos/geonode-logo.svg";
                    }}
                    alt="GeoNode official logo"
                  />
                  <div>
                    <h3>RUDA GeoNode Data Catalog</h3>
                    <p>
                      Organize, discover and share cadastral datasets, GIS
                      layers, maps and project documentation.
                    </p>
                  </div>
                </article>

                <article className="app-card">
                  <img
                    className="service-logo-card"
                    src="https://logo.clearbit.com/geoserver.org"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/logos/geoserver-logo.svg";
                    }}
                    alt="GeoServer official logo"
                  />
                  <div>
                    <h3>RUDA GeoServer Services</h3>
                    <p>
                      Publish and manage cadastral map services, WMS/WFS layers,
                      spatial datasets and secure GIS services.
                    </p>
                  </div>
                </article>
              </div>
            </div>
          </section>

          <section id="features" className="section features-section">
            <div className="container">
              <h2 className="section-title centered">Platform Features</h2>
              <p className="section-subtitle">
                Purpose-built GIS capabilities for cadastral operations, field
                verification and land management decision support.
              </p>

              <div className="feature-grid">
                <div className="feature-card">
                  <i className="fa-solid fa-map-location-dot"></i>
                  <h3>Interactive Mapping</h3>
                  <p>
                    Explore parcel boundaries and cadastral data through
                    intuitive map controls and layered visualization.
                  </p>
                </div>

                <div className="feature-card">
                  <i className="fa-solid fa-chart-bar"></i>
                  <h3>Data Analytics</h3>
                  <p>
                    Generate insights for verified area, pending surveys, parcel
                    categories and project progress.
                  </p>
                </div>

                <div className="feature-card">
                  <i className="fa-solid fa-cube"></i>
                  <h3>3D Visualization</h3>
                  <p>
                    Support visual review of infrastructure, terrain context and
                    project planning layers.
                  </p>
                </div>

                <div className="feature-card">
                  <i className="fa-solid fa-database"></i>
                  <h3>Real-time Data</h3>
                  <p>
                    Integrate field survey observations, GPS evidence and
                    centralized cadastral records.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="team" className="section team-section">
            <div className="container">
              <h2 className="section-title">Meet Our Team</h2>

              <div className="team-row">
                <div className="team-member">
                  <img src="/assets/images/team-2.svg" alt="" />
                  <h4>Director GIS</h4>
                  <p>GIS & Spatial Data Management</p>
                </div>

                <div className="team-member featured">
                  <img src="/assets/images/team-1.svg" alt="" />
                  <h4>Project Director</h4>
                  <p>RUDA Cadastral Project</p>
                </div>

                <div className="team-member">
                  <img src="/assets/images/team-3.svg" alt="" />
                  <h4>Cadastral Lead</h4>
                  <p>Parcel Mapping & Land Records</p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer id="contact" className="footer">
          <div className="container footer-grid">
            <div>
              <div className="footer-logos">
                <img src="/assets/Nespak.png" alt="NESPAK official logo" />
                <img src="/assets/Ruda.png" alt="RUDA official logo" />
                <img
                  src="/assets/govtpunjab.png"
                  alt="Government of Punjab official emblem"
                />
              </div>

              <p>
                RUDA Cadastral Project is a GIS-enabled initiative for digital
                cadastral mapping, parcel intelligence, field verification, and
                spatial decision support for the Ravi Urban Development
                Authority project area.
              </p>

              <div className="socials">
                <a href="#">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#">
                  <i className="fab fa-x-twitter"></i>
                </a>
                <a href="#">
                  <i className="fab fa-linkedin-in"></i>
                </a>
                <a href="#">
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>

            <div>
              <h3>Quick Links</h3>
              <a href="#home">Home</a>
              <a href="#about">About</a>
              <a href="#apps">GIS Apps</a>
              <a href="#features">Features</a>
              <a href="#team">Our Team</a>
              <a href="#contact">Contact</a>
            </div>

            <div>
              <h3>Contact Info</h3>
              <p>
                <i className="fa-solid fa-location-dot"></i> Ravi Urban
                Development Authority, Lahore, Pakistan
              </p>
              <p>
                <i className="fa-solid fa-phone"></i> +92-42-99333531-6
              </p>
              <p>
                <i className="fa-solid fa-envelope"></i> info@ruda.gov.pk
              </p>
            </div>

            <div>
              <h3>Send Us a Message</h3>
              <form>
                <input placeholder="Your Name" />
                <input placeholder="Your Email" />
                <input placeholder="Subject" />
                <textarea placeholder="Your Message"></textarea>
                <button type="button">Send Message</button>
              </form>
            </div>
          </div>

          <div className="container copyright">
            © 2026 Ravi Urban Development Authority (RUDA). All Rights
            Reserved. | Powered by NESPAK Geomatics & GIS Section
          </div>
        </footer>

        <a href="#home" className="back-to-top">
          <i className="fa-solid fa-chevron-up"></i>
        </a>
      </div>
    </>
  );
};

export default LandingPage;