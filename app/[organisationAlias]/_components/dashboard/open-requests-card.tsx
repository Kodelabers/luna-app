"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApplicationSummary } from "@/lib/services/dashboard";
import { format } from "date-fns";
import { hr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { Calendar, Clock } from "lucide-react";
import { ApplicationStatus } from "@prisma/client";

type OpenRequestsCardProps = {
  applications: ApplicationSummary[];
};

function getStatusBadgeClassName(status: ApplicationStatus): string {
  return status === "APPROVED" ? "border-transparent bg-green-500 text-white" : "";
}

function getStatusBadgeVariant(
  status: ApplicationStatus
): "default" | "secondary" | "outline" {
  switch (status) {
    case "SUBMITTED":
      return "secondary";
    case "DRAFT":
      return "outline";
    default:
      return "default";
  }
}

export function OpenRequestsCard({ applications }: OpenRequestsCardProps) {
  const t = useTranslations("dashboard");
  const tApp = useTranslations("applications");
  const locale = useLocale();
  const dateLocale = locale === "hr" ? hr : enUS;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("myRequests")}</CardTitle>
        <CardDescription>{t("openRequests")}</CardDescription>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noOpenRequests")}</p>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
              const startDate = new Date(app.startDate);
              const endDate = new Date(app.endDate);

              return (
                <div
                  key={app.id}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {app.unavailabilityReasonColor && (
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: app.unavailabilityReasonColor }}
                        />
                      )}
                      <span className="font-medium">{app.unavailabilityReasonName}</span>
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
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(new Date(app.createdAt), "dd. MMM yyyy.", { locale: dateLocale })}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={getStatusBadgeVariant(app.status)}
                    className={getStatusBadgeClassName(app.status)}
                  >
                    {tApp(`status${app.status}`)}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

