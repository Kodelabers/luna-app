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
import { EmployeeProfile } from "@/components/employee-profile";

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string | null;
};

type DepartmentEmployeeTableProps = {
  employees: Employee[];
  organisationAlias: string;
};

export function DepartmentEmployeeTable({
  employees,
  organisationAlias,
}: DepartmentEmployeeTableProps) {
  const t = useTranslations("employees");

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
          <TableHead>{t("titleLabel")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((emp, index) => (
          <EmployeeProfile
            key={emp.id}
            employeeId={emp.id}
            organisationAlias={organisationAlias}
          >
            <TableRow className="cursor-pointer">
              <TableCell className="text-xs text-muted-foreground">
                {index + 1}
              </TableCell>
              <TableCell className="font-medium">
                {emp.firstName} {emp.lastName}
              </TableCell>
              <TableCell className="text-muted-foreground">{emp.email}</TableCell>
              <TableCell>
                {emp.title ? (
                  <span className="text-sm">{emp.title}</span>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
            </TableRow>
          </EmployeeProfile>
        ))}
      </TableBody>
    </Table>
  );
}

