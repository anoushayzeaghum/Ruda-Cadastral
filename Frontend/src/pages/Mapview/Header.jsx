import rudaFirmLogo from "../../assets/Rudafirm.png";

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
        <div className="app-header__rss-viewport">
          <div className="app-header__rss-track">
            {tickerItems.map((item, idx) => (
              <span className="app-header__rss-item" key={`${item.type}-${idx}`}>
                <span className="app-header__rss-badge" aria-hidden="true">
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
        <h1 className="app-header__title">RUDA Cadastral Management System</h1>
        <div className="app-header__spacer" aria-hidden="true" />
      </div>
    </div>
  );
}