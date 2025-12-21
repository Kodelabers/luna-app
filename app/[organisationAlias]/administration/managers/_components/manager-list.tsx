"use client";

import { useTranslations } from "next-intl";
import { ManagerItem } from "./manager-item";

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

type ManagerListProps = {
  managers: Manager[];
  organisationAlias: string;
  departmentName?: string;
};

export function ManagerList({
  managers,
  organisationAlias,
  departmentName,
}: ManagerListProps) {
  const t = useTranslations("managers");

  if (managers.length === 0) {
    return (
      <div className="py-3 px-3 text-sm text-muted-foreground italic">
        {t("noManagers")}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {managers.map((manager) => (
        <ManagerItem
          key={manager.id}
          manager={manager}
          organisationAlias={organisationAlias}
          departmentName={departmentName}
        />
      ))}
    </div>
  );
}

