"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ error, reset }: Props) {
  const t = useTranslations("errors");

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
        <h1 className="text-xl font-semibold">{t("somethingWentWrong")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("unexpectedError")}</p>
        {error.digest && (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("errorReference")}: {error.digest}
          </p>
        )}
        <Button className="mt-4" onClick={reset}>
          {t("tryAgain")}
        </Button>
      </div>
    </div>
  );
}
