"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { MockUser, MockAuthContext, Organisation } from "@/lib/types";
import {
  mockOrganisation,
  mockEmployees,
  mockManagers,
} from "@/lib/mock-data/generator";

const AuthContext = createContext<MockAuthContext | undefined>(undefined);

// Mock users for testing
const mockUsers: MockUser[] = [
  // Employee - Ana Kovačić
  {
    id: 1,
    employeeId: 2,
    organisationId: 1,
    firstName: "Ana",
    lastName: "Kovačić",
    email: "ana.kovacic@lunatech.hr",
    role: "EMPLOYEE",
    departmentId: 1,
  },
  // Employee - Petar Novak
  {
    id: 2,
    employeeId: 3,
    organisationId: 1,
    firstName: "Petar",
    lastName: "Novak",
    email: "petar.novak@lunatech.hr",
    role: "EMPLOYEE",
    departmentId: 1,
  },
  // Department Manager - IT (Marko Horvat)
  {
    id: 3,
    employeeId: 1,
    organisationId: 1,
    firstName: "Marko",
    lastName: "Horvat",
    email: "marko.horvat@lunatech.hr",
    role: "DEPARTMENT_MANAGER",
    departmentId: 1,
  },
  // Department Manager - HR (Sandra Matić)
  {
    id: 4,
    employeeId: 9,
    organisationId: 1,
    firstName: "Sandra",
    lastName: "Matić",
    email: "sandra.matic@lunatech.hr",
    role: "DEPARTMENT_MANAGER",
    departmentId: 2,
  },
  // General Manager (Ante Petrović)
  {
    id: 5,
    employeeId: 18,
    organisationId: 1,
    firstName: "Ante",
    lastName: "Petrović",
    email: "ante.petrovic@lunatech.hr",
    role: "GENERAL_MANAGER",
    departmentId: undefined,
  },
  // Admin (CEO - Ante Petrović can also be admin)
  {
    id: 6,
    employeeId: 18,
    organisationId: 1,
    firstName: "Ante",
    lastName: "Petrović",
    email: "ante.petrovic@lunatech.hr",
    role: "ADMIN",
    departmentId: undefined,
  },
];

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(mockUsers[0]); // Default user
  const [mounted, setMounted] = useState(false);

  // Load from localStorage only on client-side
  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("mockUserId");
      if (storedUserId) {
        const user = mockUsers.find((u) => u.id === parseInt(storedUserId));
        if (user) {
          setCurrentUser(user);
        }
      }
    }
  }, []);

  const switchRole = (userId: number) => {
    const user = mockUsers.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      if (typeof window !== "undefined") {
        localStorage.setItem("mockUserId", userId.toString());
      }
    }
  };

  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("mockUserId");
    }
  };

  const value: MockAuthContext = {
    currentUser,
    organisation: mockOrganisation,
    switchRole,
    logout,
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Luna App</h1>
        <p className="text-muted-foreground">Učitavanje...</p>
      </div>
    </div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useMockAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useMockAuth must be used within MockAuthProvider");
  }
  return context;
}

export { mockUsers };
