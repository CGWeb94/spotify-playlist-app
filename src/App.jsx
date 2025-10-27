// src/App.jsx
import { useState, useEffect } from "react";
import LoginButton from "./components/LoginButton";
import PlaylistList from "./components/PlaylistList";
import TrackList from "./components/TrackList";
import axios from "axios";
import GenreGrid from "./components/GenreGrid";
import GenreTracks from "./components/GenreTracks";

export default function App() {
  const [token, setToken] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [genreGroups, setGenreGroups] = useState([]); // { genre, image, tracks: [] }
  const [selectedGenre, setSelectedGenre] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // 🔹 Authorization Code aus URL holen & Access Token vom Backend abrufen
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code && !token) {
      axios
        .post(`${BACKEND_URL}/auth/token`, { code })
        .then((res) => {
          setToken(res.data.access_token);
          window.history.replaceState({}, document.title, "/");
        })
        .catch((err) => console.error(err));
    }
  }, [token]);

  // 🔹 Playlists laden
  useEffect(() => {
    if (token) {
      axios
        .get("https://api.spotify.com/v1/me/playlists", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setPlaylists(res.data.items))
        .catch((err) => console.error(err));
    }
  }, [token]);

  // 🔹 Tracks aus allen Playlists laden (concurrent)
  useEffect(() => {
    if (token && playlists.length > 0) {
      const fetchTracks = async () => {
        try {
          const promises = playlists.map((pl) =>
            axios.get(`https://api.spotify.com/v1/playlists/${pl.id}/tracks?limit=100`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          );
          const results = await Promise.all(promises);
          let allTracks = [];
          for (const r of results) {
            allTracks = [...allTracks, ...r.data.items];
          }
          setTracks(allTracks);
        } catch (err) {
          console.error(err);
        }
      };
      fetchTracks();
    }
  }, [token, playlists]);

  // 🔹 Genre-Gruppierung: Artists holen, Genres zuordnen
  useEffect(() => {
    if (!token || tracks.length === 0) {
      setGenreGroups([]);
      return;
    }

    const buildGenres = async () => {
      try {
        // Alle Artist-IDs sammeln (unique)
        const artistIds = new Set();
        tracks.forEach((t) => {
          const track = t.track;
          if (!track || !track.artists) return;
          track.artists.forEach((a) => artistIds.add(a.id));
        });
        const ids = Array.from(artistIds).filter(Boolean);
        // Spotify artist endpoint erlaubt max 50 ids
        const chunks = [];
        for (let i = 0; i < ids.length; i += 50) {
          chunks.push(ids.slice(i, i + 50));
        }

        const artistResponses = await Promise.all(
          chunks.map((chunk) =>
            axios.get(`https://api.spotify.com/v1/artists?ids=${chunk.join(",")}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          )
        );

        const artistMap = new Map();
        artistResponses.forEach((r) => {
          r.data.artists.forEach((a) => {
            artistMap.set(a.id, a);
          });
        });

        // Genre -> Set of trackIds (avoid duplicates) and sample image
        const genreMap = new Map();

        tracks.forEach((t) => {
          const track = t.track;
          if (!track) return;
          const trackId = track.id;
          // for each artist of the track
          track.artists.forEach((a) => {
            const artist = artistMap.get(a.id);
            if (!artist || !artist.genres || artist.genres.length === 0) {
              // optional: put in 'unknown' bucket
              const g = "Unbekannt";
              if (!genreMap.has(g)) genreMap.set(g, { image: (artist?.images?.[0]?.url) || null, tracks: new Map() });
              genreMap.get(g).tracks.set(trackId, track);
            } else {
              artist.genres.forEach((g) => {
                if (!genreMap.has(g)) genreMap.set(g, { image: (artist.images?.[0]?.url) || null, tracks: new Map() });
                genreMap.get(g).tracks.set(trackId, track);
              });
            }
          });
        });

        // Transform to array
        const groups = Array.from(genreMap.entries()).map(([genre, data]) => ({
          genre,
          image: data.image,
          tracks: Array.from(data.tracks.values()),
        }));

        // Sort by number of tracks desc
        groups.sort((a, b) => b.tracks.length - a.tracks.length);

        setGenreGroups(groups);
      } catch (err) {
        console.error(err);
      }
    };

    buildGenres();
  }, [token, tracks]);

  return (
    <div style={{ padding: "20px" }}>
      {!token ? (
        <LoginButton />
      ) : (
        <div>
          <h2>Deine Playlists</h2>
          <PlaylistList playlists={playlists} />
          <h2>Genres</h2>
          <GenreGrid groups={genreGroups} onSelect={(g) => setSelectedGenre(g)} />
          {selectedGenre && <GenreTracks group={selectedGenre} onClose={() => setSelectedGenre(null)} />}
          <h2>Alle Songs (roh)</h2>
          <TrackList tracks={tracks} />
        </div>
      )}
    </div>
  );
}
