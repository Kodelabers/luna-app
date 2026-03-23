"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplicationSummary } from "@/lib/services/dashboard";
import { ApprovalDialog } from "./approval-dialog";
import { gmDecideApplicationAction } from "@/lib/actions/application";
import { format } from "date-fns";
import { hr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { Calendar, CheckCircle, XCircle, MoreVertical, Pencil } from "lucide-react";
import { FormState } from "@/lib/errors";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type GmApprovalCardProps = {
  applications: ApplicationSummary[];
  organisationAlias: string;
};

export function GmApprovalCard({ applications, organisationAlias }: GmApprovalCardProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const dateLocale = locale === "hr" ? hr : enUS;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationSummary | null>(null);
  const [dialogMode, setDialogMode] = useState<"approve" | "reject">("approve");

  // Wrapper function for the action to match expected type
  const handleAction = async (prevState: FormState, formData: FormData): Promise<FormState> => {
    return await gmDecideApplicationAction(organisationAlias, prevState, formData);
  };

  const handleApprove = (app: ApplicationSummary) => {
    setSelectedApplication(app);
    setDialogMode("approve");
    setDialogOpen(true);
  };

  const handleReject = (app: ApplicationSummary) => {
    setSelectedApplication(app);
    setDialogMode("reject");
    setDialogOpen(true);
  };

  return (
    <>
      <Card className="h-[400px] md:h-[350px] lg:h-[400px] flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle>{t("finalApproval")}</CardTitle>
          <CardDescription>{t("requestsForFinalApproval")}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto min-h-0">
          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noRequestsForFinalApproval")}</p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => {
                const startDate = new Date(app.startDate);
                const endDate = new Date(app.endDate);

                return (
                  <div
                    key={app.id}
                    className="flex items-start justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="flex-1 space-y-1 text-sm">
                      <div className="font-medium">{app.employeeName}</div>
                      <div className="text-xs text-muted-foreground">{app.departmentName}</div>
                      <div className="flex items-center gap-2">
                        {app.unavailabilityReasonColor && (
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: app.unavailabilityReasonColor }}
                          />
                        )}
                        <span className="text-muted-foreground">
                          {app.unavailabilityReasonName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(startDate, "dd. MMM", { locale: dateLocale })} -{" "}
                          {format(endDate, "dd. MMM yyyy.", { locale: dateLocale })}
                        </span>
                      </div>
                      {app.requestedWorkdays !== null && (
                        <div className="text-xs text-muted-foreground">
                          {t("workdays")}: {app.requestedWorkdays}
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/${organisationAlias}/applications/${app.id}`}>
                            <Pencil className="h-4 w-4" />
                            {t("correct")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleApprove(app)}>
                          <CheckCircle className="h-4 w-4" />
                          {t("approve")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleReject(app)}
                        >
                          <XCircle className="h-4 w-4" />
                          {t("reject")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ApprovalDialog
        application={selectedApplication}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        action={handleAction}
        mode={dialogMode}
      />
    </>
  );
}

