"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import Header from "@/components/header";
export default function UserProfile() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/auth/login";
    }
  }, []);
  // Redirect if no token at all
  useEffect(() => {
    // Fetch user orders
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const res = await fetch("http://localhost:8000/api/orders/", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        const data = await res.json();
        setOrders(data.results || []);
      } catch (err) {
        setOrders([]);
      }
      setLoadingOrders(false);
    };
    fetchOrders();
  }, []);

  // While user data is loading
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="flex justify-center mt-10">
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl bg-white shadow-lg hover:shadow-xl transition-shadow p-6 rounded-lg">
          <h1 className="text-2xl font-bold mb-2 text-yellow-600 animate-pulse">
            Bonjour, {user.firstName}!
          </h1>
          <span
            className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-4 ${
              user.role === "admin"
                ? "bg-red-100 text-red-600"
                : "bg-blue-100 text-blue-600"
            }`}
          >
            {user.role === "admin" ? "Administrateur" : "Client"}
          </span>
          <div className="space-y-2">
            <p>
              <span className="font-semibold">Prénom:</span> {user.firstName}
            </p>
            <p>
              <span className="font-semibold">Nom:</span> {user.lastName}
            </p>
            <p>
              <span className="font-semibold">Email:</span> {user.email}
            </p>
            {user.phone && (
              <p>
                <span className="font-semibold">Téléphone:</span> {user.phone}
              </p>
            )}
          </div>
          <button
            onClick={async () => {
              setIsLoggingOut(true);
              await logout();
              window.location.href = "/auth/login";
            }}
            className={`mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-all duration-150 flex items-center gap-2 ${
              isLoggingOut ? "opacity-60 cursor-not-allowed" : ""
            }`}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7"
                />
              </svg>
            )}
            Se déconnecter
          </button>
        </div>
      </div>

      <div className="w-full max-w-2xl mx-auto mt-8 px-2">
        <h2 className="text-xl font-bold mb-4">Mes commandes</h2>
        {loadingOrders ? (
          <div>Chargement des commandes...</div>
        ) : orders.length === 0 ? (
          <div>Aucune commande trouvée.</div>
        ) : (
          <>
            {/* Table for md+ screens */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full border rounded-lg overflow-hidden shadow text-sm md:text-base">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Numéro</th>
                    <th className="p-2 border">Date</th>
                    <th className="p-2 border">Montant</th>
                    <th className="p-2 border">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: any) => (
                    <tr
                      key={order.id}
                      className="hover:bg-yellow-50 cursor-pointer transition"
                      onClick={() =>
                        (window.location.href = `/orders/${order.id}`)
                      }
                    >
                      <td className="p-2 border font-semibold">
                        {order.order_number}
                      </td>
                      <td className="p-2 border">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-2 border">{order.total_amount} TND</td>
                      <td className="p-2 border">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold
                    ${
                      order.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : order.status === "confirmed"
                        ? "bg-blue-100 text-blue-800"
                        : order.status === "delivered"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Cards for mobile screens */}
            <div className="md:hidden space-y-4">
              {orders.map((order: any) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow border p-4 flex flex-col gap-2 cursor-pointer hover:shadow-lg transition"
                  onClick={() => (window.location.href = `/orders/${order.id}`)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">Numéro:</span>
                    <span className="font-bold">{order.order_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">Date:</span>
                    <span>
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">Montant:</span>
                    <span>{order.total_amount} TND</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">Statut:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold
                ${
                  order.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : order.status === "confirmed"
                    ? "bg-blue-100 text-blue-800"
                    : order.status === "delivered"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
