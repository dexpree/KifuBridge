import { useEffect, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import "../styles/MyComplaints.css";

function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await API.get("/complaints/mine", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setComplaints(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  // Priority styling
  const getPriorityClass = (priority) => {
    switch (priority) {
      case "High":
        return "complaint-priority high";

      case "Medium":
        return "complaint-priority medium";

      case "Low":
        return "complaint-priority low";

      default:
        return "complaint-priority";
    }
  };

  // Status styling
  const getStatusClass = (status) => {
    switch (status) {
      case "Resolved":
        return "complaint-status resolved";

      case "In Progress":
        return "complaint-status progress";

      case "Pending":
        return "complaint-status pending";

      default:
        return "complaint-status";
    }
  };

  // Status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "Resolved":
        return "✓";

      case "In Progress":
        return "↻";

      case "Pending":
        return "○";

      default:
        return "•";
    }
  };

  return (
    <DashboardLayout>
      <div className="my-complaints-page">

        {/* =====================================================
            PAGE HEADER
        ====================================================== */}
        <div className="complaints-header-wrapper">
          <PageHeader
            title="My Complaints"
            subtitle="Track your submitted complaints and administrator responses."
          />

          {/* Complaint count */}
          {!loading && complaints.length > 0 && (
            <div className="complaint-count">
              <span className="count-number">
                {complaints.length}
              </span>

              <span className="count-label">
                {complaints.length === 1
                  ? "Complaint"
                  : "Complaints"}
              </span>
            </div>
          )}
        </div>

        {/* =====================================================
            LOADING STATE
        ====================================================== */}
        {loading && (
          <div className="complaints-loading">

            <div className="loading-spinner"></div>

            <h4>Loading your complaints...</h4>

            <p>
              Please wait while we retrieve your complaint history.
            </p>

          </div>
        )}

        {/* =====================================================
            EMPTY STATE
        ====================================================== */}
        {!loading && complaints.length === 0 && (
          <div className="complaints-empty">

            <div className="empty-illustration">

              <div className="empty-circle">

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
                  <line x1="8" y1="9" x2="16" y2="9" />
                  <line x1="8" y1="13" x2="13" y2="13" />
                </svg>

              </div>

              <span className="empty-dot dot-one"></span>
              <span className="empty-dot dot-two"></span>
              <span className="empty-dot dot-three"></span>

            </div>

            <div className="empty-content">

              <span className="empty-label">
                ALL CLEAR
              </span>

              <h2>
                No Complaints Yet
              </h2>

              <p>
                You haven't submitted any complaints.
                If you experience an issue, you can submit
                a complaint and track its progress here.
              </p>

              <div className="empty-info">

                <div className="empty-info-item">

                  <span className="info-icon">
                    01
                  </span>

                  <div>
                    <strong>Submit</strong>
                    <small>
                      Report an issue
                    </small>
                  </div>

                </div>

                <div className="empty-line"></div>

                <div className="empty-info-item">

                  <span className="info-icon">
                    02
                  </span>

                  <div>
                    <strong>Track</strong>
                    <small>
                      Follow its status
                    </small>
                  </div>

                </div>

                <div className="empty-line"></div>

                <div className="empty-info-item">

                  <span className="info-icon">
                    03
                  </span>

                  <div>
                    <strong>Resolve</strong>
                    <small>
                      Receive a response
                    </small>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* =====================================================
            COMPLAINT LIST
        ====================================================== */}
        {!loading && complaints.length > 0 && (
          <div className="complaints-container">

            <div className="complaints-list">

              {complaints.map((item, index) => (

                <article
                  className="complaint-card"
                  key={item._id}
                >

                  {/* Top accent */}
                  <div className="complaint-card-accent"></div>

                  {/* =================================================
                      CARD HEADER
                  ================================================== */}
                  <div className="complaint-card-header">

                    <div className="complaint-title-section">

                      <div className="complaint-number">
                        #{String(index + 1).padStart(2, "0")}
                      </div>

                      <div>

                        <h3>
                          {item.title}
                        </h3>

                        <span className="complaint-category">
                          {item.category || "General Complaint"}
                        </span>

                      </div>

                    </div>

                    <div
                      className={getStatusClass(item.status)}
                    >
                      <span className="status-icon">
                        {getStatusIcon(item.status)}
                      </span>

                      {item.status || "Pending"}
                    </div>

                  </div>

                  {/* =================================================
                      DESCRIPTION
                  ================================================== */}
                  <div className="complaint-description">

                    <span className="section-label">
                      DESCRIPTION
                    </span>

                    <p>
                      {item.description}
                    </p>

                  </div>

                  {/* =================================================
                      DETAILS
                  ================================================== */}
                  <div className="complaint-details">

                    <div className="detail-item">

                      <span className="detail-label">
                        AGAINST
                      </span>

                      <strong>
                        {item.againstUser?.name || "Platform"}
                      </strong>

                    </div>

                    <div className="detail-item">

                      <span className="detail-label">
                        CATEGORY
                      </span>

                      <strong>
                        {item.category || "General"}
                      </strong>

                    </div>

                    <div className="detail-item">

                      <span className="detail-label">
                        PRIORITY
                      </span>

                      <span
                        className={getPriorityClass(item.priority)}
                      >
                        {item.priority || "Low"}
                      </span>

                    </div>

                    <div className="detail-item">

                      <span className="detail-label">
                        STATUS
                      </span>

                      <strong>
                        {item.status || "Pending"}
                      </strong>

                    </div>

                  </div>

                  {/* =================================================
                      ADMIN REPLY
                  ================================================== */}
                  <div className="admin-reply">

                    <div className="reply-header">

                      <div className="reply-icon">

                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.5 9.5 0 0 1-4-.9L3 21l1.8-4.5A8.3 8.3 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" />
                        </svg>

                      </div>

                      <div>

                        <span className="section-label">
                          ADMINISTRATOR
                        </span>

                        <h4>
                          Response
                        </h4>

                      </div>

                    </div>

                    <div className="reply-content">

                      {item.adminReply ? (
                        <p>
                          {item.adminReply}
                        </p>
                      ) : (
                        <div className="waiting-reply">

                          <span className="waiting-dot"></span>

                          <span>
                            Waiting for administrator response.
                          </span>

                        </div>
                      )}

                    </div>

                  </div>

                </article>

              ))}

            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default MyComplaints;