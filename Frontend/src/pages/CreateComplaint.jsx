import { useEffect, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import "../styles/CreateComplaint.css";

const CATEGORIES = ["Volunteer", "NGO", "Donor", "Donation", "Platform"];
const PRIORITIES = [
  { value: "Low", hint: "Can wait" },
  { value: "Medium", hint: "Needs attention" },
  { value: "High", hint: "Urgent" },
];

function CreateComplaint() {
  const [users, setUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    againstUser: "",
    title: "",
    description: "",
    category: "Volunteer",
    priority: "Medium",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/users/reportable", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await API.post("/complaints", form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Complaint submitted successfully.");
      setForm({
        againstUser: "",
        title: "",
        description: "",
        category: "Volunteer",
        priority: "Medium",
      });
    } catch (error) {
      alert(error.response?.data?.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Raise Complaint" subtitle="Report any issue to the administrator." />

      <div className="cc-page">
        <form className="cc-card" onSubmit={handleSubmit}>
          <div className="cc-card-eyebrow">
            <span>New Case</span>
            <span className="cc-refno">
              PRIORITY: {form.priority.toUpperCase()}
            </span>
          </div>

          {/* ---- Subject ---- */}
          <div className="cc-section">
            <label className="cc-label" htmlFor="cc-against">
              Complaint Against
            </label>
            <select
              id="cc-against"
              className="cc-select"
              value={form.againstUser}
              onChange={(e) => setForm({ ...form, againstUser: e.target.value })}
            >
              <option value="">Select user…</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>

          {/* ---- Category ---- */}
          <div className="cc-section">
            <label className="cc-label">Category</label>
            <div className="cc-chip-row">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  className={`cc-chip ${form.category === cat ? "is-active" : ""}`}
                  onClick={() => setForm({ ...form, category: cat })}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* ---- Priority ---- */}
          <div className="cc-section">
            <label className="cc-label">Priority</label>
            <div className="cc-priority-row">
              {PRIORITIES.map((p) => (
                <button
                  type="button"
                  key={p.value}
                  className={`cc-priority cc-priority--${p.value.toLowerCase()} ${
                    form.priority === p.value ? "is-active" : ""
                  }`}
                  onClick={() => setForm({ ...form, priority: p.value })}
                >
                  <span className="cc-priority-dot" />
                  <span className="cc-priority-label">{p.value}</span>
                  <span className="cc-priority-hint">{p.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ---- Details ---- */}
          <div className="cc-section">
            <label className="cc-label" htmlFor="cc-title">
              Title
            </label>
            <input
              id="cc-title"
              className="cc-input"
              placeholder="Short summary of the issue"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="cc-section">
            <label className="cc-label" htmlFor="cc-description">
              Description
            </label>
            <textarea
              id="cc-description"
              className="cc-textarea"
              rows="5"
              placeholder="Describe what happened, when, and any relevant details…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="cc-footer">
            <span className="cc-footer-note">
              Reports are reviewed by an administrator. False reports may result in account action.
            </span>
            <button className="cc-submit" type="submit" disabled={submitting}>
              {submitting ? "Filing…" : "File Complaint"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default CreateComplaint;