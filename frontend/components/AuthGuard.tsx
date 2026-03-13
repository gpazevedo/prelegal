"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, type User } from "@/lib/api";

interface AuthGuardProps {
  children: React.ReactNode;
  onUser?: (user: User) => void;
}

export default function AuthGuard({ children, onUser }: AuthGuardProps) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    getMe()
      .then((user) => {
        if (!user) {
          router.replace("/login");
        } else {
          onUser?.(user);
          setAuthenticated(true);
        }
      })
      .catch(() => router.replace("/login"));
  }, [router, onUser]);

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--color-blue-primary)", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "var(--color-gray-text)" }}>
            Loading…
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
