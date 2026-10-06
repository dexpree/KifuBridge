import { useEffect, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";

import "../styles/AdminComplaints.css";

function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [reply, setReply] = useState({});

  useEffect(() => {
    fetchComplaints();
  }, []);

  // =========================================================
  // FETCH COMPLAINTS
  // =========================================================

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await API.get("/complaints", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setComplaints(
        Array.isArray(res.data)
          ? res.data
          : res.data.complaints || []
      );
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
    }
  };

  // =========================================================
  // SEND REPLY
  // =========================================================

  const sendReply = async (id) => {
    try {
      const token = localStorage.getItem("token");

      if (!reply[id]?.trim()) {
        alert("Please write a reply before sending.");
        return;
      }

      await API.put(
        `/complaints/${id}/reply`,
        {
          adminReply: reply[id],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Reply sent successfully.");

      setReply((prev) => ({
        ...prev,
        [id]: "",
      }));

      fetchComplaints();
    } catch (error) {
      console.error("Reply error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to send reply."
      );
    }
  };

  // =========================================================
  // RESOLVE COMPLAINT
  // =========================================================

  const resolveComplaint = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await API.put(
        `/complaints/${id}/resolve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Complaint resolved successfully.");

      fetchComplaints();
    } catch (error) {
      console.error("Resolve error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to resolve complaint."
      );
    }
  };

  // =========================================================
  // PRIORITY CLASS
  // =========================================================

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "high";

      case "medium":
        return "medium";

      case "low":
        return "low";

      default:
        return "low";
    }
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return "status-resolved";

      case "in progress":
        return "status-progress";

      case "pending":
        return "status-pending";

      default:
        return "status-pending";
    }
  };

  // =========================================================
  // LOADING / EMPTY
  // =========================================================

  return (
    <DashboardLayout>

      <PageHeader
        title="Complaint Management"
        subtitle="Review and resolve user complaints."
      />

      <div className="ac-page">

        <div className="ac-container">

          {complaints.length === 0 ? (

            <div className="ac-empty">

              <div className="ac-empty-icon">
                📭
              </div>

              <h3>
                No Complaints Found
              </h3>

              <p>
                There are currently no complaints to review.
              </p>

            </div>

          ) : (

            <div className="ac-complaint-grid">

              {complaints.map((complaint) => {

                const priorityClass =
                  getPriorityClass(
                    complaint.priority
                  );

                const statusClass =
                  getStatusClass(
                    complaint.status
                  );

                return (

                  <div
                    key={complaint._id}
                    className={`ac-complaint-card priority-${priorityClass}`}
                  >

                    <div className="ac-complaint-body">

                      {/* =================================================
                          HEADER
                      ================================================= */}

                      <div className="ac-complaint-header">

                        <div className="ac-complaint-title-wrapper">

                          <div className="ac-complaint-icon">
                            🚩
                          </div>

                          <h2 className="ac-complaint-title">
                            {complaint.title ||
                              "Untitled Complaint"}
                          </h2>

                        </div>

                        <span
                          className={`ac-badge priority-${priorityClass}`}
                        >
                          {complaint.priority ||
                            "Low"}
                        </span>

                      </div>


                      {/* =================================================
                          DESCRIPTION
                      ================================================= */}

                      <p className="ac-complaint-description">

                        {complaint.description ||
                          "No description provided."}

                      </p>


                      <div className="ac-divider"></div>


                      {/* =================================================
                          USER INFORMATION
                      ================================================= */}

                      <div className="ac-user-info">

                        {/* REPORTED BY */}

                        <div className="ac-user-row">

                          <div className="ac-user-icon">
                            👤
                          </div>

                          <div className="ac-user-content">

                            <span className="ac-user-label">
                              Reported By
                            </span>

                            <span className="ac-user-name">

                              {complaint.reportedBy?.name ||
                                "Unknown User"}

                            </span>

                          </div>

                        </div>


                        {/* AGAINST */}

                        <div className="ac-user-row">

                          <div className="ac-user-icon">
                            ⚠️
                          </div>

                          <div className="ac-user-content">

                            <span className="ac-user-label">
                              Against
                            </span>

                            <span className="ac-user-name">

                              {complaint.againstUser?.name ||
                                "Platform"}

                            </span>

                          </div>

                        </div>

                      </div>


                      {/* =================================================
                          COMPLAINT INFORMATION
                      ================================================= */}

                      <div className="ac-complaint-info">

                        {/* CATEGORY */}

                        <div className="ac-info-item">

                          <span className="ac-info-label">
                            Category
                          </span>

                          <span className="ac-info-value">

                            {complaint.category ||
                              "General"}

                          </span>

                        </div>


                        {/* STATUS */}

                        <div className="ac-info-item">

                          <span className="ac-info-label">
                            Status
                          </span>

                          <span
                            className={`ac-badge ${statusClass}`}
                          >
                            {complaint.status ||
                              "Pending"}
                          </span>

                        </div>

                      </div>


                      {/* =================================================
                          ADMIN REPLY
                      ================================================= */}

                      <div className="ac-reply-section">

                        <label className="ac-reply-label">
                          Admin Response
                        </label>

                        <textarea
                          className="ac-reply-textarea"
                          rows="3"
                          placeholder="Write a response to this complaint..."
                          value={
                            reply[complaint._id] ||
                            ""
                          }
                          onChange={(e) =>
                            setReply({
                              ...reply,
                              [complaint._id]:
                                e.target.value,
                            })
                          }
                        />


                        {/* =================================================
                            ACTION BUTTONS
                        ================================================= */}

                        <div className="ac-actions">

                          <button
                            type="button"
                            className="ac-action-button ac-reply-button"
                            onClick={() =>
                              sendReply(
                                complaint._id
                              )
                            }
                          >
                            💬 Reply
                          </button>


                          <button
                            type="button"
                            className="ac-action-button ac-resolve-button"
                            onClick={() =>
                              resolveComplaint(
                                complaint._id
                              )
                            }
                          >
                            ✓ Resolve
                          </button>

                        </div>

                      </div>

                    </div>

                  </div>

                );

              })}

            </div>

          )}

        </div>

      </div>

    </DashboardLayout>
  );
}

export default AdminComplaints;