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
import { EmployeeActions } from "./employee-actions";

type Department = {
  id: string;
  name: string;
  colorCode: string | null;
};

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string | null;
  departmentId: string;
  userId: string | null;
  department: {
    id: string;
    name: string;
    colorCode: string | null;
  };
};

type EmployeeTableProps = {
  employees: Employee[];
  organisationAlias: string;
  departments: Department[];
};

export function EmployeeTable({
  employees,
  organisationAlias,
  departments,
}: EmployeeTableProps) {
  const t = useTranslations("employees");
  const tCommon = useTranslations("common");

  if (employees.length === 0) {
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
          <TableHead className="w-10">#</TableHead>
          <TableHead>{t("fullName")}</TableHead>
          <TableHead>{t("email")}</TableHead>
          <TableHead>{t("department")}</TableHead>
          <TableHead className="text-right">{tCommon("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((emp, index) => (
          <TableRow key={emp.id}>
            <TableCell className="text-xs text-muted-foreground">
              {index + 1}
            </TableCell>
            <TableCell className="font-medium">
              {emp.firstName} {emp.lastName}
              {emp.title && (
                <span className="text-xs text-muted-foreground ml-1">({emp.title})</span>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">{emp.email}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {emp.department.colorCode && (
                  <div
                    className="h-3 w-3 rounded-xs shrink-0 shadow-sm"
                    style={{ backgroundColor: emp.department.colorCode }}
                  />
                )}
                <Badge variant="outline">{emp.department.name}</Badge>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <EmployeeActions
                employee={emp}
                organisationAlias={organisationAlias}
                departments={departments}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

