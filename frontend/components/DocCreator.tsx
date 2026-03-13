"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import DocChat from "./DocChat";
import DocPreview from "./DocPreview";
import { DocFields, getDefaultDocFields } from "@/lib/docUtils";

interface DocCreatorProps {
  docSlug: string;
  docName: string;
  template: string;
}

export default function DocCreator({ docSlug, docName, template }: DocCreatorProps) {
  const router = useRouter();
  const [fields, setFields] = useState<DocFields>(getDefaultDocFields);

  const handleFieldsChange = useCallback((update: Partial<DocFields>) => {
    setFields((prev) => ({ ...prev, ...update }));
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--color-gray-text)" }}
            aria-label="Back to dashboard"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <div>
            <h1 className="text-lg font-semibold" style={{ color: "var(--color-dark-navy)" }}>
              {docName}
            </h1>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          style={{ backgroundColor: "var(--color-blue-primary)" }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </button>
      </header>

      {/* Body: Chat + Preview */}
      <div className="flex flex-1 min-h-0">
        <aside className="w-96 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
          <DocChat docSlug={docSlug} docName={docName} onFieldsChange={handleFieldsChange} />
        </aside>

        <main className="flex-1 overflow-y-auto bg-gray-100 p-8">
          <div className="max-w-3xl mx-auto">
            {/* Disclaimer */}
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 print:hidden">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-yellow-800">
                <strong>Draft document.</strong> This document is AI-generated and should be reviewed by a qualified legal professional before use.
              </p>
            </div>
            <div className="bg-white shadow-sm rounded-lg p-10">
              <DocPreview docName={docName} template={template} fields={fields} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
