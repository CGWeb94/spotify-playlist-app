const CLIENT_ID = "DEIN_SPOTIFY_CLIENT_ID";
const REDIRECT_URI = "http://localhost:5173/callback"; // Später auf Vercel/Render anpassen
const SCOPES = [
  "user-library-read",
  "playlist-read-private",
  "playlist-modify-public",
  "playlist-modify-private"
].join("%20");

export default function LoginButton() {
  const handleLogin = () => {
    const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${CLIENT_ID}&scope=${SCOPES}&redirect_uri=${REDIRECT_URI}`;
    window.location.href = authUrl;
  };

  return <button onClick={handleLogin}>Login with Spotify</button>;
}
