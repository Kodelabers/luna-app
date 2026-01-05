"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ApplicationStatus } from "@prisma/client";
import { useTranslations } from "next-intl";
import { SubmitApplicationButton } from "./submit-application-button";
import { ApplicationApprovalDialog } from "./application-approval-dialog";

type ApplicationActionsProps = {
  organisationAlias: string;
  applicationId: string;
  status: ApplicationStatus;
  departmentId: string;
  isOwner: boolean;
  isDepartmentManager: boolean;
  isGeneralManager: boolean;
  onActionComplete?: () => void;
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
}: ApplicationActionsProps) {
  const tActions = useTranslations("applications.actions");
  
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalDecision, setApprovalDecision] = useState<"APPROVE" | "REJECT">("APPROVE");

  // Owner actions for DRAFT - only Submit (Edit moved to page, Delete moved to edit page)
  const showSubmitAction = isOwner && status === "DRAFT";
  
  // DM actions for SUBMITTED (only if not GM - GM takes precedence)
  const showDMActions = isDepartmentManager && !isGeneralManager && status === "SUBMITTED";
  
  // GM actions for SUBMITTED or APPROVED_FIRST_LEVEL (GM can approve at any level)
  const showGMActions = isGeneralManager && (
    status === "SUBMITTED" || 
    status === "APPROVED_FIRST_LEVEL"
  );

  const handleApprovalClick = (decision: "APPROVE" | "REJECT") => {
    setApprovalDecision(decision);
    setApprovalDialogOpen(true);
  };

  const handleApprovalSuccess = () => {
    setApprovalDialogOpen(false);
    onActionComplete?.();
  };

  // If no actions to show, return null
  if (!showSubmitAction && !showDMActions && !showGMActions) {
    return null;
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
          <Button
            variant="default"
            onClick={() => handleApprovalClick("APPROVE")}
          >
            {tActions("approve")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleApprovalClick("REJECT")}
          >
            {tActions("reject")}
          </Button>
        </>
      )}

      {/* GM actions for SUBMITTED or APPROVED_FIRST_LEVEL */}
      {showGMActions && (
        <>
          <Button
            variant="default"
            onClick={() => handleApprovalClick("APPROVE")}
          >
            {tActions("approve")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleApprovalClick("REJECT")}
          >
            {tActions("reject")}
          </Button>
        </>
      )}

      {/* Approval Dialog */}
      {(showDMActions || showGMActions) && (
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
