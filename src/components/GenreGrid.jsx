import React from "react";
import OptimizedImage from "./OptimizedImage";

/**
 * GenreGrid
 * props:
 *  - groups: [{ genre, image, tracks: [...] }]
 *  - onSelect: fn(group)
 */
export default function GenreGrid({ groups = [], onSelect = () => {} }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {groups.map((g) => {
        const key = g.genre || g.title || String(Math.random());
        const srcs = g.image ? [g.image] : [];
        return (
          <div
            key={key}
            className="genre-tile"
            role="button"
            onClick={() => onSelect(g)}
            style={{ width: 260, height: 160 }}
          >
            <OptimizedImage srcs={srcs} placeholder={""} style={{ width: "100%", height: "100%", borderRadius: 10 }} />
            <div className="genre-tile-overlay">
              <div className="genre-title">{g.genre || g.title}</div>
              <div className="genre-sub">{(g.tracks || []).length} Songs</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}