export default function YearGrid({ groups = [], onSelect }) {
  const placeholder = "https://via.placeholder.com/600x400?text=Year";
  if (!groups || groups.length === 0) return <p>Keine Einträge</p>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
      {groups.map((g) => (
        <div
          key={g.title}
          className="genre-tile"
          onClick={() => onSelect(g)}
          style={{ backgroundImage: `url(${g.image || placeholder})` }}
        >
          <div className="genre-tile-overlay">
            <div className="genre-title">{g.title}</div>
            <div className="genre-sub">{g.tracks.length} Songs</div>
          </div>
        </div>
      ))}
    </div>
  );
}