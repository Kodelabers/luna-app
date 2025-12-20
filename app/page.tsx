"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to employee page by default
    // In real app, this would check auth and redirect based on role
    router.push("/employee");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4">
          <div className="h-12 w-12 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold mb-2">Luna App</h1>
        <p className="text-muted-foreground">Učitavanje...</p>
      </div>
    </div>
  );
}
