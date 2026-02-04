"use client";

import { Building2, Check, ChevronsUpDown } from "lucide-react";
import Link from "next/link";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserOrganisation = {
  id: string;
  name: string;
  alias: string;
  logoUrl: string | null;
};

type OrgHeaderProps = {
  organisation: {
    name: string;
    logoUrl?: string | null;
  };
  organisationAlias: string;
  userOrganisations: UserOrganisation[];
};

function OrgLogo({ logoUrl, name }: { logoUrl?: string | null; name: string }) {
  return (
    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={name}
          className="size-5 rounded"
        />
      ) : (
        <Building2 className="size-4" />
      )}
    </div>
  );
}

export function OrgHeader({
  organisation,
  organisationAlias,
  userOrganisations,
}: OrgHeaderProps) {
  // If user has only one organisation, show static header
  if (userOrganisations.length <= 1) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-default hover:bg-transparent"
          >
            <OrgLogo logoUrl={organisation.logoUrl} name={organisation.name} />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{organisation.name}</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // If user has multiple organisations, show dropdown
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <OrgLogo logoUrl={organisation.logoUrl} name={organisation.name} />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{organisation.name}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side="right"
            align="start"
            sideOffset={4}
          >
            {userOrganisations.map((org) => {
              const isCurrentOrg = org.alias === organisationAlias;
              return (
                <DropdownMenuItem key={org.id} asChild>
                  <Link
                    href={`/${org.alias}`}
                    className="flex items-center gap-2 px-2 py-2"
                  >
                    <OrgLogo logoUrl={org.logoUrl} name={org.name} />
                    <div className="flex-1 text-sm font-medium">
                      {org.name}
                    </div>
                    {isCurrentOrg && (
                      <Check className="ml-auto size-4" />
                    )}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

