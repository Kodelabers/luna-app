"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { useMockHolidays } from "@/lib/mock-data/api";
import { useMockAuth } from "@/lib/mock-data/context";
import { toast } from "@/hooks/use-toast";
import { Holiday } from "@/lib/types";

export default function HolidaysPage() {
  const { organisation } = useMockAuth();
  const { holidays, createHoliday, updateHoliday, deleteHoliday } = useMockHolidays();

  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [repeatYearly, setRepeatYearly] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter holidays
  const filteredHolidays = holidays
    .filter((h) => {
      if (h.repeatYearly) {
        return true; // Show all yearly holidays
      }
      return new Date(h.date).getFullYear() === yearFilter;
    })
    .sort((a, b) => {
      // Sort by date, but normalize yearly holidays to current year for comparison
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (a.repeatYearly) {
        dateA.setFullYear(yearFilter);
      }
      if (b.repeatYearly) {
        dateB.setFullYear(yearFilter);
      }
      return dateA.getTime() - dateB.getTime();
    });

  const availableYears = Array.from(
    new Set(
      holidays
        .filter((h) => !h.repeatYearly)
        .map((h) => new Date(h.date).getFullYear())
    )
  ).sort();

  const resetForm = () => {
    setName("");
    setDate("");
    setRepeatYearly(true);
    setErrors({});
  };

  const openAddDialog = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  const openEditDialog = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setName(holiday.name);
    setDate(new Date(holiday.date).toISOString().split("T")[0]);
    setRepeatYearly(holiday.repeatYearly);
    setErrors({});
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setDeleteDialogOpen(true);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Naziv je obavezan";
    }

    if (!date) {
      newErrors.date = "Datum je obavezan";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) {
      return;
    }

    try {
      createHoliday({
        organisationId: organisation.id,
        name: name.trim(),
        date: new Date(date),
        repeatYearly,
        active: true,
      });

      toast({
        title: "Praznik kreiran",
        description: `${name} je uspješno dodan u kalendar.`,
      });

      setAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Greška",
        description: error.message || "Nije moguće kreirati praznik.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = () => {
    if (!selectedHoliday || !validate()) {
      return;
    }

    try {
      updateHoliday(selectedHoliday.id, {
        name: name.trim(),
        date: new Date(date),
        repeatYearly,
      });

      toast({
        title: "Praznik ažuriran",
        description: `${name} je uspješno ažuriran.`,
      });

      setEditDialogOpen(false);
      setSelectedHoliday(null);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Greška",
        description: error.message || "Nije moguće ažurirati praznik.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    if (!selectedHoliday) {
      return;
    }

    try {
      deleteHoliday(selectedHoliday.id);

      toast({
        title: "Praznik obrisan",
        description: `${selectedHoliday.name} je uspješno obrisan iz kalendara.`,
      });

      setDeleteDialogOpen(false);
      setSelectedHoliday(null);
    } catch (error: any) {
      toast({
        title: "Greška",
        description: error.message || "Nije moguće obrisati praznik.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date, repeatYearly: boolean, year: number): string => {
    const d = new Date(date);
    if (repeatYearly) {
      d.setFullYear(year);
    }
    return d.toLocaleDateString("hr-HR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Praznici</h1>
            <p className="text-muted-foreground">
              Upravljanje praznicima u organizaciji
            </p>
          </div>
          <Button onClick={openAddDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Dodaj Praznik
          </Button>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="space-y-2">
                <Label htmlFor="yearFilter">Filtriraj po godini</Label>
                <Select
                  value={yearFilter.toString()}
                  onValueChange={(v) => setYearFilter(parseInt(v))}
                >
                  <SelectTrigger id="yearFilter" className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.length > 0 ? (
                      availableYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value={yearFilter.toString()}>
                        {yearFilter}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Holidays Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista praznika ({filteredHolidays.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naziv</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Godina</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHolidays.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nema praznika
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHolidays.map((holiday) => {
                    const holidayYear = new Date(holiday.date).getFullYear();
                    return (
                      <TableRow key={holiday.id}>
                        <TableCell className="font-medium">{holiday.name}</TableCell>
                        <TableCell>
                          {formatDate(holiday.date, holiday.repeatYearly, yearFilter)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={holiday.repeatYearly ? "default" : "secondary"}>
                            {holiday.repeatYearly ? "Ponavljajući" : "Jednokratni"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {holiday.repeatYearly ? (
                            <span className="text-muted-foreground">Sve godine</span>
                          ) : (
                            holidayYear
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(holiday)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDeleteDialog(holiday)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dodaj Novi Praznik</DialogTitle>
              <DialogDescription>
                Unesite podatke za novi praznik u kalendaru.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">
                  Naziv <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="add-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Naziv praznika"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-date">
                  Datum <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="add-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={errors.date ? "border-destructive" : ""}
                />
                {errors.date && (
                  <p className="text-sm text-destructive">{errors.date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tip praznika</Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={repeatYearly}
                      onChange={() => setRepeatYearly(true)}
                      className="rounded"
                    />
                    <span className="text-sm">Ponavljajući (svake godine)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!repeatYearly}
                      onChange={() => setRepeatYearly(false)}
                      className="rounded"
                    />
                    <span className="text-sm">Jednokratni</span>
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Odustani
              </Button>
              <Button onClick={handleAdd}>Spremi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Uredi Praznik</DialogTitle>
              <DialogDescription>
                Ažurirajte podatke praznika.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">
                  Naziv <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Naziv praznika"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-date">
                  Datum <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={errors.date ? "border-destructive" : ""}
                />
                {errors.date && (
                  <p className="text-sm text-destructive">{errors.date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tip praznika</Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={repeatYearly}
                      onChange={() => setRepeatYearly(true)}
                      className="rounded"
                    />
                    <span className="text-sm">Ponavljajući (svake godine)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!repeatYearly}
                      onChange={() => setRepeatYearly(false)}
                      className="rounded"
                    />
                    <span className="text-sm">Jednokratni</span>
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Odustani
              </Button>
              <Button onClick={handleEdit}>Spremi promjene</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Potvrdite brisanje</DialogTitle>
              <DialogDescription>
                Jeste li sigurni da želite obrisati praznik "{selectedHoliday?.name}"? Ova
                akcija će obrisati praznik iz kalendara. Postojeći zahtjevi se neće
                mijenjati retroaktivno.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Odustani
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Obriši
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

