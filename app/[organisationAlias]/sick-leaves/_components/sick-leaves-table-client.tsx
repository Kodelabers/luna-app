"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SearchIcon } from "lucide-react";
import { format } from "date-fns";
import { hr } from "date-fns/locale";
import CloseSickLeaveDialog from "./close-sick-leave-dialog";
import CancelSickLeaveDialog from "./cancel-sick-leave-dialog";

type SickLeave = {
  id: string;
  startDate: Date;
  endDate: Date | null;
  status: "OPENED" | "CLOSED" | "CANCELLED";
  note: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  department: {
    id: string;
    name: string;
  };
  unavailabilityReason: {
    id: string;
    name: string;
    colorCode: string | null;
  };
};

type Department = {
  id: string;
  name: string;
};

type Props = {
  sickLeaves: SickLeave[];
  departments: Department[];
  organisationAlias: string;
};

export default function SickLeavesTableClient({
  sickLeaves,
  departments,
  organisationAlias,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [closeDialog, setCloseDialog] = useState<SickLeave | null>(null);
  const [cancelDialog, setCancelDialog] = useState<SickLeave | null>(null);

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("status", value);
    router.push(`?${params.toString()}`);
  };

  const handleDepartmentChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("departmentId");
    } else {
      params.set("departmentId", value);
    }
    router.push(`?${params.toString()}`);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    router.push(`?${params.toString()}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPENED":
        return <Badge variant="default">Otvoreno</Badge>;
      case "CLOSED":
        return <Badge variant="secondary">Zatvoreno</Badge>;
      case "CANCELLED":
        return <Badge variant="outline">Poništeno</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatPeriod = (startDate: Date, endDate: Date | null) => {
    const start = format(startDate, "dd.MM.yyyy", { locale: hr });
    if (endDate) {
      const end = format(endDate, "dd.MM.yyyy", { locale: hr });
      return `${start} - ${end}`;
    }
    return `${start} - danas`;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži zaposlenike..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={searchParams.get("departmentId") || "all"}
          onValueChange={handleDepartmentChange}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Odjel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Svi odjeli</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={searchParams.get("status") || "OPENED"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Svi statusi</SelectItem>
            <SelectItem value="OPENED">Otvoreno</SelectItem>
            <SelectItem value="CLOSED">Zatvoreno</SelectItem>
            <SelectItem value="CANCELLED">Poništeno</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {sickLeaves.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nema bolovanja za prikaz
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zaposlenik</TableHead>
                <TableHead>Odjel</TableHead>
                <TableHead>Vrsta</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sickLeaves.map((sickLeave) => (
                <TableRow key={sickLeave.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {sickLeave.employee.firstName} {sickLeave.employee.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {sickLeave.employee.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{sickLeave.department.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {sickLeave.unavailabilityReason.colorCode && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: sickLeave.unavailabilityReason.colorCode,
                          }}
                        />
                      )}
                      {sickLeave.unavailabilityReason.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatPeriod(sickLeave.startDate, sickLeave.endDate)}
                  </TableCell>
                  <TableCell>{getStatusBadge(sickLeave.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      {sickLeave.status === "OPENED" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCloseDialog(sickLeave)}
                          >
                            Zatvori
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setCancelDialog(sickLeave)}
                          >
                            Poništi
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialogs */}
      {closeDialog && (
        <CloseSickLeaveDialog
          open={!!closeDialog}
          onOpenChange={(open) => !open && setCloseDialog(null)}
          sickLeave={closeDialog}
          organisationAlias={organisationAlias}
        />
      )}

      {cancelDialog && (
        <CancelSickLeaveDialog
          open={!!cancelDialog}
          onOpenChange={(open) => !open && setCancelDialog(null)}
          sickLeave={cancelDialog}
          organisationAlias={organisationAlias}
        />
      )}
    </div>
  );
}

