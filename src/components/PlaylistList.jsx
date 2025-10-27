import React from "react";
import OptimizedImage from "./OptimizedImage";

export default function PlaylistList({ playlists = [], onTileClick = () => {} }) {
  const placeholder = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23161616'/%3E%3Ctext x='50%25' y='50%25' fill='%23b3b3b3' font-size='18' text-anchor='middle' dominant-baseline='middle'%3EKein Bild%3C/text%3E%3C/svg%3E";

  return (
    <div>
      <div className="legend p-2 mb-3 rounded">
        <div><i className="fa-solid fa-image me-2"></i><strong>Cover</strong></div>
        <div className="ms-3">Kachel: klick = zur Listenansicht scrollen</div>
      </div>

      <div className="playlist-grid">
        {playlists.map((pl) => {
          // try to provide prioritized srcs: small -> medium -> large if available
          const urls = (pl.images || []).map((i) => i.url);
          const srcs = [urls[0], urls[1], urls[2]].filter(Boolean);
          return (
            <div
              key={pl.id}
              className="playlist-tile"
              onClick={() => onTileClick(pl.id)}
              role="button"
              tabIndex={0}
              title={pl.name}
            >
              <div style={{ position: "relative", height: 150 }}>
                <OptimizedImage
                  srcs={srcs}
                  alt={pl.name}
                  placeholder={srcs[2] || placeholder}
                  style={{ width: "100%", height: 150, borderRadius: 6 }}
                />

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
          );
        })}
      </div>

      <div style={{ marginTop: 12 }}>
        {playlists.map((pl) => (
          <div id={`pl-list-${pl.id}`} key={`list-${pl.id}`} tabIndex={-1} style={{ padding: 6, borderBottom: "1px solid rgba(255,255,255,0.03)", textAlign: "left" }}>
            <strong>{pl.name}</strong> — {pl.tracks?.total ?? 0} tracks
          </div>
        ))}
      </div>
    </div>
  );
}
