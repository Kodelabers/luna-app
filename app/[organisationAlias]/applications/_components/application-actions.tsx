"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { ApplicationStatus } from "@prisma/client";
import { useTranslations } from "next-intl";
import { SubmitApplicationButton } from "./submit-application-button";
import { DeleteApplicationDialog } from "./delete-application-dialog";
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
  const t = useTranslations("applications");
  const tActions = useTranslations("applications.actions");
  const tDashboard = useTranslations("dashboard");
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalDecision, setApprovalDecision] = useState<"APPROVE" | "REJECT">("APPROVE");

  // Owner actions for DRAFT
  const showOwnerDraftActions = isOwner && status === "DRAFT";
  
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

  const handleDeleteSuccess = () => {
    setDeleteDialogOpen(false);
    onActionComplete?.();
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Owner actions for DRAFT */}
      {showOwnerDraftActions && (
        <>
          <SubmitApplicationButton
            organisationAlias={organisationAlias}
            applicationId={applicationId}
          />
          <Link href={`/${organisationAlias}/applications/${applicationId}/edit`}>
            <Button variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              {tActions("edit")}
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {tActions("delete")}
          </Button>
        </>
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

      {/* GM actions for APPROVED_FIRST_LEVEL */}
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

      {/* Dialogs */}
      <DeleteApplicationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        applicationId={applicationId}
        organisationAlias={organisationAlias}
        onSuccess={handleDeleteSuccess}
      />

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
    </div>
  );
}

