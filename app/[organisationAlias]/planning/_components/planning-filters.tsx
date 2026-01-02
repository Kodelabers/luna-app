"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { hr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

type Department = {
  id: string;
  name: string;
  colorCode: string | null;
};

type PlanningFiltersProps = {
  fromLocalISO: string;
  toLocalISO: string;
  departmentIds: string[];
  departments: Department[];
  isGeneralManager: boolean;
  clientTimeZone: string;
  organisationAlias: string;
};

export function PlanningFilters({
  fromLocalISO,
  toLocalISO,
  departmentIds,
  departments,
  isGeneralManager,
  clientTimeZone,
  organisationAlias,
}: PlanningFiltersProps) {
  const t = useTranslations("planning");
  const locale = useLocale();
  const dateLocale = locale === "hr" ? hr : enUS;
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize date range from props
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (fromLocalISO && toLocalISO) {
      return {
        from: new Date(fromLocalISO),
        to: new Date(toLocalISO),
      };
    }
    return undefined;
  });

  // Initialize selected departments - if empty or all departments selected, show all
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>(
    departmentIds.length === 0 || departmentIds.length === departments.length
      ? departments.map((d) => d.id)
      : departmentIds
  );

  // Update URL when filters change
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      const newFrom = format(dateRange.from, "yyyy-MM-dd");
      const newTo = format(dateRange.to, "yyyy-MM-dd");
      
      // If all departments are selected, don't include department param (show all)
      const allSelected = selectedDepartmentIds.length === departments.length;
      const deptIds = allSelected ? [] : selectedDepartmentIds;

      // Check if filters actually changed
      const deptIdsChanged = 
        deptIds.length !== departmentIds.length ||
        deptIds.some((id) => !departmentIds.includes(id));

      if (
        newFrom !== fromLocalISO ||
        newTo !== toLocalISO ||
        deptIdsChanged
      ) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("from", newFrom);
        params.set("to", newTo);
        if (deptIds.length > 0) {
          params.set("department", deptIds.join(","));
        } else {
          params.delete("department");
        }
        router.push(`/${organisationAlias}/planning?${params.toString()}`);
      }
    }
  }, [dateRange, selectedDepartmentIds, fromLocalISO, toLocalISO, departmentIds, departments.length, organisationAlias, router, searchParams]);

  // Preset handlers - calculate range from today (not from start of month)
  const handlePreset = (months: number) => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    end.setMonth(end.getMonth() + months);
    // Set to end of day
    end.setHours(23, 59, 59, 999);
    setDateRange({ from: start, to: end });
  };

  // Determine which preset is active (if any)
  const getActivePreset = (): number | null => {
    if (!dateRange?.from || !dateRange?.to) return null;
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Check if current range matches any preset (from today + N months)
    const presets = [1, 3, 6, 12];
    for (const months of presets) {
      const presetStart = new Date(todayStart);
      const presetEnd = new Date(todayStart);
      presetEnd.setMonth(presetEnd.getMonth() + months);
      presetEnd.setHours(23, 59, 59, 999);
      
      // Compare dates (ignore time)
      if (
        format(dateRange.from, "yyyy-MM-dd") === format(presetStart, "yyyy-MM-dd") &&
        format(dateRange.to, "yyyy-MM-dd") === format(presetEnd, "yyyy-MM-dd")
      ) {
        return months;
      }
    }
    
    return null;
  };

  const activePreset = getActivePreset();
  const monthOptions = [
    { value: 1, label: t("presets.1month") },
    { value: 3, label: t("presets.3months") },
    { value: 6, label: t("presets.6months") },
    { value: 12, label: t("presets.12months") },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {monthOptions.map((option) => (
          <Button
            key={option.value}
            variant={activePreset === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => handlePreset(option.value)}
            className="flex-1 sm:flex-none"
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Date Range Picker */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full sm:w-[300px] justify-start text-left font-normal",
                !dateRange?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "PPP", { locale: dateLocale })} -{" "}
                    {format(dateRange.to, "PPP", { locale: dateLocale })}
                  </>
                ) : (
                  format(dateRange.from, "PPP", { locale: dateLocale })
                )
              ) : (
                <span>{t("selectDateRange")}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={dateLocale}
            />
          </PopoverContent>
        </Popover>

        {/* Department Multi-Select Filter - show for both GM and DM if they have multiple departments */}
        {departments.length > 1 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-[250px] justify-between"
              >
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
        )}
      </div>
    </div>
  );
}

