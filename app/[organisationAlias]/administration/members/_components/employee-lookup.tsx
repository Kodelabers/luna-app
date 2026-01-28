"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Loader2, User, Check } from "lucide-react";
import { searchUnlinkedEmployees } from "@/lib/actions/member";
import { cn } from "@/lib/utils";

type EmployeeResult = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentName: string;
};

type EmployeeLookupProps = {
  organisationAlias: string;
  value: string | null;
  onChange: (employeeId: string | null, employee: EmployeeResult | null) => void;
  disabled?: boolean;
};

export function EmployeeLookup({
  organisationAlias,
  value,
  onChange,
  disabled = false,
}: EmployeeLookupProps) {
  const t = useTranslations("members");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EmployeeResult[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      startTransition(async () => {
        const employees = await searchUnlinkedEmployees(organisationAlias, query);
        setResults(employees);
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, organisationAlias]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (employee: EmployeeResult) => {
    setSelectedEmployee(employee);
    onChange(employee.id, employee);
    setIsOpen(false);
    setQuery("");
    setResults([]);
  };

  const handleClear = () => {
    setSelectedEmployee(null);
    onChange(null, null);
    setQuery("");
    setResults([]);
  };

  if (selectedEmployee) {
    return (
      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
        <User className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {selectedEmployee.firstName} {selectedEmployee.lastName}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground truncate">
              {selectedEmployee.email}
            </p>
            <Badge variant="outline" className="text-xs">
              {selectedEmployee.departmentName}
            </Badge>
          </div>
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleClear}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {/* Hidden input for form submission */}
        <input type="hidden" name="employeeId" value={selectedEmployee.id} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t("searchEmployees")}
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
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
          {query.length < 2 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              {t("typeToSearchEmployees")}
            </div>
          ) : results.length === 0 && !isPending ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              {t("noUnlinkedEmployees")}
            </div>
          ) : (
            <ul className="py-1">
              {results.map((employee) => (
                <li key={employee.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(employee)}
                    className={cn(
                      "w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2",
                      value === employee.id && "bg-accent"
                    )}
                  >
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground truncate">
                          {employee.email}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {employee.departmentName}
                        </Badge>
                      </div>
                    </div>
                    {value === employee.id && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Hidden input for form when no employee selected */}
      <input type="hidden" name="employeeId" value="" />
    </div>
  );
}
