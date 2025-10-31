import React from "react";
import OptimizedImage from "./OptimizedImage";
import PaginatedGrid from "./PaginatedGrid";

export default function PlaylistList({ playlists = [], onTileClick = () => {}, onVisibleItems = () => {}, loadingIds = new Set() }) {
  const placeholder = "";

  return (
    <div>
      <PaginatedGrid
        items={playlists}
        pageSize={50}
        getLabel={(pl) => pl.name || ""}
        onVisibleItems={onVisibleItems}
        renderItem={(pl) => {
          const urls = (pl.images || []).map((i) => i.url);
          const srcs = [urls[2], urls[1], urls[0]].filter(Boolean);
          const isLoading = loadingIds && typeof loadingIds.has === "function" && loadingIds.has(pl.id);
          return (
            <div key={pl.id} className="playlist-tile" onClick={() => onTileClick(pl.id)} role="button" tabIndex={0} title={pl.name}>
              <div className="playlist-image-wrap">
                <OptimizedImage srcs={srcs} alt={pl.name} placeholder={placeholder} style={{ width: "100%", height: "100%", borderRadius: 10 }} />
                <div className="playlist-image-overlay">
                  <div className="playlist-image-title">{pl.name}</div>
                  <div className="playlist-image-meta">{pl.tracks?.total ?? 0} Songs</div>
                </div>

                {isLoading && (
                  <div className="tile-spinner">
                    <div className="spinner-border text-light" role="status" style={{ width: 28, height: 28 }}>
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}

                {pl.isLiked && (
                  <div style={{ position: "absolute", right: 8, top: 8, background: "rgba(0,0,0,0.5)", padding: 6, borderRadius: 20, zIndex: 6 }}>
                    <i className="fa-solid fa-heart" style={{ color: "#1ed760" }} />
                  </div>
                )}
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
