"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { hr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

type Department = {
  id: number;
  name: string;
  colorCode: string | null;
};

type PlanningFiltersProps = {
  fromLocalISO: string;
  toLocalISO: string;
  departmentId: number | undefined;
  departments: Department[];
  isGeneralManager: boolean;
  clientTimeZone: string;
  organisationAlias: string;
};

export function PlanningFilters({
  fromLocalISO,
  toLocalISO,
  departmentId,
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

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | "all"
  >(departmentId ?? "all");

  // Update URL when filters change
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      const newFrom = format(dateRange.from, "yyyy-MM-dd");
      const newTo = format(dateRange.to, "yyyy-MM-dd");
      const deptId =
        selectedDepartmentId === "all"
          ? undefined
          : Number(selectedDepartmentId);

      if (
        newFrom !== fromLocalISO ||
        newTo !== toLocalISO ||
        deptId !== departmentId
      ) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("from", newFrom);
        params.set("to", newTo);
        if (deptId) {
          params.set("department", deptId.toString());
        } else {
          params.delete("department");
        }
        router.push(`/${organisationAlias}/planning?${params.toString()}`);
      }
    }
  }, [dateRange, selectedDepartmentId, fromLocalISO, toLocalISO, departmentId, organisationAlias, router, searchParams]);

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

        {/* Department Filter - only show for DM */}
        {!isGeneralManager && departments.length > 0 && (
          <Select
            value={selectedDepartmentId.toString()}
            onValueChange={(value) => setSelectedDepartmentId(value as number | "all")}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t("allDepartments")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allDepartments")}</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  <div className="flex items-center gap-2">
                    {dept.colorCode && (
                      <div
                        className="h-3 w-3 rounded-xs shrink-0"
                        style={{ backgroundColor: dept.colorCode }}
                      />
                    )}
                    <span>{dept.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

