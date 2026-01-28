"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { MoreVertical, Shield, Trash2, Loader2, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { MemberRoleDialog } from "./member-role-dialog";
import { LinkEmployeeDialog } from "./link-employee-dialog";
import { removeMember } from "@/lib/actions/member";

type Department = {
  id: string;
  name: string;
  colorCode: string | null;
};

type Member = {
  id: string;
  roles: string[];
  joinedAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employees: {
      id: string;
      firstName: string;
      lastName: string;
    }[];
  };
};

type MemberActionsProps = {
  member: Member;
  organisationAlias: string;
  isCurrentUser: boolean;
  departments: Department[];
};

export function MemberActions({
  member,
  organisationAlias,
  isCurrentUser,
  departments,
}: MemberActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [linkEmployeeDialogOpen, setLinkEmployeeDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("members");
  const tCommon = useTranslations("common");

  const hasEmployee = member.user.employees.length > 0;

  const handleDeleteConfirm = () => {
    startTransition(async () => {
      const result = await removeMember(organisationAlias, member.id);

      if (result.success) {
        toast.success(result.message);
        setDeleteDialogOpen(false);
      } else {
        toast.error(result.formError || t("removeError"));
      }
    });
  };

  const fullName = `${member.user.firstName} ${member.user.lastName}`;

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
          <DropdownMenuItem onClick={() => setRoleDialogOpen(true)}>
            <Shield className="h-4 w-4" />
            {t("editRoles")}
          </DropdownMenuItem>
          {!hasEmployee && (
            <DropdownMenuItem onClick={() => setLinkEmployeeDialogOpen(true)}>
              <UserPlus className="h-4 w-4" />
              {t("linkEmployee")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isCurrentUser}
          >
            <Trash2 className="h-4 w-4" />
            {t("removeMember")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Role dialog */}
      <MemberRoleDialog
        member={member}
        organisationAlias={organisationAlias}
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
      />

      {/* Link employee dialog */}
      {!hasEmployee && (
        <LinkEmployeeDialog
          member={member}
          organisationAlias={organisationAlias}
          departments={departments}
          open={linkEmployeeDialogOpen}
          onOpenChange={setLinkEmployeeDialogOpen}
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("removeMember")}</DialogTitle>
            <DialogDescription>
              {t("confirmRemove", { name: fullName })}
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
