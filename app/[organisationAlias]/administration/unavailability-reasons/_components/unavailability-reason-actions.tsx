"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { MoreVertical, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UnavailabilityReasonDialog } from "./unavailability-reason-dialog";
import { deleteUnavailabilityReason } from "@/lib/actions/unavailability-reason";

type UnavailabilityReason = {
  id: number;
  name: string;
  colorCode: string | null;
  needApproval: boolean;
  needSecondApproval: boolean;
  hasPlanning: boolean;
};

type UnavailabilityReasonActionsProps = {
  reason: UnavailabilityReason;
  organisationAlias: string;
};

export function UnavailabilityReasonActions({
  reason,
  organisationAlias,
}: UnavailabilityReasonActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("unavailabilityReasons");
  const tCommon = useTranslations("common");

  const handleDeleteConfirm = () => {
    startTransition(async () => {
      const result = await deleteUnavailabilityReason(
        organisationAlias,
        reason.id
      );

      if (result.success) {
        toast.success(result.message);
        setDeleteDialogOpen(false);
      } else {
        toast.error(result.formError || t("deleteError"));
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">{tCommon("actions")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            <Pencil className="h-4 w-4" />
            {tCommon("edit")}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            {tCommon("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit dialog */}
      <UnavailabilityReasonDialog
        organisationAlias={organisationAlias}
        reason={reason}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteReason")}</DialogTitle>
            <DialogDescription>
              {t("deleteConfirm", { name: reason.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

