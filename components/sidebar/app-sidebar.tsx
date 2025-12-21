"use client";

import { LayoutDashboard, Settings } from "lucide-react";

import { NavMain, type NavItem } from "@/components/sidebar/nav-main";
import { NavDepartments, type Department } from "@/components/sidebar/nav-departments";
import { NavUser } from "@/components/sidebar/nav-user";
import { OrgHeader } from "@/components/sidebar/org-header";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  organisation: {
    name: string;
    logoUrl?: string | null;
  };
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  organisationAlias: string;
  isAdmin: boolean;
  managedDepartments: Department[];
};

export function AppSidebar({
  organisation,
  user,
  organisationAlias,
  isAdmin,
  managedDepartments,
  ...props
}: AppSidebarProps) {
  // Main navigation items (visible to all)
  const mainNavItems: NavItem[] = [
    {
      title: "Nadzorna ploča",
      url: `/${organisationAlias}`,
      icon: LayoutDashboard,
    },
  ];

  // Admin navigation items
  const adminNavItems: NavItem[] = [
    {
      title: "Administracija",
      url: `/${organisationAlias}/administration`,
      icon: Settings,
      items: [
        {
          title: "Odjeli",
          url: `/${organisationAlias}/administration/departments`,
        },
        {
          title: "Zaposlenici",
          url: `/${organisationAlias}/administration/employees`,
        },
        {
          title: "Članovi",
          url: `/${organisationAlias}/administration/members`,
        },
        {
          title: "Razlozi nedostupnosti",
          url: `/${organisationAlias}/administration/unavailability-reasons`,
        },
        {
          title: "Praznici",
          url: `/${organisationAlias}/administration/holidays`,
        },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrgHeader organisation={organisation} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainNavItems} />
        
        {/* Manager departments section */}
        {managedDepartments.length > 0 && (
          <>
            <SidebarSeparator />
            <NavDepartments
              departments={managedDepartments}
              organisationAlias={organisationAlias}
            />
          </>
        )}

        {/* Admin section */}
        {isAdmin && (
          <>
            <SidebarSeparator />
            <NavMain items={adminNavItems} label="Upravljanje" />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

