import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Building2, Users, UserCog, Calendar, FileQuestion } from "lucide-react";

type Props = {
  params: Promise<{ organisationAlias: string }>;
};

export default async function AdministrationPage({ params }: Props) {
  const { organisationAlias } = await params;
  const tNav = await getTranslations("nav");
  const tAdmin = await getTranslations("admin");

  const adminModules = [
    {
      href: `/${organisationAlias}/administration/departments`,
      icon: Building2,
      title: tNav("departments"),
      description: tAdmin("departmentsDescription"),
    },
    {
      href: `/${organisationAlias}/administration/employees`,
      icon: Users,
      title: tNav("employees"),
      description: tAdmin("employeesDescription"),
    },
    {
      href: `/${organisationAlias}/administration/members`,
      icon: UserCog,
      title: tNav("members"),
      description: tAdmin("membersDescription"),
    },
    {
      href: `/${organisationAlias}/administration/holidays`,
      icon: Calendar,
      title: tNav("holidays"),
      description: tAdmin("holidaysDescription"),
    },
    {
      href: `/${organisationAlias}/administration/unavailability-reasons`,
      icon: FileQuestion,
      title: tAdmin("absenceReasons"),
      description: tAdmin("absenceReasonsDescription"),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={tAdmin("title")}
        description={tAdmin("description")}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {adminModules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <module.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {module.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

