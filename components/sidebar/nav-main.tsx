"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";

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

export type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  items?: {
    title: string;
    url: string;
    colorCode?: string | null;
    items?: {
      title: string;
      url: string;
      colorCode?: string | null;
    }[];
  }[];
};

export function NavMain({
  items,
  label,
}: {
  items: NavItem[];
  label?: string;
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          const isActive =
            pathname === item.url ||
            pathname.startsWith(item.url + "/") ||
            item.items?.some((subItem) => pathname === subItem.url || pathname.startsWith(subItem.url + "/"));

          if (!item.items || item.items.length === 0) {
            // Simple menu item without subitems
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          // Collapsible menu item with subitems
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => {
                      const hasSubItems = subItem.items && subItem.items.length > 0;
                      const isSubItemActive =
                        pathname === subItem.url ||
                        pathname.startsWith(subItem.url + "/") ||
                        (hasSubItems &&
                          subItem.items!.some(
                            (nestedItem) =>
                              pathname === nestedItem.url || pathname.startsWith(nestedItem.url + "/")
                          ));

                      if (hasSubItems) {
                        // Sub-item with nested items (3rd level)
                        return (
                          <Collapsible
                            key={subItem.title}
                            asChild
                            defaultOpen={isSubItemActive}
                            className="group/nested"
                          >
                            <SidebarMenuSubItem>
                              <CollapsibleTrigger asChild>
                                <SidebarMenuSubButton isActive={isSubItemActive}>
                                  <div className="flex items-center gap-2 flex-1">
                                    {subItem.colorCode && (
                                      <div
                                        className="h-3 w-3 rounded-sm shrink-0"
                                        style={{ backgroundColor: subItem.colorCode }}
                                      />
                                    )}
                                    <span>{subItem.title}</span>
                                  </div>
                                  <ChevronRight className="ml-auto h-3 w-3 transition-transform duration-200 group-data-[state=open]/nested:rotate-90" />
                                </SidebarMenuSubButton>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <SidebarMenuSub>
                                  {subItem.items!.map((nestedItem) => (
                                    <SidebarMenuSubItem key={nestedItem.title}>
                                      <SidebarMenuSubButton
                                        asChild
                                        isActive={
                                          pathname === nestedItem.url ||
                                          pathname.startsWith(nestedItem.url + "/")
                                        }
                                      >
                                        <Link href={nestedItem.url} className="flex items-center gap-2">
                                          {nestedItem.colorCode && (
                                            <div
                                              className="h-3 w-3 rounded-sm shrink-0"
                                              style={{ backgroundColor: nestedItem.colorCode }}
                                            />
                                          )}
                                          <span>{nestedItem.title}</span>
                                        </Link>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  ))}
                                </SidebarMenuSub>
                              </CollapsibleContent>
                            </SidebarMenuSubItem>
                          </Collapsible>
                        );
                      }

                      // Regular sub-item (2nd level)
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === subItem.url || pathname.startsWith(subItem.url + "/")}
                          >
                            <Link href={subItem.url} className="flex items-center gap-2">
                              {subItem.colorCode && (
                                <div
                                  className="h-3 w-3 rounded-sm shrink-0"
                                  style={{ backgroundColor: subItem.colorCode }}
                                />
                              )}
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
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

