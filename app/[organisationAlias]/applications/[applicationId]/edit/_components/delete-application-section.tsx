"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { DeleteApplicationDialog } from "../../../_components/delete-application-dialog";
import { useRouter } from "next/navigation";

type DeleteApplicationSectionProps = {
  applicationId: string;
  organisationAlias: string;
};

export function DeleteApplicationSection({
  applicationId,
  organisationAlias,
}: DeleteApplicationSectionProps) {
  const t = useTranslations("applications");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const router = useRouter();

  const handleDeleteSuccess = () => {
    setDeleteDialogOpen(false);
    router.push(`/${organisationAlias}/applications`);
  };

  return (
    <>
      <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-medium text-destructive">{t("dangerZone")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("deleteWarning")}
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("deleteApplication")}
          </Button>
        </div>
      </div>

      <DeleteApplicationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        applicationId={applicationId}
        organisationAlias={organisationAlias}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
}

