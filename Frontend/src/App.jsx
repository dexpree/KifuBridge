import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import DonorDashboard from "./pages/DonorDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import CreateDonation from "./pages/CreateDonation";
import MyDonations from "./pages/MyDonations";
import NgoDashboard from "./pages/NgoDashboard";
import AvailableDonations from "./pages/AvailableDonations";
import DonationRequests from "./pages/DonationRequests";
import MyRequests from "./pages/MyRequests";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import MyDeliveries from "./pages/MyDeliveries";
import AvailableDeliveries from "./pages/AvailableDeliveries";
import Home from "./pages/home";
import UserManagement from "./pages/UserManagement";
import AdminDonations from "./pages/AdminDonations";
import DonorRegister from "./pages/DonorRegister";
import NgoRegister from "./pages/NgoRegister";
import VolunteerRegister from "./pages/VolunteerRegister";
import Profile from "./pages/Profile";
import AdminUserProfile from "./pages/AdminUserProfile";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import AdminComplaints from "./pages/AdminComplaints";
import CreateComplaint from "./pages/CreateComplaint";
import MyComplaints from "./pages/MyComplaints";
import CreateCampaign from "./pages/CreateCampaign";
import MyCampaigns from "./pages/MyCampaigns";
import CampaignApproval from "./pages/CampaignApproval";
import CampaignFeed from "./pages/CampaignFeed";
import CampaignDetails from "./pages/CampaignDetails";
import CampaignDonation from "./pages/CampaignDonation";
import CampaignImpact from "./pages/CampaignImpact";
import CampaignManagement from "./pages/CampaignManagement";
import CampaignDonations from "./pages/CampaignDonations";
import EditCampaign from "./pages/EditCampaign";
import AdminCampaignDetails from "./pages/AdminCampaignDetails";
import AdminCampaigns from "./pages/AdminCampaigns";
import PublicNGOs from "./pages/PublicNGOs";
import NGOProfile from "./pages/NGOProfile";
import NGOPublicProfile from "./pages/NGOPublicProfile";
import NGOPublicView from "./pages/NGOPublicView";
import DirectNGODonation from "./pages/DirectNGODonation";
import NGOPaymentDetails from "./pages/NGOPaymentDetails";
import AdminPaymentVerification from "./pages/AdminPaymentVerification";
import MakePayment from "./pages/MakePayment";
import AssignVolunteer from "./pages/AssignVolunteer";

import AdminPayments from "./pages/AdminPayments";
import NGOPayments from "./pages/NGOPayments";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ====================================================
            PUBLIC
        ==================================================== */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/register/donor"
          element={<DonorRegister />}
        />

        <Route
          path="/register/ngo"
          element={<NgoRegister />}
        />

        <Route
          path="/register/volunteer"
          element={<VolunteerRegister />}
        />
<Route
  path="/assign-volunteer/:requestId"
  element={<AssignVolunteer />}
/>
        {/* ====================================================
            PUBLIC NGO PAGES
        ==================================================== */}

        <Route
          path="/ngos"
          element={<PublicNGOs />}
        />

        <Route
          path="/ngos/:id"
          element={<NGOProfile />}
        />

        <Route
          path="/ngo-public-view"
          element={<NGOPublicView />}
        />

        <Route
          path="/ngo-public-view/:id"
          element={<NGOPublicView />}
        />

        {/* ====================================================
            DONATION PAGES
        ==================================================== */}

        <Route
          path="/create-donation"
          element={<CreateDonation />}
        />

        <Route
          path="/create-donation/:ngoId"
          element={<CreateDonation />}
        />

        <Route
          path="/direct-donation/:id"
          element={<DirectNGODonation />}
        />

        {/* ====================================================
            PAYMENT PAGES
        ==================================================== */}

        <Route
          path="/make-payment/:id"
          element={<MakePayment />}
        />

        <Route
          path="/ngo-payment-details"
          element={<NGOPaymentDetails />}
        />

        {/* ====================================================
            NGO PAYMENT HISTORY
        ==================================================== */}

        <Route
          path="/ngo/payments"
          element={
            <ProtectedRoute role="ngo">
              <NGOPayments />
            </ProtectedRoute>
          }
        />

        {/* ====================================================
            PROFILE
        ==================================================== */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* ====================================================
            DONOR
        ==================================================== */}

        <Route
          path="/donor"
          element={
            <ProtectedRoute role="donor">
              <DonorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-donations"
          element={
            <ProtectedRoute role="donor">
              <MyDonations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/campaigns"
          element={
            <ProtectedRoute role="donor">
              <CampaignFeed />
            </ProtectedRoute>
          }
        />

        <Route
          path="/campaigns/:id"
          element={
            <ProtectedRoute role={["donor", "ngo", "admin"]}>
              <CampaignDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/campaigns/:id/donate"
          element={
            <ProtectedRoute role="donor">
              <CampaignDonation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/donation-requests"
          element={
            <ProtectedRoute role="donor">
              <DonationRequests />
            </ProtectedRoute>
          }
        />

        {/* ====================================================
            NGO
        ==================================================== */}

        <Route
          path="/ngo"
          element={
            <ProtectedRoute role="ngo">
              <NgoDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ngo/payments"
          element={
            <ProtectedRoute role="ngo">
              <NGOPayments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ngo/public-profile"
          element={
            <ProtectedRoute allowedRoles={["ngo"]}>
              <NGOPublicProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ngo/create-campaign"
          element={
            <ProtectedRoute role="ngo">
              <CreateCampaign />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ngo/my-campaigns"
          element={
            <ProtectedRoute role="ngo">
              <MyCampaigns />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ngo/campaigns/:id"
          element={
            <ProtectedRoute role="ngo">
              <CampaignManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ngo/campaigns/:id/edit"
          element={<EditCampaign />}
        />

        <Route
          path="/ngo/campaigns/:id/donations"
          element={
            <ProtectedRoute role="ngo">
              <CampaignDonations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/campaigns/:id/impact"
          element={
            <ProtectedRoute role="ngo">
              <CampaignImpact />
            </ProtectedRoute>
          }
        />

        <Route
          path="/available-donations"
          element={
            <ProtectedRoute role="ngo">
              <AvailableDonations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-requests"
          element={
            <ProtectedRoute role="ngo">
              <MyRequests />
            </ProtectedRoute>
          }
        />

        {/* ====================================================
            ADMIN
        ==================================================== */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute role="admin">
              <UserManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users/:id"
          element={
            <ProtectedRoute role="admin">
              <AdminUserProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/donations"
          element={
            <ProtectedRoute role="admin">
              <AdminDonations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/payment-verification"
          element={
            <ProtectedRoute role="admin">
              <AdminPaymentVerification />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute role="admin">
              <AdminAuditLogs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/complaints"
          element={
            <ProtectedRoute role="admin">
              <AdminComplaints />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/campaign-approval"
          element={
            <ProtectedRoute role="admin">
              <CampaignApproval />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/campaigns"
          element={
            <ProtectedRoute role="admin">
              <AdminCampaigns />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/campaigns/:id"
          element={
            <ProtectedRoute role="admin">
              <AdminCampaignDetails />
            </ProtectedRoute>
          }
        />
<Route
  path="/admin/payments"
  element={
    <ProtectedRoute role="admin">
      <AdminPayments />
    </ProtectedRoute>
  }
/>
        {/* ====================================================
            COMPLAINTS
        ==================================================== */}

        <Route
          path="/create-complaint"
          element={
            <ProtectedRoute>
              <CreateComplaint />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-complaints"
          element={
            <ProtectedRoute>
              <MyComplaints />
            </ProtectedRoute>
          }
        />

        {/* ====================================================
            VOLUNTEER
        ==================================================== */}

        <Route
          path="/volunteer-dashboard"
          element={
            <ProtectedRoute role="volunteer">
              <VolunteerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-deliveries"
          element={
            <ProtectedRoute role="volunteer">
              <MyDeliveries />
            </ProtectedRoute>
          }
        />

        <Route
          path="/available-deliveries"
          element={
            <ProtectedRoute role="volunteer">
              <AvailableDeliveries />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;