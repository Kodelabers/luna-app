"use client";

import { useActionState, useEffect, useState } from "react";
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
import { createDepartmentSchema } from "@/lib/validation/schemas";
import { createDepartment, updateDepartment } from "@/lib/actions/department";
import { initialFormState, type FormState } from "@/lib/errors";
import { Loader2, Plus, Pencil } from "lucide-react";

type DepartmentFormValues = z.infer<typeof createDepartmentSchema>;

type Department = {
  id: number;
  name: string;
  alias: string;
  description: string | null;
  colorCode: string | null;
};

type DepartmentDialogProps = {
  organisationAlias: string;
  department?: Department;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function DepartmentDialog({
  organisationAlias,
  department,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: DepartmentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;
  const isEditing = !!department;
  const t = useTranslations("departments");
  const tCommon = useTranslations("common");

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(createDepartmentSchema),
    defaultValues: {
      name: department?.name || "",
      alias: department?.alias || "",
      description: department?.description || "",
      colorCode: department?.colorCode || "#3b82f6",
    },
  });

  // Create bound action with organisationAlias
  const boundCreateAction = createDepartment.bind(null, organisationAlias);
  const boundUpdateAction = department
    ? updateDepartment.bind(null, organisationAlias, department.id)
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
          form.setError(field as keyof DepartmentFormValues, {
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
        name: department?.name || "",
        alias: department?.alias || "",
        description: department?.description || "",
        colorCode: department?.colorCode || "#3b82f6",
      });
    }
  }, [open, department, form]);

  // Auto-generate alias from name
  const handleNameChange = (name: string, onChange: (value: string) => void) => {
    // Get current values BEFORE updating the name field
    const currentAlias = form.getValues("alias");
    const previousName = form.getValues("name");
    const previousAutoAlias = previousName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Update the name field
    onChange(name);

    // Only auto-generate alias if it's empty or matches previous auto-generated value
    if (!currentAlias || currentAlias === previousAutoAlias) {
      const newAlias = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      form.setValue("alias", newAlias);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              {t("newDepartment")}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editDepartment") : t("newDepartment")}
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
                    <Input
                      placeholder={t("namePlaceholder")}
                      {...field}
                      onChange={(e) =>
                        handleNameChange(e.target.value, field.onChange)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="alias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("alias")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("aliasPlaceholder")} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t("aliasDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("descriptionLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("descriptionPlaceholder")}
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
                  <FormDescription>
                    {t("colorDescription")}
                  </FormDescription>
                  <FormMessage />
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

// Convenient edit button trigger
export function DepartmentEditButton({
  organisationAlias,
  department,
}: {
  organisationAlias: string;
  department: Department;
}) {
  const tCommon = useTranslations("common");
  
  return (
    <DepartmentDialog
      organisationAlias={organisationAlias}
      department={department}
      trigger={
        <Button variant="ghost" size="sm">
          <Pencil className="mr-1 h-3 w-3" />
          {tCommon("edit")}
        </Button>
      }
    />
  );
}

