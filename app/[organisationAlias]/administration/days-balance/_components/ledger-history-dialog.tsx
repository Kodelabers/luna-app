"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getLedgerHistoryAction } from "@/lib/actions/days-balance";
import { format } from "date-fns";
import { hr, enUS } from "date-fns/locale";

type LedgerHistoryDialogProps = {
  organisationAlias: string;
  employeeId: string;
  unavailabilityReasonId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LedgerHistoryDialog({
  organisationAlias,
  employeeId,
  unavailabilityReasonId,
  open,
  onOpenChange,
}: LedgerHistoryDialogProps) {
  const t = useTranslations("ledgerHistory");
  const locale = useLocale();
  const dateLocale = locale === "hr" ? hr : enUS;
  const [entries, setEntries] = useState<Array<{
    id: string;
    year: number;
    type: string;
    typeLabel: string;
    changeDays: number;
    note: string | null;
    applicationId: string | null;
    createdAt: Date;
    createdBy: {
      firstName: string;
      lastName: string;
    } | null;
  }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      async function loadHistory() {
        setLoading(true);
        try {
          const result = await getLedgerHistoryAction(
            organisationAlias,
            employeeId,
            unavailabilityReasonId
          );
          setEntries(result.entries);
        } catch (error) {
          console.error("Error loading ledger history:", error);
        } finally {
          setLoading(false);
        }
      }

      loadHistory();
    }
  }, [open, organisationAlias, employeeId, unavailabilityReasonId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] lg:max-w-6xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              {t("noEntries")}
            </div>
          ) : (
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">{t("date")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("year")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("typeColumn")}</TableHead>
                  <TableHead className="text-right whitespace-nowrap">{t("changeDays")}</TableHead>
                  <TableHead className="min-w-[200px]">{t("note")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("createdBy")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(entry.createdAt), "dd.MM.yyyy HH:mm", { locale: dateLocale })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{entry.year}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline">{entry.typeLabel}</Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium whitespace-nowrap ${entry.changeDays >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {entry.changeDays >= 0 ? "+" : ""}{entry.changeDays}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground min-w-[200px] max-w-md break-words">
                      {entry.note || "-"}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {entry.createdBy
                        ? `${entry.createdBy.firstName} ${entry.createdBy.lastName}`
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

