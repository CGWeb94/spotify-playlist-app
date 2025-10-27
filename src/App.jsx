// src/App.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import LoginButton from "./components/LoginButton";
import PlaylistList from "./components/PlaylistList";
import GenreGrid from "./components/GenreGrid";
import GenreTracks from "./components/GenreTracks";
import YearGrid from "./components/YearGrid";
import Sidebar from "./components/Sidebar";
import ArtistsGrid from "./components/ArtistsGrid";
import "./App.css";

export default function App() {
  // auth & data state (kept)
  const [token, setToken] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [genreGroups, setGenreGroups] = useState([]);
  const [artistGroups, setArtistGroups] = useState([]); // <-- neu
  const [addedYearGroups, setAddedYearGroups] = useState([]);
  const [releasedYearGroups, setReleasedYearGroups] = useState([]);

  // single selected detail (ensures only one list view visible)
  // { kind: "genre"|"year", source: "added"|"released"?, group: {...} } or null
  const [selectedDetail, setSelectedDetail] = useState(null);

  // lifted checkedMap for the active detail view so App can use it
  const [checkedMap, setCheckedMap] = useState({});

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // loading/progress state
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // UI / sidebar
  const [section, setSection] = useState("home"); // home | playlists | genres | added | released

  // modal state for create playlist
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createPublic, setCreatePublic] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState(null);

  // scroll progress for back-to-top
  const [scrollPct, setScrollPct] = useState(0);

  // --- auth, playlists, tracks, groups effects (kept same as before) ---
  // put here your existing effects for auth, playlists, tracks pagination, buildGenres, build years...
  // Auth -> token (unchanged)
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

  // Playlists
  useEffect(() => {
    if (!token) return;

    const loadPlaylists = async () => {
      try {
        const res = await axios.get("https://api.spotify.com/v1/me/playlists", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const items = res.data.items || [];

        // fetch total saved tracks (Lieblingssongs) to show as a virtual playlist
        let likedTotal = 0;
        try {
          const likedRes = await axios.get("https://api.spotify.com/v1/me/tracks?limit=1", {
            headers: { Authorization: `Bearer ${token}` },
          });
          likedTotal = likedRes.data.total || 0;
        } catch (e) {
          console.warn("Konnte Saved Tracks count nicht holen", e?.message || e);
        }

        const likedObj = {
          id: "liked",
          name: "Lieblingssongs",
          images: [], // optional: set an image url
          tracks: { total: likedTotal },
          isLiked: true,
        };

        // put liked playlist first so it appears in PlaylistList
        setPlaylists([likedObj, ...items]);
      } catch (err) {
        console.error(err);
      }
    };

    loadPlaylists();
  }, [token]);

  // Tracks (vollständige Pagination pro Playlist) — unterstützt jetzt auch "liked"
  useEffect(() => {
    if (!token || playlists.length === 0) {
      setTracks([]);
      return;
    }

    const fetchAllForPlaylist = async (playlistId, playlistName) => {
      // special case for saved tracks (liked)
      let url = playlistId === "liked"
        ? `https://api.spotify.com/v1/me/tracks?limit=100`
        : `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

      const items = [];
      try {
        while (url) {
          const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          // annotate each item with playlist meta so we know source
          const chunk = (res.data.items || []).map((it) => ({ ...it, _playlistName: playlistName, _playlistId: playlistId }));
          items.push(...chunk);
          url = res.data.next;
        }
      } catch (err) {
        console.error("Fehler beim Laden von Tracks für Playlist:", playlistId, err?.response?.data || err.message);
      }
      // update progress for UI
      setProgress((p) => ({ ...p, current: p.current + 1 }));
      return items;
    };

    const fetchTracks = async () => {
      try {
        setLoading(true);
        setLoadingMessage("Lade Tracks aus Playlists...");
        setProgress({ current: 0, total: playlists.length });

        const promises = playlists.map((pl) => fetchAllForPlaylist(pl.id, pl.name));
        const allResults = await Promise.all(promises);
        const flattened = allResults.flat();
        setTracks(flattened);
        // reset playlist progress so next phase starts from 0
        setProgress({ current: 0, total: 0 });
        setLoadingMessage("Tracks geladen — erzeuge Genre-/Jahr‑Gruppen...");
      } catch (err) {
        console.error(err);
        setLoading(false);
        setLoadingMessage("");
      }
    };

    fetchTracks();
  }, [token, playlists]);

  // Genre & Artists build (Artist-Fetch + Genre-Gruppierung + Artist-Gruppen)
  useEffect(() => {
    if (!token || tracks.length === 0) {
      setGenreGroups([]);
      setArtistGroups([]);
      return;
    }

    const buildGenresAndArtists = async () => {
      try {
        setLoading(true);
        setLoadingMessage("Hole Künstlerdaten und gruppiere nach Genre...");
        // collect unique artist ids
        const artistIds = new Set();
        tracks.forEach((item) => {
          const tr = item.track || item;
          if (!tr || !tr.artists) return;
          tr.artists.forEach((a) => artistIds.add(a.id));
        });
        const ids = Array.from(artistIds).filter(Boolean);

        // chunk ids (50 per request)
        const chunks = [];
        for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50));

        // reset progress counter for artist-chunks (important fix)
        setProgress({ current: 0, total: chunks.length || 1 });

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
          // increment progress (now starts at 0)
          setProgress((p) => ({ ...p, current: (p.current || 0) + 1 }));
        }

        // build genre groups (with sources) - same approach as before
        const genreMap = new Map();
        tracks.forEach((item) => {
          const tr = item.track || item;
          if (!tr) return;
          const trackId = tr.id;
          const playlistName = item._playlistName || "Unbekannt";
          (tr.artists || []).forEach((a) => {
            const artist = artistMap.get(a.id);
            const genres = (artist && artist.genres && artist.genres.length) ? artist.genres : ["Unbekannt"];
            genres.forEach((g) => {
              if (!genreMap.has(g)) genreMap.set(g, { image: artist?.images?.[0]?.url || null, tracks: new Map() });
              const entry = genreMap.get(g).tracks;
              if (!entry.has(trackId)) entry.set(trackId, { track: tr, sources: new Set([playlistName]) });
              else entry.get(trackId).sources.add(playlistName);
            });
          });
        });

        const groups = Array.from(genreMap.entries()).map(([genre, data]) => ({
          genre,
          image: data.image,
          tracks: Array.from(data.tracks.values()).map((v) => ({ ...v.track, sources: Array.from(v.sources) })),
        })).sort((a, b) => b.tracks.length - a.tracks.length);
        setGenreGroups(groups);

        // build artist groups: for each artist in artistMap, collect tracks where they appear
        const ag = [];
        for (const [aid, artist] of artistMap.entries()) {
          const artistTracks = [];
          tracks.forEach((item) => {
            const tr = item.track || item;
            if (!tr) return;
            const hasArtist = (tr.artists || []).some((a) => a.id === aid);
            if (hasArtist) {
              const playlistName = item._playlistName || "Unbekannt";
              // attach sources if not present
              const tcopy = { ...tr };
              tcopy.sources = tcopy.sources || [];
              if (!tcopy.sources.includes(playlistName)) tcopy.sources.push(playlistName);
              artistTracks.push(tcopy);
            }
          });
          if (artistTracks.length) {
            ag.push({ id: aid, name: artist.name, image: artist.images?.[0]?.url || null, tracks: artistTracks });
          }
        }
        // sort by number of tracks
        ag.sort((a, b) => b.tracks.length - a.tracks.length);
        setArtistGroups(ag);
      } catch (err) {
        console.error(err);
      } finally {
        // done
        setLoading(false);
        setLoadingMessage("");
        setProgress({ current: 0, total: 0 });
      }
    };

    buildGenresAndArtists();
  }, [token, tracks]);

  // Year groups: added_at (when you added to playlists) & release year — jetzt mit Quellen
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
      const playlistName = item._playlistName || "Unbekannt";

      // added_at -> year (some playlist items include added_at)
      const addedAt = item.added_at;
      if (addedAt) {
        const y = new Date(addedAt).getFullYear();
        if (!addedMap.has(y)) addedMap.set(y, { image: track.album?.images?.[0]?.url || null, tracks: new Map() });
        const mapEntry = addedMap.get(y).tracks;
        if (!mapEntry.has(id)) mapEntry.set(id, { track: track, sources: new Set([playlistName]) });
        else mapEntry.get(id).sources.add(playlistName);
      }

      // release year
      const rel = track.album?.release_date || "";
      const relYear = rel.split("-")[0];
      if (relYear) {
        if (!releasedMap.has(relYear)) releasedMap.set(relYear, { image: track.album?.images?.[0]?.url || null, tracks: new Map() });
        const mapEntry = releasedMap.get(relYear).tracks;
        if (!mapEntry.has(id)) mapEntry.set(id, { track: track, sources: new Set([playlistName]) });
        else mapEntry.get(id).sources.add(playlistName);
      }
    });

    const addedGroups = Array.from(addedMap.entries()).map(([year, data]) => ({
      title: String(year),
      image: data.image,
      tracks: Array.from(data.tracks.values()).map((v) => ({ ...v.track, sources: Array.from(v.sources) })),
    })).sort((a,b) => b.title - a.title);

    const releasedGroups = Array.from(releasedMap.entries()).map(([year, data]) => ({
      title: String(year),
      image: data.image,
      tracks: Array.from(data.tracks.values()).map((v) => ({ ...v.track, sources: Array.from(v.sources) })),
    })).sort((a,b) => b.title - a.title);

    setAddedYearGroups(addedGroups);
    setReleasedYearGroups(releasedGroups);
  }, [tracks]);

  // when sidebar section changes, close detail
  useEffect(() => {
    setSelectedDetail(null);
  }, [section]);

  // when opening a detail, initialize checkedMap and scroll to detail panel
  useEffect(() => {
    if (!selectedDetail) return;
    // initialize checkedMap from group's tracks
    const initial = {};
    const arr = selectedDetail.group?.tracks || [];
    arr.forEach((t) => {
      const id = t.id || (t.track && t.track.id);
      initial[id] = true;
    });
    setCheckedMap(initial);

    // scroll to detail panel
    setTimeout(() => {
      const el = document.getElementById("detail-panel");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, [selectedDetail]);

  // expose handlers to open details (only one visible at a time)
  const openGenreDetail = (group) => {
    setSection("genres");
    setSelectedDetail({ kind: "genre", group });
  };
  const openYearDetail = (source, group) => {
    // source = "added" | "released"
    setSection(source === "added" ? "added" : "released");
    setSelectedDetail({ kind: "year", source, group });
  };

  // scroll to playlist list element
  const scrollToPlaylist = (id) => {
    setSelectedDetail(null);
    const el = document.getElementById(`pl-list-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // create playlist flow
  const handleCreateClick = () => {
    setCreateName(selectedDetail?.group?.genre ? `${selectedDetail.group.genre}` : "Neue Playlist");
    setCreateDesc("");
    setCreatePublic(false);
    setShowCreateModal(true);
    setCreateResult(null);
  };

  const createPlaylistOnSpotify = async () => {
    if (!token || !selectedDetail) return;
    setCreating(true);
    setCreateResult(null);
    try {
      // get current user id
      const me = await axios.get("https://api.spotify.com/v1/me", { headers: { Authorization: `Bearer ${token}` } });
      const userId = me.data.id;

      // determine selected track URIs from checkedMap
      const tracksArr = selectedDetail.group.tracks || [];
      const uris = tracksArr
        .filter((t) => {
          const id = t.id || (t.track && t.track.id);
          return !!checkedMap[id];
        })
        .map((t) => `spotify:track:${t.id || (t.track && t.track.id)}`)
        .filter(Boolean);

      if (uris.length === 0) {
        setCreateResult({ ok: false, message: "Keine Songs ausgewählt." });
        setCreating(false);
        return;
      }

      // create playlist
      const plRes = await axios.post(
        `https://api.spotify.com/v1/users/${encodeURIComponent(userId)}/playlists`,
        { name: createName || "Neue Playlist", public: !!createPublic, description: createDesc || "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newPlaylistId = plRes.data.id;

      // add tracks in batches of 100
      for (let i = 0; i < uris.length; i += 100) {
        const chunk = uris.slice(i, i + 100);
        await axios.post(
          `https://api.spotify.com/v1/playlists/${newPlaylistId}/tracks`,
          { uris: chunk },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setCreateResult({ ok: true, message: `Playlist erstellt (${uris.length} Songs)` });
    } catch (err) {
      console.error("Create playlist error", err?.response?.data || err.message);
      setCreateResult({ ok: false, message: "Fehler beim Erstellen. Siehe Konsole." });
    } finally {
      setCreating(false);
    }
  };

  // scroll progress for back-to-top with border progress
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pos = window.scrollY;
      const pct = total > 0 ? Math.round((pos / total) * 100) : 0;
      setScrollPct(pct);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onBackToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // determine number of selected tracks for create button visibility
  const selectedCount = Object.values(checkedMap).filter(Boolean).length;

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
                <h2 style={{ color: "var(--text-main)" }}>Willkommen</h2>
                <p style={{ color: "var(--text-sub)" }}>Wähle links eine Kategorie, um Inhalte anzuzeigen.</p>
              </div>
            )}

            {section === "playlists" && (
              <div>
                <h2 style={{ color: "var(--text-main)" }}>Deine Playlists</h2>
                <PlaylistList playlists={playlists} onTileClick={openPlaylistDetail} />
              </div>
            )}

            {section === "genres" && (
              <div>
                <h2 style={{ color: "var(--text-main)" }}>Playlists nach Genre</h2>
                <GenreGrid groups={genreGroups} onSelect={(g) => openGenreDetail(g)} />
              </div>
            )}

            {section === "added" && (
              <div>
                <h2 style={{ color: "var(--text-main)" }}>Nach Jahr hinzugefügt</h2>
                <YearGrid groups={addedYearGroups} onSelect={(g) => openYearDetail("added", g)} />
              </div>
            )}

            {section === "released" && (
              <div>
                <h2 style={{ color: "var(--text-main)" }}>Nach Jahr erschienen</h2>
                <YearGrid groups={releasedYearGroups} onSelect={(g) => openYearDetail("released", g)} />
              </div>
            )}

            {section === "artists" && (
              <div>
                <h2 style={{ color: "var(--text-main)" }}>Künstler</h2>
                <ArtistsGrid groups={artistGroups} onSelect={(g) => openArtistDetail(g)} />
              </div>
            )}

            {/* Detail panel: only one visible at a time */}
            <div id="detail-panel" style={{ marginTop: 18 }}>
              {selectedDetail && (
                <GenreTracks
                  group={selectedDetail.group}
                  checkedMap={checkedMap}
                  setCheckedMap={setCheckedMap}
                  onClose={() => setSelectedDetail(null)}
                />
              )}
            </div>
          </main>
        </div>
      )}

      {/* floating create-playlist button (bottom-center) */}
      {selectedDetail && (
        <div className="floating-create">
          <button
            className="create-btn"
            onClick={handleCreateClick}
            disabled={selectedCount === 0}
            title={selectedCount === 0 ? "Keine Songs ausgewählt" : `Erstelle Playlist mit ${selectedCount} Songs`}
          >
            <i className="fa-solid fa-plus me-2"></i>
            Playlist erstellen ({selectedCount})
          </button>
        </div>
      )}

      {/* create modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h4>Playlist erstellen</h4>
            <p>{selectedCount} Songs werden hinzugefügt.</p>
            <label>
              Name
              <input value={createName} onChange={(e) => setCreateName(e.target.value)} />
            </label>
            <label>
              Beschreibung
              <input value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} />
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={createPublic} onChange={(e) => setCreatePublic(e.target.checked)} />
              Öffentlich
            </label>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn" onClick={() => setShowCreateModal(false)} disabled={creating}>Abbrechen</button>
              <button className="btn btn-primary" onClick={createPlaylistOnSpotify} disabled={creating}>
                {creating ? "Erstelle..." : "Erstellen"}
              </button>
            </div>

            {createResult && (
              <div style={{ marginTop: 10, color: createResult.ok ? "var(--spotify-green)" : "#f66" }}>
                {createResult.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* back to top circular with scroll progress (bottom-right) */}
      <button
        className="back-top"
        onClick={onBackToTop}
        title="Nach oben"
        style={{ ['--pct']: `${scrollPct}%` }}
      >
        <i className="fa-solid fa-arrow-up" />
      </button>

      {/* Loading overlay (kept) */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-box">
            <div className="spinner-border text-success" role="status" style={{ width: 48, height: 48 }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <div style={{ marginTop: 12, textAlign: "center", color: "var(--text-main)" }}>
              <div style={{ fontWeight: 600 }}>{loadingMessage}</div>
              {progress.total > 0 && (
                <div style={{ width: "100%", maxWidth: 420, marginTop: 8 }}>
                  <div className="progress" style={{ height: 10 }}>
                    <div
                      className="progress-bar bg-success"
                      role="progressbar"
                      style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                      aria-valuenow={progress.current}
                      aria-valuemin="0"
                      aria-valuemax={progress.total}
                    />
                  </div>
                  <div style={{ fontSize: 12, marginTop: 6, color: "var(--text-sub)" }}>
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
