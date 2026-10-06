function FeatureCards() {
  return (

    <div className="container mb-5">

      <div className="row g-4">

        <div className="col-md-4">

          <div className="feature-card">

            <i className="bi bi-box2-heart feature-icon text-primary"></i>

            <h4>Donor</h4>

            <p>
              Donate food, books,
              clothes and essentials.
            </p>

          </div>

        </div>

        <div className="col-md-4">

          <div className="feature-card">

            <i className="bi bi-building feature-icon text-success"></i>

            <h4>NGO</h4>

            <p>
              Request donations
              and help communities.
            </p>

          </div>

        </div>

        <div className="col-md-4">

          <div className="feature-card">

            <i className="bi bi-truck feature-icon text-warning"></i>

            <h4>Volunteer</h4>

            <p>
              Deliver donations
              safely to NGOs.
            </p>

          </div>

        </div>

      </div>

    </div>

  );
}

export default FeatureCards;