"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMyDaysBalanceByYearAction } from "@/lib/actions/days-balance";

type DaysBalanceByYearClientProps = {
  organisationAlias: string;
  unavailabilityReasonId: string;
};

export function DaysBalanceByYearClient({
  organisationAlias,
  unavailabilityReasonId,
}: DaysBalanceByYearClientProps) {
  const t = useTranslations("daysBalance");
  const [balances, setBalances] = useState<Array<{
    year: number;
    breakdown: {
      allocated: number;
      used: number;
      pending: number;
      remaining: number;
      balance: number;
    };
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBalances() {
      try {
        const result = await getMyDaysBalanceByYearAction(organisationAlias, unavailabilityReasonId);
        setBalances(result.balances);
      } catch (error) {
        console.error("Error loading days balance by year:", error);
      } finally {
        setLoading(false);
      }
    }

    loadBalances();
  }, [organisationAlias, unavailabilityReasonId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (balances.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          {t("noData")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("byYearTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("year")}</TableHead>
              <TableHead className="text-right">{t("allocated")}</TableHead>
              <TableHead className="text-right">{t("used")}</TableHead>
              <TableHead className="text-right">{t("pending")}</TableHead>
              <TableHead className="text-right">{t("remaining")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {balances.map((balance) => (
              <TableRow key={balance.year}>
                <TableCell className="font-medium">{balance.year}</TableCell>
                <TableCell className="text-right">{balance.breakdown.allocated}</TableCell>
                <TableCell className="text-right">{balance.breakdown.used}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline">{balance.breakdown.pending}</Badge>
                </TableCell>
                <TableCell className="text-right font-bold">
                  {balance.breakdown.remaining}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

