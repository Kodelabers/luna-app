"use client";

import { LayoutDashboard, Settings, FileText, CalendarDays, User, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";

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
import { Separator } from "../ui/separator";

type PlanningAbsenceReason = {
  id: string;
  name: string;
  colorCode: string | null;
};

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
  planningAbsenceReasons: PlanningAbsenceReason[];
};

export function AppSidebar({
  organisation,
  user,
  organisationAlias,
  isAdmin,
  managedDepartments,
  planningAbsenceReasons,
  ...props
}: AppSidebarProps) {
  const t = useTranslations("nav");

  // Main navigation items (visible to all)
  const mainNavItems: NavItem[] = [
    {
      title: t("dashboard"),
      url: `/${organisationAlias}`,
      icon: LayoutDashboard,
    },
    {
      title: t("applications"),
      url: `/${organisationAlias}/applications`,
      icon: FileText,
    },
    {
      title: t("profile"),
      url: `/${organisationAlias}/profile`,
      icon: User,
    },
  ];

  // Manager navigation items (visible to DM/GM)
  const managerNavItems: NavItem[] = [
    {
      title: t("planning"),
      url: `/${organisationAlias}/planning`,
      icon: CalendarDays,
    },
  ];

  // Admin navigation items
  const adminNavItems: NavItem[] = [
    {
      title: t("administration"),
      url: `/${organisationAlias}/administration`,
      icon: Settings,
      items: [
        {
          title: t("departments"),
          url: `/${organisationAlias}/administration/departments`,
        },
        {
          title: t("employees"),
          url: `/${organisationAlias}/administration/employees`,
        },
        {
          title: t("managers"),
          url: `/${organisationAlias}/administration/managers`,
        },
        {
          title: t("members"),
          url: `/${organisationAlias}/administration/members`,
        },
        {
          title: t("unavailabilityReasons"),
          url: `/${organisationAlias}/administration/unavailability-reasons`,
        },
        {
          title: t("holidays"),
          url: `/${organisationAlias}/administration/holidays`,
        },
        // Planning absence with sub-items for each reason
        ...(planningAbsenceReasons.length > 0
          ? [
              {
                title: t("planningAbsence"),
                url: `/${organisationAlias}/administration/days-balance`,
                colorCode: null,
                items: planningAbsenceReasons.map((reason) => ({
                  title: reason.name,
                  url: `/${organisationAlias}/administration/days-balance/${reason.id}`,
                  colorCode: reason.colorCode,
                })),
              },
            ]
          : []),
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
        
        {/* Manager section - Planning */}
        {managedDepartments.length > 0 && (
          <>
            <Separator />
            <NavMain items={managerNavItems} />
          </>
        )}
        
        {/* Manager departments section */}
        {managedDepartments.length > 0 && (
          <>
            <Separator />
            <NavDepartments
              departments={managedDepartments}
              organisationAlias={organisationAlias}
            />
          </>
        )}

        {/* Admin section - visible to admins and managers with planning access */}
        {(isAdmin || planningAbsenceReasons.length > 0) && (
          <>
            <Separator />
            <NavMain items={adminNavItems} label={t("management")} />
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

