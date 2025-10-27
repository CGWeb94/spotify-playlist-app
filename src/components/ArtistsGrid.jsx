import React from "react";

export default function ArtistsGrid({ groups = [], onSelect = () => {} }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {groups.map((g) => (
        <div key={g.id} className="genre-tile" onClick={() => onSelect(g)} style={{ width: 260, height: 160, backgroundImage: `url(${g.image || ""})` }}>
          <div className="genre-tile-overlay">
            <div className="genre-title">{g.name}</div>
            <div className="genre-sub">{g.tracks.length} Songs</div>
          </div>
        </div>
      ))}
    </div>
  );
}