import { useEffect, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import BackButton from "../components/BackButton";

function AvailableDeliveries() {
  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await API.get(
        "/requests/volunteer-deliveries",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDeliveries(res.data);

    } catch (error) {
      console.log(error);
    }
  };

  const acceptDelivery = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await API.put(
        `/requests/${id}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Delivery accepted successfully!");

      fetchDeliveries();

    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message);
    }
  };

  return (
    <DashboardLayout>

      <BackButton />

      <PageHeader
        title="Available Deliveries"
        subtitle="Browse and accept delivery requests."
      />

      {deliveries.length === 0 ? (
        <div className="alert alert-info">
          No deliveries available.
        </div>
      ) : (
        <div className="row">

          {deliveries.map((delivery) => (

            <div
              className="col-lg-6 mb-4"
              key={delivery._id}
            >

              <div className="card shadow-lg border-0 h-100">

                <div className="card-body">

                  <h4 className="fw-bold text-primary mb-3">
                    📦 {delivery.donation?.itemName}
                  </h4>

                  <p>
                    <strong>Category:</strong>{" "}
                    {delivery.donation?.category}
                  </p>

                  <p>
                    <strong>Quantity:</strong>{" "}
                    {delivery.donation?.quantity}
                  </p>

                  <hr />

                  <h6 className="text-success fw-bold">
                    📍 Pickup From
                  </h6>

                  <p className="mb-1">
                    <strong>
                      {delivery.donation?.donor?.name}
                    </strong>
                  </p>

                  <p className="mb-1">
                    📞 {delivery.donation?.donor?.phone}
                  </p>

                  <p className="mb-0">
                    {delivery.donation?.donor?.address}
                  </p>

                  <p className="mb-0">
                    {delivery.donation?.donor?.city},{" "}
                    {delivery.donation?.donor?.state}
                  </p>

                  <p>
                    {delivery.donation?.donor?.pincode}
                  </p>

                  <hr />

                  <h6 className="text-primary fw-bold">
                    🏢 Deliver To
                  </h6>

                  <p className="mb-1">
                    <strong>
                      {delivery.ngo?.name}
                    </strong>
                  </p>

                  <p className="mb-1">
                    📞 {delivery.ngo?.phone}
                  </p>

                  <p className="mb-0">
                    {delivery.ngo?.address}
                  </p>

                  <p className="mb-0">
                    {delivery.ngo?.city},{" "}
                    {delivery.ngo?.state}
                  </p>

                  <p>
                    {delivery.ngo?.pincode}
                  </p>

                  <button
                    className="btn btn-primary w-100 mt-3"
                    onClick={() =>
                      acceptDelivery(
                        delivery._id
                      )
                    }
                  >
                    🚚 Accept Delivery
                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>
      )}

    </DashboardLayout>
  );
}

export default AvailableDeliveries;