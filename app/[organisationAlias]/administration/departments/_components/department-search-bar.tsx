"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get("search") as string;
    const sort = formData.get("sort") as string;

    startTransition(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (sort && sort !== "asc") params.set("sort", sort);
      // Reset to page 1 when searching
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    });
  };

  const handleReset = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1 max-w-sm">
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
      {hasFilters && (
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isPending}
        >
          <X className="h-4 w-4" />
          {t("reset")}
        </Button>
      )}
    </form>
  );
}
