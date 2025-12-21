"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
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

export function DepartmentSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("departments");
  const tCommon = useTranslations("common");

  const currentSearch = searchParams.get("search") || "";
  const currentSort = (searchParams.get("sort") as "asc" | "desc") || "asc";

  const hasFilters = currentSearch || currentSort !== "asc";

  const updateParams = (updates: { search?: string | null; sort?: string | null }) => {
    startTransition(() => {
      const params = new URLSearchParams();
      
      // Handle search
      const newSearch = updates.search !== undefined ? updates.search : currentSearch;
      if (newSearch) params.set("search", newSearch);
      
      // Handle sort
      const newSort = updates.sort !== undefined ? updates.sort : currentSort;
      if (newSort && newSort !== "asc") params.set("sort", newSort);
      
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get("search") as string;
    const sort = formData.get("sort") as string;

    updateParams({ search: search || null, sort: sort || null });
  };

  const handleRemoveSearch = () => {
    updateParams({ search: null });
  };

  const handleRemoveSort = () => {
    updateParams({ sort: "asc" });
  };

  const handleReset = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            placeholder={t("searchPlaceholder")}
            defaultValue={currentSearch}
            className="pl-9"
          />
        </div>
        <Select name="sort" defaultValue={currentSort}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">{tCommon("sortAsc")}</SelectItem>
            <SelectItem value="desc">{tCommon("sortDesc")}</SelectItem>
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
          {currentSort !== "asc" && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 gap-1 pr-1"
              onClick={handleRemoveSort}
            >
              <span>{tCommon("sortDesc")}</span>
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
