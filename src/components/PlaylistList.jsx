export default function PlaylistList({ playlists = [] }) {
  const placeholder = "https://via.placeholder.com/300?text=No+Image";
  return (
    <div>
      <div className="playlist-grid">
        {playlists.map((pl) => (
          <div key={pl.id} className="playlist-tile">
            <img
              src={pl.images?.[0]?.url || placeholder}
              alt={pl.name}
              className="playlist-image"
            />
            <div className="playlist-info">
              <strong className="truncate">{pl.name}</strong>
              <div className="meta">{pl.tracks?.total ?? 0} Songs</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        {playlists.map((pl) => (
          <div key={`list-${pl.id}`} style={{ padding: 6, borderBottom: "1px solid #eee", textAlign: "left" }}>
            <strong>{pl.name}</strong> — {pl.tracks?.total ?? 0} tracks
          </div>
        ))}
      </div>
    </div>
  );
}
