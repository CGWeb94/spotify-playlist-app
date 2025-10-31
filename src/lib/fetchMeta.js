import axios from "axios";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function chunkedGet(urls, token, { concurrency = 2, onRetry = null } = {}) {
  const results = [];
  let i = 0;
  const worker = async () => {
    while (i < urls.length) {
      const idx = i++;
      const u = urls[idx];
      let attempt = 0;
      while (attempt < 4) {
        attempt++;
        try {
          const res = await axios.get(u, { headers: { Authorization: `Bearer ${token}` } });
          results[idx] = { ok: true, data: res.data };
          break;
        } catch (err) {
          const status = err?.response?.status;
          if (status === 429) {
            const ra = parseInt(err?.response?.headers?.["retry-after"] || "1", 10) || 1;
            if (typeof onRetry === "function") onRetry(ra);
            await sleep((ra + 0.5) * 1000);
            continue;
          }
          await sleep(150 * attempt);
          if (attempt >= 4) results[idx] = { ok: false, err };
        }
      }
      await sleep(80);
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function fetchPlaylistTracksForIds(token, playlistIds = [], { cacheKey = "plTracks_v1" } = {}) {
  if (!token || !playlistIds.length) return {};
  let cache = {};
  try { cache = JSON.parse(sessionStorage.getItem(cacheKey) || "{}"); } catch (e) { cache = {}; }
  const toFetch = playlistIds.filter((id) => !cache[id]);

  // build urls for each playlist (we fetch first 100 tracks only to keep latency low)
  const urls = toFetch.map((id) => `https://api.spotify.com/v1/playlists/${id}/tracks?limit=100`);

  const res = await chunkedGet(urls, token, { concurrency: 2 });
  res.forEach((r, idx) => {
    const pid = toFetch[idx];
    if (r?.ok) {
      cache[pid] = r.data.items || [];
    } else {
      // mark as failed empty to avoid repeated immediate retries
      cache[pid] = cache[pid] || [];
    }
  });

  try { sessionStorage.setItem(cacheKey, JSON.stringify(cache)); } catch (e) { /* ignore */ }
  // return mapping id -> items (may be empty arrays)
  const out = {};
  playlistIds.forEach((id) => { out[id] = cache[id] || []; });
  return out;
}

export async function fetchArtistsByIds(token, artistIds = [], { cacheKey = "artistMeta_v1" } = {}) {
  if (!token || !artistIds.length) return {};
  let cache = {};
  try { cache = JSON.parse(sessionStorage.getItem(cacheKey) || "{}"); } catch (e) { cache = {}; }

  const toFetch = artistIds.filter((id) => !cache[id]);
  const chunkSize = 50;
  const urls = [];
  for (let i = 0; i < toFetch.length; i += chunkSize) {
    urls.push(`https://api.spotify.com/v1/artists?ids=${toFetch.slice(i, i + chunkSize).join(",")}`);
  }
  const res = await chunkedGet(urls, token, { concurrency: 2 });
  res.forEach((r) => {
    if (r?.ok && r.data && Array.isArray(r.data.artists)) {
      r.data.artists.forEach((a) => { if (a && a.id) cache[a.id] = a; });
    }
  });

  try { sessionStorage.setItem(cacheKey, JSON.stringify(cache)); } catch (e) {}
  const out = {};
  artistIds.forEach((id) => { out[id] = cache[id] || null; });
  return out;
}