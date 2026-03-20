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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { inviteMember } from "@/lib/actions/member";
import { initialFormState } from "@/lib/errors";
import { Loader2, Plus } from "lucide-react";

// Client-side schema without coercion for proper TypeScript inference
function inviteMemberClientSchema(t: (key: string) => string) {
  return z.object({
    firstName: z.string().min(1, t("firstNameRequired")).max(100),
    lastName: z.string().min(1, t("lastNameRequired")).max(100),
    email: z.string().email(t("invalidEmail")),
    isAdmin: z.boolean(),
    createEmployee: z.boolean(),
    departmentId: z.string().optional(),
    title: z.string().max(100).optional(),
  });
}

type InviteMemberFormValues = z.infer<ReturnType<typeof inviteMemberClientSchema>>;

type Department = {
  id: string;
  name: string;
  colorCode: string | null;
};

type InviteMemberDialogProps = {
  organisationAlias: string;
  departments: Department[];
};

export function InviteMemberDialog({ organisationAlias, departments }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [createEmployee, setCreateEmployee] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [title, setTitle] = useState("");
  const t = useTranslations("members");
  const tCommon = useTranslations("common");
  const tVal = useTranslations("validation");

  const form = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberClientSchema(tVal)),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      isAdmin: false,
      createEmployee: false,
      departmentId: undefined,
      title: undefined,
    },
  });

  // Create bound action with organisationAlias
  const boundAction = inviteMember.bind(null, organisationAlias);

  const [state, formAction, isPending] = useActionState(
    boundAction,
    initialFormState
  );

  // Handle form state changes
  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      setOpen(false);
      form.reset();
      setCreateEmployee(false);
      setSelectedDepartmentId("");
      setTitle("");
    } else if (state.formError) {
      toast.error(state.formError);
    }

    // Set field errors from server
    if (state.fieldErrors) {
      for (const [field, errors] of Object.entries(state.fieldErrors)) {
        if (errors && errors.length > 0) {
          form.setError(field as keyof InviteMemberFormValues, {
            type: "server",
            message: errors[0],
          });
        }
      }
    }
  }, [state, form]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset();
      setCreateEmployee(false);
      setSelectedDepartmentId("");
      setTitle("");
    }
  }, [open, form]);

  const canSubmit = !createEmployee || (createEmployee && selectedDepartmentId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          {t("inviteMember")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{t("inviteMember")}</DialogTitle>
          <DialogDescription>
            {t("inviteDescription")}
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
              name="isAdmin"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>{t("makeAdmin")}</FormLabel>
                  </div>
                  <input type="hidden" name="isAdmin" value={field.value ? "true" : "false"} />
                </FormItem>
              )}
            />

            <div className="space-y-4 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createEmployee"
                  checked={createEmployee}
                  onCheckedChange={(checked) => setCreateEmployee(checked === true)}
                />
                <Label htmlFor="createEmployee" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {t("createEmployeeOnInvite")}
                </Label>
              </div>

              {createEmployee && (
                <div className="space-y-4 pl-6 border-l-2 border-muted">
                  <div className="space-y-2">
                    <Label>{t("selectDepartment")} *</Label>
                    <Select
                      name="departmentId"
                      value={selectedDepartmentId}
                      onValueChange={setSelectedDepartmentId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectDepartment")} />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
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
                  </div>

                  <div className="space-y-2">
                    <Label>{t("titleOptional")}</Label>
                    <Input
                      name="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t("titlePlaceholder")}
                    />
                  </div>
                </div>
              )}

              {/* Hidden inputs for form submission */}
              <input type="hidden" name="createEmployee" value={createEmployee ? "true" : "false"} />
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
              <Button type="submit" disabled={isPending || !canSubmit}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("inviteMember")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
