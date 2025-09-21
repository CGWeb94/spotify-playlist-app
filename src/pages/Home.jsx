import { useEffect, useState } from "react";
import axios from "axios";
import PlaylistList from "../components/PlaylistList";

export default function Home() {
  const [token, setToken] = useState("");
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const token = new URLSearchParams(hash.replace("#", "?")).get("access_token");
      setToken(token);
    }
  }, []);

  useEffect(() => {
    if (token) {
      axios.get("https://api.spotify.com/v1/me/playlists", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setPlaylists(res.data.items))
      .catch(err => console.error(err));
    }
  }, [token]);

  return (
    <div>
      {!token ? <p>Please login</p> : <PlaylistList playlists={playlists} />}
    </div>
  );
}
