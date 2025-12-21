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

export default async function UnavailabilityReasonsPage({ params }: Props) {
  const { organisationAlias } = await params;
  const ctx = await resolveTenantContext(organisationAlias);
  const tAdmin = await getTranslations("admin");

  // Fetch unavailability reasons for this organisation
  const reasons = await db.unavailabilityReason.findMany({
    where: {
      organisationId: ctx.organisationId,
      active: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={tAdmin("absenceReasons")}
        description="Vrste izostanaka koje zaposlenici mogu zatražiti"
        action={<Button>Novi razlog</Button>}
      />

      <Card>
        <CardContent className="p-0">
          {reasons.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">Nema definiranih razloga izostanka.</p>
              <Button className="mt-4">Dodaj prvi razlog</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naziv</TableHead>
                  <TableHead>Boja</TableHead>
                  <TableHead>Odobrenje</TableHead>
                  <TableHead>Planiranje</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reasons.map((reason) => (
                  <TableRow key={reason.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {reason.colorCode && (
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: reason.colorCode }}
                          />
                        )}
                        {reason.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {reason.colorCode ? (
                        <Badge variant="outline" style={{ borderColor: reason.colorCode }}>
                          {reason.colorCode}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {reason.needApproval && (
                          <Badge variant="secondary" className="text-xs">1. razina</Badge>
                        )}
                        {reason.needSecondApproval && (
                          <Badge variant="default" className="text-xs">2. razina</Badge>
                        )}
                        {!reason.needApproval && !reason.needSecondApproval && (
                          <span className="text-muted-foreground text-sm">Nije potrebno</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {reason.hasPlanning ? (
                        <Badge variant="outline">Da</Badge>
                      ) : (
                        <span className="text-muted-foreground">Ne</span>
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

