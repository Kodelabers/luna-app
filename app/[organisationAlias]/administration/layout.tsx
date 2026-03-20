import { resolveTenantContext, requireAdmin } from "@/lib/tenant/resolveTenantContext";
import { ForbiddenError } from "@/lib/errors";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

type Props = {
  children: React.ReactNode;
  params: Promise<{ organisationAlias: string }>;
};

export default async function AdministrationLayout({ children, params }: Props) {
  const { organisationAlias } = await params;
  const tAdmin = await getTranslations("admin");

  try {
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    return <>{children}</>;
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{tAdmin("accessDenied")}</h1>
            <p className="mt-2 text-muted-foreground">
              {tAdmin("noAdminRights")}
            </p>
            <Button asChild className="mt-4">
              <Link href={`/${organisationAlias}`}>{tAdmin("backToDashboard")}</Link>
            </Button>
          </div>
        </div>
      );
    }
    throw error;
  }
}

