"use client";

import { useState } from "react";
import NdaForm from "./NdaForm";
import NdaPreview from "./NdaPreview";
import { NdaFormValues, getDefaultFormValues } from "@/lib/templateUtils";

interface NdaCreatorProps {
  standardTerms: string;
}

export default function NdaCreator({ standardTerms }: NdaCreatorProps) {
  const [values, setValues] = useState<NdaFormValues>(getDefaultFormValues);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    const element = document.getElementById("nda-document");
    if (!element) {
      setDownloadError("Could not find the document to export. Please try again.");
      return;
    }

    setDownloading(true);
    setDownloadError(null);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: [15, 15, 15, 15],
          filename: "Mutual-NDA.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(element)
        .save();
    } catch {
      setDownloadError("PDF generation failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Mutual NDA Creator</h1>
          <p className="text-xs text-gray-500">Prelegal — powered by Common Paper</p>
        </div>
        <div className="flex items-center gap-3">
          {downloadError && (
            <p className="text-sm text-red-600">{downloadError}</p>
          )}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            {downloading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating PDF…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </>
            )}
          </button>
        </div>
      </header>

      {/* Body: Form + Preview */}
      <div className="flex flex-1 min-h-0">
        {/* Form Panel */}
        <aside className="w-96 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto p-6">
          <NdaForm values={values} onChange={setValues} />
        </aside>

        {/* Preview Panel */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-8">
          <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-10">
            <NdaPreview standardTerms={standardTerms} values={values} />
          </div>
        </main>
      </div>
    </div>
  );
}
