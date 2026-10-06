import { useEffect, useMemo, useRef } from "react";
import "../styles/splash.css";

const WELCOME_WORDS = [
  { word: "Welcome", lang: "English" },
  { word: "Karibu", lang: "Swahili" },
  { word: "Namaste", lang: "Hindi" },
  { word: "Sawubona", lang: "Zulu" },
  { word: "Bienvenue", lang: "French" },
  { word: "Kaabo", lang: "Yoruba" },
  { word: "Marhaba", lang: "Arabic" },
];

const PILLARS = ["Give Items", "Fund Campaigns", "Trusted NGOs"];

function getGreeting() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return { text: "Good Morning", icon: "sun" };
  }

  if (hour >= 12 && hour < 17) {
    return { text: "Good Afternoon", icon: "sun" };
  }

  if (hour >= 17 && hour < 21) {
    return { text: "Good Evening", icon: "moon" };
  }

  return { text: "Good Night", icon: "moon" };
}

function GreetingIcon({ type }) {
  if (type === "sun") {
    return (
      <svg className="greeting-icon icon-sun" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="4.5" />

        <line x1="12" y1="1.5" x2="12" y2="4.5" />
        <line x1="12" y1="19.5" x2="12" y2="22.5" />

        <line x1="1.5" y1="12" x2="4.5" y2="12" />
        <line x1="19.5" y1="12" x2="22.5" y2="12" />

        <line x1="4.6" y1="4.6" x2="6.7" y2="6.7" />
        <line x1="17.3" y1="17.3" x2="19.4" y2="19.4" />

        <line x1="4.6" y1="19.4" x2="6.7" y2="17.3" />
        <line x1="17.3" y1="6.7" x2="19.4" y2="4.6" />
      </svg>
    );
  }

  return (
    <svg className="greeting-icon icon-moon" viewBox="0 0 24 24">
      <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a6.5 6.5 0 0 0 11 11z" />
    </svg>
  );
}

function SplashScreen({ onFinish }) {
  const sceneRef = useRef(null);

  const greeting = useMemo(() => getGreeting(), []);

  const welcome = useMemo(
    () =>
      WELCOME_WORDS[
        Math.floor(Math.random() * WELCOME_WORDS.length)
      ],
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 6000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  /* -----------------------------------------------------------
     Cursor depth movement
  ----------------------------------------------------------- */

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const touch = window.matchMedia("(pointer: coarse)").matches;

    if (reducedMotion || touch || !sceneRef.current) {
      return;
    }

    const node = sceneRef.current;

    const move = (event) => {
      const x =
        (event.clientX / window.innerWidth - 0.5) * 2;

      const y =
        (event.clientY / window.innerHeight - 0.5) * 2;

      node.style.setProperty("--mouse-x", x.toFixed(3));
      node.style.setProperty("--mouse-y", y.toFixed(3));
    };

    window.addEventListener("pointermove", move);

    return () => {
      window.removeEventListener("pointermove", move);
    };
  }, []);

  const title = "KifuBridge";

  return (
    <div
      className="splash-screen cinematic-splash"
      ref={sceneRef}
    >
      {/* -------------------------------------------------------
          BACKGROUND
      ------------------------------------------------------- */}

      <div className="deep-space" />

      <div className="aurora-field">
        <span className="aurora-orb aurora-one" />
        <span className="aurora-orb aurora-two" />
        <span className="aurora-orb aurora-three" />
      </div>

      <div className="stars">
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className={`tiny-star star-${i + 1}`}
          />
        ))}
      </div>

      {/* -------------------------------------------------------
          PARTICLE CONNECTIONS
      ------------------------------------------------------- */}

      <div className="connection-field">
        <span className="connection-particle cp1" />
        <span className="connection-particle cp2" />
        <span className="connection-particle cp3" />
        <span className="connection-particle cp4" />
        <span className="connection-particle cp5" />
        <span className="connection-particle cp6" />
        <span className="connection-particle cp7" />
        <span className="connection-particle cp8" />
        <span className="connection-particle cp9" />
        <span className="connection-particle cp10" />
        <span className="connection-particle cp11" />
        <span className="connection-particle cp12" />
      </div>

      {/* -------------------------------------------------------
          MAIN SCENE
      ------------------------------------------------------- */}

      <div className="splash-content">

        <div className="scene-label donor-label">
          <span className="label-dot" />
          DONORS
        </div>

        <div className="scene-label ngo-label">
          NGOs
          <span className="label-dot" />
        </div>

        {/* -----------------------------------------------------
            BRIDGE
        ----------------------------------------------------- */}

        <div className="bridge-stage">

          <div className="bridge-glow" />

          <svg
            className="bridge-svg cinematic-bridge"
            viewBox="0 0 500 230"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>

              <linearGradient
                id="bridgeGold"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop
                  offset="0%"
                  stopColor="#b87524"
                />

                <stop
                  offset="50%"
                  stopColor="#ffe2a5"
                />

                <stop
                  offset="100%"
                  stopColor="#b87524"
                />
              </linearGradient>

              <radialGradient
                id="bridgeLight"
                cx="50%"
                cy="50%"
              >
                <stop
                  offset="0%"
                  stopColor="#fff8e7"
                />

                <stop
                  offset="35%"
                  stopColor="#f6c875"
                />

                <stop
                  offset="100%"
                  stopColor="#f6c875"
                  stopOpacity="0"
                />
              </radialGradient>

              <filter id="softGlow">
                <feGaussianBlur
                  stdDeviation="5"
                />
              </filter>

            </defs>

            {/* distant ground */}

            <path
              className="mountain-back"
              d="
                M0 190
                Q80 145 150 180
                T300 175
                T500 165
                L500 230
                L0 230 Z
              "
            />

            {/* giant light */}

            <circle
              className="bridge-sun"
              cx="250"
              cy="170"
              r="45"
              fill="url(#bridgeLight)"
            />

            {/* bridge glow */}

            <path
              className="bridge-glow-line"
              d="M55 180 L445 180"
            />

            {/* main deck */}

            <path
              className="bridge-draw deck-main"
              pathLength="1"
              d="M55 170 L445 170"
            />

            {/* pylons */}

            <path
              className="bridge-draw bridge-pylon"
              pathLength="1"
              d="M105 170 L105 55"
            />

            <path
              className="bridge-draw bridge-pylon"
              pathLength="1"
              d="M395 170 L395 55"
            />

            {/* upper towers */}

            <path
              className="bridge-draw tower-top"
              pathLength="1"
              d="M75 55 L135 55"
            />

            <path
              className="bridge-draw tower-top"
              pathLength="1"
              d="M365 55 L425 55"
            />

            {/* main cable */}

            <path
              className="bridge-draw main-cable"
              pathLength="1"
              d="
                M105 55
                Q250 125 395 55
              "
            />

            {/* secondary cable */}

            <path
              className="bridge-draw secondary-cable"
              pathLength="1"
              d="
                M105 55
                Q250 95 395 55
              "
            />

            {/* hangers */}

            <line
              className="hanger h1"
              x1="145"
              y1="170"
              x2="145"
              y2="83"
            />

            <line
              className="hanger h2"
              x1="190"
              y1="170"
              x2="190"
              y2="103"
            />

            <line
              className="hanger h3"
              x1="235"
              y1="170"
              x2="235"
              y2="113"
            />

            <line
              className="hanger h4"
              x1="265"
              y1="170"
              x2="265"
              y2="113"
            />

            <line
              className="hanger h5"
              x1="310"
              y1="170"
              x2="310"
              y2="103"
            />

            <line
              className="hanger h6"
              x1="355"
              y1="170"
              x2="355"
              y2="83"
            />

            {/* bridge lamps */}

            <circle
              className="bridge-lamp bl1"
              cx="145"
              cy="83"
              r="3"
            />

            <circle
              className="bridge-lamp bl2"
              cx="190"
              cy="103"
              r="3"
            />

            <circle
              className="bridge-lamp bl3"
              cx="235"
              cy="113"
              r="3"
            />

            <circle
              className="bridge-lamp bl4"
              cx="265"
              cy="113"
              r="3"
            />

            <circle
              className="bridge-lamp bl5"
              cx="310"
              cy="103"
              r="3"
            />

            <circle
              className="bridge-lamp bl6"
              cx="355"
              cy="83"
              r="3"
            />

            {/* left incoming light */}

            <circle
              className="crossing-light crossing-left"
              r="5"
            >
              <animateMotion
                path="M20,170 L480,170"
                begin="2.55s"
                dur="1.5s"
                fill="freeze"
              />
            </circle>

            {/* right incoming light */}

            <circle
              className="crossing-light crossing-right"
              r="4"
            >
              <animateMotion
                path="M480,170 L20,170"
                begin="2.8s"
                dur="1.5s"
                fill="freeze"
              />
            </circle>

          </svg>

          {/* impact / connection pulse */}

          <div className="connection-pulse" />

        </div>

        {/* -----------------------------------------------------
            GREETING
        ----------------------------------------------------- */}

        <p className="splash-greeting">
          <GreetingIcon type={greeting.icon} />
          {greeting.text}
        </p>

        {/* -----------------------------------------------------
            LOGO
        ----------------------------------------------------- */}

        <h1 className="logo-title cinematic-title">
          {title.split("").map((letter, i) => (
            <span
              key={i}
              style={{
                animationDelay: `${3.35 + i * 0.07}s`,
              }}
            >
              {letter}
            </span>
          ))}
        </h1>

        {/* -----------------------------------------------------
            TAGLINE
        ----------------------------------------------------- */}

        <p className="logo-subtitle cinematic-subtitle">

          <span className="welcome-word">
            {welcome.word}
          </span>

          <span className="subtitle-divider">
            •
          </span>

          Where Donors Meet
          <br />

          NGOs in Need

        </p>

        {/* -----------------------------------------------------
            FEATURE PILLARS — the three things this platform
            actually does, not a decorative tagline
        ----------------------------------------------------- */}

        <div className="pillars-line">
          {PILLARS.map((pillar, i) => (
            <span className="pillar-item" key={pillar}>
              <span
                className="pillar"
                style={{
                  animationDelay: `${4.7 + i * 0.15}s`,
                }}
              >
                {pillar}
              </span>

              {i < PILLARS.length - 1 && (
                <span
                  className="pillar-dot"
                  style={{
                    animationDelay: `${4.85 + i * 0.15}s`,
                  }}
                />
              )}
            </span>
          ))}
        </div>

      </div>

      {/* cinematic vignette */}

      <div className="cinematic-vignette" />

      {/* loading progress */}

      <div className="splash-progress">
        <div className="progress-line" />
      </div>

    </div>
  );
}

export default SplashScreen;