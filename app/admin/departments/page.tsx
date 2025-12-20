"use client";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { useMockDepartments } from "@/lib/mock-data/api";
import { useMockEmployees } from "@/lib/mock-data/api";
import { useMockManagers } from "@/lib/mock-data/api";

export default function DepartmentsPage() {
  const router = useRouter();
  const { departments } = useMockDepartments();
  const { employees } = useMockEmployees();
  const { managers } = useMockManagers();

  const getDepartmentStats = (deptId: number) => {
    const deptEmployees = employees.filter(
      (e) => e.departmentId === deptId && e.active
    );
    const deptManagers = managers.filter(
      (m) => m.departmentId === deptId && m.active
    );
    return {
      employeeCount: deptEmployees.length,
      managerCount: deptManagers.length,
    };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Odjeli</h1>
            <p className="text-muted-foreground">
              Upravljanje odjelima u organizaciji
            </p>
          </div>
          <Button onClick={() => router.push("/admin/departments/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            Dodaj Odjel
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista odjela ({departments.filter((d) => d.active).length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departments.filter((d) => d.active).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nema odjela
                </p>
              ) : (
                departments
                  .filter((d) => d.active)
                  .map((dept) => {
                    const stats = getDepartmentStats(dept.id);
                    return (
                      <div
                        key={dept.id}
                        className="flex items-center justify-between border-b pb-4 last:border-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-4 w-4 rounded"
                              style={{ backgroundColor: dept.colorCode || "#3b82f6" }}
                            />
                            <div className="font-medium">{dept.name}</div>
                            <Badge variant={dept.active ? "default" : "secondary"}>
                              {dept.active ? "Aktivan" : "Neaktivan"}
                            </Badge>
                          </div>
                          {dept.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {dept.description}
                            </div>
                          )}
                          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                            <span>{stats.employeeCount} zaposlenika</span>
                            <span>{stats.managerCount} managera</span>
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
                  })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

