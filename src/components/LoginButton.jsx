// src/components/LoginButton.jsx
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const SCOPES = import.meta.env.VITE_SPOTIFY_SCOPES.replace(/ /g, "%20");

export default function LoginButton() {
  const handleLogin = () => {
    const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${CLIENT_ID}&scope=${SCOPES}&redirect_uri=${REDIRECT_URI}`;
    window.location.href = authUrl;
  };

  return <button onClick={handleLogin}>Login with Spotify</button>;
}
