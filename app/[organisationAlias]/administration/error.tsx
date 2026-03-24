"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: Props) {
  const t = useTranslations("errors");
  const params = useParams();
  const organisationAlias = typeof params.organisationAlias === "string" ? params.organisationAlias : null;

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="max-w-md w-full">
        <CardHeader className="items-center text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
          <CardTitle>{t("somethingWentWrong")}</CardTitle>
          <CardDescription>{t("unexpectedError")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          {error.digest && (
            <p className="text-sm text-muted-foreground">
              {t("errorReference")}: {error.digest}
            </p>
          )}
          <div className="flex gap-2">
            <Button onClick={reset}>{t("tryAgain")}</Button>
            {organisationAlias && (
              <Button variant="outline" asChild>
                <Link href={`/${organisationAlias}`}>{t("backToDashboard")}</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
