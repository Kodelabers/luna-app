import { Suspense } from "react";
import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberSearchBar } from "./_components/member-search-bar";
import { MemberTable } from "./_components/member-table";
import { InviteMemberDialog } from "./_components/invite-member-dialog";
import { Pagination } from "@/components/ui/pagination";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";

const PAGE_SIZE = 20;

type Props = {
	params: Promise<{ organisationAlias: string }>;
	searchParams: Promise<{
		search?: string;
		sort?: "asc" | "desc";
		page?: string;
		role?: "admin" | "member";
	}>;
};

export default async function MembersPage({ params, searchParams }: Props) {
	const { organisationAlias } = await params;
	const { search, sort = "asc", page: pageParam, role } = await searchParams;
	const ctx = await resolveTenantContext(organisationAlias);
	const t = await getTranslations("members");

	const currentPage = Math.max(1, parseInt(pageParam || "1", 10));

	// Build where clause for reuse
	const whereClause = {
		organisationId: ctx.organisationId,
		active: true,
		...(role === "admin" && { roles: { has: "ADMIN" as const } }),
		...(role === "member" && { roles: { isEmpty: true } }),
		...(search && {
			user: {
				OR: [
					{ firstName: { contains: search, mode: "insensitive" as const } },
					{ lastName: { contains: search, mode: "insensitive" as const } },
					{ email: { contains: search, mode: "insensitive" as const } },
				],
			},
		}),
	};

	// Fetch members, departments, and count in parallel
	const [members, totalCount, departments] = await Promise.all([
		db.organisationUser.findMany({
			where: whereClause,
			include: {
				user: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true,
						employees: {
							where: {
								organisationId: ctx.organisationId,
								active: true,
							},
							select: {
								id: true,
								firstName: true,
								lastName: true,
							},
							take: 1,
						},
					},
				},
			},
			orderBy: {
				user: {
					lastName: sort,
				},
			},
			skip: (currentPage - 1) * PAGE_SIZE,
			take: PAGE_SIZE,
		}),
		db.organisationUser.count({
			where: whereClause,
		}),
		db.department.findMany({
			where: {
				organisationId: ctx.organisationId,
				active: true,
			},
			select: {
				id: true,
				name: true,
				colorCode: true,
			},
			orderBy: {
				name: "asc",
			},
		}),
	]);

	const totalPages = Math.ceil(totalCount / PAGE_SIZE);

	return (
		<div className="container mx-auto py-6 space-y-6">
			<Card>
				<CardHeader>
					<PageHeader
						title={t("title")}
						description={t("description")}
						action={
							<InviteMemberDialog
								organisationAlias={organisationAlias}
								departments={departments}
							/>
						}
					/>

					<Suspense fallback={<Skeleton className="h-10 w-full" />}>
						<MemberSearchBar />
					</Suspense>
				</CardHeader>

				<CardContent className="p-0">
					{members.length === 0 && !search && !role ? (
						<div className="p-6 text-center">
							<p className="text-muted-foreground">{t("noMembers")}</p>
							<div className="mt-4">
								<InviteMemberDialog
									organisationAlias={organisationAlias}
									departments={departments}
								/>
							</div>
						</div>
					) : (
						<div className="p-4">
							<MemberTable
								members={members}
								organisationAlias={organisationAlias}
								currentUserId={ctx.user.id}
								departments={departments}
							/>
							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								totalItems={totalCount}
								pageSize={PAGE_SIZE}
							/>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
