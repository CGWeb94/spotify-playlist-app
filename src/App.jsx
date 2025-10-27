// src/App.jsx
import { useState, useEffect } from "react";
import LoginButton from "./components/LoginButton";
import PlaylistList from "./components/PlaylistList";
import TrackList from "./components/TrackList";
import axios from "axios";
import GenreGrid from "./components/GenreGrid";
import GenreTracks from "./components/GenreTracks";
import "./App.css";

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
        .then((res) => setPlaylists(res.data.items || []))
        .catch((err) => console.error(err));
    }
  }, [token]);

  // 🔹 Tracks aus allen Playlists laden (vollständig mit Pagination pro Playlist)
  useEffect(() => {
    if (token && playlists.length > 0) {
      const fetchAllForPlaylist = async (playlistId) => {
        let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
        const items = [];
        try {
          while (url) {
            const res = await axios.get(url, {
              headers: { Authorization: `Bearer ${token}` },
            });
            items.push(...(res.data.items || []));
            url = res.data.next; // Spotify liefert vollständige URL für next
          }
        } catch (err) {
          console.error("Fehler beim Laden von Tracks für Playlist:", playlistId, err?.response?.data || err.message);
        }
        return items;
      };

      const fetchTracks = async () => {
        try {
          // parallel über Playlists, aber innerhalb einer Playlist sequentiell (für paging)
          const allResults = await Promise.all(playlists.map((pl) => fetchAllForPlaylist(pl.id)));
          const flattened = allResults.flat();
          setTracks(flattened);
        } catch (err) {
          console.error(err);
        }
      };

      fetchTracks();
    } else if (playlists.length === 0) {
      setTracks([]);
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
        const artistIds = new Set();
        tracks.forEach((t) => {
          const track = t.track;
          if (!track || !track.artists) return;
          track.artists.forEach((a) => artistIds.add(a.id));
        });
        const ids = Array.from(artistIds).filter(Boolean);
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
          (r.data.artists || []).forEach((a) => {
            artistMap.set(a.id, a);
          });
        });

        const genreMap = new Map();

        tracks.forEach((t) => {
          const track = t.track;
          if (!track) return;
          const trackId = track.id;
          track.artists.forEach((a) => {
            const artist = artistMap.get(a.id);
            if (!artist || !artist.genres || artist.genres.length === 0) {
              const g = "Unbekannt";
              if (!genreMap.has(g))
                genreMap.set(g, { image: artist?.images?.[0]?.url || null, tracks: new Map() });
              genreMap.get(g).tracks.set(trackId, track);
            } else {
              artist.genres.forEach((g) => {
                if (!genreMap.has(g))
                  genreMap.set(g, { image: artist.images?.[0]?.url || null, tracks: new Map() });
                genreMap.get(g).tracks.set(trackId, track);
              });
            }
          });
        });

        const groups = Array.from(genreMap.entries()).map(([genre, data]) => ({
          genre,
          image: data.image,
          tracks: Array.from(data.tracks.values()),
        }));

        groups.sort((a, b) => b.tracks.length - a.tracks.length);

        setGenreGroups(groups);
      } catch (err) {
        console.error(err);
      }
    };

    buildGenres();
  }, [token, tracks]);

  // Accordion state
  const [openPlaylists, setOpenPlaylists] = useState(false);
  const [openGenres, setOpenGenres] = useState(false);

  return (
    <div style={{ padding: "20px" }}>
      {!token ? (
        <LoginButton />
      ) : (
        <div>
          <div className="accordion">
            <button className="accordion-toggle" onClick={() => setOpenPlaylists((s) => !s)}>
              Deine Playlists ({playlists.length}) {openPlaylists ? "▾" : "▸"}
            </button>
            {openPlaylists && (
              <div className="accordion-panel">
                <PlaylistList playlists={playlists} />
              </div>
            )}
          </div>

          <div className="accordion" style={{ marginTop: 16 }}>
            <button className="accordion-toggle" onClick={() => setOpenGenres((s) => !s)}>
              Genres ({genreGroups.length}) {openGenres ? "▾" : "▸"}
            </button>
            {openGenres && (
              <div className="accordion-panel">
                <GenreGrid groups={genreGroups} onSelect={(g) => setSelectedGenre(g)} />
              </div>
            )}
          </div>

          {selectedGenre && (
            <div style={{ marginTop: 16 }}>
              <GenreTracks group={selectedGenre} onClose={() => setSelectedGenre(null)} />
            </div>
          )}

          {/* rohe Songs ausgeblendet nach Wunsch */}
        </div>
      )}
    </div>
  );
}
