"use client";

import { useState, useEffect } from "react";
import { ApplicationTable } from "./application-table";
import { ApplicationFilters } from "./application-filters";
import { DeleteApplicationDialog } from "./delete-application-dialog";
import { ApplicationStatus } from "@prisma/client";
import { listMyApplicationsAction } from "@/lib/actions/application";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

type UnavailabilityReason = {
  id: string;
  name: string;
  needApproval: boolean;
  needSecondApproval: boolean;
  hasPlanning: boolean;
};

type ApplicationsListClientProps = {
  organisationAlias: string;
  reasons: UnavailabilityReason[];
};

export function ApplicationsListClient({
  organisationAlias,
  reasons,
}: ApplicationsListClientProps) {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "ALL">(
    "ALL"
  );
  const [reasonFilter, setReasonFilter] = useState<string | "ALL">("ALL");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);

  // Fetch applications
  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (statusFilter !== "ALL") {
        filters.status = statusFilter;
      }
      if (reasonFilter !== "ALL") {
        filters.reasonId = reasonFilter;
      }
      // Add client timezone
      filters.clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const data = await listMyApplicationsAction(organisationAlias, filters);
      setApplications(data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, reasonFilter]);

  // Filter by search query (client-side)
  const filteredApplications = applications.filter((app) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.reasonName.toLowerCase().includes(query) ||
      app.description?.toLowerCase().includes(query)
    );
  });

  const handleView = (id: string) => {
    router.push(`/${organisationAlias}/applications/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/${organisationAlias}/applications/${id}/edit`);
  };

  const handleDelete = (id: string) => {
    setSelectedApplicationId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    fetchApplications();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ApplicationFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        reasonFilter={reasonFilter}
        onReasonChange={setReasonFilter}
        reasons={reasons}
      />

      <ApplicationTable
        applications={filteredApplications}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <DeleteApplicationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        applicationId={selectedApplicationId}
        organisationAlias={organisationAlias}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}

