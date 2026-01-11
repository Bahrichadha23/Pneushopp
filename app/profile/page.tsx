"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import Header from "@/components/header";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// import { handleDownloadInvoice } from "@/components/admin/orders-table";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/config";

export default function UserProfile() {
  const { user, logout, updateProfile } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  
  const [cancelDialog, setCancelDialog] = useState<{
    isOpen: boolean;
    orderId: string | null;
    orderNumber: string;
  }>({ isOpen: false, orderId: null, orderNumber: '' });
  const [cancelling, setCancelling] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();
  // const handleProfileInvoice = (profileOrder: any) => {
  //   // Convert API snake_case → camelCase expected by handleDownloadInvoice
  //   const mappedOrder = {
  //     orderNumber: profileOrder.order_number,
  //     createdAt: profileOrder.created_at,
  //     customerName: `${profileOrder.user.firstName} ${profileOrder.user.lastName}`,
  //     customerPhone: profileOrder.user.telephone || profileOrder.user.phone,
  //     fiscalId: profileOrder.user.id,
  //     items: profileOrder.items.map((i: any) => ({
  //       productId: i.product_id,
  //       productName: i.product_name,
  //       quantity: i.quantity,
  //       unitPrice: i.unit_price,
  //       discount: 0,
  //       tva: 19,
  //     })),
  //   };

  //   // Call the original invoice generator
  //   // handleDownloadInvoice(mappedOrder);
  // };

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

  const handleCancelOrder = (orderId: string, orderNumber: string) => {
    setCancelDialog({ isOpen: true, orderId, orderNumber });
  };

  const confirmCancelOrder = async () => {
    if (!cancelDialog.orderId) return;

    setCancelling(true);
    try {
      const res = await fetch(`${API_URL}/orders/${cancelDialog.orderId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (res.ok) {
        toast.success('Commande annulée avec succès');
        // Update local state
        setOrders((prev) =>
          prev.map((order: any) =>
            order.id === parseInt(cancelDialog.orderId!)
              ? { ...order, status: 'cancelled' }
              : order
          )
        );
      } else {
        toast.error('Erreur lors de l\'annulation de la commande');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setCancelling(false);
      setCancelDialog({ isOpen: false, orderId: null, orderNumber: '' });
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
                    <th className="p-2 border text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: any) => (
                    <tr
                      key={order.id}
                      className="hover:bg-yellow-50 transition"
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
                        : order.status === "processing"
                        ? "bg-purple-100 text-purple-800"
                        : order.status === "shipped"
                        ? "bg-indigo-100 text-indigo-800"
                        : order.status === "delivered"
                        ? "bg-green-100 text-green-800"
                        : order.status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                        >
                          {order.status === 'pending' ? 'En attente' :
                           order.status === 'confirmed' ? 'Confirmée' :
                           order.status === 'processing' ? 'En cours' :
                           order.status === 'shipped' ? 'Expédiée' :
                           order.status === 'delivered' ? 'Livrée' :
                           order.status === 'cancelled' ? 'Annulée' : order.status}
                        </span>
                      </td>
                      <td className="p-2 border text-center">
                        {order.status === 'pending' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelOrder(order.id, order.order_number)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Annuler
                          </Button>
                        )}
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
                  className="bg-white rounded-lg shadow border p-4 flex flex-col gap-2 hover:shadow-lg transition"
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
                    : order.status === "processing"
                    ? "bg-purple-100 text-purple-800"
                    : order.status === "shipped"
                    ? "bg-indigo-100 text-indigo-800"
                    : order.status === "delivered"
                    ? "bg-green-100 text-green-800"
                    : order.status === "cancelled"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
                    >
                      {order.status === 'pending' ? 'En attente' :
                       order.status === 'confirmed' ? 'Confirmée' :
                       order.status === 'processing' ? 'En cours' :
                       order.status === 'shipped' ? 'Expédiée' :
                       order.status === 'delivered' ? 'Livrée' :
                       order.status === 'cancelled' ? 'Annulée' : order.status}
                    </span>
                  </div>
                  {order.status === 'pending' && (
                    <div className="mt-2 pt-2 border-t">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelOrder(order.id, order.order_number)}
                        className="w-full bg-red-500 hover:bg-red-600"
                      >
                        Annuler la commande
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {cancelDialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCancelDialog({ isOpen: false, orderId: null, orderNumber: '' })}
              className="absolute inset-0 bg-black/50"
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <button
                onClick={() => setCancelDialog({ isOpen: false, orderId: null, orderNumber: '' })}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirmer l'annulation
                </h3>
                <p className="text-sm text-gray-600">
                  Êtes-vous sûr de vouloir annuler la commande{' '}
                  <span className="font-semibold">{cancelDialog.orderNumber}</span> ?
                </p>
                <p className="text-sm text-red-600 mt-2">
                  Cette action ne peut pas être annulée.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setCancelDialog({ isOpen: false, orderId: null, orderNumber: '' })}
                  disabled={cancelling}
                >
                  Non
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmCancelOrder}
                  disabled={cancelling}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {cancelling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Annulation...
                    </>
                  ) : (
                    'Oui, annuler'
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
