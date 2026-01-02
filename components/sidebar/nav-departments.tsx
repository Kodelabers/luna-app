"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building, FileText, Users } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export type Department = {
  id: string;
  name: string;
  alias: string;
  colorCode: string | null;
};

export function NavDepartments({
  departments,
  organisationAlias,
}: {
  departments: Department[];
  organisationAlias: string;
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  if (departments.length === 0) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("departments")}</SidebarGroupLabel>
      <SidebarMenu>
        {departments.map((dept) => {
          const deptBasePath = `/${organisationAlias}/department/${dept.id}`;
          const isActive = pathname.startsWith(deptBasePath);

          const subItems = [
            { title: t("overview"), url: deptBasePath, icon: Building },
            { title: t("employees"), url: `${deptBasePath}/employees`, icon: Users },
            { title: t("applications"), url: `${deptBasePath}/applications`, icon: FileText },
          ];

          return (
            <Collapsible
              key={dept.id}
              asChild
              defaultOpen={isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={dept.name} isActive={isActive}>
                    <div className="text-white  -opacity-60 rounded-sm p-1" style={{backgroundColor: dept.colorCode ?? undefined}}>
                      <Building className="size-3 shrink-0"/>
                    </div>
                    <span className="truncate">{dept.name}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {subItems.map((item) => (
                      <SidebarMenuSubItem key={item.url}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === item.url}
                        >
                          <Link href={item.url}>
                            <item.icon className="size-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

