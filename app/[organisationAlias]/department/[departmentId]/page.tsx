import { resolveTenantContext, requireDepartmentAccess } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Props = {
  params: Promise<{ organisationAlias: string; departmentId: string }>;
};

export default async function DepartmentPage({ params }: Props) {
  const { organisationAlias, departmentId } = await params;
  const ctx = await resolveTenantContext(organisationAlias);

  const deptId = parseInt(departmentId, 10);
  if (isNaN(deptId)) {
    notFound();
  }

  // Check department access
  await requireDepartmentAccess(ctx, deptId);

  // Fetch department with employees
  const department = await db.department.findFirst({
    where: {
      id: deptId,
      organisationId: ctx.organisationId,
      active: true,
    },
    include: {
      employees: {
        where: { active: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      },
      managers: {
        where: { active: true },
        include: {
          employee: true,
        },
      },
    },
  });

  if (!department) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{department.name}</h1>
        {department.description && (
          <p className="text-muted-foreground">{department.description}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Department info */}
        <Card>
          <CardHeader>
            <CardTitle>Informacije o odjelu</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Alias:</dt>
                <dd>
                  <Badge variant="outline">{department.alias}</Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Broj zaposlenika:</dt>
                <dd className="font-medium">{department.employees.length}</dd>
              </div>
              {department.colorCode && (
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground">Boja:</dt>
                  <dd className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded"
                      style={{ backgroundColor: department.colorCode }}
                    />
                    {department.colorCode}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Managers */}
        <Card>
          <CardHeader>
            <CardTitle>Manageri odjela</CardTitle>
            <CardDescription>Osobe odgovorne za odobrenja</CardDescription>
          </CardHeader>
          <CardContent>
            {department.managers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nema dodijeljenih managera.
              </p>
            ) : (
              <ul className="space-y-2">
                {department.managers.map((manager) => (
                  <li key={manager.id} className="flex items-center justify-between text-sm">
                    <span>
                      {manager.employee.firstName} {manager.employee.lastName}
                    </span>
                    <Badge variant="secondary">Manager</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Employees table */}
      <Card>
        <CardHeader>
          <CardTitle>Zaposlenici</CardTitle>
          <CardDescription>Svi zaposlenici u odjelu</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {department.employees.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">Nema zaposlenika u odjelu.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ime i prezime</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Pozicija</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {department.employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">
                      {emp.firstName} {emp.lastName}
                    </TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>{emp.title || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

