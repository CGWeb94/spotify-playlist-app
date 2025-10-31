import React from "react";
import OptimizedImage from "./OptimizedImage";
import PaginatedGrid from "./PaginatedGrid";

export default function GenreGrid({ groups = [], onSelect = () => {}, onVisibleItems = () => {}, loadingIds = new Set() }) {
  return (
    <PaginatedGrid
      items={groups}
      pageSize={50}
      getLabel={(g) => g.genre || g.title || ""}
      onVisibleItems={onVisibleItems}
      renderItem={(g) => {
        const key = g.genre || g.title || Math.random();
        const srcs = g.image ? [g.image] : [];
        const lid = g.genre || g.title || g.id;
        const isLoading = loadingIds && typeof loadingIds.has === "function" && loadingIds.has(lid);
        return (
          <div key={key} className="genre-tile" role="button" onClick={() => onSelect(g)}>
            <OptimizedImage srcs={srcs} placeholder={""} style={{ width: "100%", height: "100%", borderRadius: 10 }} />
            <div className="genre-tile-overlay">
              <div className="genre-title">{g.genre || g.title}</div>
              <div className="genre-sub">{(g.tracks || []).length} Songs</div>
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