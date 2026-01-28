"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeeLookup } from "./employee-lookup";
import { linkEmployeeToMember, createEmployeeForMember } from "@/lib/actions/member";
import { initialFormState } from "@/lib/errors";

type Department = {
  id: string;
  name: string;
  colorCode: string | null;
};

type Member = {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

type LinkEmployeeDialogProps = {
  member: Member;
  organisationAlias: string;
  departments: Department[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LinkEmployeeDialog({
  member,
  organisationAlias,
  departments,
  open,
  onOpenChange,
}: LinkEmployeeDialogProps) {
  const t = useTranslations("members");
  const tCommon = useTranslations("common");
  const tEmployees = useTranslations("employees");

  const [mode, setMode] = useState<"link" | "create">("link");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [title, setTitle] = useState("");

  // Actions
  const boundLinkAction = linkEmployeeToMember.bind(null, organisationAlias, member.id);
  const boundCreateAction = createEmployeeForMember.bind(null, organisationAlias, member.id);

  const [linkState, linkFormAction, isLinkPending] = useActionState(
    boundLinkAction,
    initialFormState
  );

  const [createState, createFormAction, isCreatePending] = useActionState(
    boundCreateAction,
    initialFormState
  );

  const isPending = isLinkPending || isCreatePending;
  const state = mode === "link" ? linkState : createState;

  // Handle form state changes
  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      onOpenChange(false);
      resetForm();
    } else if (state.formError) {
      toast.error(state.formError);
    }
  }, [state, onOpenChange]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setMode("link");
    setSelectedEmployeeId(null);
    setSelectedDepartmentId("");
    setTitle("");
  };

  const fullName = `${member.user.firstName} ${member.user.lastName}`;

  const canSubmit = mode === "link" 
    ? !!selectedEmployeeId 
    : !!selectedDepartmentId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("linkEmployee")}</DialogTitle>
          <DialogDescription>
            {t("linkEmployeeDescription")}
            <br />
            <span className="font-medium">{fullName}</span> ({member.user.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup
            value={mode}
            onValueChange={(value) => setMode(value as "link" | "create")}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="link" id="link" />
              <Label htmlFor="link">{t("linkExisting")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="create" id="create" />
              <Label htmlFor="create">{t("createNew")}</Label>
            </div>
          </RadioGroup>

          {mode === "link" ? (
            <form action={linkFormAction} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("selectEmployee")}</Label>
                <EmployeeLookup
                  organisationAlias={organisationAlias}
                  value={selectedEmployeeId}
                  onChange={(id) => setSelectedEmployeeId(id)}
                  disabled={isPending}
                />
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
                <Button type="submit" disabled={isPending || !canSubmit}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("linkEmployee")}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form action={createFormAction} className="space-y-4">
              <div className="space-y-2">
                <Label>{tEmployees("department")}</Label>
                <Select
                  name="departmentId"
                  value={selectedDepartmentId}
                  onValueChange={setSelectedDepartmentId}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectDepartment")} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        <div className="flex items-center gap-2">
                          {dept.colorCode && (
                            <div
                              className="h-3 w-3 rounded-xs shrink-0"
                              style={{ backgroundColor: dept.colorCode }}
                            />
                          )}
                          <span>{dept.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("titleOptional")}</Label>
                <Input
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("titlePlaceholder")}
                  disabled={isPending}
                />
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
                <Button type="submit" disabled={isPending || !canSubmit}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {tCommon("create")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
