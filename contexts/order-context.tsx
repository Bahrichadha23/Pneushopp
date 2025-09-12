"use client"
// Contexte pour la gestion des commandes
import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Order, OrderContextType } from "@/types/order"

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)

  // Charger les commandes depuis localStorage
  useEffect(() => {
    const savedOrders = localStorage.getItem("pneushop-orders")
    if (savedOrders) {
      try {
        const parsedOrders = JSON.parse(savedOrders).map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        }))
        setOrders(parsedOrders)
      } catch (error) {
        console.error("Erreur lors du chargement des commandes:", error)
      }
    }
  }, [])

  // Sauvegarder les commandes dans localStorage
  useEffect(() => {
    localStorage.setItem("pneushop-orders", JSON.stringify(orders))
  }, [orders])

  const createOrder = async (orderData: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<string> => {
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newOrder: Order = {
      ...orderData,
      id: orderId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "pending",
    }

    setOrders((prev) => [...prev, newOrder])
    setCurrentOrder(newOrder)
    return orderId
  }

  const getOrder = (orderId: string): Order | null => {
    return orders.find((order) => order.id === orderId) || null
  }

  const updateOrderStatus = (orderId: string, status: Order["status"]) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status, updatedAt: new Date() } : order)),
    )
  }

  const getAllOrders = (): Order[] => {
    return orders
  }

  const value: OrderContextType = {
    currentOrder,
    createOrder,
    getOrder,
    updateOrderStatus,
    getAllOrders,
  }

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrder() {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error("useOrder doit être utilisé dans un OrderProvider")
  }
  return context
}
