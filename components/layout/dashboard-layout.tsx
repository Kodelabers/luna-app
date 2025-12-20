"use client";

import { useMockAuth } from "@/lib/mock-data/context";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Users,
  Settings,
  Building2,
  CalendarDays,
  UserCog,
} from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, organisation } = useMockAuth();
  const pathname = usePathname();

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  const getNavigationItems = () => {
    const baseUrl =
      currentUser.role === "EMPLOYEE"
        ? "/employee"
        : currentUser.role === "DEPARTMENT_MANAGER"
          ? "/manager"
          : currentUser.role === "GENERAL_MANAGER"
            ? "/general-manager"
            : "/admin";

    switch (currentUser.role) {
      case "EMPLOYEE":
        return [
          { icon: LayoutDashboard, label: "Dashboard", href: `${baseUrl}` },
          { icon: FileText, label: "Moji Zahtjevi", href: `${baseUrl}/requests` },
          { icon: Calendar, label: "Kalendar", href: `${baseUrl}/calendar` },
        ];

      case "DEPARTMENT_MANAGER":
        return [
          { icon: LayoutDashboard, label: "Dashboard", href: `${baseUrl}` },
          { icon: FileText, label: "Zahtjevi", href: `${baseUrl}/requests` },
          { icon: Calendar, label: "Planiranje", href: `${baseUrl}/planning` },
          { icon: Users, label: "Zaposlenici", href: `${baseUrl}/employees` },
          { icon: CalendarDays, label: "Bolovanja", href: `${baseUrl}/sick-leaves` },
        ];

      case "GENERAL_MANAGER":
        return [
          { icon: LayoutDashboard, label: "Dashboard", href: `${baseUrl}` },
          { icon: FileText, label: "Zahtjevi", href: `${baseUrl}/requests` },
          { icon: Building2, label: "Svi Odjeli", href: `${baseUrl}/departments` },
          { icon: Calendar, label: "Planiranje", href: `${baseUrl}/planning` },
        ];

      case "ADMIN":
        return [
          { icon: LayoutDashboard, label: "Dashboard", href: `${baseUrl}` },
          { icon: Users, label: "Zaposlenici", href: `${baseUrl}/employees` },
          { icon: Building2, label: "Odjeli", href: `${baseUrl}/departments` },
          { icon: CalendarDays, label: "Praznici", href: `${baseUrl}/holidays` },
          { icon: Settings, label: "Postavke", href: `${baseUrl}/settings` },
        ];

      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-lg font-semibold">{organisation.name}</h1>
        </div>
        <nav className="space-y-1 p-4">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b px-6">
          <div>
            <h2 className="text-lg font-semibold">
              {currentUser.firstName} {currentUser.lastName}
            </h2>
            <p className="text-sm text-muted-foreground">{currentUser.email}</p>
          </div>
          <RoleSwitcher />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

