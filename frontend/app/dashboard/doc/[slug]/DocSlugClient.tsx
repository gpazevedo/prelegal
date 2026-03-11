"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import DocCreator from "@/components/DocCreator";
import { getTemplate } from "@/lib/api";
import { DOC_NAMES, SLUG_TO_TEMPLATE } from "@/lib/docUtils";

interface Props {
  slug: string;
}

function DocContent({ slug }: Props) {
  const [template, setTemplate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const docName = DOC_NAMES[slug] ?? slug;
  const templateFile = SLUG_TO_TEMPLATE[slug];

  useEffect(() => {
    if (!templateFile) {
      setError("Unknown document type.");
      return;
    }
    getTemplate(`templates/${templateFile}`)
      .then(setTemplate)
      .catch(() => setError("Failed to load document template."));
  }, [templateFile]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  return <DocCreator docSlug={slug} docName={docName} template={template} />;
}

export default function DocSlugClient({ slug }: Props) {
  return (
    <AuthGuard>
      <DocContent slug={slug} />
    </AuthGuard>
  );
}
