"use client";

import React, { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/services/auth";
import { clearSession } from "@/services/session";
import { AdminSidebar, type AdminTabType } from "@/components/layout/AdminSidebar";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import type { AdminRole } from "@/types/api";

interface AdminShellProps {
  children: ReactNode;
  activeTab?: AdminTabType;
  onTabChange?: (tab: AdminTabType) => void;
  openTicketsCount?: number;
  usersCount?: number;
  teamCount?: number;
  adminRole?: AdminRole | null;
  onSearch?: (term: string) => void;
}

export function AdminShell({
  children,
  activeTab = "DASHBOARD",
  onTabChange,
  openTicketsCount = 0,
  usersCount = 0,
  teamCount = 0,
  adminRole,
}: AdminShellProps) {
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    getCurrentUser()
      .then((u) => {
        if (u) setAdminEmail(u.email);
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  const handleTabSelect = (tab: AdminTabType) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF6EE] dark:bg-[#181512] text-stone-900 dark:text-stone-100 font-body">
      {/* Sidebar Navigation */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={handleTabSelect}
        openTicketsCount={openTicketsCount}
        usersCount={usersCount}
        teamCount={teamCount}
        userRole={adminRole}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Container */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <AdminTopbar
          adminEmail={adminEmail || "luanvitors_852@hotmail.com"}
          adminRole={adminRole}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Scrollable Main Canvas */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
