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
import { Check } from "lucide-react";
import { UnavailabilityReasonActions } from "./unavailability-reason-actions";

type UnavailabilityReason = {
  id: string;
  name: string;
  colorCode: string | null;
  needApproval: boolean;
  needSecondApproval: boolean;
  hasPlanning: boolean;
};

type UnavailabilityReasonTableProps = {
  reasons: UnavailabilityReason[];
  organisationAlias: string;
};

export function UnavailabilityReasonTable({
  reasons,
  organisationAlias,
}: UnavailabilityReasonTableProps) {
  const t = useTranslations("unavailabilityReasons");
  const tCommon = useTranslations("common");

  if (reasons.length === 0) {
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
          <TableHead className="text-center w-32">{t("departmentManagerApproval")}</TableHead>
          <TableHead className="text-center w-32">{t("generalManagerApproval")}</TableHead>
          <TableHead className="text-center w-32">{t("planning")}</TableHead>
          <TableHead className="text-right">{tCommon("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reasons.map((reason, index) => (
          <TableRow key={reason.id}>
            <TableCell className="text-xs text-muted-foreground">
              {index + 1}
            </TableCell>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {reason.colorCode && (
                  <div
                    className="h-3 w-3 rounded-xs shrink-0 shadow-sm"
                    style={{ backgroundColor: reason.colorCode }}
                  />
                )}
                <span>{reason.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-center">
              {reason.needApproval ? (
                <Check className="h-4 w-4 text-green-600 mx-auto" />
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell className="text-center">
              {reason.needSecondApproval ? (
                <Check className="h-4 w-4 text-green-600 mx-auto" />
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell className="text-center">
              {reason.hasPlanning ? (
                <Check className="h-4 w-4 text-green-600 mx-auto" />
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <UnavailabilityReasonActions
                reason={reason}
                organisationAlias={organisationAlias}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

