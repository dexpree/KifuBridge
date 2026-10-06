import { Link } from "react-router-dom";

function QuickActionCard({
  title,
  description,
  icon,
  color,
  link,
  button,
}) {
  return (
    <div className="col-lg-4 mb-4">

      <div className="quick-card">

        <div
          className={`quick-icon ${color}`}
        >
          <i className={icon}></i>
        </div>

        <h5 className="mt-4">
          {title}
        </h5>

        <p className="text-muted">
          {description}
        </p>

        <Link
          to={link}
          className="btn btn-dark"
        >
          {button}
        </Link>

      </div>

    </div>
  );
}

export default QuickActionCard;