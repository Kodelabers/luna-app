import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ organisationAlias: string }>;
};

export default async function EmployeesPage({ params }: Props) {
  const { organisationAlias } = await params;
  const ctx = await resolveTenantContext(organisationAlias);
  const tNav = await getTranslations("nav");

  // Fetch employees for this organisation
  const employees = await db.employee.findMany({
    where: {
      organisationId: ctx.organisationId,
      active: true,
    },
    include: {
      department: true,
      user: true,
      managers: {
        where: { active: true },
      },
    },
    orderBy: [
      { lastName: "asc" },
      { firstName: "asc" },
    ],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={tNav("employees")}
        description="Upravljanje zaposlenicima u organizaciji"
        action={<Button>Novi zaposlenik</Button>}
      />

      <Card>
        <CardContent className="p-0">
          {employees.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">Nema zaposlenika u organizaciji.</p>
              <Button className="mt-4">Dodaj prvog zaposlenika</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ime i prezime</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Odjel</TableHead>
                  <TableHead>Pozicija</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">
                      {emp.firstName} {emp.lastName}
                    </TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{emp.department.name}</Badge>
                    </TableCell>
                    <TableCell>{emp.title || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {emp.user && (
                          <Badge variant="secondary" className="text-xs">
                            Povezan
                          </Badge>
                        )}
                        {emp.managers.length > 0 && (
                          <Badge variant="default" className="text-xs">
                            Manager
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Uredi
                      </Button>
                    </TableCell>
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

