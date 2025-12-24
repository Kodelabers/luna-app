"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type AutoRedirectProps = {
  to: string;
};

export function AutoRedirect({ to }: AutoRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    // Small delay to ensure Clerk auth state is settled
    const timer = setTimeout(() => {
      router.push(to);
      router.refresh();
    }, 100);

    return () => clearTimeout(timer);
  }, [to, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Preusmjeravanje...</p>
      </div>
    </div>
  );
}

