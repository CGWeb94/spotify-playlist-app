export default function GenreGrid({ groups = [], onSelect }) {
  if (groups.length === 0) return <p>Keine Genres gefunden</p>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
      {groups.map((g) => (
        <div
          key={g.genre}
          onClick={() => onSelect(g)}
          style={{
            width: 180,
            height: 140,
            borderRadius: 8,
            overflow: "hidden",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundImage: g.image ? `url(${g.image})` : undefined,
            padding: 8,
            color: "#fff",
            backgroundColor: g.image ? undefined : "#666",
          }}
        >
          <div style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.6))", padding: "6px", borderRadius: 6 }}>
            <strong>{g.genre}</strong>
            <div style={{ fontSize: 12 }}>{g.tracks.length} Songs</div>
          </div>
        </div>
      ))}
    </div>
  );
}