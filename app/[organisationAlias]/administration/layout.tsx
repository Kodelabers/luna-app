import { resolveTenantContext, requireAdmin } from "@/lib/tenant/resolveTenantContext";
import { ForbiddenError } from "@/lib/errors";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
  params: Promise<{ organisationAlias: string }>;
};

export default async function AdministrationLayout({ children, params }: Props) {
  const { organisationAlias } = await params;

  try {
    const ctx = await resolveTenantContext(organisationAlias);
    requireAdmin(ctx);

    const navItems = [
      { href: `/${organisationAlias}/administration/departments`, label: "Odjeli" },
      { href: `/${organisationAlias}/administration/employees`, label: "Zaposlenici" },
      { href: `/${organisationAlias}/administration/members`, label: "Članovi" },
      { href: `/${organisationAlias}/administration/unavailability-reasons`, label: "Razlozi izostanka" },
      { href: `/${organisationAlias}/administration/holidays`, label: "Blagdani" },
    ];

    return (
      <div className="space-y-6">
        {/* Admin navigation */}
        <div className="flex flex-wrap gap-2 border-b pb-4">
          {navItems.map((item) => (
            <Button key={item.href} variant="ghost" size="sm" asChild>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>

        {/* Admin content */}
        {children}
      </div>
    );
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Pristup odbijen</h1>
            <p className="mt-2 text-muted-foreground">
              Nemate administratorska prava za pristup ovoj stranici.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/${organisationAlias}`}>Povratak na dashboard</Link>
            </Button>
          </div>
        </div>
      );
    }
    throw error;
  }
}

