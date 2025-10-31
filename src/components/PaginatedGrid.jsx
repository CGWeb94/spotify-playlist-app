import React, { useState, useMemo } from "react";

/**
 * PaginatedGrid
 * props:
 *  - items: array
 *  - pageSize: number (default 50)
 *  - renderItem: (item) => ReactNode
 *  - className: optional wrapper class
 */
export default function PaginatedGrid({ items = [], pageSize = 50, renderItem, className = "" }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const pageItems = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page, pageSize]);

  const go = (p) => setPage(Math.max(1, Math.min(totalPages, p)));

  return (
    <div className={`paginated-grid ${className}`}>
      <div className="grid-items">
        {pageItems.map((it, idx) => <React.Fragment key={it.id || it.genre || it.name || idx}>{renderItem(it)}</React.Fragment>)}
      </div>

      {totalPages > 1 && (
        <div className="grid-pagination" aria-label="Grid pagination">
          <button className="btn-sm" onClick={() => go(page - 1)} disabled={page <= 1}>Zurück</button>
          <span className="page-indicator">Seite {page} / {totalPages}</span>
          <button className="btn-sm" onClick={() => go(page + 1)} disabled={page >= totalPages}>Weiter</button>
        </div>
      )}
    </div>
  );
}