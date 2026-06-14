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
  ScrollText,
  BarChart3,
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
  Tag,
  RotateCcw,
} from "lucide-react";
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
      { title: "Toutes les commandes",   href: "/admin/commandes",           icon: ClipboardList },
      { title: "Commandes en attente",   href: "/admin/commandes/pending",   icon: Timer },
      { title: "Commandes confirmées",   href: "/admin/commandes/confirmed", icon: CheckCircle },
      { title: "Commandes annulées",     href: "/admin/commandes/cancelled", icon: CircleX },
      { title: "Factures",               href: "/admin/factures",            icon: Receipt },
      { title: "Livraisons",             href: "/admin/livraisons",          icon: Truck },
    ],
  },
  { title: "Avoirs / Retours",  href: "/admin/avoir",       icon: RotateCcw },
  { title: "Promotions",        href: "/admin/promotions",  icon: Tag },
  {
    title: "Produits",
    icon: Package,
    children: [
      { title: "Catalogue produits",     href: "/admin/produits",            icon: Package },
      { title: "Gestion stock",          href: "/admin/stock",               icon: Store },
      { title: "Mouvements stock",       href: "/admin/stock/mouvements",    icon: TrendingUp },
    ],
  },
  {
    title: "Gestion des Produits",
    icon: Upload,
    children: [
      { title: "Importer un fichier Excel", href: "/admin/import",       icon: Upload },
      { title: "Ajouter un produit",         href: "/admin/add-product", icon: Package },
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
      { title: "Achat",                   href: "/admin/achats",           icon: ShoppingCart },
      { title: "Bons de livraison achat/facture",  href: "/admin/achats/commandes", icon: ClipboardList },
    ],
  },
  { title: "Trésorerie Vente",      href: "/admin/tresorerie",   icon: Wallet },
  { title: "Clients",               href: "/admin/clients",      icon: Users },
  { title: "Rapports",              href: "/admin/rapports",     icon: BarChart3 },
  { title: "Personnel Utilisateurs",href: "/admin/Utilisateurs", icon: Users },
  { title: "Journal d'activité",    href: "/admin/journal",      icon: ScrollText },
  { title: "Support",               href: "/admin/communication",icon: MessageSquare },
];

const MENU_PURCHASING: MenuItem[] = [
  {
    title: "Commandes",
    icon: ShoppingCart,
    children: [
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
      { title: "Bons de livraison achat/facture", href: "/admin/achats/commandes", icon: ClipboardList },
    ],
  },
  { title: "Promotions",        href: "/admin/promotions", icon: Tag },
  { title: "Support", href: "/admin/communication", icon: MessageSquare },
];

const MENU_SALES: MenuItem[] = [
  {
    title: "Commandes",
    icon: ShoppingCart,
    children: [
      { title: "Toutes les commandes",  href: "/admin/commandes",           icon: ClipboardList },
      { title: "Commandes en attente",  href: "/admin/commandes/pending",   icon: Timer },
      { title: "Commandes confirmées",  href: "/admin/commandes/confirmed", icon: CheckCircle },
      { title: "Commandes annulées",    href: "/admin/commandes/cancelled", icon: CircleX },
      { title: "Factures",              href: "/admin/factures",            icon: Receipt },
      { title: "Livraisons",            href: "/admin/livraisons",          icon: Truck },
    ],
  },
  { title: "Avoirs / Retours",  href: "/admin/avoir",      icon: RotateCcw },
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
  { title: "Trésorerie Vente",  href: "/admin/tresorerie", icon: Wallet },
  { title: "Clients",           href: "/admin/clients",    icon: Users },
  { title: "Support",           href: "/admin/communication", icon: MessageSquare },
];

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

  useEffect(() => {
    if (!user || !["admin", "purchasing"].includes(user.role ?? "")) return;
    const fetch = async () => {
      try {
        const { data } = await apiClient.get("/purchase-orders/");
        const pending = (data.results ?? data).filter(
          (b: any) => b.status === "draft"
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
            <button
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                ${level > 0 ? "pl-8" : ""}
                text-gray-400 hover:text-white hover:bg-white/8`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.title}</span>
              {isOpen
                ? <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                : <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-0.5 space-y-0.5">
            {item.children?.map((child) => renderMenuItem(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    const active = isActive(item.href || "");

    return (
      <Link key={item.href} href={item.href || "#"}>
        <div
          className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer
            ${level > 0 ? "pl-8" : ""}
            ${active
              ? "bg-[#FEC70B] text-white shadow-lg shadow-[#FEC70B]/20"
              : "text-gray-400 hover:text-white hover:bg-white/8"
            }`}
        >
          <div className="flex items-center gap-3">
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{item.title}</span>
          </div>

          {item.title === "Commandes en attente" && pendingCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full bg-[#FF8C00] text-white">
              {pendingCount}
            </span>
          )}
          {item.title === "Bons de livraison achat/facture" && bonsCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full bg-[#FF8C00] text-white">
              {bonsCount}
            </span>
          )}
        </div>
      </Link>
    );
  };

  return (
    <>
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0F1729] flex flex-col transform transition-transform duration-200 ease-in-out overflow-hidden
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${
          desktopSidebarOpen ? "md:translate-x-0" : "md:-translate-x-full"
        }`}
      >
        {/* ── Logo ── */}
        <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Image
                src="/mobile-logo.png"
                alt="PneuShop"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <p className="text-sm leading-tight font-bold">
                <span className="text-white">Pneu</span>
                <span className="text-[#FEC70B]">Shop</span>
              </p>
              <p className="text-gray-500 text-xs">Back-office</p>
            </div>
          </div>
        </div>

        {/* ── Profil utilisateur (sous le logo) ── */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FEC70B]/20 border border-[#FEC70B]/40 flex items-center justify-center flex-shrink-0">
              <span className="text-[#FEC70B] text-sm font-bold uppercase">
                {user?.first_name?.[0] ?? user?.email?.[0] ?? "?"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {user?.first_name
                  ? `${user.first_name} ${user.last_name ?? ""}`.trim()
                  : roleLabel || "Administrateur"}
              </p>
              <p className="text-gray-500 text-xs truncate">{user?.email}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {filteredMenuItems.map((item) => renderMenuItem(item))}
        </nav>
      </div>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
