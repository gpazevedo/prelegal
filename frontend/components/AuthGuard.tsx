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

  if (!authenticated) return null;
  return <>{children}</>;
}
