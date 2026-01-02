"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Crown, Building2, Loader2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Department = {
  id: string;
  name: string;
  colorCode: string | null;
};

type ManagerFilterProps = {
  departments: Department[];
};

export function ManagerFilter({ departments }: ManagerFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("managers");

  const currentDepartment = searchParams.get("department") || "all";

  const handleChange = (value: string) => {
    startTransition(() => {
      if (value === "all") {
        router.push(pathname);
      } else {
        router.push(`${pathname}?department=${value}`);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={currentDepartment} onValueChange={handleChange}>
        <SelectTrigger className="w-[220px]">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SelectValue placeholder={t("filterByDepartment")} />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allDepartments")}</SelectItem>
          <SelectItem value="general">
            <div className="flex items-center gap-2">
              <Crown className="h-3 w-3 text-amber-500" />
              <span>{t("generalManagers")}</span>
            </div>
          </SelectItem>
          {departments.map((dept) => (
            <SelectItem key={dept.id} value={dept.id.toString()}>
              <div className="flex items-center gap-2">
                {dept.colorCode ? (
                  <div
                    className="h-3 w-3 rounded-xs shrink-0"
                    style={{ backgroundColor: dept.colorCode }}
                  />
                ) : (
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                )}
                <span>{dept.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

