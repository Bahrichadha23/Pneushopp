"use client";
// Contexte global pour la gestion du panier d'achat
import type React from "react";
import { createContext, useContext, useReducer, useEffect } from "react";
import type { Product, CartItem, CartContextType } from "@/types/product";

// Actions pour le reducer du panier
type CartAction =
  | { type: "ADD_TO_CART"; product: Product; quantity: number }
  | { type: "REMOVE_FROM_CART"; productId: string }
  | { type: "UPDATE_QUANTITY"; productId: string; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; items: CartItem[] };

// API endpoints
const API_BASE_URL = "http://localhost:8000/api";

// Helper function to get auth token
const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token");
  }
  return null;
};

// Helper function to make authenticated API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Reducer pour gérer les actions du panier
function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existingItem = state.find(
        (item) => item.product.id === action.product.id
      );
      if (existingItem) {
        return state.map((item) =>
          item.product.id === action.product.id
            ? { ...item, quantity: item.quantity + action.quantity }
            : item
        );
      }
      return [...state, { product: action.product, quantity: action.quantity }];
    }
    case "REMOVE_FROM_CART":
      return state.filter((item) => item.product.id !== action.productId);
    case "UPDATE_QUANTITY":
      if (action.quantity <= 0) {
        return state.filter((item) => item.product.id !== action.productId);
      }
      return state.map((item) =>
        item.product.id === action.productId
          ? { ...item, quantity: action.quantity }
          : item
      );
    case "CLEAR_CART":
      return [];
    case "LOAD_CART":
      return action.items;
    default:
      return state;
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, []);

  // Load cart from backend on startup
  useEffect(() => {
    const loadCart = async () => {
      try {
        const token = getAuthToken();
        if (token) {
          const cartData = await apiCall("/cart/");
          // Convert backend cart data to frontend format
          const cartItems: CartItem[] =
            cartData.items?.map((item: any) => ({
              product: {
                id: item.product.id.toString(),
                name: item.product.name,
                price: parseFloat(item.product.price),
                brand: item.product.brand,
                image: item.product.image || "/placeholder.jpg",
                model: item.product.size,
                category: "auto",
                inStock: item.product.stock > 0,
                stock: item.product.stock,
                // Add other required Product fields with defaults
                originalPrice: item.product.old_price
                  ? parseFloat(item.product.old_price)
                  : undefined,
                discount: item.product.discount_percentage || 0,
                images: [item.product.image || "/placeholder.jpg"],
                specifications: {
                  width: 225,
                  height: 45,
                  diameter: 17,
                  loadIndex: 91,
                  speedRating: "W",
                  season:
                    item.product.season === "summer"
                      ? "ete"
                      : item.product.season === "winter"
                      ? "hiver"
                      : "toutes-saisons",
                  specialty: "tourisme",
                },
                description: item.product.description || "",
                features: [],
                isPromotion: item.product.is_featured || false,
                rating: 4.5,
                reviewCount: 0,
              },
              quantity: item.quantity,
            })) || [];

          dispatch({ type: "LOAD_CART", items: cartItems });
        } else {
          // Fallback to localStorage if not authenticated
          const savedCart = localStorage.getItem("pneushop-cart");
          if (savedCart) {
            try {
              const parsedCart = JSON.parse(savedCart);
              dispatch({ type: "LOAD_CART", items: parsedCart });
            } catch (error) {
              console.error("Erreur lors du chargement du panier:", error);
            }
          }
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement du panier depuis l'API:",
          error
        );
        // Fallback to localStorage
        const savedCart = localStorage.getItem("pneushop-cart");
        if (savedCart) {
          try {
            const parsedCart = JSON.parse(savedCart);
            dispatch({ type: "LOAD_CART", items: parsedCart });
          } catch (error) {
            console.error("Erreur lors du chargement du panier:", error);
          }
        }
      }
    };

    loadCart();
  }, []);

  // Save cart to localStorage as backup
  useEffect(() => {
    localStorage.setItem("pneushop-cart", JSON.stringify(items));
  }, [items]);

  const addToCart = async (product: Product, quantity = 1) => {
    try {
      const token = getAuthToken();
      if (token) {
        // Add to backend cart
        await apiCall("/cart/add/", {
          method: "POST",
          body: JSON.stringify({
            product_id: parseInt(product.id),
            quantity: quantity,
          }),
        });
      }
      // Update local state
      dispatch({ type: "ADD_TO_CART", product, quantity });
    } catch (error) {
      console.error("Erreur lors de l'ajout au panier:", error);
      // Still update local state as fallback
      dispatch({ type: "ADD_TO_CART", product, quantity });
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      const token = getAuthToken();
      if (token) {
        // Remove from backend cart
        await apiCall("/cart/remove/", {
          method: "POST",
          body: JSON.stringify({
            product_id: parseInt(productId),
          }),
        });
      }
      // Update local state
      dispatch({ type: "REMOVE_FROM_CART", productId });
    } catch (error) {
      console.error("Erreur lors de la suppression du panier:", error);
      // Still update local state as fallback
      dispatch({ type: "REMOVE_FROM_CART", productId });
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      const token = getAuthToken();
      if (token) {
        // Update backend cart
        await apiCall("/cart/update/", {
          method: "POST",
          body: JSON.stringify({
            product_id: parseInt(productId),
            quantity: quantity,
          }),
        });
      }
      // Update local state
      dispatch({ type: "UPDATE_QUANTITY", productId, quantity });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du panier:", error);
      // Still update local state as fallback
      dispatch({ type: "UPDATE_QUANTITY", productId, quantity });
    }
  };

  const clearCart = async () => {
    try {
      const token = getAuthToken();
      if (token) {
        // Clear backend cart
        await apiCall("/cart/clear/", {
          method: "POST",
        });
      }
      // Update local state
      dispatch({ type: "CLEAR_CART" });
    } catch (error) {
      console.error("Erreur lors de la vidange du panier:", error);
      // Still update local state as fallback
      dispatch({ type: "CLEAR_CART" });
    }
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  };

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart doit être utilisé dans un CartProvider");
  }
  return context;
}
