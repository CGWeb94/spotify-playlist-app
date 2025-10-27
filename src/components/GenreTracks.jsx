export default function GenreTracks({ group, onClose }) {
  if (!group) return null;
  return (
    <div style={{ marginTop: 12, textAlign: "left" }}>
      <button onClick={onClose} style={{ marginBottom: 8 }}>Schließen</button>
      <h3>{group.genre} — {group.tracks.length} Songs</h3>
      <div>
        {group.tracks.map((track) => (
          <div key={track.id} style={{ padding: "6px 0", borderBottom: "1px solid #eee" }}>
            <strong>{track.name}</strong> — {track.artists.map(a => a.name).join(", ")}
          </div>
        ))}
      </div>
    </div>
  );
}