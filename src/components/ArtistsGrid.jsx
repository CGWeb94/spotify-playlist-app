import React from "react";
import OptimizedImage from "./OptimizedImage";

export default function ArtistsGrid({ groups = [], onSelect = () => {} }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {groups.map((g) => {
        const srcs = g.image ? [g.image] : [];
        return (
          <div key={g.id} className="genre-tile" role="button" onClick={() => onSelect(g)} style={{ width: 260, height: 160 }}>
            <OptimizedImage srcs={srcs} placeholder="" style={{ width: "100%", height: "100%", borderRadius: 10 }} />
            <div className="genre-tile-overlay">
              <div className="genre-title">{g.name}</div>
              <div className="genre-sub">{g.tracks.length} Songs</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}