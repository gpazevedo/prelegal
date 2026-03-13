"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import DocPreview from "@/components/DocPreview";
import NdaPreview from "@/components/NdaPreview";
import { getSessionById, getTemplate, type SessionSummary } from "@/lib/api";
import { DocFields, DOC_NAMES, SLUG_TO_TEMPLATE, docTypeToRoute, getDefaultDocFields } from "@/lib/docUtils";
import { NdaFormValues, getDefaultFormValues } from "@/lib/templateUtils";

function PreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  const [session, setSession] = useState<SessionSummary | null>(null);
  const [template, setTemplate] = useState<string>("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      router.replace("/dashboard");
      return;
    }
    getSessionById(sessionId).then((s) => {
      if (!s) {
        setError("Document not found.");
        return;
      }
      setSession(s);
      const templateFile = s.doc_type === "mutual_nda"
        ? "Mutual-NDA.md"
        : SLUG_TO_TEMPLATE[s.doc_type];
      if (!templateFile) {
        setError("Unknown document type.");
        return;
      }
      getTemplate(`templates/${templateFile}`).then(setTemplate);
    });
  }, [sessionId, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!session || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--color-blue-primary)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  const isNda = session.doc_type === "mutual_nda";
  const editRoute = docTypeToRoute(session.doc_type);
  const docName = isNda ? "Mutual NDA" : (DOC_NAMES[session.doc_type] ?? session.doc_name);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--color-gray-text)" }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <h1 className="text-lg font-semibold" style={{ color: "var(--color-dark-navy)" }}>
            {docName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(editRoute)}
            className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 hover:border-gray-400 transition-colors"
            style={{ color: "var(--color-dark-navy)" }}
          >
            Edit
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-md"
            style={{ backgroundColor: "var(--color-blue-primary)" }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Disclaimer */}
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 print:hidden">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-yellow-800">
            <strong>Draft document.</strong> This document is AI-generated and should be reviewed by a qualified legal professional before use.
          </p>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-10">
          {isNda ? (
            <NdaPreview
              standardTerms={template}
              values={{ ...getDefaultFormValues(), ...(session.fields as Partial<NdaFormValues>) }}
            />
          ) : (
            <DocPreview
              docName={docName}
              template={template}
              fields={{ ...getDefaultDocFields(), ...(session.fields as Partial<DocFields>) }}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default function PreviewClient() {
  return (
    <AuthGuard>
      <Suspense>
        <PreviewContent />
      </Suspense>
    </AuthGuard>
  );
}
