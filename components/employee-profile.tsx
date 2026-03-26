"use client";

import { useState, useEffect, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { hr, enUS } from "date-fns/locale";
import { ExternalLink, Loader2, Mail, Briefcase, Building2, CalendarDays, FileText, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getEmployeeProfileAction,
  type EmployeeProfileData,
} from "@/lib/actions/employee";
import { ApplicationStatus } from "@prisma/client";

type EmployeeProfileProps = {
  employeeId: string;
  organisationAlias: string;
  children: React.ReactNode;
};

export function EmployeeProfile({
  employeeId,
  organisationAlias,
  children,
}: EmployeeProfileProps) {
  const t = useTranslations("employeeProfile");
  const locale = useLocale();
  const dateLocale = locale === "hr" ? hr : enUS;
  const getStatusLabel = (status: ApplicationStatus) => t(`status${status}` as Parameters<typeof t>[0]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<EmployeeProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when dialog opens
  useEffect(() => {
    if (open && !data) {
      startTransition(async () => {
        const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const result = await getEmployeeProfileAction(
          organisationAlias,
          employeeId,
          clientTimeZone
        );

        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.error);
          setData(null);
        }
      });
    }
  }, [open, data, employeeId, organisationAlias]);

  // Reset data when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        {isPending ? (
          <>
            <VisuallyHidden.Root>
              <DialogTitle>{t("loading")}</DialogTitle>
            </VisuallyHidden.Root>
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </>
        ) : error ? (
          <>
            <VisuallyHidden.Root>
              <DialogTitle>{t("error")}</DialogTitle>
            </VisuallyHidden.Root>
            <div className="py-12 text-center">
              <p className="text-destructive">{error}</p>
            </div>
          </>
        ) : data ? (
          <>
            <DialogHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14 shrink-0">
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {data.employee.firstName[0]}
                    {data.employee.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-xl">
                    {data.employee.firstName} {data.employee.lastName}
                  </DialogTitle>
                  <div className="flex flex-col gap-2 pt-2 text-muted-foreground text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{data.employee.email}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {data.employee.title && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 shrink-0" />
                          <span>{data.employee.title}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 shrink-0" />
                        <div className="flex items-center gap-1.5">
                          {data.employee.department.colorCode && (
                            <div
                              className="h-3 w-3 rounded-xs shrink-0"
                              style={{
                                backgroundColor: data.employee.department.colorCode,
                              }}
                            />
                          )}
                          <span>{data.employee.department.name}</span>
                        </div>
                      </div>
                    </div>
                    {data.employee.user && (
                      <div className="flex items-center gap-2 pt-1">
                        <User className="h-4 w-4 shrink-0" />
                        <span className="text-xs">
                          {t("linkedToUser")}{" "}
                          <span className="font-medium text-foreground">
                            {data.employee.user.firstName} {data.employee.user.lastName}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Days Balance Summary - nice display */}
            {(data.daysBalance.some((b) => b.breakdown.totalAvailable > 0) || data.sickLeaveBalances.length > 0) && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-3">
                  {data.daysBalance.filter((b) => b.breakdown.totalAvailable > 0).map((balance) => (
                    <div
                      key={balance.unavailabilityReasonId}
                      className="flex items-center gap-2 rounded-lg border px-3 py-2"
                    >
                      {balance.unavailabilityReasonColorCode && (
                        <div
                          className="h-3 w-3 rounded-xs shrink-0"
                          style={{
                            backgroundColor: balance.unavailabilityReasonColorCode,
                          }}
                        />
                      )}
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          {balance.unavailabilityReasonName}
                        </span>
                        <span className="text-lg font-semibold tabular-nums">
                          {balance.breakdown.remaining}
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            / {balance.breakdown.totalAvailable}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                  {data.sickLeaveBalances.map((sl) => (
                    <div
                      key={sl.unavailabilityReasonId}
                      className="flex items-center gap-2 rounded-lg border px-3 py-2"
                    >
                      {sl.unavailabilityReasonColorCode && (
                        <div
                          className="h-3 w-3 rounded-xs shrink-0"
                          style={{
                            backgroundColor: sl.unavailabilityReasonColorCode,
                          }}
                        />
                      )}
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          {sl.unavailabilityReasonName}
                        </span>
                        <span className="text-lg font-semibold tabular-nums">
                          {sl.days}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <Separator />

            {/* Tabs for details */}
            <Tabs defaultValue="applications" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="applications" className="flex-1 gap-1.5">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("applicationsTab")}</span>
                  {data.openApplications.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {data.openApplications.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="balance" className="flex-1 gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("daysBalanceTab")}</span>
                </TabsTrigger>
              </TabsList>

              {/* Open Applications Tab */}
              <TabsContent value="applications" className="mt-4">
                {data.openApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t("noOpenRequests")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.openApplications.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {app.unavailabilityReasonColor && (
                            <div
                              className="h-3 w-3 rounded-xs shrink-0"
                              style={{
                                backgroundColor: app.unavailabilityReasonColor,
                              }}
                            />
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate">
                              {app.unavailabilityReasonName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(app.startDateLocalISO), "d. MMM", {
                                locale: dateLocale,
                              })}
                              {app.startDateLocalISO !== app.endDateLocalISO && (
                                <>
                                  {" - "}
                                  {format(parseISO(app.endDateLocalISO), "d. MMM yyyy", {
                                    locale: dateLocale,
                                  })}
                                </>
                              )}
                              {app.startDateLocalISO === app.endDateLocalISO && (
                                <> {format(parseISO(app.startDateLocalISO), "yyyy", {
                                  locale: dateLocale,
                                })}</>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant={
                              app.status === "APPROVED_FIRST_LEVEL"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {getStatusLabel(app.status)}
                          </Badge>
                          <Link
                            href={`/${organisationAlias}/applications/${app.id}`}
                            className="text-primary hover:text-primary/80"
                            onClick={() => setOpen(false)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Days Balance Tab */}
              <TabsContent value="balance" className="mt-4">
                {data.daysBalance.length === 0 && data.sickLeaveBalances.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t("noBalanceReasons")}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("reasonHeader")}</TableHead>
                          <TableHead className="text-right w-20">{t("totalShort")}</TableHead>
                          <TableHead className="text-right w-20">{t("usedShort")}</TableHead>
                          <TableHead className="text-right w-20">{t("pendingShort")}</TableHead>
                          <TableHead className="text-right w-20">{t("remainingShort")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.daysBalance.map((balance) => (
                          <TableRow key={balance.unavailabilityReasonId}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {balance.unavailabilityReasonColorCode && (
                                  <div
                                    className="h-3 w-3 rounded-xs shrink-0"
                                    style={{
                                      backgroundColor: balance.unavailabilityReasonColorCode,
                                    }}
                                  />
                                )}
                                <span className="font-medium text-sm">
                                  {balance.unavailabilityReasonName}
                                </span>
                                {balance.openYear && (
                                  <span className="text-xs text-muted-foreground">
                                    ({balance.openYear})
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {balance.breakdown.totalAvailable}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {balance.breakdown.used}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {balance.breakdown.pending > 0 ? (
                                <span className="text-amber-600">
                                  {balance.breakdown.pending}
                                </span>
                              ) : (
                                balance.breakdown.pending
                              )}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-semibold text-primary">
                              {balance.breakdown.remaining}
                            </TableCell>
                          </TableRow>
                        ))}
                        {data.sickLeaveBalances.map((sl) => (
                          <TableRow key={sl.unavailabilityReasonId}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {sl.unavailabilityReasonColorCode && (
                                  <div
                                    className="h-3 w-3 rounded-xs shrink-0"
                                    style={{
                                      backgroundColor: sl.unavailabilityReasonColorCode,
                                    }}
                                  />
                                )}
                                <span className="font-medium text-sm">
                                  {sl.unavailabilityReasonName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">—</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {sl.days}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">0</TableCell>
                            <TableCell className="text-right text-muted-foreground">—</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
