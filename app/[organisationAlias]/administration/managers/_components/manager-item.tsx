"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { X, Loader2, User } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteManager } from "@/lib/actions/manager";

type Manager = {
  id: number;
  departmentId: number | null;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
};

type ManagerItemProps = {
  manager: Manager;
  organisationAlias: string;
  departmentName?: string;
};

export function ManagerItem({
  manager,
  organisationAlias,
  departmentName,
}: ManagerItemProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("managers");
  const tCommon = useTranslations("common");

  const fullName = `${manager.employee.firstName} ${manager.employee.lastName}`;
  const isGeneralManager = manager.departmentId === null;

  const handleDeleteConfirm = () => {
    startTransition(async () => {
      const result = await deleteManager(organisationAlias, manager.id);

      if (result.success) {
        toast.success(result.message);
        setDeleteDialogOpen(false);
      } else {
        toast.error(result.formError || t("removeError"));
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50 group">
        <User className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fullName}</p>
          <p className="text-xs text-muted-foreground truncate">
            {manager.employee.email}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setDeleteDialogOpen(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{t("removeManager")}</span>
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("removeManager")}</DialogTitle>
            <DialogDescription>
              {isGeneralManager
                ? t("removeGeneralConfirm", { name: fullName })
                : t("removeConfirm", { name: fullName, department: departmentName })}
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
              {t("removeManager")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

