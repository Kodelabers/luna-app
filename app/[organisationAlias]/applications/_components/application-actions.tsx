"use client";

import { useState, useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ApplicationStatus } from "@prisma/client";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { toast } from "sonner";
import { SubmitApplicationButton } from "./submit-application-button";
import { ApplicationApprovalDialog } from "./application-approval-dialog";
import { dmDecideApplicationAction, gmDecideApplicationAction } from "@/lib/actions/application";
import { FormState } from "@/lib/errors";

export type CorrectionRange = { from: Date; to: Date };

type ApplicationActionsProps = {
  organisationAlias: string;
  applicationId: string;
  status: ApplicationStatus;
  departmentId: string;
  isOwner: boolean;
  isDepartmentManager: boolean;
  isGeneralManager: boolean;
  onActionComplete?: () => void;
  /** When true, calendar is in correction mode: show only Odustani + Odobri (no dialog). */
  isCorrectionMode?: boolean;
  onEnterCorrection?: () => void;
  onCancelCorrection?: () => void;
  /** Current range when in correction mode; used for approve form requestedStartDate/End. */
  correctionRange?: CorrectionRange | null;
};

export function ApplicationActions({
  organisationAlias,
  applicationId,
  status,
  departmentId,
  isOwner,
  isDepartmentManager,
  isGeneralManager,
  onActionComplete,
  isCorrectionMode = false,
  onEnterCorrection,
  onCancelCorrection,
  correctionRange = null,
}: ApplicationActionsProps) {
  const tActions = useTranslations("applications.actions");
  const tCommon = useTranslations("common");

  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalDecision, setApprovalDecision] = useState<"APPROVE" | "REJECT">("APPROVE");

  // Owner actions for DRAFT - only Submit (Edit moved to page, Delete moved to edit page)
  const showSubmitAction = isOwner && status === "DRAFT";

  // DM actions for SUBMITTED (only if not GM - GM takes precedence)
  const showDMActions = isDepartmentManager && !isGeneralManager && status === "SUBMITTED";

  // GM actions for SUBMITTED or APPROVED_FIRST_LEVEL (GM can approve at any level)
  const showGMActions = isGeneralManager && (
    status === "SUBMITTED" || status === "APPROVED_FIRST_LEVEL"
  );

  const showManagerActions = showDMActions || showGMActions;

  const handleApprovalClick = (decision: "APPROVE" | "REJECT") => {
    setApprovalDecision(decision);
    setApprovalDialogOpen(true);
  };

  const handleApprovalSuccess = () => {
    setApprovalDialogOpen(false);
    onActionComplete?.();
  };

  // Correction-mode approve: form that submits requestedStartDate/requestedEndDate
  const decideAction = showGMActions
    ? gmDecideApplicationAction.bind(null, organisationAlias)
    : dmDecideApplicationAction.bind(null, organisationAlias);
  const [correctionState, correctionFormAction, isCorrectionPending] =
    useActionState<FormState, FormData>(decideAction, { success: false });

  useEffect(() => {
    if (!isCorrectionMode) return;
    if (correctionState.success && correctionState.message) {
      toast.success(correctionState.message);
      onActionComplete?.();
    } else if (correctionState.formError) {
      toast.error(correctionState.formError);
    } else if (correctionState.fieldErrors) {
      const firstError = Object.values(correctionState.fieldErrors)[0]?.[0];
      if (firstError) toast.error(firstError);
    }
  }, [isCorrectionMode, correctionState, onActionComplete]);

  // If no actions to show, return null
  if (!showSubmitAction && !showManagerActions) {
    return null;
  }

  // Correction mode: only Odustani + Odobri (form)
  if (showManagerActions && isCorrectionMode) {
    const from = correctionRange?.from;
    const to = correctionRange?.to;
    const requestedStart = from ? format(from, "yyyy-MM-dd") : "";
    const requestedEnd = to ? format(to, "yyyy-MM-dd") : "";

    return (
      <>
        <Button variant="outline" onClick={onCancelCorrection} disabled={isCorrectionPending}>
          {tActions("cancelCorrection")}
        </Button>
        <form action={correctionFormAction}>
          <input type="hidden" name="applicationId" value={applicationId} />
          <input type="hidden" name="decision" value="APPROVE" />
          <input
            type="hidden"
            name="clientTimeZone"
            value={
              typeof window !== "undefined"
                ? Intl.DateTimeFormat().resolvedOptions().timeZone
                : "UTC"
            }
          />
          <input type="hidden" name="requestedStartDate" value={requestedStart} />
          <input type="hidden" name="requestedEndDate" value={requestedEnd} />
          <Button type="submit" disabled={isCorrectionPending}>
            {isCorrectionPending ? tCommon("loading") : tActions("approve")}
          </Button>
        </form>
      </>
    );
  }

  return (
    <>
      {/* Owner action for DRAFT - Submit */}
      {showSubmitAction && (
        <SubmitApplicationButton
          organisationAlias={organisationAlias}
          applicationId={applicationId}
        />
      )}

      {/* DM actions for SUBMITTED */}
      {showDMActions && (
        <>
          {onEnterCorrection && (
            <Button variant="outline" onClick={onEnterCorrection}>
              {tActions("correct")}
            </Button>
          )}
          <Button variant="default" onClick={() => handleApprovalClick("APPROVE")}>
            {tActions("approve")}
          </Button>
          <Button variant="destructive" onClick={() => handleApprovalClick("REJECT")}>
            {tActions("reject")}
          </Button>
        </>
      )}

      {/* GM actions for SUBMITTED or APPROVED_FIRST_LEVEL */}
      {showGMActions && (
        <>
          {onEnterCorrection && (
            <Button variant="outline" onClick={onEnterCorrection}>
              {tActions("correct")}
            </Button>
          )}
          <Button variant="default" onClick={() => handleApprovalClick("APPROVE")}>
            {tActions("approve")}
          </Button>
          <Button variant="destructive" onClick={() => handleApprovalClick("REJECT")}>
            {tActions("reject")}
          </Button>
        </>
      )}

      {/* Approval Dialog */}
      {showManagerActions && (
        <ApplicationApprovalDialog
          open={approvalDialogOpen}
          onOpenChange={setApprovalDialogOpen}
          applicationId={applicationId}
          decision={approvalDecision}
          organisationAlias={organisationAlias}
          isGeneralManager={showGMActions}
          onSuccess={handleApprovalSuccess}
        />
      )}
    </>
  );
}
