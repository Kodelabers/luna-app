"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

type Props = {
  organisationAlias: string;
  organisationName: string;
};

export function DynamicBreadcrumb({ organisationAlias, organisationName }: Props) {
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const tAdmin = useTranslations("admin");

  // Map URL segments to translation keys
  const segmentLabels: Record<string, string> = {
    administration: tNav("administration"),
    departments: tNav("departments"),
    employees: tNav("employees"),
    members: tNav("members"),
    holidays: tNav("holidays"),
    "unavailability-reasons": tAdmin("absenceReasons"),
    department: tNav("departments"),
  };

  // Parse the pathname and build breadcrumb items
  const buildBreadcrumbs = () => {
    // Remove the organisation alias from the path
    const pathWithoutOrg = pathname.replace(`/${organisationAlias}`, "");
    const segments = pathWithoutOrg.split("/").filter(Boolean);

    const items: { label: string; href?: string }[] = [
      { label: organisationName, href: `/${organisationAlias}` },
    ];

    let currentPath = `/${organisationAlias}`;

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      // Skip UUID-like segments (department IDs, etc.) - they'll be handled separately
      if (segment.match(/^[0-9a-f-]{36}$/i)) {
        return;
      }

      const label = segmentLabels[segment] || segment;
      items.push({
        label,
        href: isLast ? undefined : currentPath,
      });
    });

    return items;
  };

  const breadcrumbs = buildBreadcrumbs();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <React.Fragment key={`${item.label}-${index}`}>
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

