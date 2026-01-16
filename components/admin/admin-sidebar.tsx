"use client";
import { useState, useEffect } from "react";
import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  CheckCircle,
  CircleX,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context"; // Add this
import { API_URL } from "@/lib/config";
import { title } from "process";

interface MenuItem {
  title: string;
  href?: string;
  icon: React.ComponentType<any>;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { title: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  {
    title: "Commandes",
    icon: ShoppingCart,
    children: [
      {
        title: "Toutes les commandes",
        href: "/admin/commandes",
        icon: ClipboardList,
      },
      {
        title: "Commandes en attente",
        href: "/admin/commandes/pending",
        icon: Timer,
      },
      {
        title: "Commandes confirmées",
        href: "/admin/commandes/confirmed",
        icon: CheckCircle,
      },
      {
        title: "Commandes annulées",
        href: "/admin/commandes/cancelled",
        icon: CircleX,
      },
      { title: "Livraisons", href: "/admin/livraisons", icon: Truck },
    ],
  },
  {
    title: "Produits",
    icon: Package,
    children: [
      { title: "Catalogue produits", href: "/admin/produits", icon: Package },
      { title: "Gestion stock", href: "/admin/stock", icon: Store },
      {
        title: "Mouvements stock",
        href: "/admin/stock/mouvements",
        icon: TrendingUp,
      },
    ],
  },
  {
    title: "Gestion des Produits",
    icon: Upload,
    children: [
      {
        title: "Importer un fichier Excel",
        href: "/admin/import",
        icon: Upload,
      },
      {
        title: "Ajouter un produit",
        href: "/admin/add-product",
        icon: Package,
      },
    ],
  },
  {
    title: "Fournisseurs",
    icon: UserCheck,
    children: [
      {
        title: "Liste fournisseurs",
        href: "/admin/fournisseurs",
        icon: UserCheck,
      },
      {
        title: "Bons de commande",
        href: "/admin/bons-commande",
        icon: FileText,
      },
    ],
  },
  { title: "Clients", href: "/admin/clients", icon: Users },
  { title: "Rapports", href: "/admin/rapports", icon: BarChart3 },
  { title: "Paramètres", href: "/admin/parametres", icon: Settings },
  { title: "Personnel Utilisateurs", href: "/admin/Utilisateurs", icon: Users },
];

export default function AdminSidebar({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  const [pendingCount, setPendingCount] = useState(0);
  const [bonsCount, setBonsCount] = useState(0);
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };
  const { user } = useAuth(); // Get current user
  useEffect(() => {
    if (!user) return;

    const fetchPendingOrders = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_URL}/orders/?status=pending`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        setPendingCount(data.results.length);
      } catch (err) {
        console.error("Error fetching pending orders:", err);
      }
    };

    fetchPendingOrders();

    // Optional: poll every 10s for updates
    const interval = setInterval(fetchPendingOrders, 10000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchPendingBons = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_URL}/purchase-orders/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        // Count the number of pending bons
        const pendingBons = (data.results ?? []).filter(
          (bon: any) => bon.statut === "en_attente"
        );
        setBonsCount(pendingBons.length);
      } catch (err) {
        console.error("Error fetching bons de commande:", err);
      }
    };

    fetchPendingBons();

    // Optional: poll every 10s
    const interval = setInterval(fetchPendingBons, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Role-based menu filtering
  let filteredMenuItems = menuItems;
  let roleLabel = "";
  if (user?.role === "purchasing") {
    roleLabel = "Compte Achats";
    filteredMenuItems = [
      {
        title: "Produits",
        icon: Package,
        children: [
          {
            title: "Catalogue produits",
            href: "/admin/produits",
            icon: Package,
          },
          { title: "Gestion stock", href: "/admin/stock", icon: Store },
          {
            title: "Mouvements stock",
            href: "/admin/stock/mouvements",
            icon: TrendingUp,
          },
        ],
      },
      {
        title: "Fournisseurs",
        icon: UserCheck,
        children: [
          {
            title: "Liste fournisseurs",
            href: "/admin/fournisseurs",
            icon: UserCheck,
          },
          {
            title: "Bons de commande",
            href: "/admin/bons-commande",
            icon: FileText,
          },
        ],
      },
    ];
  } else if (user?.role === "sales") {
    roleLabel = "Compte Ventes";
    filteredMenuItems = [
      {
        title: "Commandes",
        icon: ShoppingCart,
        children: [
          {
            title: "Toutes les commandes",
            href: "/admin/commandes",
            icon: ClipboardList,
          },
          {
            title: "Commandes en attente",
            href: "/admin/commandes/pending",
            icon: Timer,
          },
          {
            title: "Commandes confirmées",
            href: "/admin/commandes/confirmed",
            icon: CheckCircle,
          },
          {
            title: "Commandes annulées",
            href: "/admin/commandes/cancelled",
            icon: CircleX,
          },
          { title: "Livraisons", href: "/admin/livraisons", icon: Truck },
        ],
      },
      { title: "Clients", href: "/admin/clients", icon: Users },
    ];
  } else if (user?.role === "admin") {
    roleLabel = "Administrateur";
    filteredMenuItems = menuItems;
  }
  const isActive = (href: string) => pathname === href;

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openMenus.includes(item.title);
    const Icon = item.icon;

    if (hasChildren) {
      return (
        <Collapsible
          key={item.title}
          open={isOpen}
          onOpenChange={() => toggleMenu(item.title)}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full justify-start px-3 py-2 h-auto text-left ${
                level > 0 ? "pl-8" : ""
              } hover:bg-gray-100`}
            >
              <Icon className="w-4 h-4 mr-3" />
              <span className="flex-1">{item.title}</span>
              {isOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            {item.children?.map((child) => renderMenuItem(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Link key={item.href} href={item.href || "#"}>
        <Button
          variant="ghost"
          className={`w-full justify-start px-2 h-auto ${
            // reduced px from 3 → 2
            level > 0 ? "pl-6" : "pl-3" // slightly less than previous pl-8
          } ${
            isActive(item.href || "")
              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
              : "hover:bg-gray-100"
          } flex items-center justify-between`}
        >
          <div className="flex items-center">
            <Icon className="w-4 h-4 mr-2" /> {/* icon spacing maintained */}
            <span>{item.title}</span>
          </div>

          {item.title === "Commandes en attente" && pendingCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
              {pendingCount}
            </span>
          )}

          {item.title === "Bons de commande" && bonsCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
              {bonsCount}
            </span>
          )}
        </Button>
      </Link>
    );
  };

  return (
    <>
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
        ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Desktop logo */}
        <div className="p-3 justify-center items-center space-x-2 sticky top-0 bg-white z-10 border-b border-gray-100">
          <Image src="/logo.png" alt="Logo PneuShop" width={100} height={100} />
          <div>
            <p className="pl-2 pt-0.5 text-xs text-gray-600">{roleLabel}</p>
          </div>
        </div>
        {/* Menu */}
        <nav className="p-4 space-y-1 pb-20">
          {filteredMenuItems.map((item) => renderMenuItem(item))}
        </nav>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
