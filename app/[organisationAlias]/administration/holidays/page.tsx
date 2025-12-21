import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { hr } from "date-fns/locale";
import { PageHeader } from "@/components/page-header";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ organisationAlias: string }>;
};

export default async function HolidaysPage({ params }: Props) {
  const { organisationAlias } = await params;
  const ctx = await resolveTenantContext(organisationAlias);
  const tNav = await getTranslations("nav");

  // Fetch holidays for this organisation
  const holidays = await db.holiday.findMany({
    where: {
      organisationId: ctx.organisationId,
      active: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={tNav("holidays")}
        description="Neradni dani i praznici u organizaciji"
        action={<Button>Novi blagdan</Button>}
      />

      <Card>
        <CardContent className="p-0">
          {holidays.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">Nema definiranih blagdana.</p>
              <Button className="mt-4">Dodaj prvi blagdan</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naziv</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Ponavljanje</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell className="font-medium">{holiday.name}</TableCell>
                    <TableCell>
                      {format(holiday.date, "dd. MMMM yyyy.", { locale: hr })}
                    </TableCell>
                    <TableCell>
                      {holiday.repeatYearly ? (
                        <Badge variant="secondary">Godišnje</Badge>
                      ) : (
                        <Badge variant="outline">Jednokratno</Badge>
                      )}
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

