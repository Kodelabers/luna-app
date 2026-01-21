"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { hr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { openSickLeaveAction } from "@/lib/actions/sick-leave";
import { cn } from "@/lib/utils";

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  department: {
    id: string;
    name: string;
  };
};

type Department = {
  id: string;
  name: string;
};

type SickLeaveReason = {
  id: string;
  name: string;
  colorCode: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  departments: Department[];
  sickLeaveReasons: SickLeaveReason[];
  organisationAlias: string;
};

const initialState = {
  success: false,
};

export default function OpenSickLeaveDialog({
  open,
  onOpenChange,
  employees,
  departments,
  sickLeaveReasons,
  organisationAlias,
}: Props) {
  const router = useRouter();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [state, formAction, isPending] = useActionState(
    openSickLeaveAction.bind(null, organisationAlias),
    initialState
  );

  useEffect(() => {
    if (state.success) {
      toast.success(state.message || "Bolovanje je uspješno otvoreno");
      onOpenChange(false);
      router.refresh();
    } else if (state.formError) {
      toast.error(state.formError);
    }
  }, [state, onOpenChange, router]);

  const filteredEmployees = selectedDepartment && selectedDepartment !== "ALL"
    ? employees.filter((emp) => emp.departmentId === selectedDepartment)
    : employees;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Otvori bolovanje</DialogTitle>
          <DialogDescription>
            Evidentiranje bolovanja bez datuma završetka
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input
            type="hidden"
            name="clientTimeZone"
            value={Intl.DateTimeFormat().resolvedOptions().timeZone}
          />

          <div className="space-y-2">
            <Label htmlFor="departmentFilter">Odjel (filter)</Label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger id="departmentFilter">
                <SelectValue placeholder="Svi odjeli" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Svi odjeli</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employeeId">Zaposlenik *</Label>
            <Select name="employeeId" required>
              <SelectTrigger id="employeeId">
                <SelectValue placeholder="Odaberite zaposlenika" />
              </SelectTrigger>
              <SelectContent>
                {filteredEmployees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName} ({employee.department.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.employeeId && (
              <p className="text-sm text-destructive">{state.fieldErrors.employeeId[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="unavailabilityReasonId">Vrsta bolovanja *</Label>
            <Select name="unavailabilityReasonId" required>
              <SelectTrigger id="unavailabilityReasonId">
                <SelectValue placeholder="Odaberite vrstu bolovanja" />
              </SelectTrigger>
              <SelectContent>
                {sickLeaveReasons.map((reason) => (
                  <SelectItem key={reason.id} value={reason.id}>
                    <div className="flex items-center gap-2">
                      {reason.colorCode && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: reason.colorCode }}
                        />
                      )}
                      {reason.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.unavailabilityReasonId && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.unavailabilityReasonId[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Datum početka *</Label>
            <input
              type="hidden"
              name="startDateLocalISO"
              value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    format(startDate, "dd.MM.yyyy", { locale: hr })
                  ) : (
                    <span>Odaberite datum</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date > new Date()}
                  locale={hr}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {state.fieldErrors?.startDateLocalISO && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.startDateLocalISO[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Napomena</Label>
            <Textarea
              id="note"
              name="note"
              placeholder="Dodatne napomene (opcionalno)"
              rows={3}
            />
            {state.fieldErrors?.note && (
              <p className="text-sm text-destructive">{state.fieldErrors.note[0]}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Odustani
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Spremanje..." : "Otvori bolovanje"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

