import React from "react";

export default function PlaylistList({ playlists = [], onTileClick = () => {} }) {
  const placeholder = "https://via.placeholder.com/300?text=No+Image";
  return (
    <div>
      {/* Legend */}
      <div className="legend p-2 mb-3 rounded">
        <div><i className="fa-solid fa-image me-2"></i><strong>Cover</strong></div>
        <div className="ms-3">Kachel: klick = zur Listenansicht scrollen</div>
      </div>

      <div className="playlist-grid">
        {playlists.map((pl) => (
          <div
            key={pl.id}
            className="playlist-tile"
            onClick={() => onTileClick(pl.id)}
            role="button"
            tabIndex={0}
            title={pl.name}
          >
            <div style={{ position: "relative" }}>
              <img src={pl.images?.[0]?.url || placeholder} alt={pl.name} className="playlist-image" />
              {pl.isLiked && (
                <div style={{
                  position: "absolute", right: 8, top: 8,
                  background: "rgba(0,0,0,0.5)", padding: 6, borderRadius: 20
                }}>
                  <i className="fa-solid fa-heart" style={{ color: "#1ed760" }} />
                </div>
              )}
            </div>

            <div className="playlist-info">
              <strong className="truncate">{pl.name}</strong>
              <div className="meta">{pl.tracks?.total ?? 0} Songs</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        {playlists.map((pl) => (
          <div id={`pl-list-${pl.id}`} key={`list-${pl.id}`} tabIndex={-1} style={{ padding: 6, borderBottom: "1px solid #eee", textAlign: "left" }}>
            <strong>{pl.name}</strong> — {pl.tracks?.total ?? 0} tracks
          </div>
        ))}
      </div>
    </div>
  );
}
