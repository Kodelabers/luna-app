"use client";

import { useMockAuth, mockUsers } from "@/lib/mock-data/context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User2, Check } from "lucide-react";

export function RoleSwitcher() {
  const { currentUser, switchRole } = useMockAuth();

  if (!currentUser) return null;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "EMPLOYEE":
        return "Zaposlenik";
      case "DEPARTMENT_MANAGER":
        return "Voditelj odjela";
      case "GENERAL_MANAGER":
        return "Opći voditelj";
      case "ADMIN":
        return "Administrator";
      default:
        return role;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <User2 className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentUser.firstName} {currentUser.lastName}
          </span>
          <span className="text-xs text-muted-foreground">
            ({getRoleLabel(currentUser.role)})
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px]">
        <DropdownMenuLabel>Prebaci se na korisnika (Mock)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {mockUsers.map((user) => (
          <DropdownMenuItem
            key={user.id}
            onClick={() => switchRole(user.id)}
            className="flex items-center justify-between"
          >
            <div>
              <div className="font-medium">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs text-muted-foreground">
                {getRoleLabel(user.role)}
              </div>
            </div>
            {currentUser.id === user.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

