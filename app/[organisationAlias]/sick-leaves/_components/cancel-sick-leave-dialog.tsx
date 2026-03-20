"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { cancelSickLeaveAction } from "@/lib/actions/sick-leave";
import { format } from "date-fns";
import { hr, enUS } from "date-fns/locale";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type SickLeave = {
  id: string;
  startDate: Date;
  employee: {
    firstName: string;
    lastName: string;
  };
  unavailabilityReason: {
    name: string;
  };
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sickLeave: SickLeave;
  organisationAlias: string;
};

const initialState = {
  success: false,
};

export default function CancelSickLeaveDialog({
  open,
  onOpenChange,
  sickLeave,
  organisationAlias,
}: Props) {
  const router = useRouter();
  const t = useTranslations("sickLeave");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dateLocale = locale === "hr" ? hr : enUS;
  const [state, formAction, isPending] = useActionState(
    cancelSickLeaveAction.bind(null, organisationAlias),
    initialState
  );

  useEffect(() => {
    if (state.success) {
      toast.success(state.message || t("messages.cancelled"));
      onOpenChange(false);
      router.refresh();
    } else if (state.formError) {
      toast.error(state.formError);
    }
  }, [state, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("cancelDialog.title")}</DialogTitle>
          <DialogDescription>{t("cancelDialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t("cancelDescription")}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>{t("employee")}:</strong> {sickLeave.employee.firstName}{" "}
              {sickLeave.employee.lastName}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>{t("reason")}:</strong> {sickLeave.unavailabilityReason.name}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>{t("startDate")}:</strong>{" "}
              {format(sickLeave.startDate, "dd.MM.yyyy", { locale: dateLocale })}
            </p>
          </div>

          <p className="text-sm font-medium">
            {t("confirmCancel")}
          </p>

          <form action={formAction}>
            <input type="hidden" name="sickLeaveId" value={sickLeave.id} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? t("cancelling") : t("cancelDialog.title")}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

