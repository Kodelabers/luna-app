"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { joinOrganisation } from "@/lib/actions/organisation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type PendingInvitation = {
  id: string;
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
  const tLanding = useTranslations("landing");
  const tAuth = useTranslations("auth");
  const tDashboard = useTranslations("dashboard");

  const handleJoin = (employeeId: string, organisationAlias: string) => {
    startTransition(async () => {
      const result = await joinOrganisation(employeeId);

      if (result.success) {
        toast.success(result.message);
        router.push(`/${organisationAlias}`);
      } else {
        toast.error(result.formError || tDashboard("genericError"));
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{tLanding("welcome")}</h1>
        <p className="mt-1 text-muted-foreground">
          {tLanding("foundOrganisations")}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-1 max-w-2xl w-full">
        {invitations.map((invitation) => (
          <Card key={invitation.id}>
            <CardHeader>
              <CardTitle>{invitation.organisation.name}</CardTitle>
              <CardDescription>{tDashboard("department")}: {invitation.department.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {tLanding("emailRegistered")}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleJoin(invitation.id, invitation.organisation.alias)}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? tLanding("joining") : tLanding("join")}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <SignOutButton>
        <Button variant="ghost" size="sm">
          {tAuth("signOut")}
        </Button>
      </SignOutButton>
    </div>
  );
}

