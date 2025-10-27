// src/App.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import LoginButton from "./components/LoginButton";
import PlaylistList from "./components/PlaylistList";
import GenreGrid from "./components/GenreGrid";
import GenreTracks from "./components/GenreTracks";
import YearGrid from "./components/YearGrid";
import Sidebar from "./components/Sidebar";
import "./App.css";

export default function App() {
  const [token, setToken] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [genreGroups, setGenreGroups] = useState([]); // { genre, image, tracks: [] }
  const [selectedGenre, setSelectedGenre] = useState(null);

  const [addedYearGroups, setAddedYearGroups] = useState([]);
  const [releasedYearGroups, setReleasedYearGroups] = useState([]);
  const [selectedYearGroup, setSelectedYearGroup] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // New: loading / progress state
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 }); // for playlists / artists

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
      setLoading(true);
      setLoadingMessage("Lade Tracks aus Playlists...");
      setProgress({ current: 0, total: playlists.length });

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
        // update playlist progress
        setProgress((p) => ({ ...p, current: p.current + 1 }));
        return items;
      };

      const fetchTracks = async () => {
        try {
          // parallel starten, aber Fortschritt wird nach Abschluss jeder Playlist aktualisiert
          const promises = playlists.map((pl) => fetchAllForPlaylist(pl.id));
          const allResults = await Promise.all(promises);
          const flattened = allResults.flat();
          setTracks(flattened);
          setLoadingMessage("Tracks geladen — erzeuge Genre-/Jahr‑Gruppen...");
          // keep loading on until genre/year groups are built
        } catch (err) {
          console.error(err);
          setLoading(false);
          setLoadingMessage("");
        }
      };

      fetchTracks();
    } else if (playlists.length === 0) {
      setTracks([]);
      setLoading(false);
      setLoadingMessage("");
      setProgress({ current: 0, total: 0 });
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
        setLoading(true);
        setLoadingMessage("Hole Künstlerdaten und gruppiere nach Genre...");
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

        // show artist progress
        setProgress({ current: 0, total: chunks.length });

        // fetch artist chunks sequentially to allow progress updates (avoids burst & gives UX feedback)
        const artistMap = new Map();
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          try {
            const res = await axios.get(`https://api.spotify.com/v1/artists?ids=${chunk.join(",")}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            (res.data.artists || []).forEach((a) => artistMap.set(a.id, a));
          } catch (err) {
            console.error("Fehler beim Laden von Künstlern (Chunk)", err?.response?.data || err.message);
          }
          setProgress((p) => ({ ...p, current: p.current + 1 }));
        }

        const genreMap = new Map();

        tracks.forEach((t) => {
          const track = t.track;
          if (!track) return;
          const trackId = track.id;
          track.artists.forEach((a) => {
            const artist = artistMap.get(a.id);
            if (!artist || !artist.genres || artist.genres.length === 0) {
              const g = "Unbekannt";
              if (!genreMap.has(g)) genreMap.set(g, { image: artist?.images?.[0]?.url || null, tracks: new Map() });
              genreMap.get(g).tracks.set(trackId, track);
            } else {
              artist.genres.forEach((g) => {
                if (!genreMap.has(g)) genreMap.set(g, { image: artist.images?.[0]?.url || null, tracks: new Map() });
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
      } finally {
        setLoading(false);
        setLoadingMessage("");
        setProgress({ current: 0, total: 0 });
      }
    };

    buildGenres();
  }, [token, tracks]);

  // Year groups: added_at (when you added to playlists) & release year
  useEffect(() => {
    if (!tracks || tracks.length === 0) {
      setAddedYearGroups([]);
      setReleasedYearGroups([]);
      return;
    }
    const addedMap = new Map();
    const releasedMap = new Map();

    tracks.forEach((item) => {
      const track = item.track;
      if (!track) return;
      const id = track.id;
      // added_at -> year (some playlist items include added_at)
      const addedAt = item.added_at;
      if (addedAt) {
        const y = new Date(addedAt).getFullYear();
        if (!addedMap.has(y)) addedMap.set(y, { image: track.album?.images?.[0]?.url || null, tracks: new Map() });
        addedMap.get(y).tracks.set(id, track);
      }
      // release year
      const rel = track.album?.release_date || "";
      const relYear = rel.split("-")[0];
      if (relYear) {
        if (!releasedMap.has(relYear)) releasedMap.set(relYear, { image: track.album?.images?.[0]?.url || null, tracks: new Map() });
        releasedMap.get(relYear).tracks.set(id, track);
      }
    });

    const addedGroups = Array.from(addedMap.entries()).map(([year, data]) => ({
      title: String(year),
      image: data.image,
      tracks: Array.from(data.tracks.values()),
    })).sort((a,b) => b.title - a.title);

    const releasedGroups = Array.from(releasedMap.entries()).map(([year, data]) => ({
      title: String(year),
      image: data.image,
      tracks: Array.from(data.tracks.values()),
    })).sort((a,b) => b.title - a.title);

    setAddedYearGroups(addedGroups);
    setReleasedYearGroups(releasedGroups);
  }, [tracks]);

  // New: UI state for sidebar
  const [section, setSection] = useState("home"); // home | playlists | genres | added | released

  // smooth scroll handler for playlist tiles -> list item
  const scrollToPlaylist = (id) => {
    const el = document.getElementById(`pl-list-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // optional focus for accessibility
      el.focus?.();
    }
  };

  return (
    <div className="app-layout container-fluid">
      {!token ? (
        <div className="row justify-content-center mt-5">
          <div className="col-auto">
            <LoginButton />
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-auto">
            <Sidebar
              selected={section}
              onSelect={(s) => setSection(s)}
              counts={{
                playlists: playlists.length,
                genres: genreGroups.length,
                addedYears: addedYearGroups.length,
                releasedYears: releasedYearGroups.length,
              }}
            />
          </div>

          <main className="col content-area">
            {section === "home" && (
              <div>
                <h2>Willkommen</h2>
                <p>Wähle links eine Kategorie, um Inhalte anzuzeigen.</p>
              </div>
            )}

            {section === "playlists" && (
              <div>
                <h2>Deine Playlists</h2>
                <PlaylistList playlists={playlists} onTileClick={scrollToPlaylist} />
              </div>
            )}

            {section === "genres" && (
              <div>
                <h2>Playlists nach Genre</h2>
                <GenreGrid groups={genreGroups} onSelect={(g) => setSelectedGenre(g)} />
              </div>
            )}

            {section === "added" && (
              <div>
                <h2>Nach Jahr hinzugefügt</h2>
                <YearGrid groups={addedYearGroups} onSelect={(g) => setSelectedYearGroup(g)} />
              </div>
            )}

            {section === "released" && (
              <div>
                <h2>Nach Jahr erschienen</h2>
                <YearGrid groups={releasedYearGroups} onSelect={(g) => setSelectedYearGroup(g)} />
              </div>
            )}

            {selectedGenre && <div style={{ marginTop: 16 }}><GenreTracks group={selectedGenre} onClose={() => setSelectedGenre(null)} /></div>}
            {selectedYearGroup && <div style={{ marginTop: 16 }}><GenreTracks group={selectedYearGroup} onClose={() => setSelectedYearGroup(null)} /></div>}
          </main>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-box">
            <div className="spinner-border text-primary" role="status" style={{ width: 48, height: 48 }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <div style={{ fontWeight: 600 }}>{loadingMessage}</div>
              {progress.total > 0 && (
                <div style={{ width: 260, marginTop: 8 }}>
                  <div className="progress" style={{ height: 10 }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                      aria-valuenow={progress.current}
                      aria-valuemin="0"
                      aria-valuemax={progress.total}
                    />
                  </div>
                  <div style={{ fontSize: 12, marginTop: 6 }}>
                    {progress.current} / {progress.total}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
