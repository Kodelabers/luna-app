"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DmApprovalQueues } from "@/lib/services/dashboard";
import { ApprovalDialog } from "./approval-dialog";
import { dmDecideApplicationAction } from "@/lib/actions/application";
import { format } from "date-fns";
import { hr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { Calendar, CheckCircle, XCircle, Pencil } from "lucide-react";
import Link from "next/link";
import type { ApplicationSummary } from "@/lib/services/dashboard";

type DmApprovalCardProps = {
	queues: DmApprovalQueues;
	organisationAlias: string;
};

export function DmApprovalCard({
	queues,
	organisationAlias,
}: DmApprovalCardProps) {
	const t = useTranslations("dashboard");
	const tApp = useTranslations("applications");
	const locale = useLocale();
	const dateLocale = locale === "hr" ? hr : enUS;

	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedApplication, setSelectedApplication] =
		useState<ApplicationSummary | null>(null);
	const [dialogMode, setDialogMode] = useState<"approve" | "reject">("approve");

	const handleApprove = (app: ApplicationSummary) => {
		setSelectedApplication(app);
		setDialogMode("approve");
		setDialogOpen(true);
	};

	const handleReject = (app: ApplicationSummary) => {
		setSelectedApplication(app);
		setDialogMode("reject");
		setDialogOpen(true);
	};

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>{t("forApproval")}</CardTitle>
					<CardDescription>{t("requestsAwaitingDecision")}</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="submitted" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="submitted">
								{t("submittedTab")}
								{queues.submitted.length > 0 && (
									<Badge variant="secondary" className="ml-2">
										{queues.submitted.length}
									</Badge>
								)}
							</TabsTrigger>
							<TabsTrigger value="awaitingGm">
								{t("awaitingGmTab")}
								{queues.awaitingGm.length > 0 && (
									<Badge variant="outline" className="ml-2">
										{queues.awaitingGm.length}
									</Badge>
								)}
							</TabsTrigger>
						</TabsList>

						<TabsContent value="submitted" className="mt-4">
							{queues.submitted.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									{t("noRequestsToApprove")}
								</p>
							) : (
								<div className="space-y-3">
									{queues.submitted.map((app) => {
										const startDate = new Date(app.startDate);
										const endDate = new Date(app.endDate);

										return (
											<div
												key={app.id}
												className="space-y-2 rounded-lg border p-3"
											>
												<div className="space-y-1 text-sm">
													<div className="font-medium">{app.employeeName}</div>
													<div className="flex items-center gap-2">
														{app.unavailabilityReasonColor && (
															<div
																className="h-3 w-3 rounded-full"
																style={{
																	backgroundColor:
																		app.unavailabilityReasonColor,
																}}
															/>
														)}
														<span className="text-muted-foreground">
															{app.unavailabilityReasonName}
														</span>
													</div>
													<div className="flex items-center gap-1 text-xs text-muted-foreground">
														<Calendar className="h-3 w-3" />
														<span>
															{format(startDate, "dd. MMM", {
																locale: dateLocale,
															})}{" "}
															-{" "}
															{format(endDate, "dd. MMM yyyy.", {
																locale: dateLocale,
															})}
														</span>
													</div>
													{app.requestedWorkdays !== null && (
														<div className="text-xs text-muted-foreground">
															{t("workdays")}: {app.requestedWorkdays}
														</div>
													)}
												</div>
												<div className="flex gap-2 justify-end">
													<Button
														size="sm"
														variant="outline"
														className="gap-1"
														asChild
													>
														<Link
															href={`/${organisationAlias}/applications/${app.id}`}
														>
															<Pencil className="h-4 w-4" />
															{t("correct")}
														</Link>
													</Button>
													<Button
														size="sm"
														variant="outline"
														onClick={() => handleApprove(app)}
														className="gap-1"
													>
														<CheckCircle className="h-4 w-4" />
														{t("approve")}
													</Button>
													<Button
														size="sm"
														variant="outline"
														onClick={() => handleReject(app)}
														className="gap-1 text-destructive hover:text-destructive"
													>
														<XCircle className="h-4 w-4" />
														{t("reject")}
													</Button>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</TabsContent>

						<TabsContent value="awaitingGm" className="mt-4">
							{queues.awaitingGm.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									{t("noRequestsForFinalApproval")}
								</p>
							) : (
								<div className="space-y-3">
									{queues.awaitingGm.map((app) => {
										const startDate = new Date(app.startDate);
										const endDate = new Date(app.endDate);

										return (
											<div
												key={app.id}
												className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm"
											>
												<div className="flex-1 space-y-1">
													<div className="font-medium">{app.employeeName}</div>
													<div className="flex items-center gap-2">
														{app.unavailabilityReasonColor && (
															<div
																className="h-3 w-3 rounded-full"
																style={{
																	backgroundColor:
																		app.unavailabilityReasonColor,
																}}
															/>
														)}
														<span className="text-muted-foreground">
															{app.unavailabilityReasonName}
														</span>
													</div>
													<div className="flex items-center gap-1 text-xs text-muted-foreground">
														<Calendar className="h-3 w-3" />
														<span>
															{format(startDate, "dd. MMM", {
																locale: dateLocale,
															})}{" "}
															-{" "}
															{format(endDate, "dd. MMM yyyy.", {
																locale: dateLocale,
															})}
														</span>
													</div>
													{app.requestedWorkdays !== null && (
														<div className="text-xs text-muted-foreground">
															{t("workdays")}: {app.requestedWorkdays}
														</div>
													)}
												</div>
												<Badge variant="default">
													{tApp("statusAPPROVED_FIRST_LEVEL")}
												</Badge>
											</div>
										);
									})}
								</div>
							)}
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			<ApprovalDialog
				application={selectedApplication}
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				action={dmDecideApplicationAction.bind(null, organisationAlias)}
				mode={dialogMode}
			/>
		</>
	);
}
