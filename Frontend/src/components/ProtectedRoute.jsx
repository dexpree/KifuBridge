import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, role }) {

  const token = localStorage.getItem("token");

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (role) {

    if (Array.isArray(role)) {

      if (!role.includes(user.role)) {
        return <Navigate to="/" replace />;
      }

    } else {

      if (user.role !== role) {
        return <Navigate to="/" replace />;
      }

    }

  }

  return children;

}

export default ProtectedRoute;