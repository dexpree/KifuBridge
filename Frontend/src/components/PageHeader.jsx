/**
 * PageHeader
 *
 * Props:
 *  - title        string, required
 *  - subtitle     string, optional
 *  - icon         node, optional
 *  - badge        string, optional
 *  - onBack       function, optional
 *  - backLabel    string, optional
 *  - actions      node, optional
 */

function PageHeader({
  title,
  subtitle,
  icon,
  badge,
  onBack,
  backLabel = "Back",
  actions,
}) {
  return (
    <div className="page-header">

      {/* =====================================================
          BACK BUTTON
      ===================================================== */}

      {onBack && (
        <button
          type="button"
          className="back-btn"
          onClick={onBack}
        >
          <span className="back-btn-icon">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M10 3L5 8L10 13"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <span>{backLabel}</span>
        </button>
      )}

      {/* =====================================================
          HEADER CONTENT
      ===================================================== */}

      <div className="page-header-content">

        {/* ICON */}

        {icon && (
          <div className="page-header-icon-wrap">
            <div className="page-header-icon">
              {icon}
            </div>
          </div>
        )}

        {/* TITLE AREA */}

        <div className="page-header-main">

          <div className="page-header-title-row">

            <span className="page-header-accent" />

            <h2 className="page-header-title">
              {title}
            </h2>

            {badge && (
              <span className="page-header-badge">
                <span className="page-header-badge-dot" />
                {badge}
              </span>
            )}

          </div>

          {subtitle && (
            <p className="page-header-subtitle">
              {subtitle}
            </p>
          )}

        </div>

        {/* ACTIONS */}

        {actions && (
          <div className="page-header-actions">
            {actions}
          </div>
        )}

      </div>

      {/* =====================================================
          DECORATIVE GOLD LINE
      ===================================================== */}

      <div className="page-header-line">
        <span />
      </div>

    </div>
  );
}

export default PageHeader;