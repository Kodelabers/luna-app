"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

type Department = {
  id: string;
  name: string;
  colorCode: string | null;
};

type DepartmentFilterProps = {
  departmentIds: string[];
  departments: Department[];
  organisationAlias: string;
  reasonId?: string;
};

export function DepartmentFilter({
  departmentIds,
  departments,
  organisationAlias,
  reasonId,
}: DepartmentFilterProps) {
  const t = useTranslations("daysBalance");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize selected departments - if empty or all departments selected, show all
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>(
    departmentIds.length === 0 || departmentIds.length === departments.length
      ? departments.map((d) => d.id)
      : departmentIds
  );

  // Update URL when filters change
  useEffect(() => {
    // If all departments are selected, don't include department param (show all)
    const allSelected = selectedDepartmentIds.length === departments.length;
    const deptIds = allSelected ? [] : selectedDepartmentIds;

    // Check if filters actually changed
    const deptIdsChanged =
      deptIds.length !== departmentIds.length ||
      deptIds.some((id) => !departmentIds.includes(id));

    if (deptIdsChanged) {
      const params = new URLSearchParams(searchParams.toString());
      if (deptIds.length > 0) {
        params.set("department", deptIds.join(","));
      } else {
        params.delete("department");
      }
      const basePath = reasonId
        ? `/${organisationAlias}/administration/days-balance/${reasonId}`
        : `/${organisationAlias}/administration/days-balance`;
      router.push(`${basePath}?${params.toString()}`);
    }
  }, [
    selectedDepartmentIds,
    departmentIds,
    departments.length,
    organisationAlias,
    router,
    searchParams,
  ]);

  // Only show filter if there are multiple departments
  if (departments.length <= 1) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full sm:w-[250px] justify-between">
          <span className="truncate">
            {selectedDepartmentIds.length === departments.length
              ? t("allDepartments")
              : selectedDepartmentIds.length === 0
              ? t("noDepartments")
              : selectedDepartmentIds.length === 1
              ? departments.find((d) => d.id === selectedDepartmentIds[0])?.name
              : t("selectedDepartments", { count: selectedDepartmentIds.length })}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <div className="p-2">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm font-medium">{t("selectDepartments")}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => {
                if (selectedDepartmentIds.length === departments.length) {
                  setSelectedDepartmentIds([]);
                } else {
                  setSelectedDepartmentIds(departments.map((d) => d.id));
                }
              }}
            >
              {selectedDepartmentIds.length === departments.length
                ? t("deselectAll")
                : t("selectAll")}
            </Button>
          </div>
          <div className="border-t mt-2 pt-2 space-y-1 max-h-[300px] overflow-y-auto">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="flex items-center space-x-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
                onClick={() => {
                  if (selectedDepartmentIds.includes(dept.id)) {
                    setSelectedDepartmentIds(
                      selectedDepartmentIds.filter((id) => id !== dept.id)
                    );
                  } else {
                    setSelectedDepartmentIds([...selectedDepartmentIds, dept.id]);
                  }
                }}
              >
                <Checkbox
                  checked={selectedDepartmentIds.includes(dept.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedDepartmentIds([...selectedDepartmentIds, dept.id]);
                    } else {
                      setSelectedDepartmentIds(
                        selectedDepartmentIds.filter((id) => id !== dept.id)
                      );
                    }
                  }}
                />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {dept.colorCode && (
                    <div
                      className="h-3 w-3 rounded-xs shrink-0"
                      style={{ backgroundColor: dept.colorCode }}
                    />
                  )}
                  <span className="text-sm truncate">{dept.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

