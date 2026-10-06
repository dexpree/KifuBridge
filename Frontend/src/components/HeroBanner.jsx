import "../styles/heroBanner.css";

const ROLE_COPY = {
  donor: {
    eyebrow: "Donor",
    message:
      "Your generosity keeps the bridge open. Every donation you post finds its way to someone who needs it.",
  },
  ngo: {
    eyebrow: "NGO Partner",
    message:
      "Every request you post connects to a donor ready to help. Thanks for the work you do.",
  },
  volunteer: {
    eyebrow: "Volunteer",
    message:
      "Deliveries move because you show up. Thanks for keeping the bridge running.",
  },
  admin: {
    eyebrow: "Admin",
    message: "Here's what's happening across KifuBridge today.",
  },
};

const DEFAULT_COPY = {
  eyebrow: "KifuBridge",
  message:
    "Welcome back to KifuBridge. Together we're making donations easier and more impactful.",
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function HeartIcon() {
  return (
    <svg
      className="hero-heart"
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20.5s-7.5-4.6-10-9.3C.4 7.8 2.3 4.5 5.7 4c2-.3 3.9.7 6.3 3 2.4-2.3 4.3-3.3 6.3-3 3.4.5 5.3 3.8 3.7 7.2-2.5 4.7-10 9.3-10 9.3Z" />
    </svg>
  );
}

function HeroBanner({ name, role }) {
  const greeting = getGreeting();
  const copy = ROLE_COPY[role] || DEFAULT_COPY;

  return (
    <div className="hero-banner mb-4">
      <div className="hero-banner-glow" aria-hidden="true" />

      <div className="hero-banner-body">
        <span className="hero-eyebrow">{copy.eyebrow}</span>

        <h2 className="hero-greeting">
          {greeting}
          {name ? `, ${name}` : ""}
        </h2>

        <p className="hero-message">{copy.message}</p>
      </div>

      <div className="hero-icon" aria-hidden="true">
        <span className="hero-icon-ring" />
        <HeartIcon />
      </div>
    </div>
  );
}

export default HeroBanner;