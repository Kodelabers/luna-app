"use client";

import { useState } from "react";
import { MoreVertical, CheckCircle, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import CloseSickLeaveDialog from "./close-sick-leave-dialog";
import CancelSickLeaveDialog from "./cancel-sick-leave-dialog";

type SickLeave = {
  id: string;
  startDate: Date;
  endDate: Date | null;
  status: "OPENED" | "CLOSED" | "CANCELLED";
  note: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  department: {
    id: string;
    name: string;
  };
  unavailabilityReason: {
    id: string;
    name: string;
    colorCode: string | null;
  };
};

type SickLeaveActionsProps = {
  sickLeave: SickLeave;
  organisationAlias: string;
};

export function SickLeaveActions({
  sickLeave,
  organisationAlias,
}: SickLeaveActionsProps) {
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Only show actions for OPENED sick leaves
  if (sickLeave.status !== "OPENED") {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Akcije</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setCloseDialogOpen(true)}>
            <CheckCircle className="h-4 w-4" />
            Zatvori
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setCancelDialogOpen(true)}
          >
            <XCircle className="h-4 w-4" />
            Poništi
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Close sick leave dialog */}
      <CloseSickLeaveDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        sickLeave={sickLeave}
        organisationAlias={organisationAlias}
      />

      {/* Cancel sick leave dialog */}
      <CancelSickLeaveDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        sickLeave={sickLeave}
        organisationAlias={organisationAlias}
      />
    </>
  );
}
