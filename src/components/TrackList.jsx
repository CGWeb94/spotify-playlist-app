// src/components/TrackList.jsx
export default function TrackList({ tracks }) {
  return (
    <div>
      {tracks.map((trackItem) => {
        const track = trackItem.track; // Spotify liefert trackItem.track
        return (
          <div key={track.id} style={{ marginBottom: "10px" }}>
            <strong>{track.name}</strong> - {track.artists.map(a => a.name).join(", ")}
          </div>
        );
      })}
    </div>
  );
}
