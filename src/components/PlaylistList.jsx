export default function PlaylistList({ playlists }) {
  return (
    <div>
      {playlists.map(pl => (
        <div key={pl.id}>
          <h3>{pl.name}</h3>
          <p>{pl.tracks.total} tracks</p>
        </div>
      ))}
    </div>
  );
}
