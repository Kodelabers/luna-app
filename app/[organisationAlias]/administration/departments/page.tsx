import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ organisationAlias: string }>;
};

export default async function DepartmentsPage({ params }: Props) {
  const { organisationAlias } = await params;
  const ctx = await resolveTenantContext(organisationAlias);

  // Fetch departments for this organisation
  const departments = await db.department.findMany({
    where: {
      organisationId: ctx.organisationId,
      active: true,
    },
    include: {
      _count: {
        select: {
          employees: {
            where: { active: true },
          },
          managers: {
            where: { active: true },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Odjeli</h1>
          <p className="text-muted-foreground">
            Upravljanje odjelima u organizaciji
          </p>
        </div>
        <Button>Novi odjel</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {departments.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">Nema odjela u organizaciji.</p>
              <Button className="mt-4">Dodaj prvi odjel</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naziv</TableHead>
                  <TableHead>Alias</TableHead>
                  <TableHead>Zaposlenici</TableHead>
                  <TableHead>Manageri</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {dept.colorCode && (
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: dept.colorCode }}
                          />
                        )}
                        {dept.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{dept.alias}</Badge>
                    </TableCell>
                    <TableCell>{dept._count.employees}</TableCell>
                    <TableCell>{dept._count.managers}</TableCell>
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

