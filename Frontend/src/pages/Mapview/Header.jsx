import { NavLink } from "react-router-dom";
import rudaFirmLogo from "../../assets/Rudafirm.png";

const navItems = [
  { to: "/", label: "Map", icon: MapIcon },
  { to: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { to: "/reports", label: "Reports", icon: ReportsIcon },
  { to: "/data", label: "Data", icon: DataIcon },
  { to: "/about", label: "About", icon: AboutIcon },
];

function MapIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function DashboardIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}
function ReportsIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </svg>
  );
}
function DataIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M21 12v7c0 1.66-4 3-9 3s-9-1.34-9-3v-7" />
    </svg>
  );
}
function AboutIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export default function Header() {
  const rssItems = [
    {
      type: "INFRA",
      text: "RUDA CEO confirms 7km flood embankments constructed, protecting Sapphire Bay villages — Jan 2026",
    },
    {
      type: "UPDATE",
      text: "RUDA board approves Rs88 billion 2025 plan for net-zero Ravi City with Ring Road bridge — Jan 2025",
    },
    {
      type: "UPDATE",
      text: "Mehmood Booti dumpsite rehabilitation 83% complete; to be converted into solar park & urban forest — 2026",
    },
    {
      type: "LEGAL",
      text: "Lahore High Court suspends Punjab Protection of Ownership of Immovable Property Act — Dec 2025",
    },
    {
      type: "SOCIAL",
      text: "RUDA establishes Vocational Training Centre to empower Maskan-e-Ravi residents — 2026",
    },
  ];

  const tickerItems = [...rssItems, ...rssItems];

  return (
    <div className="app-header">
      <div className="app-header__rss" aria-label="RUDA project updates">
        <div className="app-header__rss-label">
          <span className="app-header__rss-label-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 22h16" />
              <path d="M5 2v4" />
              <path d="M19 2v4" />
              <path d="M5 10h14" />
              <path d="M5 14h14" />
              <path d="M5 18h14" />
            </svg>
          </span>
          <span>Updates</span>
        </div>
        <div className="app-header__rss-viewport">
          <div className="app-header__rss-track">
            {tickerItems.map((item, idx) => (
              <span className="app-header__rss-item" key={`${item.type}-${idx}`}>
                <span
                  className={`app-header__rss-badge app-header__rss-badge--${item.type.toLowerCase()}`}
                  aria-hidden="true"
                >
                  {item.type}
                </span>
                <span className="app-header__rss-text">{item.text}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="app-header__main">
        <img
          className="app-header__logo"
          src={rudaFirmLogo}
          alt="RUDA"
          loading="eager"
        />
        <nav className="app-header__nav" aria-label="Main navigation">
          <ul className="app-header__nav-bar">
            {navItems.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `app-header__nav-link ${isActive ? "app-header__nav-link--active" : ""}`
                  }
                  end={to === "/"}
                >
                  <Icon className="app-header__nav-icon" />
                  <span className="app-header__nav-label">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}