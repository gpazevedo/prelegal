"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { DocFields, formatDate, substituteTemplate } from "@/lib/docUtils";

interface DocPreviewProps {
  docName: string;
  template: string;
  fields: DocFields;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td
        className="py-1.5 pr-4 text-xs font-medium whitespace-nowrap align-top"
        style={{ color: "var(--color-gray-text)", width: "40%" }}
      >
        {label}
      </td>
      <td className="py-1.5 text-xs align-top" style={{ color: "var(--color-dark-navy)" }}>
        {value || <span className="italic text-gray-400">—</span>}
      </td>
    </tr>
  );
}

function SignatureRow({ label, party1, party2 }: { label: string; party1: string; party2: string }) {
  return (
    <tr>
      <td
        className="py-1.5 pr-4 text-xs font-medium"
        style={{ color: "var(--color-gray-text)", width: "20%" }}
      >
        {label}
      </td>
      <td className="py-1.5 pr-4 text-xs border-b border-gray-300" style={{ width: "40%" }}>
        {party1}
      </td>
      <td className="py-1.5 text-xs border-b border-gray-300" style={{ width: "40%" }}>
        {party2}
      </td>
    </tr>
  );
}

export default function DocPreview({ docName, template, fields }: DocPreviewProps) {
  const body = substituteTemplate(template, fields);

  return (
    <div>
      {/* Cover Page */}
      <div className="mb-10 pb-8 border-b border-gray-200">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "var(--color-dark-navy)" }}
        >
          {docName}
        </h1>
        <p className="text-xs mb-6" style={{ color: "var(--color-gray-text)" }}>
          Prelegal — AI-assisted document generation
        </p>

        <table className="w-full mb-6">
          <tbody>
            {fields.effectiveDate && (
              <Field label="Effective Date" value={formatDate(fields.effectiveDate)} />
            )}
            {fields.productName && <Field label="Product / Service" value={fields.productName} />}
            {fields.purpose && <Field label="Purpose" value={fields.purpose} />}
            {fields.term && <Field label="Term" value={fields.term} />}
            {fields.fees && <Field label="Fees" value={fields.fees} />}
            {fields.governingLaw && <Field label="Governing Law" value={fields.governingLaw} />}
            {fields.jurisdiction && <Field label="Jurisdiction" value={fields.jurisdiction} />}
          </tbody>
        </table>

        <p className="text-xs mb-3 font-medium" style={{ color: "var(--color-dark-navy)" }}>
          By signing below, each party agrees to the terms of this agreement.
        </p>

        <table className="w-full">
          <thead>
            <tr>
              <th className="text-xs text-left py-1.5 pr-4" style={{ width: "20%" }}></th>
              <th
                className="text-xs text-left py-1.5 pr-4 font-semibold"
                style={{ color: "var(--color-dark-navy)", width: "40%" }}
              >
                {fields.providerCompany || "Provider"}
              </th>
              <th
                className="text-xs text-left py-1.5 font-semibold"
                style={{ color: "var(--color-dark-navy)", width: "40%" }}
              >
                {fields.customerCompany || "Customer / Partner"}
              </th>
            </tr>
          </thead>
          <tbody>
            <SignatureRow label="Signature" party1="" party2="" />
            <SignatureRow
              label="Print Name"
              party1={fields.providerName}
              party2={fields.customerName}
            />
            <SignatureRow
              label="Title"
              party1={fields.providerTitle}
              party2={fields.customerTitle}
            />
            <SignatureRow
              label="Address"
              party1={fields.providerAddress}
              party2={fields.customerAddress}
            />
            <SignatureRow
              label="Date"
              party1={fields.providerDate ? formatDate(fields.providerDate) : ""}
              party2={fields.customerDate ? formatDate(fields.customerDate) : ""}
            />
          </tbody>
        </table>
      </div>

      {/* Agreement Body */}
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {body}
        </ReactMarkdown>
      </div>
    </div>
  );
}
