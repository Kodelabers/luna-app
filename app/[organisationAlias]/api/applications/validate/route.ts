import { NextRequest, NextResponse } from "next/server";
import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { validateApplicationDraft } from "@/lib/services/application";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organisationAlias: string }> }
) {
  try {
    const { organisationAlias } = await params;
    const ctx = await resolveTenantContext(organisationAlias);

    const body = await request.json();
    const result = await validateApplicationDraft(ctx, body);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Validation failed" },
      { status: 400 }
    );
  }
}

