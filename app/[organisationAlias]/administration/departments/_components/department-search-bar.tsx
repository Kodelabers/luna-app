"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useTransition, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowDownAZ, ArrowUpZA, Search, Loader2 } from "lucide-react";

export function DepartmentSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("departments");
  const tCommon = useTranslations("common");

  const currentSearch = searchParams.get("search") || "";
  const currentSort = (searchParams.get("sort") as "asc" | "desc") || "asc";

  const [searchValue, setSearchValue] = useState(currentSearch);

  // Sync search value when URL changes externally
  useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === "") {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, value);
        }
      }

      return newSearchParams.toString();
    },
    [searchParams]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== currentSearch) {
        startTransition(() => {
          const queryString = createQueryString({ search: searchValue || null });
          router.push(queryString ? `${pathname}?${queryString}` : pathname);
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, currentSearch, createQueryString, pathname, router]);

  const toggleSort = () => {
    const newSort = currentSort === "asc" ? "desc" : "asc";
    startTransition(() => {
      const queryString = createQueryString({ sort: newSort });
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9"
        />
        {isPending && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={toggleSort}
        title={currentSort === "asc" ? tCommon("sortAsc") : tCommon("sortDesc")}
      >
        {currentSort === "asc" ? (
          <ArrowDownAZ className="h-4 w-4" />
        ) : (
          <ArrowUpZA className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

