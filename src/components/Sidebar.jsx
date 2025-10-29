import React from "react";

export default function Sidebar({ selected, onSelect, counts = {} }) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <h3 className="mb-0"><i className="fa-solid fa-compact-disc me-2"></i>MySpotify</h3>
      </div>

      <nav className="sidebar-nav">
        <button className={`nav-item ${selected === "start" ? "active" : ""}`} onClick={() => onSelect("start")}>
          <i className="fa-solid fa-house me-2"></i> Startseite
        </button>

        <button className={`nav-item ${selected === "playlists" ? "active" : ""}`} onClick={() => onSelect("playlists")}>
          <i className="fa-solid fa-list-music me-2"></i> Deine Playlists <span className="badge ms-auto">{counts.playlists ?? 0}</span>
        </button>

        <button className={`nav-item ${selected === "artists" ? "active" : ""}`} onClick={() => onSelect("artists")}>
          <i className="fa-solid fa-star me-2"></i> Künstler <span className="badge ms-auto">{counts.artists ?? 0}</span>
        </button>

        <button className={`nav-item ${selected === "genres" ? "active" : ""}`} onClick={() => onSelect("genres")}>
          <i className="fa-solid fa-music me-2"></i> Playlists nach Genre <span className="badge ms-auto">{counts.genres ?? 0}</span>
        </button>

        <button className={`nav-item ${selected === "added" ? "active" : ""}`} onClick={() => onSelect("added")}>
          <i className="fa-solid fa-calendar-plus me-2"></i> Nach Jahr hinzugefügt <span className="badge ms-auto">{counts.addedYears ?? 0}</span>
        </button>

        <button className={`nav-item ${selected === "released" ? "active" : ""}`} onClick={() => onSelect("released")}>
          <i className="fa-solid fa-calendar-days me-2"></i> Nach Jahr erschienen <span className="badge ms-auto">{counts.releasedYears ?? 0}</span>
        </button>
      </nav>
    </aside>
  );
}