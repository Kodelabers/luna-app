"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FormState } from "@/lib/errors";
import { dmDecideApplicationAction, gmDecideApplicationAction } from "@/lib/actions/application";

type ApplicationApprovalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: number;
  decision: "APPROVE" | "REJECT";
  organisationAlias: string;
  isGeneralManager: boolean;
  onSuccess?: () => void;
};

export function ApplicationApprovalDialog({
  open,
  onOpenChange,
  applicationId,
  decision,
  organisationAlias,
  isGeneralManager,
  onSuccess,
}: ApplicationApprovalDialogProps) {
  const t = useTranslations("applications.actions");
  const tCommon = useTranslations("common");

  const action = isGeneralManager 
    ? gmDecideApplicationAction.bind(null, organisationAlias)
    : dmDecideApplicationAction.bind(null, organisationAlias);

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    action,
    { success: false }
  );

  // Handle success/error toasts
  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
      onOpenChange(false);
      onSuccess?.();
    } else if (state.formError) {
      toast.error(state.formError);
    } else if (state.fieldErrors) {
      const firstError = Object.values(state.fieldErrors)[0]?.[0];
      if (firstError) {
        toast.error(firstError);
      }
    }
  }, [state, onOpenChange, onSuccess]);

  const isReject = decision === "REJECT";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>
              {isReject ? t("reject") : t("approve")}
            </DialogTitle>
            <DialogDescription>
              {isReject
                ? "Molimo unesite razlog odbijanja zahtjeva."
                : "Potvrdite odobrenje zahtjeva."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <input type="hidden" name="applicationId" value={applicationId} />
            <input type="hidden" name="decision" value={decision} />
            <input
              type="hidden"
              name="clientTimeZone"
              value={typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC"}
            />

            <div className="space-y-2">
              <Label htmlFor="comment">
                Komentar {isReject && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                id="comment"
                name="comment"
                placeholder={
                  isReject
                    ? "Razlog odbijanja..."
                    : "Dodatni komentar (opcionalno)..."
                }
                rows={4}
                disabled={isPending}
              />
              {state.fieldErrors?.comment && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.comment[0]}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              variant={isReject ? "destructive" : "default"}
              disabled={isPending}
            >
              {isPending
                ? tCommon("loading")
                : isReject
                ? t("reject")
                : t("approve")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

