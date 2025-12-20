"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMockEmployees } from "@/lib/mock-data/api";
import { useMockDepartments } from "@/lib/mock-data/api";
import { useMockManagers } from "@/lib/mock-data/api";
import { toast } from "@/hooks/use-toast";
import { Plus, Users, Building2, Settings, UserCog, X } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const { employees } = useMockEmployees();
  const { departments } = useMockDepartments();
  const { managers, assignGeneralManager, removeManager } = useMockManagers();

  const activeEmployees = employees.filter((e) => e.active);
  const inactiveEmployees = employees.filter((e) => !e.active);
  const generalManagers = managers.filter(
    (m) => m.departmentId === undefined && m.active
  );
  const [gmDialogOpen, setGmDialogOpen] = useState(false);
  const [selectedGMs, setSelectedGMs] = useState<number[]>([]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Administracija sustava i organizacijske strukture
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Zaposlenici</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeEmployees.length}</div>
              <p className="text-xs text-muted-foreground">
                {inactiveEmployees.length} neaktivnih
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Odjeli</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departments.filter((d) => d.active).length}</div>
              <p className="text-xs text-muted-foreground">Aktivnih odjela</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">General Manageri</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{generalManagers.length}</div>
              <p className="text-xs text-muted-foreground mb-2">
                Aktivnih General Managera
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setSelectedGMs(generalManagers.map((m) => m.employeeId));
                  setGmDialogOpen(true);
                }}
              >
                Upravljaj
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Employees Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Zaposlenici</CardTitle>
            <Button
              className="gap-2"
              onClick={() => router.push("/admin/employees/new")}
            >
              <Plus className="h-4 w-4" />
              Dodaj Zaposlenika
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ime</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Odjel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeEmployees.slice(0, 10).map((employee) => {
                  const department = departments.find(
                    (d) => d.id === employee.departmentId
                  );
                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{department?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={employee.active ? "default" : "secondary"}>
                          {employee.active ? "Aktivan" : "Neaktivan"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/employees/${employee.id}`)}
                          >
                            Uredi
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Departments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Odjeli</CardTitle>
            <Button
              className="gap-2"
              onClick={() => router.push("/admin/departments/new")}
            >
              <Plus className="h-4 w-4" />
              Dodaj Odjel
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departments.filter((d) => d.active).map((dept) => {
                const deptEmployees = employees.filter(
                  (e) => e.departmentId === dept.id && e.active
                );
                return (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div>
                      <div className="font-medium">{dept.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {deptEmployees.length} zaposlenika
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/admin/departments/${dept.id}`)}
                    >
                      Uredi
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* General Managers Section */}
        <Card>
          <CardHeader>
            <CardTitle>General Manageri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  General Manageri imaju pristup svim odjelima i mogu odobravati zahtjeve
                  na drugom nivou.
                </p>
                <Button onClick={() => {
                  setSelectedGMs(generalManagers.map((m) => m.employeeId));
                  setGmDialogOpen(true);
                }}>
                  <UserCog className="mr-2 h-4 w-4" />
                  Upravljaj General Managerima
                </Button>
              </div>

              {generalManagers.length > 0 && (
                <div className="space-y-2">
                  {generalManagers.map((gm) => {
                    const employee = employees.find((e) => e.id === gm.employeeId);
                    if (!employee) return null;
                    return (
                      <div
                        key={gm.id}
                        className="flex items-center justify-between border rounded-md p-3"
                      >
                        <div>
                          <div className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {employee.email}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            removeManager(gm.id);
                            toast({
                              title: "General Manager uklonjen",
                              description: `${employee.firstName} ${employee.lastName} više nije General Manager.`,
                            });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* General Manager Assignment Dialog */}
        <Dialog open={gmDialogOpen} onOpenChange={setGmDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upravljanje General Managerima</DialogTitle>
              <DialogDescription>
                Odaberite zaposlenike koji će biti General Manageri. General Manageri imaju
                pristup svim odjelima i mogu odobravati zahtjeve na drugom nivou.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Aktivni zaposlenici</Label>
                <div className="border rounded-md p-4 max-h-96 overflow-y-auto">
                  {activeEmployees.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nema aktivnih zaposlenika
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activeEmployees.map((emp) => (
                        <label
                          key={emp.id}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-muted p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedGMs.includes(emp.id)}
                            onChange={() => {
                              setSelectedGMs((prev) =>
                                prev.includes(emp.id)
                                  ? prev.filter((id) => id !== emp.id)
                                  : [...prev, emp.id]
                              );
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">
                            {emp.firstName} {emp.lastName} ({emp.email})
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {selectedGMs.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Odabrano: {selectedGMs.length} General Managera</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGmDialogOpen(false)}>
                Odustani
              </Button>
              <Button
                onClick={() => {
                  const currentGMIds = generalManagers.map((m) => m.employeeId);
                  const toAdd = selectedGMs.filter((id) => !currentGMIds.includes(id));
                  const toRemove = generalManagers.filter(
                    (m) => !selectedGMs.includes(m.employeeId)
                  );

                  // Remove managers
                  for (const manager of toRemove) {
                    removeManager(manager.id);
                  }

                  // Add new managers
                  for (const employeeId of toAdd) {
                    try {
                      assignGeneralManager(employeeId, employees);
                    } catch (error: any) {
                      toast({
                        title: "Greška",
                        description: error.message || "Nije moguće dodijeliti General Managera.",
                        variant: "destructive",
                      });
                    }
                  }

                  toast({
                    title: "General Manageri ažurirani",
                    description: "Lista General Managera je uspješno ažurirana.",
                  });

                  setGmDialogOpen(false);
                }}
              >
                Spremi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

