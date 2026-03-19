"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { isExportFormat, type ExportFormat } from "@/lib/export/vacation-translations";

type Props = {
	organisationAlias: string;
	departmentId: string;
};

export function VacationExportDialog({
	organisationAlias,
	departmentId,
}: Props) {
	const t = useTranslations("vacationExport");
	const locale = useLocale();
	const currentYear = new Date().getFullYear();
	const [open, setOpen] = useState(false);
	const [year, setYear] = useState(String(currentYear));
	const [format, setFormat] = useState<ExportFormat>("pdf");
	const [isLoading, setIsLoading] = useState(false);

	const handleExport = async () => {
		setIsLoading(true);
		try {
			const params = new URLSearchParams({
				org: organisationAlias,
				departmentId,
				year,
				format,
				locale,
			});
			const res = await fetch(`/api/export/vacation?${params}`);
			if (!res.ok) {
				toast.error(t("error"));
				return;
			}
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			const disposition = res.headers.get("Content-Disposition");
			const match = disposition?.match(/filename="([^"]+)"/);
			const ext = format === "pdf" ? "pdf" : "xlsx";
			const baseName = locale === "hr" ? "godisnji-odmor" : "annual-leave";
			a.download = match?.[1] ?? `${baseName}-${year}.${ext}`;
			a.click();
			URL.revokeObjectURL(url);
			setOpen(false);
		} catch {
			toast.error(t("error"));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<Button variant="outline" size="sm" onClick={() => setOpen(true)}>
				<Download className="mr-2 h-4 w-4" />
				{t("trigger")}
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-[380px]">
					<DialogHeader>
						<DialogTitle>{t("title")}</DialogTitle>
					</DialogHeader>

					<div className="space-y-5 py-2">
						<div className="space-y-2">
							<Label>{t("yearLabel")}</Label>
							<RadioGroup
								value={year}
								onValueChange={setYear}
								className="flex gap-4"
							>
								<div className="flex items-center space-x-2">
									<RadioGroupItem
										value={String(currentYear)}
										id="year-current"
									/>
									<Label
										htmlFor="year-current"
										className="font-normal cursor-pointer"
									>
										{t("currentYear", { year: currentYear })}
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem
										value={String(currentYear + 1)}
										id="year-next"
									/>
									<Label
										htmlFor="year-next"
										className="font-normal cursor-pointer"
									>
										{t("nextYear", { year: currentYear + 1 })}
									</Label>
								</div>
							</RadioGroup>
						</div>

						<div className="space-y-2">
							<Label>{t("formatLabel")}</Label>
							<RadioGroup
								value={format}
								onValueChange={(v) => { if (isExportFormat(v)) setFormat(v); }}
								className="flex gap-4"
							>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="pdf" id="fmt-pdf" />
									<Label
										htmlFor="fmt-pdf"
										className="font-normal cursor-pointer"
									>
										{t("formatPdf")}
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="xlsx" id="fmt-xlsx" />
									<Label
										htmlFor="fmt-xlsx"
										className="font-normal cursor-pointer"
									>
										{t("formatXlsx")}
									</Label>
								</div>
							</RadioGroup>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={isLoading}
						>
							{t("cancel")}
						</Button>
						<Button onClick={handleExport} disabled={isLoading}>
							{isLoading ? t("generating") : t("download")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
