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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { updateMemberRoles } from "@/lib/actions/member";
import { initialFormState } from "@/lib/errors";

type Member = {
  id: string;
  roles: string[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

type MemberRoleDialogProps = {
  member: Member;
  organisationAlias: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MemberRoleDialog({
  member,
  organisationAlias,
  open,
  onOpenChange,
}: MemberRoleDialogProps) {
  const t = useTranslations("members");
  const tCommon = useTranslations("common");
  
  const [isAdmin, setIsAdmin] = useState(member.roles.includes("ADMIN"));

  // Create bound action with organisationAlias and memberId
  const boundAction = updateMemberRoles.bind(null, organisationAlias, member.id);

  const [state, formAction, isPending] = useActionState(
    boundAction,
    initialFormState
  );

  // Handle form state changes
  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      onOpenChange(false);
    } else if (state.formError) {
      toast.error(state.formError);
    }
  }, [state, onOpenChange]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setIsAdmin(member.roles.includes("ADMIN"));
    }
  }, [open, member.roles]);

  const fullName = `${member.user.firstName} ${member.user.lastName}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t("editRoles")}</DialogTitle>
          <DialogDescription>
            {fullName}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="isAdmin" value={isAdmin ? "true" : "false"} />
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isAdmin"
              checked={isAdmin}
              onCheckedChange={(checked) => setIsAdmin(checked === true)}
            />
            <Label htmlFor="isAdmin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {t("roleAdmin")}
            </Label>
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
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
