"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DepartmentEditButton } from "./department-dialog";
import { deleteDepartment } from "@/lib/actions/department";
import { Loader2, Trash2 } from "lucide-react";

type Department = {
  id: number;
  name: string;
  alias: string;
  description: string | null;
  colorCode: string | null;
  _count: {
    employees: number;
    managers: number;
  };
};

type DepartmentTableProps = {
  departments: Department[];
  organisationAlias: string;
};

export function DepartmentTable({
  departments,
  organisationAlias,
}: DepartmentTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("departments");
  const tCommon = useTranslations("common");

  const handleDeleteClick = (department: Department) => {
    setDepartmentToDelete(department);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!departmentToDelete) return;

    startTransition(async () => {
      const result = await deleteDepartment(
        organisationAlias,
        departmentToDelete.id
      );

      if (result.success) {
        toast.success(result.message);
        setDeleteDialogOpen(false);
        setDepartmentToDelete(null);
      } else {
        toast.error(result.formError || t("deleteError"));
      }
    });
  };

  if (departments.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">
          {t("noSearchResults")}
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("name")}</TableHead>
            <TableHead>{t("alias")}</TableHead>
            <TableHead>{t("employeesCount")}</TableHead>
            <TableHead>{t("managersCount")}</TableHead>
            <TableHead className="text-right">{tCommon("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((dept) => (
            <TableRow key={dept.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {dept.colorCode && (
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: dept.colorCode }}
                    />
                  )}
                  <span>{dept.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{dept.alias}</Badge>
              </TableCell>
              <TableCell>{dept._count.employees}</TableCell>
              <TableCell>{dept._count.managers}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <DepartmentEditButton
                    organisationAlias={organisationAlias}
                    department={dept}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(dept)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteDepartment")}</DialogTitle>
            <DialogDescription>
              {t("deleteConfirm", { name: departmentToDelete?.name || "" })}
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

