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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { closeSickLeaveAction } from "@/lib/actions/sick-leave";
import { cn } from "@/lib/utils";

type SickLeave = {
  id: string;
  startDate: Date;
  employee: {
    firstName: string;
    lastName: string;
  };
  unavailabilityReason: {
    name: string;
  };
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sickLeave: SickLeave;
  organisationAlias: string;
};

const initialState = {
  success: false,
};

export default function CloseSickLeaveDialog({
  open,
  onOpenChange,
  sickLeave,
  organisationAlias,
}: Props) {
  const router = useRouter();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [state, formAction, isPending] = useActionState(
    closeSickLeaveAction.bind(null, organisationAlias),
    initialState
  );

  useEffect(() => {
    if (state.success) {
      toast.success(state.message || "Bolovanje je uspješno zatvoreno");
      onOpenChange(false);
      router.refresh();
    } else if (state.formError) {
      toast.error(state.formError);
    }
  }, [state, onOpenChange, router]);

  // Minimalni datum završetka je isti dan kao datum početka
  const minEndDate = new Date(sickLeave.startDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Zatvori bolovanje</DialogTitle>
          <DialogDescription>Definirajte datum završetka bolovanja</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Zaposlenik:</strong> {sickLeave.employee.firstName}{" "}
              {sickLeave.employee.lastName}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Vrsta:</strong> {sickLeave.unavailabilityReason.name}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Datum početka:</strong>{" "}
              {format(sickLeave.startDate, "dd.MM.yyyy", { locale: hr })}
            </p>
          </div>

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="sickLeaveId" value={sickLeave.id} />
            <input
              type="hidden"
              name="clientTimeZone"
              value={Intl.DateTimeFormat().resolvedOptions().timeZone}
            />

            <div className="space-y-2">
              <Label>Datum završetka *</Label>
              <input
                type="hidden"
                name="endDateLocalISO"
                value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? (
                      format(endDate, "dd.MM.yyyy", { locale: hr })
                    ) : (
                      <span>Odaberite datum</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < minEndDate}
                    locale={hr}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {state.fieldErrors?.endDateLocalISO && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.endDateLocalISO[0]}
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
                {isPending ? "Spremanje..." : "Zatvori bolovanje"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

