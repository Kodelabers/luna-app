"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useMockAuth } from "@/lib/mock-data/context";
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
import { mockUnavailabilityReasons, mockHolidays } from "@/lib/mock-data/generator";
import { calculateWorkingDays } from "@/lib/utils/workdays";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function CreateRequestPage() {
  const { currentUser } = useMockAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    unavailabilityReasonId: "",
    startDate: "",
    endDate: "",
    description: "",
  });
  const [workingDays, setWorkingDays] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const handleDateChange = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (start > end) {
        setErrors(["Datum početka mora biti prije datuma završetka"]);
        setWorkingDays(null);
        return;
      }

      const days = calculateWorkingDays(start, end, mockHolidays);
      setWorkingDays(days);
      
      if (days === 0) {
        setErrors(["Zahtjev mora uključivati barem jedan radni dan"]);
      } else {
        setErrors([]);
      }
    }
  };

  const handleSubmit = (isDraft: boolean) => {
    const newErrors: string[] = [];

    if (!formData.unavailabilityReasonId) {
      newErrors.push("Molimo odaberite tip nedostupnosti");
    }
    if (!formData.startDate) {
      newErrors.push("Molimo unesite datum početka");
    }
    if (!formData.endDate) {
      newErrors.push("Molimo unesite datum završetka");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    // Mock save - in real app this would call API
    alert(
      isDraft
        ? "Zahtjev spremljen kao draft"
        : "Zahtjev poslan na odobrenje"
    );
    router.push("/employee/requests");
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/employee">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Novi Zahtjev</h1>
            <p className="text-muted-foreground">
              Kreirajte zahtjev za godišnji odmor ili drugu vrstu nedostupnosti
            </p>
          </div>
        </div>

        {errors.length > 0 && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <p key={index} className="text-sm text-destructive">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Detalji Zahtjeva</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="reason">Tip Nedostupnosti *</Label>
              <Select
                value={formData.unavailabilityReasonId}
                onValueChange={(value) =>
                  setFormData({ ...formData, unavailabilityReasonId: value })
                }
              >
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Odaberite tip..." />
                </SelectTrigger>
                <SelectContent>
                  {mockUnavailabilityReasons
                    .filter((r) => r.active)
                    .map((reason) => (
                      <SelectItem key={reason.id} value={reason.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: reason.colorCode }}
                          />
                          {reason.name}
                          {reason.needApproval && (
                            <span className="text-xs text-muted-foreground">
                              (Potrebno odobrenje)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Datum Početka *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => {
                    setFormData({ ...formData, startDate: e.target.value });
                    setTimeout(handleDateChange, 0);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Datum Završetka *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => {
                    setFormData({ ...formData, endDate: e.target.value });
                    setTimeout(handleDateChange, 0);
                  }}
                />
              </div>
            </div>

            {workingDays !== null && workingDays > 0 && (
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Broj radnih dana
                    </p>
                    <p className="text-3xl font-bold">{workingDays}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Napomena (opcionalno)</Label>
              <Textarea
                id="description"
                placeholder="Unesite dodatne informacije..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => handleSubmit(true)}
                className="flex-1"
              >
                Spremi kao Draft
              </Button>
              <Button onClick={() => handleSubmit(false)} className="flex-1">
                Pošalji na Odobrenje
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

