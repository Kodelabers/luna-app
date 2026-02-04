import { auth } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ensureLocalUser } from "@/lib/integrations/clerk";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PendingInvitations } from "./_components/pending-invitations";
import { AutoRedirect } from "./_components/auto-redirect";

export default async function HomePage() {
  const { userId } = await auth();

  // If not signed in, show landing page
  if (!userId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Luna HR</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Sustav za upravljanje ljudskim resursima
          </p>
        </div>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/sign-in">Prijava</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/sign-up">Registracija</Link>
          </Button>
        </div>
      </div>
    );
  }

  // User is signed in - ensure local user exists
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/sign-in");
  }

  const user = await ensureLocalUser(clerkUser);

  // Get organisations user belongs to
  const organisationUsers = await db.organisationUser.findMany({
    where: {
      userId: user.id,
      active: true,
    },
    include: {
      organisation: true,
    },
    orderBy: {
      joinedAt: 'asc', // Use oldest membership for consistency
    },
  });

  // If user belongs to only one organisation, redirect there
  if (organisationUsers.length === 1) {
    return <AutoRedirect to={`/${organisationUsers[0].organisation.alias}`} />;
  }

  // If user belongs to multiple organisations, show picker
  if (organisationUsers.length > 1) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Odaberite organizaciju</h1>
          <p className="mt-1 text-muted-foreground">
            Imate pristup više organizacija
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-1 max-w-2xl w-full">
          {organisationUsers.map((ou) => (
            <Card key={ou.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
              <Link href={`/${ou.organisation.alias}`}>
                <CardHeader>
                  <CardTitle>{ou.organisation.name}</CardTitle>
                  <CardDescription>/{ou.organisation.alias}</CardDescription>
                </CardHeader>
              </Link>
            </Card>
          ))}
        </div>
        <SignOutButton>
          <Button variant="ghost" size="sm">
            Odjava
          </Button>
        </SignOutButton>
      </div>
    );
  }

  // User doesn't belong to any organisation - check for pending invitations
  const pendingEmployees = await db.employee.findMany({
    where: {
      email: user.email,
      userId: null, // Not yet linked to a user
      active: true,
      organisation: {
        active: true,
      },
    },
    include: {
      organisation: {
        select: {
          name: true,
          alias: true,
        },
      },
      department: {
        select: {
          name: true,
        },
      },
    },
  });

  // If there are pending invitations, show them
  if (pendingEmployees.length > 0) {
    return <PendingInvitations invitations={pendingEmployees} />;
  }

  // No organisations and no pending invitations
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Dobrodošli u Luna HR</CardTitle>
          <CardDescription>
            Trenutno niste član nijedne organizacije.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Kontaktirajte administratora vaše organizacije kako bi vas dodao u sustav.
          </p>
        </CardContent>
      </Card>
      <SignOutButton>
        <Button variant="ghost" size="sm">
          Odjava
        </Button>
      </SignOutButton>
    </div>
  );
}
