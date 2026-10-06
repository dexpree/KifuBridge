import { useNavigate } from "react-router-dom";

function BackButton() {

  const navigate = useNavigate();

  return (

    <button
      className="btn btn-light shadow-sm back-btn mb-4"
      onClick={() => navigate(-1)}
    >

      <i className="bi bi-arrow-left me-2"></i>

      Back

    </button>

  );

}

export default BackButton;