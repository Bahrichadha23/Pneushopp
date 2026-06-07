"use client";
import { useState, useEffect } from "react";
import type React from "react";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { LogOutIcon, Menu, X, ArrowLeft, ShieldAlert } from "lucide-react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

// ─── Droits d'accès par route ────────────────────────────────────────────────
//  "purchasing" = Responsable Achat
//  "sales"      = Responsable Vente
//  "admin"      = tout
//  undefined → pas de restriction supplémentaire (ex. /admin dashboard)

const ROUTE_PERMISSIONS: { pattern: RegExp; roles: string[] }[] = [
  // Commandes / Vente
  { pattern: /^\/admin\/commandes/, roles: ["admin", "sales"] },
  { pattern: /^\/admin\/bons-commande/, roles: ["admin", "sales"] },
  { pattern: /^\/admin\/factures/, roles: ["admin", "sales"] },
  { pattern: /^\/admin\/livraisons/, roles: ["admin", "sales"] },
  { pattern: /^\/admin\/tresorerie/, roles: ["admin", "sales"] },
  { pattern: /^\/admin\/clients/, roles: ["admin", "sales"] },
  // Produits / Achat
  { pattern: /^\/admin\/produits/, roles: ["admin", "purchasing"] },
  { pattern: /^\/admin\/stock/, roles: ["admin", "purchasing"] },
  { pattern: /^\/admin\/import/, roles: ["admin", "purchasing"] },
  { pattern: /^\/admin\/add-product/, roles: ["admin", "purchasing"] },
  { pattern: /^\/admin\/fournisseurs/, roles: ["admin", "purchasing"] },
  { pattern: /^\/admin\/achats/, roles: ["admin", "purchasing"] },
  // Admin uniquement
  { pattern: /^\/admin\/rapports/, roles: ["admin"] },
  { pattern: /^\/admin\/parametres/, roles: ["admin"] },
  { pattern: /^\/admin\/Utilisateurs/, roles: ["admin"] },
  { pattern: /^\/admin\/journal/, roles: ["admin"] },
];

function isRouteAllowed(pathname: string, role: string | undefined): boolean {
  if (!role || role === "customer") return false;
  if (role === "admin") return true;
  const rule = ROUTE_PERMISSIONS.find((r) => r.pattern.test(pathname));
  if (!rule) return true; // pas de restriction → autorisé (/admin, /communication…)
  return rule.roles.includes(role);
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Garde de route
  const allowed = isRouteAllowed(pathname, user?.role);

  // Chargement en cours → spinner neutre
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#FF8C00] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Chargement…</p>
        </div>
      </div>
    );
  }

  // Non connecté → redirection vers la page de connexion admin
  if (!user) {
    router.replace("/auth/login/admin");
    return null;
  }

  // Connecté mais rôle insuffisant → accès refusé
  if (!allowed) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-10 flex flex-col items-center gap-4 max-w-sm w-full text-center">
          <div className="p-4 bg-red-50 rounded-full">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Accès refusé</h2>
          <p className="text-sm text-gray-500">
            Vous n&apos;avez pas les droits nécessaires pour accéder à cette
            page.
          </p>
          <Button
            onClick={() => router.push("/admin")}
            className="bg-[#FF8C00] hover:bg-[#CC7000] text-white w-full"
          >
            Retour au tableau de bord
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
          >
            Se déconnecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-x-auto">
      {/* Sidebar */}
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        desktopSidebarOpen={desktopSidebarOpen}
      />

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          desktopSidebarOpen ? "md:pl-64" : "md:pl-0"
        }`}
      >
        {/* Mobile top bar */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0F1729] border-b border-white/10 flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="bg-yellow-400 rounded-lg p-1">
              <Image src="/logo.png" alt="PneuShop" width={24} height={24} className="w-6 h-6 object-contain" />
            </div>
            <span className="text-white font-bold text-sm">PneuShop</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-300 hover:text-white hover:bg-white/10"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <Button
              onClick={handleLogout}
              size="icon"
              className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white sm:hidden border-0"
            >
              <LogOutIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Desktop top bar */}
        <div className="hidden md:flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setDesktopSidebarOpen((prev) => !prev)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>
          </div>

          {/* Breadcrumb / page indicator */}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
            <span>PneuShop Admin</span>
          </div>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <LogOutIcon className="w-4 h-4" />
            <span>Déconnexion</span>
          </Button>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto pt-14 md:pt-0">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
