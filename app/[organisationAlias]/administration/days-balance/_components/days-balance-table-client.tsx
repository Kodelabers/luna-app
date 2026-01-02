"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getEmployeeDaysBalanceAction } from "@/lib/actions/days-balance";
import { AllocateDaysDialog } from "./allocate-days-dialog";
import { UpdateAllocationDialog } from "./update-allocation-dialog";
import { LedgerHistoryDialog } from "./ledger-history-dialog";
import { Plus, Edit, History } from "lucide-react";

type DaysBalanceTableClientProps = {
  organisationAlias: string;
  unavailabilityReasonId: string;
  departmentIds?: string[];
};

export function DaysBalanceTableClient({
  organisationAlias,
  unavailabilityReasonId,
  departmentIds,
}: DaysBalanceTableClientProps) {
  const t = useTranslations("daysBalance");
  const [employees, setEmployees] = useState<Array<{
    employeeId: string;
    employeeFirstName: string;
    employeeLastName: string;
    employeeEmail: string;
    departmentId: string;
    departmentName: string;
    balances: Array<{
      unavailabilityReasonId: string;
      unavailabilityReasonName: string;
      unavailabilityReasonColorCode: string | null;
      openYear: number | null;
      openYearBalance: number | null;
      breakdown: {
        allocated: number;
        used: number;
        pending: number;
        remaining: number;
        balance: number;
      };
    }>;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  // Get current year in client timezone
  const getCurrentYear = (): number => {
    if (typeof window !== "undefined") {
      const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const now = new Date();
      // Use a simple approach: get year from local date
      return now.getFullYear();
    }
    return new Date().getFullYear();
  };

  const currentYear = getCurrentYear();

  useEffect(() => {
    async function loadBalances() {
      try {
        setLoading(true);
        const result = await getEmployeeDaysBalanceAction(
          organisationAlias,
          currentYear,
          departmentIds
        );
        setEmployees(result.employees);
      } catch (error) {
        console.error("Error loading employee days balance:", error);
      } finally {
        setLoading(false);
      }
    }

    loadBalances();
  }, [organisationAlias, departmentIds, currentYear]);

  // Filter employees to show only the selected reason's balance
  const filteredEmployees = employees.map((emp) => {
    const balance = emp.balances.find((b) => b.unavailabilityReasonId === unavailabilityReasonId);
    return {
      ...emp,
      balance: balance || {
        unavailabilityReasonId,
        unavailabilityReasonName: "",
        unavailabilityReasonColorCode: null,
        openYear: null,
        openYearBalance: null,
        breakdown: {
          allocated: 0,
          used: 0,
          pending: 0,
          remaining: 0,
          balance: 0,
        },
      },
    };
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("employeesBalance")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("employee")}</TableHead>
                <TableHead>{t("department")}</TableHead>
                <TableHead className="text-right">{t("totalAvailable")}</TableHead>
                <TableHead className="text-right">{t("used")}</TableHead>
                <TableHead className="text-right">{t("pending")}</TableHead>
                <TableHead className="text-right">{t("remaining")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {t("noEmployees")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((emp) => {
                  const hasAllocation = emp.balance.breakdown.allocated > 0;
                  const openYear = emp.balance.openYear;
                  const openYearBalance = emp.balance.openYearBalance;
                  
                  // Calculate nextYear and check if it can be opened
                  const nextYear = openYear !== null ? openYear + 1 : null;
                  const canOpenNextYear = nextYear !== null && nextYear <= currentYear + 1;
                  
                  // Check if allocation exists for nextYear (should not happen, but safety check)
                  const hasNextYearAllocation = false; // This would require a server check, but we rely on backend validation
                  
                  // Calculate total available (entitlementTotal = balance + used)
                  const totalAvailable = emp.balance.breakdown.balance + emp.balance.breakdown.used;
                  
                  // Check if openYear is stale (older than currentYear - 1)
                  const isStaleOpenYear = openYear !== null && openYear < currentYear - 1;
                  
                  return (
                    <TableRow key={emp.employeeId}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span>
                            {emp.employeeFirstName} {emp.employeeLastName}
                          </span>
                          {openYear !== null ? (
                            <span className="text-xs text-muted-foreground">
                              {isStaleOpenYear 
                                ? t("lastPlanned", { year: openYear })
                                : t("plannedThrough", { year: openYear })}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {t("notPlanned")}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{emp.departmentName}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {totalAvailable}
                      </TableCell>
                      <TableCell className="text-right">
                        {emp.balance.breakdown.used}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{emp.balance.breakdown.pending}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {emp.balance.breakdown.remaining}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!hasAllocation ? (
                            // Show "Allocate" button if no allocation exists
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setSelectedEmployee(emp.employeeId);
                                setSelectedReason(unavailabilityReasonId);
                                setAllocateDialogOpen(true);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              {t("allocate")}
                            </Button>
                          ) : (
                            // Show "Update", "Add New Year", and "History" buttons if allocation exists
                            <>
                              {openYear !== null && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedEmployee(emp.employeeId);
                                    setSelectedReason(unavailabilityReasonId);
                                    setUpdateDialogOpen(true);
                                  }}
                                  title={t("update")}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {openYear !== null && canOpenNextYear && !hasNextYearAllocation && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEmployee(emp.employeeId);
                                    setSelectedReason(unavailabilityReasonId);
                                    setAllocateDialogOpen(true);
                                  }}
                                  title={t("addNewYear")}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  {t("addNewYear")}
                                </Button>
                              )}
                              {openYear !== null && !canOpenNextYear && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled
                                  title={t("cannotOpenFutureYear", { maxYear: currentYear + 1 })}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  {t("addNewYear")}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedEmployee(emp.employeeId);
                                  setSelectedReason(unavailabilityReasonId);
                                  setHistoryDialogOpen(true);
                                }}
                                title={t("history")}
                              >
                                <History className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedEmployee && selectedReason && (() => {
        const emp = filteredEmployees.find((e) => e.employeeId === selectedEmployee);
        const balance = emp?.balance;
        const openYear = balance?.openYear ?? null;
        const openYearBalance = balance?.openYearBalance ?? null;
        const currentAllocated = balance?.breakdown.allocated ?? 0;
        const currentUsed = balance?.breakdown.used ?? 0;
        
        const handleDialogClose = () => {
          setSelectedEmployee(null);
          setSelectedReason(null);
          // Reload data
          getEmployeeDaysBalanceAction(organisationAlias, currentYear, departmentIds).then((result) => {
            setEmployees(result.employees);
          });
        };
        
        return (
          <>
            <AllocateDaysDialog
              organisationAlias={organisationAlias}
              employeeId={selectedEmployee}
              unavailabilityReasonId={selectedReason}
              openYear={openYear}
              currentYear={currentYear}
              openYearBalance={openYearBalance}
              open={allocateDialogOpen}
              onOpenChange={(open) => {
                setAllocateDialogOpen(open);
                if (!open) {
                  handleDialogClose();
                }
              }}
            />
            <UpdateAllocationDialog
              organisationAlias={organisationAlias}
              employeeId={selectedEmployee}
              unavailabilityReasonId={selectedReason}
              openYear={openYear}
              currentAllocated={currentAllocated}
              currentUsed={currentUsed}
              open={updateDialogOpen}
              onOpenChange={(open) => {
                setUpdateDialogOpen(open);
                if (!open) {
                  handleDialogClose();
                }
              }}
            />
            <LedgerHistoryDialog
              organisationAlias={organisationAlias}
              employeeId={selectedEmployee}
              unavailabilityReasonId={selectedReason}
              open={historyDialogOpen}
              onOpenChange={(open) => {
                setHistoryDialogOpen(open);
                if (!open) {
                  setSelectedEmployee(null);
                  setSelectedReason(null);
                }
              }}
            />
          </>
        );
      })()}
    </>
  );
}
