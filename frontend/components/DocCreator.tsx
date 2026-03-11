"use client";

import { useCallback, useState } from "react";
import DocChat from "./DocChat";
import DocPreview from "./DocPreview";
import { DocFields, getDefaultDocFields } from "@/lib/docUtils";

interface DocCreatorProps {
  docSlug: string;
  docName: string;
  template: string;
}

export default function DocCreator({ docSlug, docName, template }: DocCreatorProps) {
  const [fields, setFields] = useState<DocFields>(getDefaultDocFields);

  const handleFieldsChange = useCallback((update: Partial<DocFields>) => {
    setFields((prev) => ({ ...prev, ...update }));
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--color-dark-navy)" }}>
            {docName}
          </h1>
          <p className="text-xs" style={{ color: "var(--color-gray-text)" }}>
            Prelegal — AI-assisted legal documents
          </p>
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
          <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-10">
            <DocPreview docName={docName} template={template} fields={fields} />
          </div>
        </main>
      </div>
    </div>
  );
}
