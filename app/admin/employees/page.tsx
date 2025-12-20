"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Search, MoreVertical, Edit, Trash2, UserX, UserCheck } from "lucide-react";
import { useMockEmployees } from "@/lib/mock-data/api";
import { useMockDepartments } from "@/lib/mock-data/api";
import { toast } from "@/hooks/use-toast";

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function EmployeesPage() {
  const router = useRouter();
  const { employees, deleteEmployee, toggleEmployeeActive } = useMockEmployees();
  const { departments } = useMockDepartments();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      searchQuery === "" ||
      emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && emp.active) ||
      (statusFilter === "inactive" && !emp.active);

    return matchesSearch && matchesStatus;
  });

  const handleEdit = (id: number) => {
    router.push(`/admin/employees/${id}`);
  };

  const handleDelete = (id: number) => {
    setSelectedEmployee(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEmployee) {
      deleteEmployee(selectedEmployee);
      toast({
        title: "Zaposlenik obrisan",
        description: "Zaposlenik je uspješno obrisan iz sustava.",
      });
      setDeleteDialogOpen(false);
      setSelectedEmployee(null);
    }
  };

  const handleDeactivate = (id: number) => {
    setSelectedEmployee(id);
    setDeactivateDialogOpen(true);
  };

  const confirmDeactivate = () => {
    if (selectedEmployee) {
      const employee = employees.find((e) => e.id === selectedEmployee);
      if (employee) {
        toggleEmployeeActive(selectedEmployee);
        toast({
          title: employee.active ? "Zaposlenik deaktiviran" : "Zaposlenik aktiviran",
          description: employee.active
            ? "Zaposlenik više ne može pristupiti sustavu."
            : "Zaposlenik sada može pristupiti sustavu.",
        });
        setDeactivateDialogOpen(false);
        setSelectedEmployee(null);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Zaposlenici</h1>
            <p className="text-muted-foreground">
              Upravljanje zaposlenicima u organizaciji
            </p>
          </div>
          <Button onClick={() => router.push("/admin/employees/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            Dodaj Zaposlenika
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pretraži po imenu ili emailu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi statusi</SelectItem>
                  <SelectItem value="active">Aktivni</SelectItem>
                  <SelectItem value="inactive">Neaktivni</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Employees Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista zaposlenika ({filteredEmployees.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zaposlenik</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Odjel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nema zaposlenika
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => {
                    const department = departments.find(
                      (d) => d.id === employee.departmentId
                    );
                    return (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                              {getInitials(employee.firstName, employee.lastName)}
                            </div>
                            <div>
                              <div className="font-medium">
                                {employee.firstName} {employee.lastName}
                              </div>
                              {employee.title && (
                                <div className="text-sm text-muted-foreground">
                                  {employee.title}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{department?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={employee.active ? "default" : "secondary"}>
                            {employee.active ? "Aktivan" : "Neaktivan"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(employee.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Uredi
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeactivate(employee.id)}
                              >
                                {employee.active ? (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Deaktiviraj
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Aktiviraj
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(employee.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Obriši
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Potvrdite brisanje</DialogTitle>
              <DialogDescription>
                Jeste li sigurni da želite obrisati ovog zaposlenika? Ova akcija je
                nepovratna i trajno će obrisati zaposlenika iz sustava.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Odustani
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Obriši
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Deactivate Confirmation Dialog */}
        <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedEmployee &&
                employees.find((e) => e.id === selectedEmployee)?.active
                  ? "Potvrdite deaktivaciju"
                  : "Potvrdite aktivaciju"}
              </DialogTitle>
              <DialogDescription>
                {selectedEmployee &&
                employees.find((e) => e.id === selectedEmployee)?.active
                  ? "Deaktivirani zaposlenik više neće moći pristupiti sustavu, ali njegovi podaci će ostati vidljivi."
                  : "Aktivirani zaposlenik će moći pristupiti sustavu."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>
                Odustani
              </Button>
              <Button onClick={confirmDeactivate}>
                {selectedEmployee &&
                employees.find((e) => e.id === selectedEmployee)?.active
                  ? "Deaktiviraj"
                  : "Aktiviraj"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

