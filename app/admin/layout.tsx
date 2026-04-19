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
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Garde de route : redirige si le rôle n'a pas accès à cette page
  const allowed = isRouteAllowed(pathname, user?.role);

  // Attendre que l'utilisateur soit chargé avant de bloquer
  const userLoaded = user !== undefined;

  if (userLoaded && !allowed) {
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
            className="bg-yellow-500 hover:bg-yellow-600 text-white w-full"
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
        className={`flex-1 flex flex-col ${
          desktopSidebarOpen ? "md:pl-64" : "md:pl-0"
        }`}
      >
        {/* Mobile top bar */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b flex items-center justify-between px-3 py-2">
          <Image
            src="/logo.png"
            alt="Logo PneuShop"
            width={80}
            height={80}
            className="h-10 w-auto"
          />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-700 hover:text-gray-900"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
            <Button
              onClick={handleLogout}
              size="icon"
              className="bg-white text-red-600 cursor-pointer hover:bg-red-700 hover:text-white sm:hidden"
            >
              <LogOutIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto pt-14 md:pt-0">
          <div className="flex w-full justify-between items-center pt-8 px-6 mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="hidden md:inline-flex"
                onClick={() => setDesktopSidebarOpen((prev) => !prev)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="hidden sm:flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOutIcon className="w-4 h-4" />
              <span>Déconnexion</span>
            </Button>
          </div>

          <div className="p-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
