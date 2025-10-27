import { useState, useMemo, useEffect } from "react";

export default function GenreTracks({ group, onClose }) {
  if (!group) return null;
  const PAGE_SIZE = 100;
  const placeholder = "https://via.placeholder.com/64?text=No";

  const [page, setPage] = useState(1);
  const [checkedMap, setCheckedMap] = useState({});
  const [query, setQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name | year | added_at

  // sauber re-init wenn group wechselt
  useEffect(() => {
    setPage(1);
    setQuery("");
    setYearFilter("");
    setSortBy("name");
    const initial = Object.fromEntries((group.tracks || []).map((t) => [t.id, true]));
    setCheckedMap(initial);
  }, [group]);

  const filtered = useMemo(() => {
    let list = (group.tracks || []).slice();
    // search
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (t) =>
          (t.name || "").toLowerCase().includes(q) ||
          (t.artists || []).some((a) => a.name.toLowerCase().includes(q))
      );
    }
    // year filter (release year of album)
    if (yearFilter) {
      list = list.filter((t) => {
        const rel = t.album?.release_date || "";
        const year = rel.split("-")[0];
        return year === yearFilter;
      });
    }
    // sort
    if (sortBy === "year") {
      list.sort((a, b) => {
        const ay = +(a.album?.release_date || "").split("-")[0] || 0;
        const by = +(b.album?.release_date || "").split("-")[0] || 0;
        return by - ay;
      });
    } else if (sortBy === "added_at") {
      list.sort((a, b) => {
        const atA = new Date(a.added_at || 0).getTime();
        const atB = new Date(b.added_at || 0).getTime();
        return atB - atA;
      });
    } else {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    return list;
  }, [group, query, yearFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggle = (id) => {
    setCheckedMap((s) => ({ ...s, [id]: !s[id] }));
  };

  const toggleAll = (val) => {
    const obj = {};
    filtered.forEach((t) => (obj[t.id] = val));
    setCheckedMap(obj);
  };

  return (
    <div className="genre-tracks">
      <button onClick={onClose} className="btn">Zurück</button>

      <h3 style={{ marginTop: 8 }}>{group.genre} — {group.tracks.length} Songs</h3>

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
        {pageItems.map((track) => (
          <div key={track.id} className="track-row">
            <img src={track.album?.images?.[2]?.url || placeholder} alt="" className="track-thumb" />
            <div className="track-meta">
              <div className="track-title">{track.name}</div>
              <div className="track-sub">{(track.artists || []).map(a => a.name).join(", ")} • {track.album?.release_date?.split("-")[0] || "?"}</div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <input type="checkbox" checked={!!checkedMap[track.id]} onChange={() => toggle(track.id)} />
            </div>
          </div>
        ))}
      </div>

      <div className="pagination">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
        <span>Seite {page} / {totalPages}</span>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
      </div>
    </div>
  );
}