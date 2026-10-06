function DashboardCard({ title, value, icon, color = "primary" }) {
  return (
    <div className="col-md-3 col-sm-6 mb-3">
      <div className={`stats-card stats-card--${color}`}>
        <div className="stats-card-icon">
          <i className={icon}></i>
        </div>
        <h2>{value}</h2>
        <p>{title}</p>
      </div>
    </div>
  );
}

export default DashboardCard;