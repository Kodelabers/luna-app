"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { joinOrganisation } from "@/lib/actions/organisation";
import { toast } from "sonner";

type PendingInvitation = {
  id: number;
  organisation: {
    name: string;
    alias: string;
  };
  department: {
    name: string;
  };
};

interface PendingInvitationsProps {
  invitations: PendingInvitation[];
}

export function PendingInvitations({ invitations }: PendingInvitationsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleJoin = (employeeId: number, organisationAlias: string) => {
    startTransition(async () => {
      const result = await joinOrganisation(employeeId);
      
      if (result.success) {
        toast.success(result.message);
        router.push(`/${organisationAlias}`);
      } else {
        toast.error(result.formError || "Došlo je do greške");
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Dobrodošli u Luna HR</h1>
        <p className="mt-1 text-muted-foreground">
          Pronašli smo organizacije koje vas čekaju
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-1 max-w-2xl w-full">
        {invitations.map((invitation) => (
          <Card key={invitation.id}>
            <CardHeader>
              <CardTitle>{invitation.organisation.name}</CardTitle>
              <CardDescription>Odjel: {invitation.department.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Vaš email je registriran kao zaposlenik ove organizacije.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleJoin(invitation.id, invitation.organisation.alias)}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? "Pridruživanje..." : "Pridruži se"}
              </Button>
            </CardFooter>
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

