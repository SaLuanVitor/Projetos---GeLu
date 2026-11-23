"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getValidSession } from "@/services/auth";

export default function BackofficeHomePage() {
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const session = await getValidSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      try {
        const user = await getCurrentUser(session.accessToken);
        if (user.isSuperAdmin) {
          router.replace("/dashboard");
        } else {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      }
    }
    check();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface text-stone-500">
      <div className="flex items-center gap-3">
        <span className="text-2xl animate-spin">⚙️</span>
        <span className="text-sm font-semibold">Carregando Backoffice...</span>
      </div>
    </div>
  );
}
