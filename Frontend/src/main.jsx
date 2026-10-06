import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "leaflet/dist/leaflet.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/theme.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./styles/global.css";
import "./styles/dashboard.css";
import "./styles/quickaction.css";
import "./styles/backbutton.css";
import "./styles/pageheader.css";
import "aos/dist/aos.css";
import AOS from "aos";
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/700.css";
import "@fontsource/manrope/300.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";


AOS.init({
  duration: 1000,
  once: true,
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);