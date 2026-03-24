import { resolveTenantContext, requireDepartmentAccess } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { BreadcrumbSegmentUpdater } from "@/components/breadcrumb-context";

type Props = {
  children: React.ReactNode;
  params: Promise<{ organisationAlias: string; departmentId: string }>;
};

export default async function DepartmentLayout({ children, params }: Props) {
  const { organisationAlias, departmentId } = await params;
  const ctx = await resolveTenantContext(organisationAlias);

  await requireDepartmentAccess(ctx, departmentId);

  const department = await db.department.findFirst({
    where: {
      id: departmentId,
      organisationId: ctx.organisationId,
      active: true,
    },
    select: { name: true },
  });

  if (!department) {
    notFound();
  }

  return (
    <>
      <BreadcrumbSegmentUpdater segmentKey={departmentId} segmentValue={department.name} />
      {children}
    </>
  );
}
