"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2, User, Check } from "lucide-react";
import { searchUsers, getUserById } from "@/lib/actions/employee";
import { cn } from "@/lib/utils";

type UserResult = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

type UserLookupProps = {
  organisationAlias: string;
  value: number | null;
  onChange: (userId: number | null) => void;
  disabled?: boolean;
};

export function UserLookup({
  organisationAlias,
  value,
  onChange,
  disabled = false,
}: UserLookupProps) {
  const t = useTranslations("employees");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load selected user on mount if value exists
  useEffect(() => {
    if (value && !selectedUser) {
      startTransition(async () => {
        const user = await getUserById(organisationAlias, value);
        if (user) {
          setSelectedUser(user);
        }
      });
    }
  }, [value, organisationAlias, selectedUser]);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      startTransition(async () => {
        const users = await searchUsers(organisationAlias, query);
        setResults(users);
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

  const handleSelect = (user: UserResult) => {
    setSelectedUser(user);
    onChange(user.id);
    setIsOpen(false);
    setQuery("");
    setResults([]);
  };

  const handleClear = () => {
    setSelectedUser(null);
    onChange(null);
    setQuery("");
    setResults([]);
  };

  if (selectedUser) {
    return (
      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
        <User className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {selectedUser.firstName} {selectedUser.lastName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {selectedUser.email}
          </p>
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
            <span className="sr-only">{t("unlinkUser")}</span>
          </Button>
        )}
        {/* Hidden input for form submission */}
        <input type="hidden" name="userId" value={selectedUser.id} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={t("searchUsers")}
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
              {t("typeToSearch")}
            </div>
          ) : results.length === 0 && !isPending ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              {t("noUsersFound")}
            </div>
          ) : (
            <ul className="py-1">
              {results.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(user)}
                    className={cn(
                      "w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2",
                      value === user.id && "bg-accent"
                    )}
                  >
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    {value === user.id && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Hidden input for form when no user selected */}
      <input type="hidden" name="userId" value="" />
    </div>
  );
}

