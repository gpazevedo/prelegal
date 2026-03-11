"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  NdaFormValues,
  getMndaTermText,
  getConfidentialityTermText,
  substituteStandardTerms,
  formatDate,
} from "@/lib/templateUtils";

interface NdaPreviewProps {
  standardTerms: string;
  values: NdaFormValues;
}


function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr className="border-b border-gray-200">
      <td className="py-2 pr-6 font-semibold text-sm w-52 align-top">{label}</td>
      <td className="py-2 text-sm leading-relaxed">{children}</td>
    </tr>
  );
}

function Placeholder() {
  return <span className="text-gray-400 italic">[Not provided]</span>;
}

function SignatureTable({ values }: { values: NdaFormValues }) {
  return (
    <table className="w-full border border-gray-300 text-sm mt-4">
      <thead>
        <tr className="bg-gray-50">
          <th className="border border-gray-300 px-3 py-2 text-left w-36"></th>
          <th className="border border-gray-300 px-3 py-2 text-center">
            {values.party1Company || "PARTY 1"}
          </th>
          <th className="border border-gray-300 px-3 py-2 text-center">
            {values.party2Company || "PARTY 2"}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-gray-300 px-3 py-4 font-medium bg-gray-50">Signature</td>
          <td className="border border-gray-300 px-3 py-4 italic text-gray-500">
            {values.party1Name ? `/s/ ${values.party1Name}` : ""}
          </td>
          <td className="border border-gray-300 px-3 py-4 italic text-gray-500">
            {values.party2Name ? `/s/ ${values.party2Name}` : ""}
          </td>
        </tr>
        <tr>
          <td className="border border-gray-300 px-3 py-3 font-medium bg-gray-50">Print Name</td>
          <td className="border border-gray-300 px-3 py-3">{values.party1Name}</td>
          <td className="border border-gray-300 px-3 py-3">{values.party2Name}</td>
        </tr>
        <tr>
          <td className="border border-gray-300 px-3 py-3 font-medium bg-gray-50">Title</td>
          <td className="border border-gray-300 px-3 py-3">{values.party1Title}</td>
          <td className="border border-gray-300 px-3 py-3">{values.party2Title}</td>
        </tr>
        <tr>
          <td className="border border-gray-300 px-3 py-3 font-medium bg-gray-50">Company</td>
          <td className="border border-gray-300 px-3 py-3">{values.party1Company}</td>
          <td className="border border-gray-300 px-3 py-3">{values.party2Company}</td>
        </tr>
        <tr>
          <td className="border border-gray-300 px-3 py-3 font-medium bg-gray-50">Notice Address</td>
          <td className="border border-gray-300 px-3 py-3">{values.party1Address}</td>
          <td className="border border-gray-300 px-3 py-3">{values.party2Address}</td>
        </tr>
        <tr>
          <td className="border border-gray-300 px-3 py-3 font-medium bg-gray-50">Date</td>
          <td className="border border-gray-300 px-3 py-3">
            {formatDate(values.party1Date)}
          </td>
          <td className="border border-gray-300 px-3 py-3">
            {formatDate(values.party2Date)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default function NdaPreview({ standardTerms, values }: NdaPreviewProps) {
  const substituted = substituteStandardTerms(standardTerms, values);

  return (
    <div id="nda-document" className="font-serif text-gray-900">
      {/* ── Cover Page ── */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-center mb-1">
          Mutual Non-Disclosure Agreement
        </h1>
        <p className="text-center text-sm text-gray-500 mb-6">
          Common Paper Mutual NDA Standard Terms Version 1.0
        </p>

        <p className="text-sm mb-6 leading-relaxed">
          This Mutual Non-Disclosure Agreement (the &ldquo;MNDA&rdquo;) consists of: (1) this
          Cover Page and (2) the Common Paper Mutual NDA Standard Terms Version
          1.0 identical to those posted at{" "}
          <a
            href="https://commonpaper.com/standards/mutual-nda/1.0"
            className="text-blue-600 underline"
            target="_blank"
            rel="noreferrer"
          >
            commonpaper.com/standards/mutual-nda/1.0
          </a>
          .
        </p>

        <table className="w-full text-sm mb-6">
          <tbody>
            <Row label="Purpose">
              {values.purpose || <Placeholder />}
            </Row>
            <Row label="Effective Date">
              {values.effectiveDate ? formatDate(values.effectiveDate) : <Placeholder />}
            </Row>
            <Row label="MNDA Term">
              {values.mndaTermType === "expires" ? (
                <>
                  Expires <strong>{getMndaTermText(values)}</strong>.
                </>
              ) : (
                "Continues until terminated in accordance with the terms of the MNDA."
              )}
            </Row>
            <Row label="Term of Confidentiality">
              {values.confidentialityTermType === "months" ? (
                <>
                  <strong>{getConfidentialityTermText(values)}</strong>, but in
                  the case of trade secrets until Confidential Information is no
                  longer considered a trade secret under applicable laws.
                </>
              ) : (
                "In perpetuity."
              )}
            </Row>
            <Row label="Governing Law">
              {values.governingLaw || <Placeholder />}
            </Row>
            <Row label="Jurisdiction">
              {values.jurisdiction || <Placeholder />}
            </Row>
          </tbody>
        </table>

        <p className="text-sm mb-4">
          By signing this Cover Page, each party agrees to enter into this MNDA
          as of the Effective Date.
        </p>

        <SignatureTable values={values} />

        <p className="text-xs text-gray-500 mt-4 text-center">
          Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use
          under{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 4.0
          </a>
          .
        </p>
      </div>

      {/* ── Standard Terms ── */}
      <hr className="border-gray-400 mb-8" />

      <div className="prose prose-sm max-w-none [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-3 [&_strong]:font-semibold">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {substituted}
        </ReactMarkdown>
      </div>
    </div>
  );
}
