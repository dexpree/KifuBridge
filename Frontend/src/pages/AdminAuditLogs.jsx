import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import "../styles/AdminAuditLogs.css";

const DATE_RANGES = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
];

// Single source of truth for how an action maps to a category + colour,
// used for both the badge and the filter chips/stat strip.
const categorize = (action = "") => {
  if (action.includes("Approve")) return { key: "approve", label: "Approvals", color: "success" };
  if (action.includes("Block")) return { key: "block", label: "Blocks", color: "danger" };
  if (action.includes("Delete")) return { key: "delete", label: "Deletions", color: "dark" };
  if (action.includes("Update")) return { key: "update", label: "Updates", color: "primary" };
  if (action.includes("Assign")) return { key: "assign", label: "Assignments", color: "warning" };
  return { key: "other", label: "Other", color: "secondary" };
};

function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/audit-logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  // Categories present in the data, with live counts — so the chip
  // strip doubles as a quick "what's been happening" summary.
  const categoryCounts = useMemo(() => {
    const counts = {};
    logs.forEach((log) => {
      const { key } = categorize(log.action);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [logs]);

  const categoryChips = useMemo(() => {
    const seen = new Map();
    logs.forEach((log) => {
      const cat = categorize(log.action);
      if (!seen.has(cat.key)) seen.set(cat.key, cat);
    });
    return Array.from(seen.values());
  }, [logs]);

  const dateCutoff = (range) => {
    const now = new Date();
    if (range === "today") {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    if (range === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (range === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return null;
  };

  const filteredLogs = useMemo(() => {
    const cutoff = dateCutoff(dateRange);
    const q = search.toLowerCase();

    const filtered = logs.filter((log) => {
      const matchesSearch =
        !q ||
        log.action?.toLowerCase().includes(q) ||
        log.description?.toLowerCase().includes(q) ||
        log.admin?.name?.toLowerCase().includes(q) ||
        log.targetUser?.name?.toLowerCase().includes(q);

      const matchesCategory =
        activeCategory === "all" || categorize(log.action).key === activeCategory;

      const matchesDate = !cutoff || new Date(log.createdAt) >= cutoff;

      return matchesSearch && matchesCategory && matchesDate;
    });

    return [...filtered].sort((a, b) => {
      const dA = new Date(a.createdAt).getTime();
      const dB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dB - dA : dA - dB;
    });
  }, [logs, search, activeCategory, dateRange, sortOrder]);

  // ---- CSV export of exactly what's currently visible ----
  const exportCsv = () => {
    const header = ["Action", "Admin", "Target", "Description", "Date"];
    const escape = (val = "") => `"${String(val).replace(/"/g, '""')}"`;

    const rows = filteredLogs.map((log) => [
      log.action,
      log.admin?.name || "",
      log.targetUser?.name || "",
      log.description || "",
      new Date(log.createdAt).toLocaleString(),
    ]);

    const csv = [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <PageHeader title="Audit Logs" subtitle="Track every administrative action." />

      <div className="aud-page">
        {/* ---- stat strip: category counts at a glance ---- */}
        {categoryChips.length > 0 && (
          <div className="aud-stats">
            {categoryChips.map((cat) => (
              <div key={cat.key} className={`aud-stat aud-stat--${cat.color}`}>
                <span className="aud-stat-count">{categoryCounts[cat.key]}</span>
                <span className="aud-stat-label">{cat.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ---- toolbar ---- */}
        <div className="aud-toolbar">
          <input
            type="text"
            className="aud-search"
            placeholder="Search action, admin, target, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="aud-chip-row">
            <button
              className={`aud-chip ${activeCategory === "all" ? "is-active" : ""}`}
              onClick={() => setActiveCategory("all")}
            >
              All
            </button>
            {categoryChips.map((cat) => (
              <button
                key={cat.key}
                className={`aud-chip aud-chip--${cat.color} ${
                  activeCategory === cat.key ? "is-active" : ""
                }`}
                onClick={() => setActiveCategory(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="aud-toolbar-right">
            <select
              className="aud-date-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              {DATE_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            <div className="aud-sort">
              <button
                className={`aud-sort-btn ${sortOrder === "newest" ? "is-active" : ""}`}
                onClick={() => setSortOrder("newest")}
              >
                <i className="bi bi-sort-down"></i> Newest
              </button>
              <button
                className={`aud-sort-btn ${sortOrder === "oldest" ? "is-active" : ""}`}
                onClick={() => setSortOrder("oldest")}
              >
                <i className="bi bi-sort-up"></i> Oldest
              </button>
            </div>

            <button className="aud-export-btn" onClick={exportCsv} disabled={filteredLogs.length === 0}>
              <i className="bi bi-download"></i> Export CSV
            </button>
          </div>
        </div>

        {/* ---- ledger table ---- */}
        <div className="aud-table-card">
          <div className="aud-table-wrap">
            <table className="aud-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Admin</th>
                  <th>Target</th>
                  <th>Description</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="aud-empty-cell">
                      No logs found.
                    </td>
                  </tr>
                )}

                {filteredLogs.map((log) => {
                  const cat = categorize(log.action);
                  return (
                    <tr key={log._id}>
                      <td>
                        <span className={`aud-badge aud-badge--${cat.color}`}>{log.action}</span>
                      </td>
                      <td>
                        <span className="aud-admin">
                          <i className="bi bi-person-badge"></i> {log.admin?.name || "—"}
                        </span>
                      </td>
                      <td>{log.targetUser?.name || "—"}</td>
                      <td className="aud-description">{log.description}</td>
                      <td className="aud-date">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AdminAuditLogs;