"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyDaysBalanceAction } from "@/lib/actions/days-balance";
import { ChevronRight } from "lucide-react";

type DaysBalanceClientProps = {
  organisationAlias: string;
};

export function DaysBalanceClient({ organisationAlias }: DaysBalanceClientProps) {
  const t = useTranslations("daysBalance");
  const [balances, setBalances] = useState<Array<{
    unavailabilityReasonId: string;
    unavailabilityReasonName: string;
    unavailabilityReasonColorCode: string | null;
    openYear: number | null;
    openYearBalance: number | null;
    breakdown: {
      allocated: number;
      used: number;
      pending: number;
      remaining: number;
      balance: number;
      totalAvailable: number;
    };
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBalances() {
      try {
        const currentYear = new Date().getFullYear();
        const result = await getMyDaysBalanceAction(organisationAlias, currentYear);
        setBalances(result.balances);
      } catch (error) {
        console.error("Error loading days balance:", error);
      } finally {
        setLoading(false);
      }
    }

    loadBalances();
  }, [organisationAlias]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          {t("noReasons")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {balances.map((balance) => (
        <Card key={balance.unavailabilityReasonId}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {balance.unavailabilityReasonColorCode && (
                  <div
                    className="h-4 w-4 rounded-sm"
                    style={{ backgroundColor: balance.unavailabilityReasonColorCode }}
                  />
                )}
                {balance.unavailabilityReasonName}
              </CardTitle>
              <Link
                href={`/${organisationAlias}/profile/days/${balance.unavailabilityReasonId}`}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t("activeYear")}</span>
                <span className="font-medium">{balance.openYear ?? t("notPlanned")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t("totalAvailable")}</span>
                <span className="font-medium">{balance.breakdown.totalAvailable}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t("used")}</span>
                <span className="font-medium">{balance.breakdown.used}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t("pending")}</span>
                <Badge variant="outline">{balance.breakdown.pending}</Badge>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">{t("remaining")}</span>
                <span className="text-lg font-bold">{balance.breakdown.remaining}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

