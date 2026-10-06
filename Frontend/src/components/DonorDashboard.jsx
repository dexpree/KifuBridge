import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

function DonorDashboard() {
  return (
    <>
      <Navbar />

      <h1>Donor Dashboard</h1>

      <Link to="/create-donation">
        Create Donation
      </Link>

      <br />
      <br />

      <Link to="/my-donations">
        My Donations
      </Link>
    </>
  );
}

export default DonorDashboard;