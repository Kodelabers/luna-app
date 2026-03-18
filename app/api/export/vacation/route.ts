import { NextResponse } from "next/server";
import { z } from "zod";
import {
	resolveTenantContext,
	requireDepartmentAccess,
} from "@/lib/tenant/resolveTenantContext";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import { getVacationExportData } from "@/lib/services/vacation-export";
import { generateVacationPdf } from "@/lib/export/vacation-pdf";
import { generateVacationXlsx } from "@/lib/export/vacation-xlsx";
import { type ExportFormat } from "@/lib/export/vacation-translations";

const EXPORT_FORMATS = ["pdf", "xlsx"] as const satisfies readonly ExportFormat[];

function normalizeFilename(str: string): string {
	const map: Record<string, string> = {
		č: "c",
		ć: "c",
		š: "s",
		ž: "z",
		đ: "d",
		Č: "C",
		Ć: "C",
		Š: "S",
		Ž: "Z",
		Đ: "D",
	};
	return str
		.replace(/[čćšžđČĆŠŽĐ]/g, (c) => map[c] ?? c)
		.replace(/[^a-zA-Z0-9-]/g, "-")
		.toLowerCase();
}

const paramsSchema = z.object({
	org: z.string().min(1),
	departmentId: z.string().min(1),
	year: z.coerce.number().int().min(2000).max(2100),
	format: z.enum(EXPORT_FORMATS),
	locale: z.enum(["hr", "en"]).default("hr"),
});

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const parsed = paramsSchema.safeParse({
			org: url.searchParams.get("org"),
			departmentId: url.searchParams.get("departmentId"),
			year: url.searchParams.get("year"),
			format: url.searchParams.get("format"),
			locale: url.searchParams.get("locale") ?? "hr",
		});

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues },
				{ status: 400 },
			);
		}

		const { org, departmentId, year, format, locale } = parsed.data;

		const ctx = await resolveTenantContext(org);
		await requireDepartmentAccess(ctx, departmentId);

		const data = await getVacationExportData(ctx, departmentId, year);

		const baseName = locale === "hr" ? "godisnji-odmor" : "annual-leave";
		const deptSlug = normalizeFilename(data.departmentName);

		if (format === "pdf") {
			const buffer = await generateVacationPdf(data, locale);
			return new NextResponse(new Uint8Array(buffer), {
				headers: {
					"Content-Type": "application/pdf",
					"Content-Disposition": `attachment; filename="${baseName}-${deptSlug}-${year}.pdf"`,
				},
			});
		}

		// xlsx
		const buffer = await generateVacationXlsx(data, locale);
		return new NextResponse(new Uint8Array(buffer), {
			headers: {
				"Content-Type":
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				"Content-Disposition": `attachment; filename="${baseName}-${deptSlug}-${year}.xlsx"`,
			},
		});
	} catch (err: unknown) {
		if (err instanceof NotFoundError) {
			return NextResponse.json({ error: err.message }, { status: 404 });
		}
		if (err instanceof ForbiddenError) {
			return NextResponse.json({ error: err.message }, { status: 403 });
		}
		console.error("Export error:", err);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
