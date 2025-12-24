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
import { format } from "date-fns";
import { hr } from "date-fns/locale";

type Application = {
  applicationId: number;
  startLocalISO: string;
  endLocalISO: string;
  status: ApplicationStatus;
  reasonId: number;
  reasonName: string;
  workdays: number | null;
  description: string | null;
  createdAtISO: string;
};

type ApplicationTableProps = {
  applications: Application[];
  onView: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
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
}: ApplicationTableProps) {
  const t = useTranslations("applications");

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
            <TableHead>{t("startDate")}</TableHead>
            <TableHead>{t("endDate")}</TableHead>
            <TableHead>{t("reason")}</TableHead>
            <TableHead>{t("workdays")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead className="text-right">
              {useTranslations("common")("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => (
            <TableRow key={app.applicationId}>
              <TableCell>
                {format(new Date(app.startLocalISO), "dd.MM.yyyy", {
                  locale: hr,
                })}
              </TableCell>
              <TableCell>
                {format(new Date(app.endLocalISO), "dd.MM.yyyy", {
                  locale: hr,
                })}
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
                <div className="flex justify-end gap-2">
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

