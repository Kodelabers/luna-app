export type ExportLocale = "hr" | "en";
export type ExportFormat = "pdf" | "xlsx";

export function isExportFormat(v: string): v is ExportFormat {
	return v === "pdf" || v === "xlsx";
}

export type ExportTranslations = {
	months: string[];
	departmentLabel: string;
	nameCol: string;
	totalCol: string;
	periodJoin: (start: string, end: string, days: number) => string;
	footnote: string;
	approvedBy: string;
};

export const TRANSLATIONS: Record<ExportLocale, ExportTranslations> = {
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
