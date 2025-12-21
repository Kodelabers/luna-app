"use client";

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
import { DepartmentActions } from "./department-actions";

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
  const t = useTranslations("departments");
  const tCommon = useTranslations("common");

  if (departments.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">{t("noSearchResults")}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
        <TableHead>#</TableHead>
          <TableHead>{t("name")}</TableHead>
          <TableHead>{t("alias")}</TableHead>
          <TableHead>{t("employeesCount")}</TableHead>
          <TableHead>{t("managersCount")}</TableHead>
          <TableHead className="text-right">{tCommon("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {departments.map((dept, index) => (
          <TableRow key={dept.id}>
            <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {dept.colorCode && (
                  <div
                    className="h-3 w-3 rounded-xs shrink-0 shadow-sm"
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
              <DepartmentActions
                department={dept}
                organisationAlias={organisationAlias}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
