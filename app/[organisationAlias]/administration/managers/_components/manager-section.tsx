"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ManagerList } from "./manager-list";
import { AddManagerDialog } from "./add-manager-dialog";
import { Crown, Building2 } from "lucide-react";

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

type ManagerSectionProps = {
  title: string;
  departmentId?: number | null;
  managers: Manager[];
  organisationAlias: string;
  colorCode?: string | null;
  isGeneral?: boolean;
};

export function ManagerSection({
  title,
  departmentId,
  managers,
  organisationAlias,
  colorCode,
  isGeneral = false,
}: ManagerSectionProps) {
  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isGeneral ? (
              <Crown className="h-4 w-4 text-amber-500" />
            ) : (
              <>
                {colorCode && (
                  <div
                    className="h-3 w-3 rounded-xs shrink-0 shadow-sm"
                    style={{ backgroundColor: colorCode }}
                  />
                )}
                {!colorCode && (
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                )}
              </>
            )}
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              {title}
            </CardTitle>
          </div>
          <AddManagerDialog
            organisationAlias={organisationAlias}
            departmentId={departmentId}
            departmentName={title}
          />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        <ManagerList
          managers={managers}
          organisationAlias={organisationAlias}
          departmentName={title}
        />
      </CardContent>
    </Card>
  );
}

