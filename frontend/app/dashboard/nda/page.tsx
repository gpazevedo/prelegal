"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import NdaCreator from "@/components/NdaCreator";
import { getTemplate } from "@/lib/api";

function NdaContent() {
  const [standardTerms, setStandardTerms] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getTemplate("templates/Mutual-NDA.md")
      .then(setStandardTerms)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm" style={{ color: "var(--color-gray-text)" }}>
          Failed to load template.{" "}
          <Link href="/dashboard" className="underline" style={{ color: "var(--color-blue-primary)" }}>
            Go back
          </Link>
        </p>
      </div>
    );
  }

  if (!standardTerms) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm" style={{ color: "var(--color-gray-text)" }}>
          Loading…
        </p>
      </div>
    );
  }

  return <NdaCreator standardTerms={standardTerms} />;
}

export default function NdaPage() {
  return (
    <AuthGuard>
      <NdaContent />
    </AuthGuard>
  );
}
