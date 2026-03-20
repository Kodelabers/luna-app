"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { hr, enUS } from "date-fns/locale";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { closeSickLeaveAction, checkRemainingDaysAction } from "@/lib/actions/sick-leave";
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
  const t = useTranslations("sickLeave");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dateLocale = locale === "hr" ? hr : enUS;
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [cancelRemainingDays, setCancelRemainingDays] = useState<"none" | "cancel">("none");
  const [hasRemainingDays, setHasRemainingDays] = useState(false);
  const [checkingRemainingDays, setCheckingRemainingDays] = useState(false);
  const [state, formAction, isPending] = useActionState(
    closeSickLeaveAction.bind(null, organisationAlias),
    initialState
  );

  useEffect(() => {
    if (state.success) {
      toast.success(state.message || t("messages.closed"));
      onOpenChange(false);
      router.refresh();
    } else if (state.formError) {
      toast.error(state.formError);
    }
  }, [state, onOpenChange, router]);

  // Check for remaining days when endDate changes
  useEffect(() => {
    if (!endDate) {
      setHasRemainingDays(false);
      return;
    }

    const checkRemainingDays = async () => {
      setCheckingRemainingDays(true);
      try {
        const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const endDateISO = format(endDate, "yyyy-MM-dd");
        const result = await checkRemainingDaysAction(
          organisationAlias,
          sickLeave.id,
          endDateISO,
          clientTimeZone
        );
        setHasRemainingDays(result.hasRemainingDays);
        if (!result.hasRemainingDays) {
          setCancelRemainingDays("none");
        }
      } catch (error) {
        setHasRemainingDays(false);
      } finally {
        setCheckingRemainingDays(false);
      }
    };

    checkRemainingDays();
  }, [endDate, organisationAlias, sickLeave.id]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setEndDate(undefined);
      setCancelRemainingDays("none");
      setHasRemainingDays(false);
    }
  }, [open]);

  // Minimalni datum završetka je isti dan kao datum početka
  const minEndDate = new Date(sickLeave.startDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("closeDialog.title")}</DialogTitle>
          <DialogDescription>{t("closeDialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>{t("employee")}:</strong> {sickLeave.employee.firstName}{" "}
              {sickLeave.employee.lastName}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>{t("reason")}:</strong> {sickLeave.unavailabilityReason.name}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>{t("startDate")}:</strong>{" "}
              {format(sickLeave.startDate, "dd.MM.yyyy", { locale: dateLocale })}
            </p>
          </div>

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="sickLeaveId" value={sickLeave.id} />
            <input
              type="hidden"
              name="clientTimeZone"
              value={Intl.DateTimeFormat().resolvedOptions().timeZone}
            />
            <input
              type="hidden"
              name="cancelRemainingDays"
              value={cancelRemainingDays === "cancel" ? "true" : "false"}
            />

            <div className="space-y-2">
              <Label>{t("endDate")} *</Label>
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
                      format(endDate, "dd.MM.yyyy", { locale: dateLocale })
                    ) : (
                      <span>{t("selectDate")}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < minEndDate}
                    locale={dateLocale}
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

            {hasRemainingDays && (
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>{t("remainingDaysAlert")}</AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Label>{t("remainingDaysOption")}</Label>
                  <RadioGroup
                    value={cancelRemainingDays}
                    onValueChange={(value) => setCancelRemainingDays(value as "none" | "cancel")}
                  >
                    <div className="flex items-start space-x-3 space-y-0">
                      <RadioGroupItem value="none" id="none" />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="none" className="font-normal cursor-pointer">
                          {t("keepRemainingDays")}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {t("keepRemainingDaysDesc")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 space-y-0">
                      <RadioGroupItem value="cancel" id="cancel" />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="cancel" className="font-normal cursor-pointer">
                          {t("cancelRemainingDays")}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {t("cancelRemainingDaysDesc")}
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {checkingRemainingDays && (
              <p className="text-sm text-muted-foreground">{t("checkingDays")}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="note">{t("note")}</Label>
              <Textarea
                id="note"
                name="note"
                placeholder={t("notePlaceholder")}
                rows={3}
              />
              {state.fieldErrors?.note && (
                <p className="text-sm text-destructive">{state.fieldErrors.note[0]}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t("saving") : t("closeDialog.title")}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

