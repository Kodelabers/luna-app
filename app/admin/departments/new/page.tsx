"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMockDepartments } from "@/lib/mock-data/api";
import { useMockEmployees } from "@/lib/mock-data/api";
import { useMockManagers } from "@/lib/mock-data/api";
import { useMockAuth } from "@/lib/mock-data/context";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewDepartmentPage() {
  const router = useRouter();
  const { organisation } = useMockAuth();
  const { departments, createDepartment } = useMockDepartments();
  const { employees } = useMockEmployees();
  const { assignDepartmentManager } = useMockManagers();

  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [description, setDescription] = useState("");
  const [colorCode, setColorCode] = useState("#3b82f6");
  const [selectedManagers, setSelectedManagers] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeEmployees = employees.filter((e) => e.active);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Naziv odjela je obavezan";
    } else {
      // Check unique name
      const existingDept = departments.find((d) => d.name === name.trim());
      if (existingDept) {
        newErrors.name = "Naziv odjela već postoji";
      }
    }

    if (!alias.trim()) {
      newErrors.alias = "Alias je obavezan";
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
      // Create department
      const newDept = createDepartment({
        organisationId: organisation.id,
        name: name.trim(),
        alias: alias.trim().toLowerCase().replace(/\s+/g, "-"),
        description: description.trim() || undefined,
        colorCode: colorCode,
        active: true,
      });

      // Assign managers
      for (const employeeId of selectedManagers) {
        try {
          assignDepartmentManager(employeeId, newDept.id, employees);
        } catch (error: any) {
          console.error(`Failed to assign manager ${employeeId}:`, error);
        }
      }

      toast({
        title: "Odjel kreiran",
        description: `Odjel ${name} je uspješno kreiran.`,
      });

      router.push("/admin/departments");
    } catch (error: any) {
      toast({
        title: "Greška",
        description: error.message || "Nije moguće kreirati odjel.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleManager = (employeeId: number) => {
    setSelectedManagers((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/admin/departments"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Natrag na listu odjela
          </Link>
          <h1 className="text-3xl font-bold">Dodaj Novi Odjel</h1>
          <p className="text-muted-foreground">
            Unesite podatke za novi odjel
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Podaci odjela</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Naziv odjela <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Naziv odjela"
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alias">
                    Alias <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="alias"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="alias-odjela"
                    className={errors.alias ? "border-destructive" : ""}
                  />
                  {errors.alias && (
                    <p className="text-sm text-destructive">{errors.alias}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Jedinstveni identifikator (koristi se u URL-ovima)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Opis</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Opis odjela (opcionalno)"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="colorCode">Boja odjela</Label>
                <div className="flex gap-2">
                  <Input
                    id="colorCode"
                    type="color"
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Department Manageri (opcionalno)</Label>
                <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                  {activeEmployees.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nema aktivnih zaposlenika
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activeEmployees.map((emp) => (
                        <label
                          key={emp.id}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-muted p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedManagers.includes(emp.id)}
                            onChange={() => toggleManager(emp.id)}
                            className="rounded"
                          />
                          <span className="text-sm">
                            {emp.firstName} {emp.lastName} ({emp.email})
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {selectedManagers.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Odabrano: {selectedManagers.length} managera</p>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/departments")}
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

