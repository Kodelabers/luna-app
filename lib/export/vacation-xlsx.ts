import ExcelJS from "exceljs";
import type { VacationExportData } from "@/lib/services/vacation-export";
import { TRANSLATIONS, type ExportLocale } from "./vacation-translations";

export async function generateVacationXlsx(
  data: VacationExportData,
  locale: ExportLocale = "hr"
): Promise<Buffer> {
  const t = TRANSLATIONS[locale];

  const workbook = new ExcelJS.Workbook();
  const safeName = data.departmentName.replace(/[\\/*?:[\]|]/g, "_").slice(0, 31);
  const sheet = workbook.addWorksheet(safeName, {
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  // --- Column widths ---
  sheet.columns = [
    { width: 28 },          // name
    { width: 6 },           // total
    ...Array(12).fill({ width: 22 }),  // months
  ];

  // --- Row 1: merged department header ---
  sheet.mergeCells(1, 1, 1, 14);
  const headerCell = sheet.getCell(1, 1);
  headerCell.value = `${t.departmentLabel} ${data.departmentName.toUpperCase()}`;
  headerCell.font = { bold: true, size: 9 };
  headerCell.alignment = { horizontal: "left", vertical: "middle" };
  sheet.getRow(1).height = 20;

  // --- Row 2: column headers ---
  const colHeaderRow = sheet.getRow(2);
  colHeaderRow.height = 18;
  const colHeaders = [t.nameCol, t.totalCol, ...t.months];
  colHeaders.forEach((text, i) => {
    const cell = colHeaderRow.getCell(i + 1);
    cell.value = text;
    cell.font = { bold: true, size: 9 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEEEEEE" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });

  // --- Rows 3+: employee data ---
  data.employees.forEach((emp) => {
    const rowIndex = sheet.rowCount + 1;
    const row = sheet.getRow(rowIndex);

    const nameCell = row.getCell(1);
    nameCell.value = emp.fullName;
    nameCell.font = { bold: true, size: 8 };
    nameCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    nameCell.alignment = { vertical: "middle" };

    const ukCell = row.getCell(2);
    ukCell.value = emp.totalDays;
    ukCell.font = { size: 8 };
    ukCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    ukCell.alignment = { horizontal: "center", vertical: "middle" };

    emp.months.forEach((month, i) => {
      const cell = row.getCell(i + 3);
      // Mirror PDF: * goes into the first month cell when employee can't plan and that month is empty
      let text: string;
      if (!emp.canPlanVacation && i === 0 && month.periods.length === 0) {
        text = "*";
      } else {
        text = month.periods.map((p) => t.periodJoin(p.start, p.end, p.days)).join("\n");
      }
      cell.value = text || null;
      cell.font = { size: 8 };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", wrapText: true };
    });

    const maxPeriods = Math.max(...emp.months.map((m) => m.periods.length), 1);
    row.height = Math.max(18, maxPeriods * 15);
  });

  // --- Footnote (always shown, same as PDF) ---
  const footerStartRow = sheet.rowCount + 2;
  sheet.mergeCells(footerStartRow, 1, footerStartRow, 14);
  const footnoteCell = sheet.getCell(footerStartRow, 1);
  footnoteCell.value = t.footnote;
  footnoteCell.font = { size: 7, italic: true };
  footnoteCell.alignment = { wrapText: true };
  sheet.getRow(footerStartRow).height = 30;

  // --- Signature line ---
  const signRowIndex = sheet.rowCount + 2;
  sheet.mergeCells(signRowIndex, 1, signRowIndex, 4);
  const signCell = sheet.getCell(signRowIndex, 1);
  signCell.value = t.approvedBy;
  signCell.font = { size: 10 };
  sheet.getRow(signRowIndex).height = 20;

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
