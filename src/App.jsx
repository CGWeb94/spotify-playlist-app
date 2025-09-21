// src/App.jsx
import { useState, useEffect } from "react";
import LoginButton from "./components/LoginButton";
import PlaylistList from "./components/PlaylistList";
import TrackList from "./components/TrackList";
import axios from "axios";

export default function App() {
  const [token, setToken] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [tracks, setTracks] = useState([]);

  // Token aus URL holen nach Spotify Login
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const accessToken = new URLSearchParams(hash.replace("#", "?")).get("access_token");
      setToken(accessToken);
    }
  }, []);

  // Playlists laden
  useEffect(() => {
    if (token) {
      axios.get("https://api.spotify.com/v1/me/playlists", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setPlaylists(res.data.items))
      .catch(err => console.error(err));
    }
  }, [token]);

  // Tracks aus allen Playlists laden (erste 50 Songs pro Playlist als Beispiel)
  useEffect(() => {
    if (token && playlists.length > 0) {
      const fetchTracks = async () => {
        let allTracks = [];
        for (const pl of playlists) {
          const res = await axios.get(`https://api.spotify.com/v1/playlists/${pl.id}/tracks?limit=50`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          allTracks = [...allTracks, ...res.data.items];
        }
        setTracks(allTracks);
      };
      fetchTracks();
    }
  }, [token, playlists]);

  return (
    <div style={{ padding: "20px" }}>
      {!token ? (
        <LoginButton />
      ) : (
        <div>
          <h2>Deine Playlists</h2>
          <PlaylistList playlists={playlists} />
          <h2>Alle Songs</h2>
          <TrackList tracks={tracks} />
        </div>
      )}
    </div>
  );
}
