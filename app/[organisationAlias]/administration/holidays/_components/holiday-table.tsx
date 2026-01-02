"use client";

import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { HolidayActions } from "./holiday-actions";
import { format } from "date-fns";
import { hr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { Repeat, CalendarDays } from "lucide-react";

type Holiday = {
  id: string;
  name: string;
  date: Date;
  repeatYearly: boolean;
};

type HolidayTableProps = {
  holidays: Holiday[];
  organisationAlias: string;
};

export function HolidayTable({ holidays, organisationAlias }: HolidayTableProps) {
  const t = useTranslations("holidays");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const dateLocale = locale === "hr" ? hr : enUS;

  if (holidays.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">{t("noSearchResults")}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>{t("name")}</TableHead>
          <TableHead>{t("date")}</TableHead>
          <TableHead>{t("repeatYearly")}</TableHead>
          <TableHead className="text-right">{tCommon("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {holidays.map((holiday, index) => (
          <TableRow key={holiday.id}>
            <TableCell className="text-xs text-muted-foreground">
              {index + 1}
            </TableCell>
            <TableCell className="font-medium">{holiday.name}</TableCell>
            <TableCell>
              {holiday.repeatYearly
                ? format(holiday.date, "dd. MMMM", { locale: dateLocale })
                : format(holiday.date, "dd. MMMM yyyy.", { locale: dateLocale })}
            </TableCell>
            <TableCell>
              {holiday.repeatYearly ? (
                <Badge variant="secondary" className="gap-1">
                  <Repeat className="h-3 w-3" />
                  {t("yearly")}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {t("oneTime")}
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <HolidayActions
                holiday={holiday}
                organisationAlias={organisationAlias}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

