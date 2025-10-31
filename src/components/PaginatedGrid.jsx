import React, { useState, useMemo, useEffect } from "react";

/**
 * props:
 *  - items: array
 *  - pageSize: number (default 50)
 *  - renderItem: (item) => ReactNode
 *  - getLabel: (item) => string   // used for live search
 *  - onVisibleItems: (visibleItems) => void // called when visible page items change
 */
export default function PaginatedGrid({ items = [], pageSize = 50, renderItem, getLabel, onVisibleItems, className = "" }) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  const normalizedLabel = (it) => {
    try { return (getLabel ? getLabel(it) : (it.name || it.title || it.genre || "")).toLowerCase(); } catch (e) { return ""; }
  };

  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => normalizedLabel(it).includes(q));
  }, [items, query]);

  useEffect(() => {
    // adjust page when filtered length changes
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (page > totalPages) setPage(totalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.length, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  useEffect(() => {
    if (typeof onVisibleItems === "function") onVisibleItems(pageItems);
  }, [pageItems, onVisibleItems]);

  return (
    <div className={`paginated-grid ${className}`}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
        <input
          aria-label="Grid-Suche"
          placeholder="Suche..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          style={{ padding: 8, borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.25)", color: "var(--text-main)" }}
        />
        <div style={{ marginLeft: "auto", color: "var(--text-sub)" }}>
          {filtered.length} Ergebnis{filtered.length !== 1 ? "se" : ""} • Seite {page}/{totalPages}
        </div>
      </div>

      <div className="grid-items" style={{ marginTop: 12 }}>
        {pageItems.map((it, idx) => <React.Fragment key={it.id || it.genre || it.name || idx}>{renderItem(it)}</React.Fragment>)}
      </div>

      {totalPages > 1 && (
        <div className="grid-pagination" style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Zurück</button>
          <span className="page-indicator">Seite {page} / {totalPages}</span>
          <button className="btn-sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Weiter</button>
        </div>
      )}
    </div>
  );
}