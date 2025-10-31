import React, { useState, useMemo, useEffect } from "react";

/**
 * PaginatedGrid: items, pageSize, renderItem, getLabel, onVisibleItems
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
      <div style={{ marginTop: 6 }}>
        <input
          aria-label="Grid-Suche"
          placeholder="Suche..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(0,0,0,0.25)",
            color: "var(--text-main)",
            fontSize: 16,
            boxSizing: "border-box"
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, color: "var(--text-sub)", fontSize: 13 }}>
          <div>{filtered.length} Ergebnis{filtered.length !== 1 ? "se" : ""}</div>
          <div>Seite {page} / {totalPages}</div>
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