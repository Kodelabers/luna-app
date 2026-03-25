import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { BreadcrumbSegmentUpdater } from "@/components/breadcrumb-context";

type Props = {
  children: React.ReactNode;
  params: Promise<{ organisationAlias: string; reasonId: string }>;
};

export default async function ProfileDaysReasonLayout({ children, params }: Props) {
  const { organisationAlias, reasonId } = await params;
  const ctx = await resolveTenantContext(organisationAlias);

  const reason = await db.unavailabilityReason.findFirst({
    where: {
      id: reasonId,
      organisationId: ctx.organisationId,
      active: true,
    },
    select: { name: true },
  });

  if (!reason) {
    notFound();
  }

  return (
    <>
      <BreadcrumbSegmentUpdater segmentKey={reasonId} segmentValue={reason.name} />
      {children}
    </>
  );
}
