import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/home-hero.css";

/* ==========================================================
   ICONS — thin-line SVGs, currentColor, matching the navbar
   and brand mark instead of OS-dependent emoji.
========================================================== */

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function GiftIcon(props) {
  return (
    <svg {...iconProps} {...props}>
      <rect x="3" y="9" width="18" height="11" rx="1.2" />
      <line x1="3" y1="13.5" x2="21" y2="13.5" />
      <line x1="12" y1="9" x2="12" y2="20" />
      <path d="M12 9C9 9 6.8 7.3 6.8 5.6A2.1 2.1 0 0 1 12 5a2.1 2.1 0 0 1 5.2.6C17.2 7.3 15 9 12 9Z" />
    </svg>
  );
}

function BuildingIcon(props) {
  return (
    <svg {...iconProps} {...props}>
      <polygon points="12 3 21 8.5 3 8.5" />
      <line x1="4" y1="20" x2="20" y2="20" />
      <line x1="4" y1="8.5" x2="4" y2="20" />
      <line x1="20" y1="8.5" x2="20" y2="20" />
      <line x1="8" y1="8.5" x2="8" y2="20" />
      <line x1="12" y1="8.5" x2="12" y2="20" />
      <line x1="16" y1="8.5" x2="16" y2="20" />
    </svg>
  );
}

function PersonIcon(props) {
  return (
    <svg {...iconProps} {...props}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5" />
    </svg>
  );
}

function PinIcon(props) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}

function BoxIcon(props) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
      <path d="M3 8l9 5 9-5" />
      <line x1="12" y1="13" x2="12" y2="21" />
    </svg>
  );
}

function ShieldIcon(props) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M12 3l7 3v6c0 5-3.2 7.8-7 9-3.8-1.2-7-4-7-9V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function LinkIcon(props) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M9 15a4 4 0 0 1 0-6l3-3a4 4 0 0 1 6 6l-1 1" />
      <path d="M15 9a4 4 0 0 1 0 6l-3 3a4 4 0 0 1-6-6l1-1" />
    </svg>
  );
}

function LockIcon(props) {
  return (
    <svg {...iconProps} {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function HeartIcon(props) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M12 20.5s-7.5-4.6-10-9.3C.4 7.8 2.3 4.5 5.7 4c2-.3 3.9.7 6.3 3 2.4-2.3 4.3-3.3 6.3-3 3.4.5 5.3 3.8 3.7 7.2-2.5 4.7-10 9.3-10 9.3Z" />
    </svg>
  );
}

function ArrowRightIcon(props) {
  return (
    <svg {...iconProps} {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </svg>
  );
}

/* ==========================================================
   DATA — the same donor/NGO/volunteer icons are reused in
   both the network visual and the stats bar, so the two
   sections visibly refer to the same three groups instead
   of using unrelated iconography.
========================================================== */

const STATS = [
  { Icon: GiftIcon, target: 1200, label: "Donations Made", format: (n) => `${(n / 1000).toFixed(1)}k+` },
  { Icon: BuildingIcon, target: 80, label: "NGOs Registered", format: (n) => `${Math.round(n)}+` },
  { Icon: PersonIcon, target: 350, label: "Active Volunteers", format: (n) => `${Math.round(n)}+` },
  { Icon: PinIcon, target: 25, label: "Cities Reached", format: (n) => `${Math.round(n)}+` },
];

const FEATURES = [
  { Icon: BoxIcon, tone: "icon-gold", title: "Easy Donations", body: "Donate food, clothes, books and more in just a few clicks." },
  { Icon: ShieldIcon, tone: "icon-teal", title: "Trusted NGOs", body: "We verify NGOs to ensure your donation reaches the right hands." },
  { Icon: LinkIcon, tone: "icon-violet", title: "Volunteer Network", body: "Join our volunteer community and make an impact." },
  { Icon: LockIcon, tone: "icon-amber", title: "Safe & Secure", body: "Transparent process with real-time updates and tracking." },
];

/* ==========================================================
   THE ROUTE — signature section. The brand mark is a bridge
   and the sidebar's tagline is "Donation Route", but nothing
   on the site ever shows what that route is. This does: the
   real path a donation takes, drawn as the same suspension
   cable used in the divider below the hero, with checkpoints
   that pop in as the cable draws itself on scroll.
========================================================== */

/* x/y are percentages of the track box. The cable's SVG path
   (in HomeHero's render below) is built to pass exactly through
   these same five points via a Catmull-Rom spline, so the pins
   are guaranteed to sit on the line at any screen width instead
   of two independently-guessed shapes drifting apart. */
const ROUTE_STOPS = [
  { Icon: GiftIcon, x: 4, y: 30, title: "Donor gives", body: "List an item or fund a need in under a minute." },
  { Icon: ShieldIcon, x: 27, y: 78, title: "We verify", body: "Every NGO on KifuBridge is checked before it can receive." },
  { Icon: BuildingIcon, x: 50, y: 22, title: "NGO is matched", body: "Routed to the NGO with the closest, clearest need." },
  { Icon: PersonIcon, x: 73, y: 78, title: "Volunteer carries it", body: "A nearby volunteer picks up and hand-delivers it." },
  { Icon: HeartIcon, x: 96, y: 30, title: "Impact delivered", body: "You get a real-time update the moment it lands." },
];

/* Cable path built through the exact ROUTE_STOPS points above via
   Catmull-Rom → cubic Bézier conversion, in a 500×100 coordinate
   space (5:1, matched by --route-track's aspect-ratio in CSS so
   the curve never stretches unevenly). */
const ROUTE_CABLE_D =
  "M20,30 C39.167,38 96.667,79.333 135,78 " +
  "C173.333,76.667 211.667,22 250,22 " +
  "C288.333,22 326.667,76.667 365,78 " +
  "C403.333,79.333 460.833,38 480,30";

/* ==========================================================
   COUNT-UP — animates the stats bar numbers once it scrolls
   into view. Respects prefers-reduced-motion.
========================================================== */

function useCountUp(targets, trigger) {
  const [values, setValues] = useState(() => targets.map(() => 0));

  useEffect(() => {
    if (!trigger) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      setValues(targets);
      return;
    }

    const duration = 1200;
    const start = performance.now();
    let frame;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValues(targets.map((t) => t * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return values;
}

/* ==========================================================
   IN-VIEW — generic scroll trigger, reused by the route
   section below (and mirrors the pattern already used for
   the stats bar, so the codebase stays consistent).
========================================================== */

function useInView(threshold = 0.35) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}

function HomeHero() {
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const counts = useCountUp(
    STATS.map((s) => s.target),
    statsVisible
  );

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [routeRef, routeVisible] = useInView(0.3);

  return (
    <section className="hero">
      <div className="hero-glow" />
      <div className="hero-star hs1" />
      <div className="hero-star hs2" />
      <div className="hero-star hs3" />
      <div className="hero-star hs4" />

      <div className="hero-container">
        {/* Left — copy */}
        <div className="hero-content">
          <span className="hero-badge hero-anim" style={{ animationDelay: "0s" }}>
            <span className="hero-badge-dot" />
            Together, We Can Make a Difference
          </span>

          <h1 className="hero-title hero-anim" style={{ animationDelay: "0.12s" }}>
            Donate Today,
            <br />
            <span className="hero-title-accent">Change Tomorrow</span>
          </h1>

          <p className="hero-description hero-anim" style={{ animationDelay: "0.24s" }}>
            KifuBridge connects generous donors, trusted NGOs and dedicated
            volunteers through one secure platform for transparent and
            efficient donations.
          </p>

          <div className="hero-buttons hero-anim" style={{ animationDelay: "0.36s" }}>
            <Link to="/register" className="btn btn-warning btn-lg">
              Get Started
              <ArrowRightIcon className="btn-arrow" />
            </Link>
            <Link to="/login" className="btn btn-outline-light btn-lg">
              Login
            </Link>
          </div>
        </div>

        {/* Right — CSS-animated network visual, no image */}
        <div className="hero-visual hero-anim" style={{ animationDelay: "0.42s" }}>
          <div className="network">
            <div className="network-line line-a" />
            <div className="network-line line-b" />
            <div className="network-line line-c" />

            <span className="network-dot dot-a" />
            <span className="network-dot dot-b" />
            <span className="network-dot dot-c" />

            <div className="network-node node-donor">
              <GiftIcon className="node-icon" />
              <p>Donors</p>
            </div>
            <div className="network-node node-ngo">
              <BuildingIcon className="node-icon" />
              <p>NGOs</p>
            </div>
            <div className="network-node node-volunteer">
              <PersonIcon className="node-icon" />
              <p>Volunteers</p>
            </div>

            <div className="network-core">
              <HeartIcon />
            </div>
          </div>
        </div>
      </div>

      {/* Bridge-cable divider — the one visual callback to the
          actual bridge drawn on the splash screen and navbar,
          so this page reads as the same product. */}
      <div className="hero-divider" aria-hidden="true">
        <svg viewBox="0 0 1000 40" preserveAspectRatio="none">
          <path d="M0,8 Q500,38 1000,8" className="hero-divider-cable" />
          <line x1="180" y1="8" x2="180" y2="30" className="hero-divider-hanger" />
          <line x1="360" y1="20" x2="360" y2="34" className="hero-divider-hanger" />
          <line x1="640" y1="20" x2="640" y2="34" className="hero-divider-hanger" />
          <line x1="820" y1="8" x2="820" y2="30" className="hero-divider-hanger" />
        </svg>
      </div>

      {/* THE ROUTE — signature section. Same cable, now carrying
          the actual journey a donation takes, checkpoint by
          checkpoint. Draws in on scroll; each pin lifts and
          reveals its caption on hover or keyboard focus. */}
      <div className="route">
        <span className="route-eyebrow">The Route</span>
        <h2 className="route-title">Every donation crosses the same bridge</h2>
        <p className="route-sub">
          From the moment you give to the moment it lands, five checkpoints
          and full visibility the whole way.
        </p>

        <div
          className={`route-track${routeVisible ? " in-view" : ""}`}
          ref={routeRef}
        >
          <svg
            className="route-cable"
            viewBox="0 0 500 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              className="route-cable-path"
              d={ROUTE_CABLE_D}
              pathLength="100"
            />
          </svg>

          {ROUTE_STOPS.map((stop, i) => (
            <div
              className="route-stop"
              key={stop.title}
              style={{
                "--x": `${stop.x}%`,
                "--y": `${stop.y}%`,
                animationDelay: `${0.5 + i * 0.15}s`,
              }}
            >
              <div className="route-card">
                <h4>{stop.title}</h4>
                <p>{stop.body}</p>
              </div>
              <button className="route-pin" type="button">
                <stop.Icon className="route-pin-icon" />
              </button>
              <span className="route-index">0{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live ticker — small pulsing-dot pill above the stats bar.
          Replaces the old impact-pulse card (which sat on top of
          the network graphic and covered the Donors node). Gives
          the page a "live" feeling without re-explaining the
          donation journey that The Route section already covers. */}
      <div className="live-ticker-wrap">
        <div className="live-ticker">
          <span className="live-ticker-dot" />
          <span className="live-ticker-text">
            <strong>3 donations</strong> made in the last hour
          </span>
        </div>
      </div>

      {/* Stats bar — horizontal, icon led, counts up on scroll */}
      <div className="stats-bar" ref={statsRef}>
        {STATS.map(({ Icon, target, label, format }, i) => (
          <div className="stat-pill" key={label}>
            <span className="stat-icon">
              <Icon />
            </span>
            <div>
              <h2>{format(counts[i] ?? 0)}</h2>
              <p>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Feature grid */}
      <div className="feature-grid">
        {FEATURES.map(({ Icon, tone, title, body }) => (
          <div className="feature-card" key={title}>
            <span className={`feature-icon ${tone}`}>
              <Icon />
            </span>
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default HomeHero;