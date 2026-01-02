"use client";

import { useState, useEffect } from "react";
import { ApplicationTable } from "@/app/[organisationAlias]/applications/_components/application-table";
import { ApplicationFilters } from "@/app/[organisationAlias]/applications/_components/application-filters";
import { ApplicationStatus } from "@prisma/client";
import { listDepartmentApplicationsAction } from "@/lib/actions/application";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

type UnavailabilityReason = {
  id: number;
  name: string;
};

type DepartmentApplicationsClientProps = {
  organisationAlias: string;
  departmentId: number;
  reasons: UnavailabilityReason[];
};

export function DepartmentApplicationsClient({
  organisationAlias,
  departmentId,
  reasons,
}: DepartmentApplicationsClientProps) {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "ALL">(
    "ALL"
  );
  const [reasonFilter, setReasonFilter] = useState<number | "ALL">("ALL");

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

      const data = await listDepartmentApplicationsAction(
        organisationAlias,
        departmentId,
        filters
      );
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

  // Filter by search query (client-side) - search by employee name or reason
  const filteredApplications = applications.filter((app) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.employeeName?.toLowerCase().includes(query) ||
      app.reasonName.toLowerCase().includes(query) ||
      app.description?.toLowerCase().includes(query)
    );
  });

  const handleView = (id: number) => {
    router.push(`/${organisationAlias}/applications/${id}`);
  };

  const handleRowClick = (id: number) => {
    router.push(`/${organisationAlias}/applications/${id}`);
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
        showEmployee
        onRowClick={handleRowClick}
      />
    </div>
  );
}

