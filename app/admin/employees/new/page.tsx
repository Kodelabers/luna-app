"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMockEmployees } from "@/lib/mock-data/api";
import { useMockDepartments } from "@/lib/mock-data/api";
import { useMockLedgerEntries } from "@/lib/mock-data/api";
import { useMockAuth } from "@/lib/mock-data/context";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewEmployeePage() {
  const router = useRouter();
  const { organisation } = useMockAuth();
  const { departments } = useMockDepartments();
  const { createEmployee } = useMockEmployees();
  const { createLedgerEntry } = useMockLedgerEntries();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined);
  const [vacationDays, setVacationDays] = useState(20);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = "Ime je obavezno";
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Prezime je obavezno";
    }

    if (!email.trim()) {
      newErrors.email = "Email je obavezan";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email nije valjan";
    }

    if (vacationDays < 1 || vacationDays > 50) {
      newErrors.vacationDays = "Broj dana mora biti između 1 i 50";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create employee
      createEmployee(
        {
          organisationId: organisation.id,
          departmentId: departmentId || 0, // Use 0 if no department selected
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          active: true,
        },
        createLedgerEntry,
        vacationDays
      );

      toast({
        title: "Zaposlenik kreiran",
        description: `${firstName} ${lastName} je uspješno dodan u sustav.`,
      });

      router.push("/admin/employees");
    } catch (error: any) {
      toast({
        title: "Greška",
        description: error.message || "Nije moguće kreirati zaposlenika.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/admin/employees"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Natrag na listu zaposlenika
          </Link>
          <h1 className="text-3xl font-bold">Dodaj Novog Zaposlenika</h1>
          <p className="text-muted-foreground">
            Unesite podatke za novog zaposlenika
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Podaci zaposlenika</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    Ime <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ime"
                    className={errors.firstName ? "border-destructive" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Prezime <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Prezime"
                    className={errors.lastName ? "border-destructive" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@primjer.hr"
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="departmentId">Odjel</Label>
                <Select
                  value={departmentId?.toString() || ""}
                  onValueChange={(v) => setDepartmentId(v ? parseInt(v) : undefined)}
                >
                  <SelectTrigger id="departmentId">
                    <SelectValue placeholder="Odaberi odjel (opcionalno)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Bez odjela</SelectItem>
                    {departments
                      .filter((d) => d.active)
                      .map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vacationDays">
                  Broj dana godišnjeg odmora <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="vacationDays"
                  type="number"
                  min="1"
                  max="50"
                  value={vacationDays}
                  onChange={(e) => setVacationDays(parseInt(e.target.value) || 0)}
                  className={errors.vacationDays ? "border-destructive" : ""}
                />
                {errors.vacationDays && (
                  <p className="text-sm text-destructive">{errors.vacationDays}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Automatski će se kreirati alokacija za tekuću godinu
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/employees")}
                  disabled={isSubmitting}
                >
                  Odustani
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Spremanje..." : "Spremi"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

