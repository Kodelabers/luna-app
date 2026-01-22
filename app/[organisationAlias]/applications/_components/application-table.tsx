"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { ApplicationStatus } from "@prisma/client";
import { useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { hr } from "date-fns/locale";

type Application = {
  applicationId: string;
  startLocalISO: string;
  endLocalISO: string;
  status: ApplicationStatus;
  reasonId: string;
  reasonName: string;
  workdays: number | null;
  description: string | null;
  createdAtISO: string;
  employeeId?: string;
  employeeName?: string;
};

type ApplicationTableProps = {
  applications: Application[];
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showEmployee?: boolean;
  onRowClick?: (id: string) => void;
};

const statusColorMap: Record<ApplicationStatus, string> = {
  DRAFT: "bg-gray-500",
  SUBMITTED: "bg-blue-500",
  APPROVED_FIRST_LEVEL: "bg-yellow-500",
  APPROVED: "bg-green-500",
  REJECTED: "bg-red-500",
  CANCELLED: "bg-gray-400",
};

export function ApplicationTable({
  applications,
  onView,
  onEdit,
  onDelete,
  showEmployee = false,
  onRowClick,
}: ApplicationTableProps) {
  const t = useTranslations("applications");
  const tCommon = useTranslations("common");

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">{t("noApplications")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showEmployee && <TableHead>{t("employee")}</TableHead>}
            <TableHead>{t("period")}</TableHead>
            <TableHead>{t("reason")}</TableHead>
            <TableHead>{t("workdays")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead className="text-right">
              {tCommon("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => (
            <TableRow
              key={app.applicationId}
              className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
              onClick={() => onRowClick?.(app.applicationId)}
            >
              {showEmployee && (
                <TableCell className="font-medium">{app.employeeName}</TableCell>
              )}
              <TableCell>
                <Badge variant="outline">
                  {format(parseISO(app.startLocalISO), "dd.MM.yyyy", {
                    locale: hr,
                  })} - {format(parseISO(app.endLocalISO), "dd.MM.yyyy", {
                    locale: hr,
                  })}
                </Badge>
              </TableCell>

              <TableCell>{app.reasonName}</TableCell>
              <TableCell>{app.workdays ?? "-"}</TableCell>
              <TableCell>
                <Badge
                  className={statusColorMap[app.status]}
                  variant="default"
                >
                  {t(`status${app.status}`)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onView(app.applicationId)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {app.status === "DRAFT" && onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(app.applicationId)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {app.status === "DRAFT" && onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(app.applicationId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

