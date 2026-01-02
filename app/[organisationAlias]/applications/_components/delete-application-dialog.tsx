"use client";

import { useActionState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { deleteDraftApplicationAction } from "@/lib/actions/application";
import { toast } from "sonner";
import { FormState } from "@/lib/errors";

type DeleteApplicationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string | null;
  organisationAlias: string;
  onSuccess?: () => void;
};

export function DeleteApplicationDialog({
  open,
  onOpenChange,
  applicationId,
  organisationAlias,
  onSuccess,
}: DeleteApplicationDialogProps) {
  const t = useTranslations("applications");
  const tCommon = useTranslations("common");

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    deleteDraftApplicationAction.bind(null, organisationAlias),
    { success: false }
  );

  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
      onOpenChange(false);
      onSuccess?.();
    } else if (state.formError) {
      toast.error(state.formError);
    }
  }, [state, onOpenChange, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>{t("deleteApplication")}</DialogTitle>
            <DialogDescription>{t("deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <input type="hidden" name="applicationId" value={applicationId ?? ""} />
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? tCommon("loading") : t("deleteApplication")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

