"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Loader2,
  User,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  searchEmployeesForManager,
  getEmployeesForManager,
} from "@/lib/actions/manager";
import { cn } from "@/lib/utils";

type EmployeeResult = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type EmployeeSearchProps = {
  organisationAlias: string;
  departmentId?: string | null;
  onSelect: (employee: EmployeeResult) => void;
  disabled?: boolean;
};

export function EmployeeSearch({
  organisationAlias,
  departmentId,
  onSelect,
  disabled = false,
}: EmployeeSearchProps) {
  const t = useTranslations("managers");
  const tPagination = useTranslations("pagination");

  const [mode, setMode] = useState<"search" | "all">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EmployeeResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pagination state for "all" mode
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Debounced search
  useEffect(() => {
    if (mode !== "search") return;

    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      startTransition(async () => {
        const employees = await searchEmployeesForManager(
          organisationAlias,
          query,
          departmentId
        );
        setResults(employees);
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, organisationAlias, departmentId, mode]);

  // Load all employees when in "all" mode
  useEffect(() => {
    if (mode !== "all") return;

    startTransition(async () => {
      const result = await getEmployeesForManager(
        organisationAlias,
        currentPage,
        departmentId
      );
      setResults(result.employees);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    });
  }, [mode, currentPage, organisationAlias, departmentId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (employee: EmployeeResult) => {
    onSelect(employee);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setMode("search");
    setCurrentPage(1);
  };

  const handleShowAll = () => {
    setMode("all");
    setCurrentPage(1);
    setQuery("");
  };

  const handleBackToSearch = () => {
    setMode("search");
    setResults([]);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {mode === "search" ? (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              disabled={disabled}
              className="pl-9 pr-9"
            />
            {isPending && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-72 overflow-auto">
              {query.length < 2 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  {t("typeToSearch")}
                </div>
              ) : results.length === 0 && !isPending ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  {t("noEmployeesFound")}
                </div>
              ) : (
                <ul className="py-1">
                  {results.map((employee) => (
                    <li key={employee.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(employee)}
                        className={cn(
                          "w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2"
                        )}
                      >
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {employee.email}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Show all button */}
              <div className="border-t p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={handleShowAll}
                >
                  <List className="h-4 w-4 mr-2" />
                  {t("showAll")}
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* "All" mode with pagination */
        <div className="border rounded-md">
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b bg-muted/30">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleBackToSearch}
            >
              <Search className="h-4 w-4 mr-1" />
              {t("backToSearch")}
            </Button>
            <span className="text-xs text-muted-foreground">
              {totalCount} {t("employeesTotal")}
            </span>
          </div>

          {/* Employee list */}
          <div className="max-h-64 overflow-auto">
            {isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                {t("noEmployeesFound")}
              </div>
            ) : (
              <ul className="py-1">
                {results.map((employee) => (
                  <li key={employee.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(employee)}
                      disabled={disabled}
                      className={cn(
                        "w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2"
                      )}
                    >
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {employee.email}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-2 border-t bg-muted/30">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage <= 1 || isPending}
              >
                <ChevronLeft className="h-4 w-4" />
                {tPagination("previous")}
              </Button>
              <span className="text-xs text-muted-foreground">
                {tPagination("pageOf", {
                  current: currentPage,
                  total: totalPages,
                })}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages || isPending}
              >
                {tPagination("next")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
