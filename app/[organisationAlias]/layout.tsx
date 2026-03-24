import {
	resolveTenantContext,
	isAdmin,
	getManagerStatus,
	getEmployeeForUser,
	getUserOrganisations,
} from "@/lib/tenant/resolveTenantContext";
import { notFound } from "next/navigation";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
	getManagedDepartments,
	getPlanningAbsenceReasons,
} from "@/lib/services/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";

type Props = {
	children: React.ReactNode;
	params: Promise<{ organisationAlias: string }>;
};

export default async function TenantLayout({ children, params }: Props) {
	const { organisationAlias } = await params;

	try {
		const ctx = await resolveTenantContext(organisationAlias);
		const userIsAdmin = isAdmin(ctx);
		const managedDepartments = await getManagedDepartments(ctx);
		const managerStatus = await getManagerStatus(ctx);
		const employee = await getEmployeeForUser(ctx);
		const hasEmployee = !!employee;

		// Get planning absence reasons for managers
		const planningAbsenceReasons = userIsAdmin
			? await getPlanningAbsenceReasons(ctx)
			: [];

		// Get all organisations for org switcher
		const userOrganisations = await getUserOrganisations(ctx.user.id);

		const userName = `${ctx.user.firstName} ${ctx.user.lastName}`.trim();

		return (
			<SidebarProvider>
				<AppSidebar
					organisation={{
						name: ctx.organisation.name,
						logoUrl: ctx.organisation.logoUrl,
					}}
					user={{
						name: userName || ctx.user.email,
						email: ctx.user.email,
					}}
					organisationAlias={organisationAlias}
					isAdmin={userIsAdmin}
					hasEmployee={hasEmployee}
					managedDepartments={managedDepartments}
					planningAbsenceReasons={planningAbsenceReasons}
					userOrganisations={userOrganisations}
				/>
				<SidebarInset>
					<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
						<div className="flex items-center gap-2 px-4">
							<SidebarTrigger className="-ml-1" />
							<Separator
								orientation="vertical"
								className="mr-2 data-[orientation=vertical]:h-4"
							/>
							<DynamicBreadcrumb
								organisationAlias={organisationAlias}
								organisationName={ctx.organisation.name}
							/>
						</div>
					</header>
					<main className="flex flex-1 flex-col gap-4 p-4 pt-0 overflow-x-hidden min-w-0">
						{children}
					</main>
				</SidebarInset>
			</SidebarProvider>
		);
	} catch (error) {
		if (error instanceof NotFoundError) {
			notFound();
		}
		if (error instanceof ForbiddenError) {
			const tCommon = await getTranslations("common");
			return (
				<div className="flex min-h-screen items-center justify-center">
					<div className="text-center">
						<h1 className="text-2xl font-bold">{tCommon("accessDenied")}</h1>
						<p className="mt-2 text-muted-foreground">
							{tCommon("noOrganisationAccess")}
						</p>
						<Button asChild className="mt-4">
							<Link href="/">{tCommon("back")}</Link>
						</Button>
					</div>
				</div>
			);
		}
		throw error;
	}
}
