"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { ApplicationStatus } from "@prisma/client";

type ApplicationFiltersProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: ApplicationStatus | "ALL";
  onStatusChange: (value: ApplicationStatus | "ALL") => void;
  reasonFilter: string | "ALL";
  onReasonChange: (value: string | "ALL") => void;
  reasons: Array<{ id: string; name: string }>;
};

export function ApplicationFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  reasonFilter,
  onReasonChange,
  reasons,
}: ApplicationFiltersProps) {
  const t = useTranslations("applications");
  const tCommon = useTranslations("common");

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
      <Select
        value={statusFilter}
        onValueChange={(value) =>
          onStatusChange(value as ApplicationStatus | "ALL")
        }
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder={t("filters.filterByStatus")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
          <SelectItem value="DRAFT">{t("statusDRAFT")}</SelectItem>
          <SelectItem value="SUBMITTED">{t("statusSUBMITTED")}</SelectItem>
          <SelectItem value="APPROVED_FIRST_LEVEL">
            {t("statusAPPROVED_FIRST_LEVEL")}
          </SelectItem>
          <SelectItem value="APPROVED">{t("statusAPPROVED")}</SelectItem>
          <SelectItem value="REJECTED">{t("statusREJECTED")}</SelectItem>
          <SelectItem value="CANCELLED">{t("statusCANCELLED")}</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={reasonFilter.toString()}
        onValueChange={(value) =>
          onReasonChange(value === "ALL" ? "ALL" : value)
        }
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder={t("filters.filterByReason")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t("filters.allReasons")}</SelectItem>
          {reasons.map((reason) => (
            <SelectItem key={reason.id} value={reason.id.toString()}>
              {reason.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

