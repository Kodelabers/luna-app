"use client";

import { useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createHolidaySchema, type CreateHolidayInput } from "@/lib/validation/schemas";
import { createHoliday, updateHoliday } from "@/lib/actions/holiday";
import { initialFormState } from "@/lib/errors";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type HolidayFormValues = CreateHolidayInput;

type Holiday = {
  id: string;
  name: string;
  date: Date;
  repeatYearly: boolean;
};

type HolidayDialogProps = {
  organisationAlias: string;
  holiday?: Holiday;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function HolidayDialog({
  organisationAlias,
  holiday,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: HolidayDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const locale = useLocale();
  const dateLocale = locale === "hr" ? hr : enUS;

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;
  const isEditing = !!holiday;
  const t = useTranslations("holidays");
  const tCommon = useTranslations("common");
  const tVal = useTranslations("validation");

  const form = useForm<HolidayFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createHolidaySchema(tVal)) as any,
    defaultValues: {
      name: holiday?.name || "",
      date: holiday?.date || new Date(),
      repeatYearly: holiday?.repeatYearly || false,
    },
  });

  // Create bound action with organisationAlias
  const boundCreateAction = createHoliday.bind(null, organisationAlias);
  const boundUpdateAction = holiday
    ? updateHoliday.bind(null, organisationAlias, holiday.id)
    : boundCreateAction;

  const [state, formAction, isPending] = useActionState(
    isEditing ? boundUpdateAction : boundCreateAction,
    initialFormState
  );

  // Handle form state changes
  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      setOpen(false);
      form.reset();
    } else if (state.formError) {
      toast.error(state.formError);
    }

    // Set field errors from server
    if (state.fieldErrors) {
      for (const [field, errors] of Object.entries(state.fieldErrors)) {
        if (errors && errors.length > 0) {
          form.setError(field as keyof HolidayFormValues, {
            type: "server",
            message: errors[0],
          });
        }
      }
    }
  }, [state, form]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        name: holiday?.name || "",
        date: holiday?.date || new Date(),
        repeatYearly: holiday?.repeatYearly || false,
      });
    }
  }, [open, holiday, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              {t("newHoliday")}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editHoliday") : t("newHoliday")}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form action={formAction} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("namePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t("date")}</FormLabel>
                  <input
                    type="hidden"
                    name="date"
                    value={field.value ? field.value.toISOString() : ""}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: dateLocale })
                          ) : (
                            <span>{t("datePlaceholder")}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        locale={dateLocale}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="repeatYearly"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <input
                    type="hidden"
                    name="repeatYearly"
                    value={field.value ? "true" : "false"}
                  />
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>{t("repeatYearly")}</FormLabel>
                    <FormDescription>
                      {t("repeatYearlyDescription")}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? tCommon("save") : tCommon("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

