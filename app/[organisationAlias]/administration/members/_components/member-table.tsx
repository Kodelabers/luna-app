"use client";

import { useTranslations } from "next-intl";
import { format } from "date-fns";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MemberActions } from "./member-actions";

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

type MemberTableProps = {
  members: Member[];
  organisationAlias: string;
  currentUserId: string;
  departments: Department[];
};

export function MemberTable({
  members,
  organisationAlias,
  currentUserId,
  departments,
}: MemberTableProps) {
  const t = useTranslations("members");
  const tCommon = useTranslations("common");

  if (members.length === 0) {
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
          <TableHead>{t("linkedEmployee")}</TableHead>
          <TableHead>{t("roles")}</TableHead>
          <TableHead>{t("joinedAt")}</TableHead>
          <TableHead className="text-right">{tCommon("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member, index) => (
          <TableRow key={member.id}>
            <TableCell className="text-xs text-muted-foreground">
              {index + 1}
            </TableCell>
            <TableCell className="font-medium">
              {member.user.firstName} {member.user.lastName}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {member.user.email}
            </TableCell>
            <TableCell>
              {member.user.employees[0] ? (
                <Link
                  href={`/${organisationAlias}/administration/employees?search=${encodeURIComponent(member.user.employees[0].lastName)}`}
                  className="text-primary hover:underline"
                >
                  {member.user.employees[0].firstName} {member.user.employees[0].lastName}
                </Link>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                {member.roles.includes("ADMIN") ? (
                  <Badge variant="default">{t("roleAdmin")}</Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    {t("noRole")}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {format(member.joinedAt, "dd.MM.yyyy.")}
            </TableCell>
            <TableCell className="text-right">
              <MemberActions
                member={member}
                organisationAlias={organisationAlias}
                isCurrentUser={member.user.id === currentUserId}
                departments={departments}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
