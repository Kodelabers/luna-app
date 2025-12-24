"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { submitApplicationAction } from "@/lib/actions/application";
import { FormState } from "@/lib/errors";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";

type SubmitApplicationButtonProps = {
  organisationAlias: string;
  applicationId: number;
};

export function SubmitApplicationButton({
  organisationAlias,
  applicationId,
}: SubmitApplicationButtonProps) {
  const t = useTranslations("applications");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    submitApplicationAction.bind(null, organisationAlias),
    { success: false }
  );

  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
      router.push(`/${organisationAlias}/applications`);
      router.refresh();
    } else if (state.formError) {
      toast.error(state.formError);
    }
  }, [state, router, organisationAlias]);

  return (
    <form action={formAction}>
      <input type="hidden" name="applicationId" value={applicationId} />
      <input
        type="hidden"
        name="clientTimeZone"
        value={Intl.DateTimeFormat().resolvedOptions().timeZone}
      />
      <Button type="submit" disabled={isPending}>
        <Send className="mr-2 h-4 w-4" />
        {isPending ? tCommon("loading") : t("submitRequest")}
      </Button>
    </form>
  );
}

