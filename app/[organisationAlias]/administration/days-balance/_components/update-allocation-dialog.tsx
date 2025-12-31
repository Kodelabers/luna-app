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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { updateAllocationSchema } from "@/lib/validation/schemas";
import { updateAllocationAction } from "@/lib/actions/days-balance";
import { initialFormState, type FormState } from "@/lib/errors";
import { Loader2 } from "lucide-react";
import { z } from "zod";

type UpdateAllocationFormValues = z.infer<typeof updateAllocationSchema>;

type UpdateAllocationDialogProps = {
  organisationAlias: string;
  employeeId: number;
  unavailabilityReasonId: number;
  openYear: number | null;
  currentAllocated: number;
  currentUsed: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UpdateAllocationDialog({
  organisationAlias,
  employeeId,
  unavailabilityReasonId,
  openYear,
  currentAllocated: propCurrentAllocated,
  currentUsed: propCurrentUsed,
  open,
  onOpenChange,
}: UpdateAllocationDialogProps) {
  const t = useTranslations("updateAllocation");
  const tCommon = useTranslations("common");

  // Get client timezone
  const clientTimeZone = typeof window !== "undefined" 
    ? Intl.DateTimeFormat().resolvedOptions().timeZone 
    : "Europe/Zagreb";

  const [currentAllocated, setCurrentAllocated] = useState<number>(propCurrentAllocated);
  const [currentUsed, setCurrentUsed] = useState<number>(propCurrentUsed);

  const form = useForm<UpdateAllocationFormValues>({
    resolver: zodResolver(updateAllocationSchema),
    defaultValues: {
      employeeId,
      unavailabilityReasonId,
      year: openYear ?? new Date().getFullYear(),
      adjustmentType: "INCREASE",
      adjustmentDays: 1,
      clientTimeZone,
    },
  });

  // Create bound action with organisationAlias
  const boundAction = updateAllocationAction.bind(null, organisationAlias);

  const [state, formAction, isPending] = useActionState(boundAction, initialFormState);

  // Load current allocation when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentAllocated(propCurrentAllocated);
      setCurrentUsed(propCurrentUsed);
      form.reset({
        employeeId,
        unavailabilityReasonId,
        year: openYear ?? new Date().getFullYear(),
        adjustmentType: "INCREASE",
        adjustmentDays: 1,
        clientTimeZone,
      });
    }
  }, [open, employeeId, unavailabilityReasonId, openYear, propCurrentAllocated, propCurrentUsed, form, clientTimeZone]);

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
          form.setError(field as keyof UpdateAllocationFormValues, {
            type: "server",
            message: errors[0],
          });
        }
      }
    }
  }, [state, form, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {openYear !== null 
              ? t("editingYear", { openYear })
              : t("description", { used: currentUsed })}
          </DialogDescription>
        </DialogHeader>

        {openYear === null && (
          <Alert variant="destructive">
            <AlertDescription>
              {t("openYearOnly", { openYear: "N/A" })}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="employeeId" value={employeeId} />
            <input type="hidden" name="unavailabilityReasonId" value={unavailabilityReasonId} />
            <input type="hidden" name="clientTimeZone" value={clientTimeZone} />
            {openYear !== null && (
              <input type="hidden" name="year" value={openYear} />
            )}
            <input
              type="hidden"
              name="adjustmentType"
              value={form.watch("adjustmentType") || "INCREASE"}
            />
            <input
              type="hidden"
              name="adjustmentDays"
              value={form.watch("adjustmentDays") || 1}
            />

            <FormField
              control={form.control}
              name="year"
              render={({ field }) => {
                const yearValue = openYear !== null ? openYear : (field.value || new Date().getFullYear());
                return (
                  <FormItem>
                    <FormLabel>{t("year")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={yearValue}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val)) {
                            field.onChange(val);
                          }
                        }}
                        readOnly
                        disabled
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <div className="flex gap-2 items-end">
              <FormField
                control={form.control}
                name="adjustmentType"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>{t("adjustmentType")}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectAdjustmentType")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="INCREASE">{t("increase")}</SelectItem>
                        <SelectItem value="DECREASE">{t("decrease")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="adjustmentDays"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>{t("adjustmentDays")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        min={1}
                        max={50}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isPending || openYear === null}>
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

