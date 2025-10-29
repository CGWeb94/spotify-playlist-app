import { useState, useMemo, useEffect } from "react";
import OptimizedImage from "./OptimizedImage";

export default function GenreTracks({ group, onClose, checkedMap, setCheckedMap }) {
  if (!group) return null;
  const PAGE_SIZE = 100;

  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    if (!group) return;
    const initial = {};
    const arr = group.tracks || [];
    arr.forEach((t) => { const id = t.id; initial[id] = true; });
    if (setCheckedMap) setCheckedMap(initial);
  }, [group, setCheckedMap]);

  const filtered = useMemo(() => {
    let list = (group.tracks || []).slice();
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((t) => (t.name || "").toLowerCase().includes(q) || (t.artists || []).some(a => a.name.toLowerCase().includes(q)));
    }
    if (yearFilter) list = list.filter((t) => (t.album?.release_date || "").split("-")[0] === yearFilter);
    if (sortBy === "year") list.sort((a,b) => (+(b.album?.release_date||"0").split("-")[0]) - (+(a.album?.release_date||"0").split("-")[0]));
    else if (sortBy === "added_at") list.sort((a,b) => new Date(b.added_at||0).getTime() - new Date(a.added_at||0).getTime());
    else list.sort((a,b) => (a.name||"").localeCompare(b.name||""));
    return list;
  }, [group, query, yearFilter, sortBy]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [filtered, page]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggle = (id) => {
    if (!setCheckedMap) return;
    setCheckedMap((s) => ({ ...s, [id]: !s[id] }));
  };

  const toggleAll = (val) => {
    if (!setCheckedMap) return;
    const obj = {};
    filtered.forEach((t) => (obj[t.id] = val));
    setCheckedMap(obj);
  };

  return (
    <div className="genre-tracks">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onClose} className="btn">Zurück</button>
        <div style={{ color: "var(--text-sub)" }}>{group.genre || group.title}</div>
      </div>

      <h3 style={{ marginTop: 8, color: "var(--text-main)" }}>{group.genre || group.title} — {group.tracks.length} Songs</h3>

      <div className="controls">
        <input placeholder="Suche Titel/Interpret" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
        <input placeholder="Jahr (YYYY)" value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setPage(1); }} style={{ width: 120 }} />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="name">Sort: Name</option>
          <option value="year">Sort: Jahr (neu → alt)</option>
          <option value="added_at">Sort: Hinzugefügt</option>
        </select>
        <div style={{ marginLeft: "auto" }}>
          <button className="btn-sm" onClick={() => toggleAll(true)}>Alle wählen</button>
          <button className="btn-sm" onClick={() => toggleAll(false)} style={{ marginLeft: 6 }}>Alle abwählen</button>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        {pageItems.map((track) => {
          const id = track.id;
          const imgs = (track.album?.images || []).map(i => i.url);
          const srcs = [imgs[2], imgs[1], imgs[0]].filter(Boolean);
          return (
            <div key={id} className="track-row">
              <div style={{ width: 48, height: 48 }}>
                <OptimizedImage srcs={srcs} alt={track.name} placeholder="" style={{ width: 48, height: 48, borderRadius: 4 }} />
              </div>

              <div className="track-meta">
                <div className="track-title">{track.name}</div>
                <div className="track-sub">
                  {(track.artists || []).map(a => a.name).join(", ")} • {track.album?.release_date?.split("-")[0] || "?"}
                  {track.sources && track.sources.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      {track.sources.map((s, i) => (
                        <span key={i} className="source-chip">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginLeft: "auto" }}>
                <input type="checkbox" checked={!!(checkedMap && checkedMap[id])} onChange={() => toggle(id)} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="pagination">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Zurück</button>
        <span>Seite {page} / {Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}</span>
        <button onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)), p + 1))} disabled={page >= Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}>Weiter</button>
      </div>
    </div>
  );
}