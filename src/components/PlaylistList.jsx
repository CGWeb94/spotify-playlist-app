import React from "react";
import OptimizedImage from "./OptimizedImage";

export default function PlaylistList({ playlists = [], onTileClick = () => {} }) {
  const placeholder = ""; // OptimizedImage zeigt Icon-Placeholder

  return (
    <div>
      <div className="playlist-grid">
        {playlists.map((pl) => {
          const urls = (pl.images || []).map((i) => i.url);
          const srcs = [urls[2], urls[1], urls[0]].filter(Boolean);

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
                  placeholder={placeholder}
                  style={{ width: "100%", height: 150, borderRadius: 6 }}
                />

                <div className="playlist-image-overlay">
                  <div className="playlist-image-title">{pl.name}</div>
                  <div className="playlist-image-meta">{pl.tracks?.total ?? 0} Songs</div>
                </div>

                {pl.isLiked && (
                  <div style={{
                    position: "absolute", right: 8, top: 8,
                    background: "rgba(0,0,0,0.5)", padding: 6, borderRadius: 20, zIndex: 4
                  }}>
                    <i className="fa-solid fa-heart" style={{ color: "#1ed760" }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
