import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ organisationAlias: string }>;
};

export default async function MembersPage({ params }: Props) {
  const { organisationAlias } = await params;
  const ctx = await resolveTenantContext(organisationAlias);
  const tNav = await getTranslations("nav");
  const tAdmin = await getTranslations("admin");

  // Fetch organisation members (OrganisationUser)
  const members = await db.organisationUser.findMany({
    where: {
      organisationId: ctx.organisationId,
      active: true,
    },
    include: {
      user: true,
    },
    orderBy: {
      joinedAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={tNav("members")}
        description={tAdmin("membersDescription")}
        action={<Button>Pozovi korisnika</Button>}
      />

      <Card>
        <CardContent className="p-0">
          {members.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">Nema korisnika u organizaciji.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ime i prezime</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Uloge</TableHead>
                  <TableHead>Pridružen</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.user.firstName} {member.user.lastName}
                    </TableCell>
                    <TableCell>{member.user.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {member.roles.map((role) => (
                          <Badge key={role} variant="default">
                            {role}
                          </Badge>
                        ))}
                        {member.roles.length === 0 && (
                          <span className="text-muted-foreground text-sm">Član</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(member.joinedAt, "dd.MM.yyyy.")}
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

