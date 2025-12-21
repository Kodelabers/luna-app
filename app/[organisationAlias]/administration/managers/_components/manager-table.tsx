"use client";

import { Fragment, useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { X, Loader2, Crown, Building2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AddManagerDialog } from "./add-manager-dialog";
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

type Department = {
  id: number;
  name: string;
  colorCode: string | null;
  managers: Manager[];
};

type ManagerTableProps = {
  generalManagers: Manager[];
  departments: Department[];
  organisationAlias: string;
  filteredDepartmentId?: number | null;
};

export function ManagerTable({
  generalManagers,
  departments,
  organisationAlias,
  filteredDepartmentId,
}: ManagerTableProps) {
  const t = useTranslations("managers");
  const tCommon = useTranslations("common");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [managerToDelete, setManagerToDelete] = useState<{
    manager: Manager;
    departmentName: string;
    isGeneral: boolean;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDeleteClick = (
    manager: Manager,
    departmentName: string,
    isGeneral: boolean
  ) => {
    setManagerToDelete({ manager, departmentName, isGeneral });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!managerToDelete) return;

    startTransition(async () => {
      const result = await deleteManager(
        organisationAlias,
        managerToDelete.manager.id
      );

      if (result.success) {
        toast.success(result.message);
        setDeleteDialogOpen(false);
        setManagerToDelete(null);
      } else {
        toast.error(result.formError || t("removeError"));
      }
    });
  };

  // Determine what to show based on filter
  const showGeneralManagers =
    filteredDepartmentId === undefined || filteredDepartmentId === null;
  const filteredDepartments =
    filteredDepartmentId === undefined
      ? departments
      : filteredDepartmentId === null
        ? [] // Only general managers selected
        : departments.filter((d) => d.id === filteredDepartmentId);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>{t("employee")}</TableHead>
            <TableHead>{t("emailColumn")}</TableHead>
            <TableHead className="w-16 text-right">{tCommon("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* General Managers Section */}
          {showGeneralManagers && (
            <>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableCell colSpan={3} className="py-2">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-sm uppercase tracking-wide">
                      {t("generalManagers")}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right py-2">
                  <AddManagerDialog
                    organisationAlias={organisationAlias}
                    departmentId={null}
                    departmentName={t("generalManagers")}
                  />
                </TableCell>
              </TableRow>
              {generalManagers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground text-sm py-3 italic"
                  >
                    {t("noManagers")}
                  </TableCell>
                </TableRow>
              ) : (
                generalManagers.map((manager, index) => (
                  <TableRow key={manager.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {manager.employee.firstName} {manager.employee.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {manager.employee.email}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          handleDeleteClick(manager, t("generalManagers"), true)
                        }
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">{t("removeManager")}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </>
          )}

          {/* Department Sections */}
          {filteredDepartments.map((department) => (
            <Fragment key={`header-${department.id}`}>
              <TableRow
                key={`header-${department.id}`}
                className="bg-muted/50 hover:bg-muted/50"
              >
                <TableCell colSpan={3} className="py-2">
                  <div className="flex items-center gap-2">
                    {department.colorCode ? (
                      <div
                        className="h-3 w-3 rounded-xs shrink-0 shadow-sm"
                        style={{ backgroundColor: department.colorCode }}
                      />
                    ) : (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-semibold text-sm uppercase tracking-wide">
                      {department.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right py-2">
                  <AddManagerDialog
                    organisationAlias={organisationAlias}
                    departmentId={department.id}
                    departmentName={department.name}
                  />
                </TableCell>
              </TableRow>
              {department.managers.length === 0 ? (
                <TableRow key={`empty-${department.id}`}>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground text-sm py-3 italic"
                  >
                    {t("noManagers")}
                  </TableCell>
                </TableRow>
              ) : (
                department.managers.map((manager, index) => (
                  <TableRow key={manager.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {manager.employee.firstName} {manager.employee.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {manager.employee.email}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          handleDeleteClick(manager, department.name, false)
                        }
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">{t("removeManager")}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("removeManager")}</DialogTitle>
            <DialogDescription>
              {managerToDelete?.isGeneral
                ? t("removeGeneralConfirm", {
                    name: `${managerToDelete.manager.employee.firstName} ${managerToDelete.manager.employee.lastName}`,
                  })
                : t("removeConfirm", {
                    name: `${managerToDelete?.manager.employee.firstName} ${managerToDelete?.manager.employee.lastName}`,
                    department: managerToDelete?.departmentName || "",
                  })}
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

