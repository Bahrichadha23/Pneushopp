// Barre latérale de navigation pour l'interface d'administration
"use client"
import { useState } from "react"
import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Truck,
  FileText,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Store,
  UserCheck,
  ClipboardList,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface MenuItem {
  title: string
  href?: string
  icon: React.ComponentType<any>
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    title: "Tableau de bord",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Commandes",
    icon: ShoppingCart,
    children: [
      { title: "Toutes les commandes", href: "/admin/commandes", icon: ShoppingCart },
      { title: "Commandes en attente", href: "/admin/commandes/pending", icon: ClipboardList },
      { title: "Livraisons", href: "/admin/livraisons", icon: Truck },
    ],
  },
  {
    title: "Produits",
    icon: Package,
    children: [
      { title: "Catalogue produits", href: "/admin/produits", icon: Package },
      { title: "Gestion stock", href: "/admin/stock", icon: Store },
      { title: "Mouvements stock", href: "/admin/stock/mouvements", icon: TrendingUp },
    ],
  },
  {
    title: "Clients",
    href: "/admin/clients",
    icon: Users,
  },
  {
    title: "Fournisseurs",
    icon: UserCheck,
    children: [
      { title: "Liste fournisseurs", href: "/admin/fournisseurs", icon: UserCheck },
      { title: "Bons de commande", href: "/admin/bons-commande", icon: FileText },
    ],
  },
  {
    title: "Rapports",
    icon: BarChart3,
    children: [
      { title: "Ventes", href: "/admin/rapports/ventes", icon: BarChart3 },
      { title: "Inventaire", href: "/admin/rapports/inventaire", icon: Package },
      { title: "Clients", href: "/admin/rapports/clients", icon: Users },
    ],
  },
  {
    title: "Paramètres",
    href: "/admin/parametres",
    icon: Settings,
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<string[]>(["Commandes", "Produits"])

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]))
  }

  const isActive = (href: string) => pathname === href

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isOpen = openMenus.includes(item.title)
    const Icon = item.icon

    if (hasChildren) {
      return (
        <Collapsible key={item.title} open={isOpen} onOpenChange={() => toggleMenu(item.title)}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full justify-start px-3 py-2 h-auto text-left ${level > 0 ? "pl-8" : ""} hover:bg-gray-100`}
            >
              <Icon className="w-4 h-4 mr-3" />
              <span className="flex-1">{item.title}</span>
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            {item.children?.map((child) => renderMenuItem(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      )
    }

    return (
      <Link key={item.href} href={item.href || "#"}>
        <Button
          variant="ghost"
          className={`w-full justify-start px-3 py-2 h-auto ${level > 0 ? "pl-8" : ""} ${
            isActive(item.href || "") ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : "hover:bg-gray-100"
          }`}
        >
          <Icon className="w-4 h-4 mr-3" />
          {item.title}
        </Button>
      </Link>
    )
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      {/* Logo administrateur */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-black rounded-full"></div>
          </div>
          <div>
            <h2 className="font-bold text-gray-900">PNEU SHOP</h2>
            <p className="text-xs text-gray-600">Administration</p>
          </div>
        </div>
      </div>

      {/* Menu de navigation */}
      <nav className="p-4 space-y-1">{menuItems.map((item) => renderMenuItem(item))}</nav>

      {/* Informations utilisateur */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
            <p className="text-xs text-gray-500">Administrateur</p>
          </div>
        </div>
      </div>
    </div>
  )
}
