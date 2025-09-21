// src/components/LoginButton.jsx
import React from "react";

export default function LoginButton() {
  // Env Variables aus Vite
  const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  const SCOPES = import.meta.env.VITE_SPOTIFY_SCOPES.replace(/ /g, "%20"); // Leerzeichen -> %20 für URL

  const handleLogin = () => {
    // Authorization Code Flow
    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${SCOPES}&redirect_uri=${REDIRECT_URI}`;
    window.location.href = authUrl; // Weiterleitung zu Spotify Login
  };

  return (
    <button
      onClick={handleLogin}
      style={{
        padding: "10px 20px",
        backgroundColor: "#1DB954",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      Login with Spotify
    </button>
  );
}
