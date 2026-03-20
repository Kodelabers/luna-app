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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ApplicationSummary } from "@/lib/services/dashboard";
import { format } from "date-fns";
import { hr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { type FormState, initialFormState } from "@/lib/errors";

type ApprovalDialogProps = {
  application: ApplicationSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  mode: "approve" | "reject";
};

export function ApprovalDialog({
  application,
  open,
  onOpenChange,
  action,
  mode,
}: ApprovalDialogProps) {
  const t = useTranslations("dashboard");
  const tApp = useTranslations("applications");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dateLocale = locale === "hr" ? hr : enUS;

  const [state, formAction, isPending] = useActionState(action, initialFormState);

  // Handle success/error toasts
  useEffect(() => {
    if (state.success === true) {
      toast.success(state.message);
      onOpenChange(false);
    } else if (state.success === false) {
      toast.error(state.formError || state.message || t("genericError"));
    }
  }, [state, onOpenChange]);

  if (!application) return null;

  const startDate = new Date(application.startDate);
  const endDate = new Date(application.endDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "approve" ? t("approveRequest") : t("rejectRequest")}
          </DialogTitle>
          <DialogDescription>{t("requestDetails")}</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {/* Hidden fields */}
          <input type="hidden" name="applicationId" value={application.id} />
          <input type="hidden" name="decision" value={mode === "approve" ? "APPROVE" : "REJECT"} />
          <input
            type="hidden"
            name="clientTimeZone"
            value={Intl.DateTimeFormat().resolvedOptions().timeZone}
          />

          {/* Application details */}
          <div className="space-y-3 rounded-lg border p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">{t("employee")}:</div>
              <div className="font-medium">{application.employeeName}</div>

              <div className="text-muted-foreground">{t("department")}:</div>
              <div className="font-medium">{application.departmentName}</div>

              <div className="text-muted-foreground">{t("reason")}:</div>
              <div className="flex items-center gap-2">
                {application.unavailabilityReasonColor && (
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: application.unavailabilityReasonColor }}
                  />
                )}
                <span className="font-medium">{application.unavailabilityReasonName}</span>
              </div>

              <div className="text-muted-foreground">{t("from")}:</div>
              <div className="font-medium">
                {format(startDate, "dd. MMM yyyy.", { locale: dateLocale })}
              </div>

              <div className="text-muted-foreground">{t("to")}:</div>
              <div className="font-medium">
                {format(endDate, "dd. MMM yyyy.", { locale: dateLocale })}
              </div>

              {application.requestedWorkdays !== null && (
                <>
                  <div className="text-muted-foreground">{t("workdays")}:</div>
                  <div className="font-medium">{application.requestedWorkdays}</div>
                </>
              )}

              <div className="text-muted-foreground">{t("status")}:</div>
              <div>
                <Badge variant="secondary">{tApp(`status${application.status}`)}</Badge>
              </div>
            </div>

            {application.description && (
              <div className="mt-3 border-t pt-3">
                <div className="text-sm text-muted-foreground">{tApp("description")}:</div>
                <div className="mt-1 text-sm">{application.description}</div>
              </div>
            )}
          </div>

          {/* Comment field */}
          <div className="space-y-2">
            <Label htmlFor="comment">
              {mode === "reject" ? t("comment") : t("commentOptional")}
              {mode === "reject" && <span className="text-destructive"> *</span>}
            </Label>
            <Textarea
              id="comment"
              name="comment"
              placeholder={t("commentPlaceholder")}
              rows={3}
              required={mode === "reject"}
            />
            {mode === "reject" && (
              <p className="text-xs text-muted-foreground">{t("commentRequired")}</p>
            )}
            {state.fieldErrors?.comment && (
              <p className="text-xs text-destructive">{state.fieldErrors.comment[0]}</p>
            )}
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
              disabled={isPending}
              variant={mode === "approve" ? "default" : "destructive"}
            >
              {isPending
                ? tCommon("loading")
                : mode === "approve"
                  ? t("approve")
                  : t("reject")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

