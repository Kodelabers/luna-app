"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, X } from "lucide-react";

export function HolidaySearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("holidays");
  const tCommon = useTranslations("common");

  const currentYear = new Date().getFullYear();
  const currentSearch = searchParams.get("search") || "";
  const currentSort = (searchParams.get("sort") as "asc" | "desc") || "asc";
  const currentType = searchParams.get("type") || "";
  const currentYearFilter = searchParams.get("year") || currentYear.toString();

  // Generate year options (current year + 5 years forward and 5 years back)
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  }, [currentYear]);

  const hasFilters = currentSearch || currentSort !== "asc" || currentType || currentYearFilter !== currentYear.toString();

  const updateParams = (updates: {
    search?: string | null;
    sort?: string | null;
    type?: string | null;
    year?: string | null;
  }) => {
    startTransition(() => {
      const params = new URLSearchParams();

      // Handle search
      const newSearch = updates.search !== undefined ? updates.search : currentSearch;
      if (newSearch) params.set("search", newSearch);

      // Handle sort
      const newSort = updates.sort !== undefined ? updates.sort : currentSort;
      if (newSort && newSort !== "asc") params.set("sort", newSort);

      // Handle type filter
      const newType = updates.type !== undefined ? updates.type : currentType;
      if (newType) params.set("type", newType);

      // Handle year filter
      const newYear = updates.year !== undefined ? updates.year : currentYearFilter;
      if (newYear && newYear !== currentYear.toString()) params.set("year", newYear);

      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get("search") as string;
    const sort = formData.get("sort") as string;
    const type = formData.get("type") as string;
    const year = formData.get("year") as string;

    updateParams({
      search: search || null,
      sort: sort || null,
      type: type === "all" ? null : type || null,
      year: year || null,
    });
  };

  const handleRemoveSearch = () => {
    updateParams({ search: null });
  };

  const handleRemoveSort = () => {
    updateParams({ sort: "asc" });
  };

  const handleRemoveType = () => {
    updateParams({ type: null });
  };

  const handleRemoveYear = () => {
    updateParams({ year: currentYear.toString() });
  };

  const handleReset = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  // Key for form to force re-mount when filters are reset
  const formKey = `${currentSearch}-${currentSort}-${currentType}-${currentYearFilter}`;

  return (
    <div className="space-y-3">
      <form
        key={formKey}
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row sm:items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            placeholder={t("searchPlaceholder")}
            defaultValue={currentSearch}
            className="pl-9"
          />
        </div>
        <Select name="year" defaultValue={currentYearFilter}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder={t("year")} />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="type" defaultValue={currentType || "all"}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t("allTypes")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allTypes")}</SelectItem>
            <SelectItem value="yearly">{t("yearly")}</SelectItem>
            <SelectItem value="oneTime">{t("oneTime")}</SelectItem>
          </SelectContent>
        </Select>
        <Select name="sort" defaultValue={currentSort}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">{t("sortDateAsc")}</SelectItem>
            <SelectItem value="desc">{t("sortDateDesc")}</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {tCommon("search")}
        </Button>
      </form>

      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {currentSearch && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 gap-1 pr-1"
              onClick={handleRemoveSearch}
            >
              <span className="text-muted-foreground">{tCommon("search")}:</span>
              <span>{currentSearch}</span>
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {currentType && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 gap-1 pr-1"
              onClick={handleRemoveType}
            >
              <span className="text-muted-foreground">{t("repeatYearly")}:</span>
              <span>{currentType === "yearly" ? t("yearly") : t("oneTime")}</span>
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {currentYearFilter !== currentYear.toString() && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 gap-1 pr-1"
              onClick={handleRemoveYear}
            >
              <span className="text-muted-foreground">{t("year")}:</span>
              <span>{currentYearFilter}</span>
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {currentSort !== "asc" && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 gap-1 pr-1"
              onClick={handleRemoveSort}
            >
              <span>{t("sortDateDesc")}</span>
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isPending}
            className="h-6 px-2 text-xs"
          >
            {t("reset")}
          </Button>
        </div>
      )}
    </div>
  );
}

