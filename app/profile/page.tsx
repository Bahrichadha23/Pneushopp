"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import Header from "@/components/header";
import { Download } from "lucide-react";
import { handleDownloadInvoice } from "@/components/admin/orders-table";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/config";

export default function UserProfile() {
  const { user, logout, updateProfile } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();
  const handleProfileInvoice = (profileOrder: any) => {
    // Convert API snake_case → camelCase expected by handleDownloadInvoice
    const mappedOrder = {
      orderNumber: profileOrder.order_number,
      createdAt: profileOrder.created_at,
      customerName: `${profileOrder.user.firstName} ${profileOrder.user.lastName}`,
      customerPhone: profileOrder.user.telephone || profileOrder.user.phone,
      fiscalId: profileOrder.user.id,
      items: profileOrder.items.map((i: any) => ({
        productId: i.product_id,
        productName: i.product_name,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        discount: 0,
        tva: 19,
      })),
    };

    // Call the original invoice generator
    handleDownloadInvoice(mappedOrder);
  };

  // Reset form with user data when user changes or when toggling edit mode
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user, isEditing, reset]);
  const onSubmit = async (data: any) => {
    try {
      const result = await updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
      });

      if (result.success) {
        toast.success("Profil mis à jour avec succès");
        setIsEditing(false);
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour du profil");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Une erreur est survenue");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
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
        const res = await fetch(`${API_URL}/orders/`, {
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
          <button
            onClick={async () => {
              setIsLoggingOut(true);
              await logout();
              window.location.href = "/auth/login";
            }}
            className={`ml-86 px-4 py-2 bg-yellow-500 text-white rounded cursor-pointer hover:bg-yellow-600 transition-all duration-150 flex items-center gap-2 ${
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
            onClick={() => setIsEditing(true)}
            className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded cursor-pointer hover:bg-yellow-600 transition-colors"
          >
            Modifier le profil
          </button>
        </div>
      </div>
      {isEditing ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white shadow-lg rounded-lg overflow-hidden p-6 sm:p-8"
        >
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              Modifier le profil
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Mettez à jour vos informations personnelles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700"
              >
                Prénom
              </label>
              <div className="mt-1">
                <input
                  id="firstName"
                  type="text"
                  {...register("firstName", {
                    required: "Ce champ est requis",
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2 border"
                />
                {errors.fieldName && (
                  <p className="mt-1 text-sm text-red-600">
                    {String(errors.fieldName.message)}
                  </p>
                )}{" "}
              </div>
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700"
              >
                Nom
              </label>
              <div className="mt-1">
                <input
                  id="lastName"
                  type="text"
                  {...register("lastName", { required: "Ce champ est requis" })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2 border"
                />
                {errors.fieldName && (
                  <p className="mt-1 text-sm text-red-600">
                    {String(errors.fieldName.message)}
                  </p>
                )}{" "}
              </div>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  {...register("email", {
                    required: "Email est requis",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email invalide",
                    },
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2 border"
                />
                {errors.fieldName && (
                  <p className="mt-1 text-sm text-red-600">
                    {String(errors.fieldName.message)}
                  </p>
                )}{" "}
              </div>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Téléphone
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2 border"
                />
                {errors.fieldName && (
                  <p className="mt-1 text-sm text-red-600">
                    {String(errors.fieldName.message)}
                  </p>
                )}{" "}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200 mt-8">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${
                isSubmitting ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Enregistrement...
                </>
              ) : (
                "Enregistrer les modifications"
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Profile view content */}
        </div>
      )}
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
                    <th className="p-2 border text-center">Facture</th>{" "}
                    {/* 👈 new column */}
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
                      <td className="p-2 border text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation(); // prevent row click navigation
                            handleProfileInvoice(order);
                          }}
                          className="flex items-center justify-center"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
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
