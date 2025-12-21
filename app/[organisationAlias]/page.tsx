import { resolveTenantContext, getManagerStatus, getEmployeeForUser } from "@/lib/tenant/resolveTenantContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  params: Promise<{ organisationAlias: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { organisationAlias } = await params;
  const ctx = await resolveTenantContext(organisationAlias);
  const managerStatus = await getManagerStatus(ctx);
  const employee = await getEmployeeForUser(ctx);

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Dobrodošli, {ctx.user.firstName}!
        </h1>
        <p className="text-muted-foreground">
          Dashboard za {ctx.organisation.name}
        </p>
      </div>

      {/* Role badges */}
      <div className="flex gap-2">
        {ctx.organisationUser.roles.includes("ADMIN") && (
          <Badge variant="default">Administrator</Badge>
        )}
        {managerStatus.isGeneralManager && (
          <Badge variant="secondary">Generalni Manager</Badge>
        )}
        {managerStatus.isDepartmentManager && (
          <Badge variant="outline">Manager Odjela</Badge>
        )}
      </div>

      {/* Dashboard widgets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Employee profile status */}
        {employee ? (
          <Card>
            <CardHeader>
              <CardTitle>Moj profil</CardTitle>
              <CardDescription>Vaši podaci u sustavu</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Ime i prezime:</dt>
                  <dd className="font-medium">{employee.firstName} {employee.lastName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Email:</dt>
                  <dd className="font-medium">{employee.email}</dd>
                </div>
                {employee.title && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Pozicija:</dt>
                    <dd className="font-medium">{employee.title}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Moj profil</CardTitle>
              <CardDescription>Niste povezani sa zaposlenikom</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Kontaktirajte administratora kako bi povezao vaš korisnički račun sa evidencijom zaposlenika.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Open requests - for employees */}
        {employee && (
          <Card>
            <CardHeader>
              <CardTitle>Moji zahtjevi</CardTitle>
              <CardDescription>Otvoreni zahtjevi za izostanak</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ovdje će se prikazati vaši otvoreni zahtjevi (DRAFT, SUBMITTED, APPROVED_FIRST_LEVEL).
              </p>
              {/* TODO: Implement UC-DASH-03.1 */}
            </CardContent>
          </Card>
        )}

        {/* Requests to approve - for department managers */}
        {managerStatus.isDepartmentManager && (
          <Card>
            <CardHeader>
              <CardTitle>Za odobrenje</CardTitle>
              <CardDescription>Zahtjevi koji čekaju vašu odluku</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ovdje će se prikazati zahtjevi za odobrenje (SUBMITTED status).
              </p>
              {/* TODO: Implement UC-DASH-03.2 */}
            </CardContent>
          </Card>
        )}

        {/* Requests to approve - for general manager */}
        {managerStatus.isGeneralManager && (
          <Card>
            <CardHeader>
              <CardTitle>Finalno odobrenje</CardTitle>
              <CardDescription>Zahtjevi za završno odobrenje</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ovdje će se prikazati zahtjevi za finalno odobrenje (APPROVED_FIRST_LEVEL status).
              </p>
              {/* TODO: Implement UC-DASH-03.3 */}
            </CardContent>
          </Card>
        )}

        {/* Calendar placeholder */}
        {employee && (
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Moj kalendar</CardTitle>
              <CardDescription>Raspored za trenutni mjesec</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ovdje će se prikazati kalendar s DaySchedule zapisima.
              </p>
              {/* TODO: Implement UC-DASH-02 */}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

