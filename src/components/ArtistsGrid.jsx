import React from "react";
import OptimizedImage from "./OptimizedImage";
import PaginatedGrid from "./PaginatedGrid";

export default function ArtistsGrid({ groups = [], onSelect = () => {}, onVisibleItems = () => {}, loadingIds = new Set() }) {
  return (
    <PaginatedGrid
      items={groups}
      pageSize={50}
      getLabel={(g) => g.name || ""}
      onVisibleItems={onVisibleItems}
      renderItem={(g) => {
        const srcs = g.image ? [g.image] : [];
        const isLoading = loadingIds && typeof loadingIds.has === "function" && loadingIds.has(g.id);
        return (
          <div key={g.id} className="genre-tile" role="button" onClick={() => onSelect(g)} style={{ width: 260, height: 160 }}>
            <OptimizedImage srcs={srcs} placeholder={""} style={{ width: "100%", height: "100%", borderRadius: 10 }} />
            <div className="genre-tile-overlay">
              <div className="genre-title">{g.name}</div>
              <div className="genre-sub">{g.tracks.length} Songs</div>
            </div>

            {isLoading && (
              <div className="tile-spinner">
                <div className="spinner-border text-light" role="status" style={{ width: 28, height: 28 }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
          </div>
        );
      }}
    />
  );
}