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
  Receipt,
  Wallet,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import apiClient from "@/lib/api-client";

interface MenuItem {
  title: string;
  href?: string;
  icon: React.ComponentType<any>;
  children?: MenuItem[];
}

// ─── Menus par rôle ────────────────────────────────────────────────────────────

const MENU_ADMIN: MenuItem[] = [
  { title: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  {
    title: "Commandes",
    icon: ShoppingCart,
    children: [
      { title: "Toutes les commandes", href: "/admin/commandes", icon: ClipboardList },
      { title: "Commandes en attente", href: "/admin/commandes/pending", icon: Timer },
      { title: "Commandes confirmées", href: "/admin/commandes/confirmed", icon: CheckCircle },
      { title: "Commandes annulées", href: "/admin/commandes/cancelled", icon: CircleX },
      { title: "Bons de commande", href: "/admin/bons-commande", icon: FileText },
      { title: "Factures", href: "/admin/factures", icon: Receipt },
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
    title: "Gestion des Produits",
    icon: Upload,
    children: [
      { title: "Importer un fichier Excel", href: "/admin/import", icon: Upload },
      { title: "Ajouter un produit", href: "/admin/add-product", icon: Package },
    ],
  },
  {
    title: "Fournisseurs",
    icon: UserCheck,
    children: [
      { title: "Liste fournisseurs", href: "/admin/fournisseurs", icon: UserCheck },
    ],
  },
  {
    title: "Achats",
    icon: ShoppingCart,
    children: [
      { title: "Achat", href: "/admin/achats", icon: ShoppingCart },
      { title: "Bons de commande achat", href: "/admin/achats/commandes", icon: ClipboardList },
    ],
  },
  {
    title: "Trésorerie",
    icon: Wallet,
    children: [
      { title: "Trésorerie Vente", href: "/admin/tresorerie", icon: Receipt },
    ],
  },
  { title: "Clients", href: "/admin/clients", icon: Users },
  { title: "Rapports", href: "/admin/rapports", icon: BarChart3 },
  { title: "Paramètres", href: "/admin/parametres", icon: Settings },
  { title: "Personnel Utilisateurs", href: "/admin/Utilisateurs", icon: Users },
  { title: "Support", href: "/admin/communication", icon: MessageSquare },
];

/** Responsable Achat : tout ce qui concerne les achats et les produits */
const MENU_PURCHASING: MenuItem[] = [
  { title: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
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
    title: "Gestion des Produits",
    icon: Upload,
    children: [
      { title: "Importer un fichier Excel", href: "/admin/import", icon: Upload },
      { title: "Ajouter un produit", href: "/admin/add-product", icon: Package },
    ],
  },
  {
    title: "Fournisseurs",
    icon: UserCheck,
    children: [
      { title: "Liste fournisseurs", href: "/admin/fournisseurs", icon: UserCheck },
    ],
  },
  {
    title: "Achats",
    icon: ShoppingCart,
    children: [
      { title: "Achat", href: "/admin/achats", icon: ShoppingCart },
      { title: "Bons de commande achat", href: "/admin/achats/commandes", icon: ClipboardList },
    ],
  },
  { title: "Support", href: "/admin/communication", icon: MessageSquare },
];

/** Responsable Vente : tout ce qui concerne les ventes */
const MENU_SALES: MenuItem[] = [
  { title: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  {
    title: "Commandes",
    icon: ShoppingCart,
    children: [
      { title: "Toutes les commandes", href: "/admin/commandes", icon: ClipboardList },
      { title: "Commandes en attente", href: "/admin/commandes/pending", icon: Timer },
      { title: "Commandes confirmées", href: "/admin/commandes/confirmed", icon: CheckCircle },
      { title: "Commandes annulées", href: "/admin/commandes/cancelled", icon: CircleX },
      { title: "Bons de commande", href: "/admin/bons-commande", icon: FileText },
      { title: "Factures", href: "/admin/factures", icon: Receipt },
      { title: "Livraisons", href: "/admin/livraisons", icon: Truck },
    ],
  },
  {
    title: "Trésorerie",
    icon: Wallet,
    children: [
      { title: "Trésorerie Vente", href: "/admin/tresorerie", icon: Receipt },
    ],
  },
  { title: "Clients", href: "/admin/clients", icon: Users },
  { title: "Support", href: "/admin/communication", icon: MessageSquare },
];

// ─── Libellés de rôle ─────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  purchasing: "Responsable Achat",
  sales: "Responsable Vente",
  customer: "Client",
};

function getMenuForRole(role: string | undefined): MenuItem[] {
  if (role === "admin") return MENU_ADMIN;
  if (role === "purchasing") return MENU_PURCHASING;
  if (role === "sales") return MENU_SALES;
  return [];
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function AdminSidebar({
  sidebarOpen,
  setSidebarOpen,
  desktopSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  desktopSidebarOpen: boolean;
}) {
  const [pendingCount, setPendingCount] = useState(0);
  const [bonsCount, setBonsCount] = useState(0);
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const { user } = useAuth();

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  // Badge : commandes en attente (visible sales + admin)
  useEffect(() => {
    if (!user || !["admin", "sales"].includes(user.role ?? "")) return;
    const fetch = async () => {
      try {
        const { data } = await apiClient.get("/orders/?status=pending");
        setPendingCount((data.results ?? data).length);
      } catch {}
    };
    fetch();
    const id = setInterval(fetch, 15000);
    return () => clearInterval(id);
  }, [user]);

  // Badge : bons de commande achat en attente (visible purchasing + admin)
  useEffect(() => {
    if (!user || !["admin", "purchasing"].includes(user.role ?? "")) return;
    const fetch = async () => {
      try {
        const { data } = await apiClient.get("/purchase-orders/");
        const pending = (data.results ?? data).filter(
          (b: any) => b.statut === "en_attente" || b.status === "draft"
        );
        setBonsCount(pending.length);
      } catch {}
    };
    fetch();
    const id = setInterval(fetch, 15000);
    return () => clearInterval(id);
  }, [user]);

  const filteredMenuItems = getMenuForRole(user?.role);
  const roleLabel = ROLE_LABELS[user?.role ?? ""] ?? "";

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
            level > 0 ? "pl-6" : "pl-3"
          } ${
            isActive(item.href || "")
              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
              : "hover:bg-gray-100"
          } flex items-center justify-between`}
        >
          <div className="flex items-center">
            <Icon className="w-4 h-4 mr-2" />
            <span>{item.title}</span>
          </div>

          {item.title === "Commandes en attente" && pendingCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
              {pendingCount}
            </span>
          )}
          {item.title === "Bons de commande achat" && bonsCount > 0 && (
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
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${
          desktopSidebarOpen ? "md:translate-x-0" : "md:-translate-x-full"
        }`}
      >
        {/* Logo + rôle */}
        <div className="p-3 sticky top-0 bg-white z-10 border-b border-gray-100">
          <Image src="/logo.png" alt="Logo PneuShop" width={100} height={100} />
          {roleLabel && (
            <p className="pl-2 pt-0.5 text-xs font-medium text-yellow-700 bg-yellow-50 rounded px-2 py-0.5 mt-1 inline-block">
              {roleLabel}
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 pb-20">
          {filteredMenuItems.map((item) => renderMenuItem(item))}
        </nav>
      </div>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
