"use client"
import { useState } from "react"
import type React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation" // ✅ useRouter instead of useNavigate
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
  Upload,
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
      { title: "Import Excel", href: "/admin/import", icon: Upload },
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
    href: "/admin/rapports",
    icon: BarChart3,
  },
  {
    title: "Paramètres",
    href: "/admin/parametres",
    icon: Settings,
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter() // ✅ Next.js router
  const [openMenus, setOpenMenus] = useState<string[]>(["Commandes", "Produits"])

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    )
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
              className={`w-full justify-start px-3 py-2 h-auto text-left ${
                level > 0 ? "pl-8" : ""
              } hover:bg-gray-100`}
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
          className={`w-full justify-start px-3 py-2 h-auto ${
            level > 0 ? "pl-8" : ""
          } ${
            isActive(item.href || "")
              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
              : "hover:bg-gray-100"
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

    </div>
  )
}
