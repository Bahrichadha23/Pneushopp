"use client";
import { useState } from "react";
import type React from "react";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { LogOutIcon, Menu, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/");
  };
  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex-1 flex flex-col md:pl-64">
        {/* Mobile top bar */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b flex items-center justify-between px-3 py-2">
          {/* Logo */}
          <Image
            src="/logo.png"
            alt="Logo"
            width={80}
            height={80}
            className="h-10 w-auto"
          />

          {/* Right side icons */}
          <div className="flex items-center gap-2">
            {/* Menu toggle */}
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

            {/* Logout button */}
            <Button
              onClick={handleLogout}
              size="icon"
              className="bg-white text-red-600 cursor-pointer hover:bg-red-700 hover:text-white"
            >
              <LogOutIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {/* Page content */}
        <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
          {/* Logout button aligned right */}
          <div className="flex w-full justify-end pt-8 px-6 cursor-pointer">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 "
            >
              <LogOutIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>

          {/* Page Content */}
          <div className="p-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
