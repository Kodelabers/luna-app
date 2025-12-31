"use client";

import { useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { allocateDaysSchema } from "@/lib/validation/schemas";
import { allocateDaysAction } from "@/lib/actions/days-balance";
import { initialFormState, type FormState } from "@/lib/errors";
import { Loader2 } from "lucide-react";
import { z } from "zod";

type AllocateDaysFormValues = z.infer<typeof allocateDaysSchema>;

type AllocateDaysDialogProps = {
  organisationAlias: string;
  employeeId: number;
  unavailabilityReasonId: number;
  openYear: number | null;
  currentYear: number;
  openYearBalance: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AllocateDaysDialog({
  organisationAlias,
  employeeId,
  unavailabilityReasonId,
  openYear,
  currentYear,
  openYearBalance,
  open,
  onOpenChange,
}: AllocateDaysDialogProps) {
  const t = useTranslations("allocateDays");
  const tCommon = useTranslations("common");

  // Get client timezone
  const clientTimeZone = typeof window !== "undefined" 
    ? Intl.DateTimeFormat().resolvedOptions().timeZone 
    : "Europe/Zagreb";

  // Check if openYear is stale (older than currentYear - 1)
  const isStaleOpenYear = openYear !== null && openYear < currentYear - 1;

  // Calculate initial year based on rules
  const getInitialYear = (): number => {
    if (openYear !== null && !isStaleOpenYear) {
      const nextYear = openYear + 1;
      // Validate: nextYear <= currentYear + 1
      if (nextYear > currentYear + 1) {
        // This should not happen if DaysBalanceTableClient checks correctly
        return currentYear + 1;
      }
      return nextYear;
    } else {
      // No openYear or stale openYear: allow currentYear-1, currentYear, or currentYear+1
      return currentYear;
    }
  };

  const initialYear = getInitialYear();
  const showYearSelect = openYear === null || isStaleOpenYear;
  const nextYear = openYear !== null && !isStaleOpenYear ? openYear + 1 : null;
  const canOpenNextYear = nextYear !== null && nextYear <= currentYear + 1;

  const form = useForm<AllocateDaysFormValues>({
    resolver: zodResolver(allocateDaysSchema),
    defaultValues: {
      employeeId,
      unavailabilityReasonId,
      year: initialYear,
      days: 20,
      clientTimeZone,
    },
  });

  // Create bound action with organisationAlias
  const boundAction = allocateDaysAction.bind(null, organisationAlias);

  const [state, formAction, isPending] = useActionState(boundAction, initialFormState);

  // Handle form state changes
  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      onOpenChange(false);
      form.reset();
    } else if (state.formError) {
      toast.error(state.formError);
    }

    // Set field errors from server
    if (state.fieldErrors) {
      for (const [field, errors] of Object.entries(state.fieldErrors)) {
        if (errors && errors.length > 0) {
          form.setError(field as keyof AllocateDaysFormValues, {
            type: "server",
            message: errors[0],
          });
        }
      }
    }
  }, [state, form, onOpenChange]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      const year = getInitialYear();
      form.reset({
        employeeId,
        unavailabilityReasonId,
        year,
        days: 20,
        clientTimeZone,
      });
    }
  }, [open, employeeId, unavailabilityReasonId, openYear, currentYear, form, clientTimeZone]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="employeeId" value={employeeId} />
            <input type="hidden" name="unavailabilityReasonId" value={unavailabilityReasonId} />
            <input type="hidden" name="clientTimeZone" value={clientTimeZone} />
            <input
              type="hidden"
              name="year"
              value={form.watch("year") || initialYear}
            />

            {/* Show stale openYear info message */}
            {isStaleOpenYear && openYear !== null && (
              <Alert>
                <AlertDescription>
                  {t("staleOpenYearMessage", { openYear })}
                </AlertDescription>
              </Alert>
            )}

            {/* Show transfer message if openYearBalance > 0 and not stale */}
            {openYear !== null && !isStaleOpenYear && openYearBalance !== null && openYearBalance > 0 && canOpenNextYear && (
              <Alert>
                <AlertDescription>
                  {t("transferMessage", {
                    openYear,
                    balance: openYearBalance,
                    newYear: nextYear,
                  })}
                </AlertDescription>
              </Alert>
            )}

            {/* Show simple message if opening new year with balance = 0 and not stale */}
            {openYear !== null && !isStaleOpenYear && openYearBalance !== null && openYearBalance === 0 && canOpenNextYear && (
              <Alert>
                <AlertDescription>
                  {t("openingNewYear", { year: nextYear })}
                </AlertDescription>
              </Alert>
            )}

            {/* Show error if cannot open next year and not stale */}
            {openYear !== null && !isStaleOpenYear && !canOpenNextYear && (
              <Alert variant="destructive">
                <AlertDescription>
                  {t("maxYearExceeded", {
                    year: nextYear,
                    maxYear: currentYear + 1,
                  })}
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("year")}</FormLabel>
                  <FormControl>
                    {showYearSelect ? (
                      <Select
                        value={field.value.toString()}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectYear")} />
                        </SelectTrigger>
                        <SelectContent>
                          {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type="number"
                        {...field}
                        value={field.value}
                        readOnly
                        disabled
                        className="bg-muted"
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("days")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isPending || (openYear !== null && !isStaleOpenYear && !canOpenNextYear)}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("submit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

