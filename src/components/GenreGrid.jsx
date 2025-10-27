import React from "react";

export default function GenreGrid({ groups = [], onSelect }) {
  const placeholder = "https://via.placeholder.com/600x400?text=Genre";
  if (!groups || groups.length === 0) return <p>Keine Genres gefunden</p>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
      {groups.map((g) => (
        <div
          key={g.genre}
          className="genre-tile"
          onClick={() => onSelect(g)}
          style={{
            backgroundImage: `url(${g.image || placeholder})`,
          }}
        >
          <div className="genre-tile-overlay">
            <div className="genre-title">{g.genre}</div>
            <div className="genre-sub">{g.tracks.length} Songs</div>
          </div>
        </div>
      ))}
    </div>
  );
}