import { useState } from "react";

import SplashScreen from "../components/SplashScreen";
import Navbar from "../components/Navbar";
import HomeHero from "../components/HomeHero";
import TransitionWrapper from "../components/TransitionWrapper";
import "../styles/home-hero.css"
import "../styles/home.css";


const SPLASH_SESSION_KEY = "kb_splash_shown";

function Home() {
  const [loading, setLoading] = useState(
    () => sessionStorage.getItem(SPLASH_SESSION_KEY) !== "true"
  );

  const handleSplashFinish = () => {
    sessionStorage.setItem(SPLASH_SESSION_KEY, "true");
    setLoading(false);
  };

  if (loading) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

 return (
  <TransitionWrapper>
    <div className="home-page">


      <div className="home-content">
        <Navbar />
        <HomeHero />
      </div>

    </div>
  </TransitionWrapper>
);
}

export default Home;