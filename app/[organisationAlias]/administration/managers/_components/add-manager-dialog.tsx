"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Plus, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmployeeSearch } from "./employee-search";
import { createManager } from "@/lib/actions/manager";

type EmployeeResult = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

type AddManagerDialogProps = {
  organisationAlias: string;
  departmentId?: number | null;
  departmentName?: string;
  trigger?: React.ReactNode;
};

export function AddManagerDialog({
  organisationAlias,
  departmentId,
  departmentName,
  trigger,
}: AddManagerDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("managers");

  const isGeneralManager = !departmentId;

  const handleSelect = (employee: EmployeeResult) => {
    startTransition(async () => {
      const result = await createManager(
        organisationAlias,
        employee.id,
        departmentId
      );

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.formError || t("addError"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {isGeneralManager ? t("addGeneralManager") : t("addManager")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isGeneralManager ? t("addGeneralManager") : t("addManager")}
          </DialogTitle>
          <DialogDescription>
            {isGeneralManager
              ? t("selectEmployeeGeneral")
              : t("selectEmployeeDepartment", { department: departmentName })}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isPending ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <EmployeeSearch
              organisationAlias={organisationAlias}
              departmentId={departmentId}
              onSelect={handleSelect}
              disabled={isPending}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

