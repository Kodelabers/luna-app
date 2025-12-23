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
import { createEmployeeSchema } from "@/lib/validation/schemas";
import { createEmployee, updateEmployee } from "@/lib/actions/employee";
import { initialFormState, type FormState } from "@/lib/errors";
import { Loader2, Plus } from "lucide-react";
import { UserLookup } from "./user-lookup";

type EmployeeFormValues = z.infer<typeof createEmployeeSchema>;

type Department = {
  id: number;
  name: string;
  colorCode: string | null;
};

type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  title: string | null;
  departmentId: number;
  userId: number | null;
};

type EmployeeDialogProps = {
  organisationAlias: string;
  departments: Department[];
  employee?: Employee;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function EmployeeDialog({
  organisationAlias,
  departments,
  employee,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: EmployeeDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(
    employee?.userId || null
  );

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;
  const isEditing = !!employee;
  const t = useTranslations("employees");
  const tCommon = useTranslations("common");

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      firstName: employee?.firstName || "",
      lastName: employee?.lastName || "",
      email: employee?.email || "",
      title: employee?.title || "",
      departmentId: employee?.departmentId || 0,
    },
  });

  // Create bound action with organisationAlias
  const boundCreateAction = createEmployee.bind(null, organisationAlias);
  const boundUpdateAction = employee
    ? updateEmployee.bind(null, organisationAlias, employee.id)
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
      setSelectedUserId(null);
    } else if (state.formError) {
      toast.error(state.formError);
    }

    // Set field errors from server
    if (state.fieldErrors) {
      for (const [field, errors] of Object.entries(state.fieldErrors)) {
        if (errors && errors.length > 0) {
          form.setError(field as keyof EmployeeFormValues, {
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
        firstName: employee?.firstName || "",
        lastName: employee?.lastName || "",
        email: employee?.email || "",
        title: employee?.title || "",
        departmentId: employee?.departmentId || 0,
      });
      setSelectedUserId(employee?.userId || null);
    }
  }, [open, employee, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              {t("newEmployee")}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editEmployee") : t("newEmployee")}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("firstName")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("firstNamePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("lastName")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("lastNamePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("titleLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("titlePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("department")}</FormLabel>
                  <Select
                    name="departmentId"
                    value={field.value?.toString() || ""}
                    onValueChange={(value) => field.onChange(parseInt(value, 10))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectDepartment")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          <div className="flex items-center gap-2">
                            {dept.colorCode && (
                              <div
                                className="h-3 w-3 rounded-xs shrink-0"
                                style={{ backgroundColor: dept.colorCode }}
                              />
                            )}
                            <span>{dept.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("linkedUser")}</label>
              <UserLookup
                organisationAlias={organisationAlias}
                value={selectedUserId}
                onChange={setSelectedUserId}
                disabled={isPending}
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

