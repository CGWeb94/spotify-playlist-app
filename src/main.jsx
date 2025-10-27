// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import PasswordGate from "./components/PasswordGate";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./App.css";

const root = createRoot(document.getElementById("root"));
root.render(
  <PasswordGate>
    <App />
  </PasswordGate>
);
