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

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // z.B. https://spotify-playlist-app-backend.onrender.com

  // Authorization Code aus URL holen und Access Token vom Backend abrufen
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code && !token) {
      axios
        .post(`${BACKEND_URL}/auth/token`, { code })
        .then(res => setToken(res.data.access_token))
        .catch(err => console.error(err));
    }
  }, [token]);

  // Playlists laden
  useEffect(() => {
    if (token) {
      axios
        .get("https://api.spotify.com/v1/me/playlists", {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setPlaylists(res.data.items))
        .catch(err => console.error(err));
    }
  }, [token]);

  // Tracks aus allen Playlists laden (erste 50 Songs pro Playlist)
  useEffect(() => {
    if (token && playlists.length > 0) {
      const fetchTracks = async () => {
        let allTracks = [];
        for (const pl of playlists) {
          const res = await axios.get(
            `https://api.spotify.com/v1/playlists/${pl.id}/tracks?limit=50`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
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
