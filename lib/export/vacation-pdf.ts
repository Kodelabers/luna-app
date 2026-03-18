import type { VacationExportData } from "@/lib/services/vacation-export";

// pdfmake 0.3.x imports
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfMake = require("pdfmake/build/pdfmake");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vfs = require("pdfmake/build/vfs_fonts");

// One-time module-level setup
pdfMake.addVirtualFileSystem(vfs);
pdfMake.addFonts({
	Roboto: {
		normal: "Roboto-Regular.ttf",
		bold: "Roboto-Medium.ttf",
		italics: "Roboto-Italic.ttf",
		bolditalics: "Roboto-MediumItalic.ttf",
	},
});

type PdfLocale = "hr" | "en";

type PdfTranslations = {
	months: string[];
	departmentLabel: string;
	nameCol: string;
	totalCol: string;
	periodJoin: (start: string, end: string, days: number) => string;
	footnote: string;
	approvedBy: string;
};

const TRANSLATIONS: Record<PdfLocale, PdfTranslations> = {
	hr: {
		months: [
			"Siječanj",
			"Veljača",
			"Ožujak",
			"Travanj",
			"Svibanj",
			"Lipanj",
			"Srpanj",
			"Kolovoz",
			"Rujan",
			"Listopad",
			"Studeni",
			"Prosinac",
		],
		departmentLabel: "ODJEL",
		nameCol: "PREZIME I IME",
		totalCol: "UK",
		periodJoin: (s, e, d) => `${s} do ${e}, dana ${d}`,
		footnote:
			"* RADNICIMA KOJIMA SE NE MOŽE PLANIRATI DATUM KORIŠTENJA GODIŠNJEG ODMORA, IZDAT ĆE SE RJEŠENJE PO ODOBRENJU ISTOG.",
		approvedBy: "Odobrio: ___________________",
	},
	en: {
		months: [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December",
		],
		departmentLabel: "DEPARTMENT",
		nameCol: "FULL NAME",
		totalCol: "TOTAL",
		periodJoin: (s, e, d) => `${s} to ${e}, ${d} days`,
		footnote:
			"* EMPLOYEES WHO CANNOT HAVE THEIR ANNUAL LEAVE DATES PLANNED WILL BE ISSUED A DECISION UPON APPROVAL.",
		approvedBy: "Approved by: ___________________",
	},
};

export async function generateVacationPdf(
	data: VacationExportData,
	locale: PdfLocale = "hr",
): Promise<Buffer> {
	const t = TRANSLATIONS[locale];

	const headerRow = [
		{ text: t.nameCol, bold: true, fillColor: "#eeeeee", alignment: "center" },
		{ text: t.totalCol, bold: true, fillColor: "#eeeeee", alignment: "center" },
		...t.months.map((m) => ({
			text: m,
			bold: true,
			fillColor: "#eeeeee",
			alignment: "center",
		})),
	];

	const dataRows = data.employees.map((emp) => {
		const monthCells = emp.months.map((m, i) => {
			// First month with no periods gets "*" if employee can't plan
			if (!emp.canPlanVacation && i === 0 && m.periods.length === 0) {
				return "*";
			}
			return (
				m.periods.map((p) => t.periodJoin(p.start, p.end, p.days)).join("\n") ||
				""
			);
		});

		return [
			{ text: emp.fullName, bold: true },
			{ text: emp.totalDays, alignment: "center" },
			...monthCells,
		];
	});

	const docDefinition = {
		pageOrientation: "landscape" as const,
		pageSize: "A4",
		pageMargins: [15, 15, 15, 15],
		defaultStyle: { font: "Roboto", fontSize: 7 },
		content: [
			{
				text: `${t.departmentLabel} ${data.departmentName.toUpperCase()}`,
				bold: true,
				fontSize: 9,
				marginBottom: 8,
			},
			{
				table: {
					headerRows: 1,
					widths: [100, 18, ...Array(12).fill("*")],
					body: [headerRow, ...dataRows],
				},
				layout: {
					hLineWidth: () => 0.5,
					vLineWidth: () => 0.5,
					hLineColor: () => "#000000",
					vLineColor: () => "#000000",
					paddingLeft: () => 2,
					paddingRight: () => 2,
					paddingTop: () => 1,
					paddingBottom: () => 1,
				},
			},
			{ text: t.footnote, fontSize: 6, marginTop: 8, italics: true },
			{ text: `${t.approvedBy}`, marginTop: 20, fontSize: 8 },
		],
	};

	return pdfMake.createPdf(docDefinition).getBuffer();
}
