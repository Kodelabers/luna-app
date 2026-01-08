"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { closeSickLeaveAction } from "@/lib/actions/sick-leave";
import { format } from "date-fns";
import { hr } from "date-fns/locale";

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

  const minEndDate = new Date(sickLeave.startDate);
  minEndDate.setDate(minEndDate.getDate() + 1);

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
              <Label htmlFor="endDateLocalISO">Datum završetka *</Label>
              <Input
                id="endDateLocalISO"
                name="endDateLocalISO"
                type="date"
                required
                min={minEndDate.toISOString().split("T")[0]}
                max={new Date().toISOString().split("T")[0]}
              />
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

