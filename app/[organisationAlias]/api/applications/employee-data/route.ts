import { NextRequest, NextResponse } from "next/server";
import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { getEmployeeMonthCalendar } from "@/lib/services/calendar";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organisationAlias: string }> }
) {
  try {
    const { organisationAlias } = await params;
    const ctx = await resolveTenantContext(organisationAlias);

    const body = await request.json();
    const { employeeId } = body;

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
    const clientTimeZone = "Europe/Zagreb"; // TODO: Get from user preferences
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

    // Fetch ledger balance for reasons with planning
    const currentYear = now.getFullYear();
    const ledgerEntries = await db.unavailabilityLedgerEntry.findMany({
      where: {
        organisationId: ctx.organisationId,
        employeeId,
        year: {
          in: [currentYear - 1, currentYear, currentYear + 1],
        },
      },
      include: {
        unavailabilityReason: {
          select: {
            id: true,
            name: true,
            hasPlanning: true,
          },
        },
      },
    });

    // Group by reason and year, calculate balance
    const ledgerBalance = new Map<
      number,
      {
        reasonId: number;
        reasonName: string;
        byYear: Map<number, { allocated: number; used: number; remaining: number }>;
      }
    >();

    ledgerEntries.forEach((entry) => {
      if (!entry.unavailabilityReason.hasPlanning) return;

      if (!ledgerBalance.has(entry.unavailabilityReasonId)) {
        ledgerBalance.set(entry.unavailabilityReasonId, {
          reasonId: entry.unavailabilityReasonId,
          reasonName: entry.unavailabilityReason.name,
          byYear: new Map(),
        });
      }

      const reasonData = ledgerBalance.get(entry.unavailabilityReasonId)!;
      if (!reasonData.byYear.has(entry.year)) {
        reasonData.byYear.set(entry.year, {
          allocated: 0,
          used: 0,
          remaining: 0,
        });
      }

      const yearData = reasonData.byYear.get(entry.year)!;
      if (entry.type === "ALLOCATION") {
        yearData.allocated += entry.changeDays;
      } else if (entry.type === "USAGE") {
        yearData.used += Math.abs(entry.changeDays);
      }
      yearData.remaining = yearData.allocated - yearData.used;
    });

    // Convert to serializable format
    const ledgerBalanceSerialized = Array.from(ledgerBalance.values()).map(
      (reason) => ({
        reasonId: reason.reasonId,
        reasonName: reason.reasonName,
        byYear: Array.from(reason.byYear.entries()).map(([year, data]) => ({
          year,
          ...data,
        })),
      })
    );

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

