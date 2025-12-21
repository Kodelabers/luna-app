"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building, FileText, Users } from "lucide-react";
import { ChevronRight } from "lucide-react";

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
  id: number;
  name: string;
  alias: string;
};

export function NavDepartments({
  departments,
  organisationAlias,
}: {
  departments: Department[];
  organisationAlias: string;
}) {
  const pathname = usePathname();

  if (departments.length === 0) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Odjeli</SidebarGroupLabel>
      <SidebarMenu>
        {departments.map((dept) => {
          const deptBasePath = `/${organisationAlias}/department/${dept.id}`;
          const isActive = pathname.startsWith(deptBasePath);

          const subItems = [
            { title: "Pregled", url: deptBasePath, icon: Building },
            { title: "Zaposlenici", url: `${deptBasePath}/employees`, icon: Users },
            { title: "Zahtjevi", url: `${deptBasePath}/applications`, icon: FileText },
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
                    <Building />
                    <span>{dept.name}</span>
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

