import { Link } from "react-router-dom";
import "../styles/register.css";

function Register() {
  return (
    <div className="register-page">

      {/* =====================================================
          AMBIENT BACKGROUND
      ===================================================== */}

      <div className="register-bg">

        <div className="register-orb register-orb-one"></div>
        <div className="register-orb register-orb-two"></div>
        <div className="register-orb register-orb-three"></div>

        <div className="register-stars">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>

      </div>


      <div className="register-shell">

        {/* ===================================================
            LEFT SIDE
        =================================================== */}

        <section className="register-visual">

          {/* Decorative glow */}

          <div className="register-visual-glow"></div>


          {/* Floating particles */}

          <div className="register-particles">

            <span className="particle particle-one"></span>
            <span className="particle particle-two"></span>
            <span className="particle particle-three"></span>
            <span className="particle particle-four"></span>
            <span className="particle particle-five"></span>
            <span className="particle particle-six"></span>

          </div>


          {/* =================================================
              BRAND
          ================================================= */}

          <div className="register-brand">

            <span className="register-brand-mark">
              K
            </span>

            <span className="register-brand-name">
              KifuBridge
            </span>

          </div>


          {/* =================================================
              MAIN MESSAGE
          ================================================= */}

          <div className="register-visual-content">

            <span className="register-eyebrow">
              COMMUNITY • CONNECTION • IMPACT
            </span>


            <h1>

              Welcome to
              <br />

              <span>
                KifuBridge.
              </span>

            </h1>


            <p>

              Every donation creates a connection.
              Every connection can become a bridge
              toward someone who needs help.

            </p>


            {/* =================================================
                FLOATING MESSAGE
            ================================================= */}

            <div className="register-floating-message">

              <span className="floating-message-icon">
                🤝
              </span>

              <div>

                <strong>
                  Together, we can help more.
                </strong>

                <span>
                  One contribution at a time.
                </span>

              </div>

            </div>


            {/* =================================================
                ROLE ROW
            ================================================= */}

            <div className="register-role-row">

              <div className="register-role">

                <span className="register-role-icon">
                  ❤️
                </span>

                <span>
                  Donors
                </span>

              </div>


              <div className="register-role">

                <span className="register-role-icon">
                  🏢
                </span>

                <span>
                  NGOs
                </span>

              </div>


              <div className="register-role">

                <span className="register-role-icon">
                  🚚
                </span>

                <span>
                  Volunteers
                </span>

              </div>

            </div>

          </div>


          {/* =================================================
              BOTTOM MESSAGE
          ================================================= */}

          <div className="register-bottom-message">

            <span className="register-bottom-line"></span>

            <span>
              Your help may become someone's hope.
            </span>

          </div>

        </section>


        {/* ===================================================
            RIGHT SIDE
        =================================================== */}

        <section className="register-form-side">

          <div className="register-card">

            {/* Card glow */}

            <div className="register-card-glow"></div>


            {/* =================================================
                BACK TO HOME
            ================================================= */}

            <Link
              to="/"
              className="register-card-back"
            >

              <span className="register-card-back-icon">
                ←
              </span>

              <span>
                Back to Home
              </span>

            </Link>


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="register-card-header">

              <span className="register-mini-label">
                GET STARTED
              </span>

              <h2>
                Join KifuBridge
              </h2>

              <p>
                Choose how you would like to make a difference.
              </p>

            </div>


            {/* =================================================
                REGISTRATION OPTIONS
            ================================================= */}

            <div className="register-options">


              {/* =================================================
                  DONOR
              ================================================= */}

              <Link
                to="/register/donor"
                className="register-option register-option-donor"
              >

                <div className="register-option-icon">
                  ❤️
                </div>


                <div className="register-option-content">

                  <div className="register-option-title">

                    <span>
                      Register as Donor
                    </span>

                    <span className="register-option-arrow">
                      →
                    </span>

                  </div>


                  <p>
                    Give items, resources and support
                    to communities that need them.
                  </p>

                </div>


                <span className="register-option-line"></span>

              </Link>


              {/* =================================================
                  NGO
              ================================================= */}

              <Link
                to="/register/ngo"
                className="register-option register-option-ngo"
              >

                <div className="register-option-icon">
                  🏢
                </div>


                <div className="register-option-content">

                  <div className="register-option-title">

                    <span>
                      Register as NGO
                    </span>

                    <span className="register-option-arrow">
                      →
                    </span>

                  </div>


                  <p>
                    Connect your organization with
                    donors, volunteers and resources.
                  </p>

                </div>


                <span className="register-option-line"></span>

              </Link>


              {/* =================================================
                  VOLUNTEER
              ================================================= */}

              <Link
                to="/register/volunteer"
                className="register-option register-option-volunteer"
              >

                <div className="register-option-icon">
                  🚚
                </div>


                <div className="register-option-content">

                  <div className="register-option-title">

                    <span>
                      Register as Volunteer
                    </span>

                    <span className="register-option-arrow">
                      →
                    </span>

                  </div>


                  <p>
                    Help move donations and support
                    the people behind every contribution.
                  </p>

                </div>


                <span className="register-option-line"></span>

              </Link>

            </div>


            {/* =================================================
                LOGIN
            ================================================= */}

            <div className="register-footer">

              <span>
                Already have an account?
              </span>

              <Link to="/login">
                Login
              </Link>

            </div>


            {/* =================================================
                SECURITY
            ================================================= */}

            <div className="register-security">

              <span className="register-security-icon">
                🔒
              </span>

              <span>
                Your information is securely protected.
              </span>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}

export default Register;