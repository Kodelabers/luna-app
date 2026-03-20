"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslations } from "next-intl";

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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { createUnavailabilityReasonSchema, type CreateUnavailabilityReasonInput } from "@/lib/validation/schemas";
import {
  createUnavailabilityReason,
  updateUnavailabilityReason,
} from "@/lib/actions/unavailability-reason";
import { initialFormState, type FormState } from "@/lib/errors";
import { Loader2, Plus, Pencil } from "lucide-react";

type UnavailabilityReasonFormValues = CreateUnavailabilityReasonInput;

type UnavailabilityReason = {
  id: string;
  name: string;
  colorCode: string | null;
  needApproval: boolean;
  needSecondApproval: boolean;
  hasPlanning: boolean;
  sickLeave: boolean;
};

type UnavailabilityReasonDialogProps = {
  organisationAlias: string;
  reason?: UnavailabilityReason;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function UnavailabilityReasonDialog({
  organisationAlias,
  reason,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: UnavailabilityReasonDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;
  const isEditing = !!reason;
  const t = useTranslations("unavailabilityReasons");
  const tCommon = useTranslations("common");
  const tVal = useTranslations("validation");

  // Refs for hidden inputs
  const needApprovalRef = useRef<HTMLInputElement>(null);
  const needSecondApprovalRef = useRef<HTMLInputElement>(null);
  const hasPlanningRef = useRef<HTMLInputElement>(null);
  const sickLeaveRef = useRef<HTMLInputElement>(null);

  const form = useForm<UnavailabilityReasonFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createUnavailabilityReasonSchema(tVal)) as any,
    defaultValues: {
      name: reason?.name || "",
      colorCode: reason?.colorCode || "#3b82f6",
      needApproval: reason?.needApproval ?? false,
      needSecondApproval: reason?.needSecondApproval ?? false,
      hasPlanning: reason?.hasPlanning ?? false,
      sickLeave: reason?.sickLeave ?? false,
    },
  });

  // Watch sickLeave value to control other checkboxes
  const sickLeaveValue = form.watch("sickLeave");

  // Create bound action with organisationAlias
  const boundCreateAction = createUnavailabilityReason.bind(
    null,
    organisationAlias
  );
  const boundUpdateAction = reason
    ? updateUnavailabilityReason.bind(null, organisationAlias, reason.id)
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
      const resetValues = {
        name: "",
        colorCode: "#3b82f6",
        needApproval: false,
        needSecondApproval: false,
        hasPlanning: false,
        sickLeave: false,
      };
      form.reset(resetValues);
      
      // Reset hidden inputs
      if (needApprovalRef.current) {
        needApprovalRef.current.value = "false";
      }
      if (needSecondApprovalRef.current) {
        needSecondApprovalRef.current.value = "false";
      }
      if (hasPlanningRef.current) {
        hasPlanningRef.current.value = "false";
      }
      if (sickLeaveRef.current) {
        sickLeaveRef.current.value = "false";
      }
    } else if (state.formError) {
      toast.error(state.formError);
    }

    // Set field errors from server
    if (state.fieldErrors) {
      for (const [field, errors] of Object.entries(state.fieldErrors)) {
        if (errors && errors.length > 0) {
          form.setError(field as keyof UnavailabilityReasonFormValues, {
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
      const resetValues = {
        name: reason?.name || "",
        colorCode: reason?.colorCode || "#3b82f6",
        needApproval: reason?.needApproval ?? false,
        needSecondApproval: reason?.needSecondApproval ?? false,
        hasPlanning: reason?.hasPlanning ?? false,
        sickLeave: reason?.sickLeave ?? false,
      };
      form.reset(resetValues);
      
      // Update hidden inputs
      if (needApprovalRef.current) {
        needApprovalRef.current.value = resetValues.needApproval ? "true" : "false";
      }
      if (needSecondApprovalRef.current) {
        needSecondApprovalRef.current.value = resetValues.needSecondApproval ? "true" : "false";
      }
      if (hasPlanningRef.current) {
        hasPlanningRef.current.value = resetValues.hasPlanning ? "true" : "false";
      }
      if (sickLeaveRef.current) {
        sickLeaveRef.current.value = resetValues.sickLeave ? "true" : "false";
      }
    }
  }, [open, reason, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              {t("newReason")}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editReason") : t("newReason")}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form 
            action={formAction} 
            className="space-y-4"
            onSubmit={(e) => {
              // Ensure hidden inputs are updated before submit
              const formData = new FormData(e.currentTarget);
              const needApproval = form.getValues("needApproval");
              const needSecondApproval = form.getValues("needSecondApproval");
              const hasPlanning = form.getValues("hasPlanning");
              const sickLeave = form.getValues("sickLeave");
              
              if (needApprovalRef.current) {
                needApprovalRef.current.value = needApproval ? "true" : "false";
              }
              if (needSecondApprovalRef.current) {
                needSecondApprovalRef.current.value = needSecondApproval ? "true" : "false";
              }
              if (hasPlanningRef.current) {
                hasPlanningRef.current.value = hasPlanning ? "true" : "false";
              }
              if (sickLeaveRef.current) {
                sickLeaveRef.current.value = sickLeave ? "true" : "false";
              }
            }}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("namePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="colorCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("color")}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        className="w-12 h-10 p-1 cursor-pointer"
                        {...field}
                      />
                      <Input
                        placeholder="#3b82f6"
                        value={field.value || ""}
                        onChange={field.onChange}
                        className="flex-1"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>{t("colorDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormField
                control={form.control}
                name="needApproval"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={sickLeaveValue ? false : field.value}
                        disabled={sickLeaveValue}
                        onCheckedChange={(checked) => {
                          if (!sickLeaveValue) {
                            field.onChange(checked);
                            if (needApprovalRef.current) {
                              needApprovalRef.current.value = checked ? "true" : "false";
                            }
                          }
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className={sickLeaveValue ? "text-muted-foreground" : ""}>
                        {t("needApproval")}
                      </FormLabel>
                      <FormDescription>
                        {t("needApprovalDescription")}
                      </FormDescription>
                    </div>
                    <input
                      ref={needApprovalRef}
                      type="hidden"
                      name="needApproval"
                      value={sickLeaveValue ? "false" : (field.value ? "true" : "false")}
                      key={`needApproval-${field.value}-${sickLeaveValue}`}
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="needSecondApproval"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={sickLeaveValue ? false : field.value}
                        disabled={sickLeaveValue}
                        onCheckedChange={(checked) => {
                          if (!sickLeaveValue) {
                            field.onChange(checked);
                            if (needSecondApprovalRef.current) {
                              needSecondApprovalRef.current.value = checked ? "true" : "false";
                            }
                          }
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className={sickLeaveValue ? "text-muted-foreground" : ""}>
                        {t("needSecondApproval")}
                      </FormLabel>
                      <FormDescription>
                        {t("needSecondApprovalDescription")}
                      </FormDescription>
                    </div>
                    <input
                      ref={needSecondApprovalRef}
                      type="hidden"
                      name="needSecondApproval"
                      value={sickLeaveValue ? "false" : (field.value ? "true" : "false")}
                      key={`needSecondApproval-${field.value}-${sickLeaveValue}`}
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasPlanning"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={sickLeaveValue ? false : field.value}
                        disabled={sickLeaveValue}
                        onCheckedChange={(checked) => {
                          if (!sickLeaveValue) {
                            field.onChange(checked);
                            if (hasPlanningRef.current) {
                              hasPlanningRef.current.value = checked ? "true" : "false";
                            }
                          }
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className={sickLeaveValue ? "text-muted-foreground" : ""}>
                        {t("hasPlanning")}
                      </FormLabel>
                      <FormDescription>
                        {t("hasPlanningDescription")}
                      </FormDescription>
                    </div>
                    <input
                      ref={hasPlanningRef}
                      type="hidden"
                      name="hasPlanning"
                      value={sickLeaveValue ? "false" : (field.value ? "true" : "false")}
                      key={`hasPlanning-${field.value}-${sickLeaveValue}`}
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sickLeave"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (sickLeaveRef.current) {
                            sickLeaveRef.current.value = checked ? "true" : "false";
                          }
                          // When sickLeave is checked, reset other fields to false
                          if (checked) {
                            form.setValue("needApproval", false);
                            form.setValue("needSecondApproval", false);
                            form.setValue("hasPlanning", false);
                            if (needApprovalRef.current) {
                              needApprovalRef.current.value = "false";
                            }
                            if (needSecondApprovalRef.current) {
                              needSecondApprovalRef.current.value = "false";
                            }
                            if (hasPlanningRef.current) {
                              hasPlanningRef.current.value = "false";
                            }
                          }
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-semibold">{t("sickLeave")}</FormLabel>
                      <FormDescription>
                        {t("sickLeaveDescription")}
                      </FormDescription>
                    </div>
                    <input
                      ref={sickLeaveRef}
                      type="hidden"
                      name="sickLeave"
                      value={field.value ? "true" : "false"}
                      key={`sickLeave-${field.value}`}
                    />
                  </FormItem>
                )}
              />
            </div>

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

// Convenient edit button trigger
export function UnavailabilityReasonEditButton({
  organisationAlias,
  reason,
}: {
  organisationAlias: string;
  reason: UnavailabilityReason;
}) {
  const tCommon = useTranslations("common");

  return (
    <UnavailabilityReasonDialog
      organisationAlias={organisationAlias}
      reason={reason}
      trigger={
        <Button variant="ghost" size="sm">
          <Pencil className="mr-1 h-3 w-3" />
          {tCommon("edit")}
        </Button>
      }
    />
  );
}

