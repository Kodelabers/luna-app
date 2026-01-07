import { NextRequest, NextResponse } from "next/server";
import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { getEmployeeMonthCalendar } from "@/lib/services/calendar";
import { getDaysBalanceForEmployee } from "@/lib/services/days-balance";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organisationAlias: string }> }
) {
  try {
    const { organisationAlias } = await params;
    const ctx = await resolveTenantContext(organisationAlias);

    const body = await request.json();
    const { employeeId, clientTimeZone = "Europe/Zagreb" } = body;

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    // Verify employee belongs to organisation
    const employee = await db.employee.findFirst({
      where: {
        id: employeeId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Fetch calendar data for the next 12 months
    const now = new Date();
    const calendarDays = await getEmployeeMonthCalendar(ctx, {
      employeeId,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      clientTimeZone,
      numberOfMonths: 12,
    });

    // Fetch pending applications (SUBMITTED, APPROVED_FIRST_LEVEL, DRAFT)
    const pendingApplications = await db.application.findMany({
      where: {
        organisationId: ctx.organisationId,
        employeeId,
        active: true,
        status: {
          in: ["DRAFT", "SUBMITTED", "APPROVED_FIRST_LEVEL"],
        },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
        unavailabilityReason: {
          select: {
            colorCode: true,
          },
        },
      },
    });

    // Get ledger balance using openYear logic from days-balance service
    const currentYear = now.getFullYear();
    const daysBalance = await getDaysBalanceForEmployee(
      ctx,
      employeeId,
      currentYear,
      clientTimeZone
    );

    // Convert to format expected by form (openYear-based)
    const ledgerBalanceSerialized = daysBalance.map((balance) => ({
      reasonId: balance.unavailabilityReasonId,
      reasonName: balance.unavailabilityReasonName,
      colorCode: balance.unavailabilityReasonColorCode,
      openYear: balance.openYear,
      remaining: balance.breakdown.remaining,
      pending: balance.breakdown.pending,
      balance: balance.breakdown.balance,
    }));

    return NextResponse.json({
      calendarDays,
      pendingApplications,
      ledgerBalance: ledgerBalanceSerialized,
    });
  } catch (error) {
    console.error("Error fetching employee data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

