"use client";

import { NdaFormValues } from "@/lib/templateUtils";

interface NdaFormProps {
  values: NdaFormValues;
  onChange: (values: NdaFormValues) => void;
}

function Field({
  label,
  fieldId,
  children,
}: {
  label: string;
  fieldId?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function NdaForm({ values, onChange }: NdaFormProps) {
  const set = <K extends keyof NdaFormValues>(key: K, value: NdaFormValues[K]) =>
    onChange({ ...values, [key]: value });

  return (
    <div className="space-y-6">
      {/* Agreement Details */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b">
          Agreement Details
        </h2>
        <div className="space-y-4">
          <Field label="Purpose" fieldId="field-purpose">
            <textarea
              id="field-purpose"
              className={`${inputClass} resize-none`}
              rows={3}
              value={values.purpose}
              onChange={(e) => set("purpose", e.target.value)}
              placeholder="How Confidential Information may be used"
            />
          </Field>

          <Field label="Effective Date" fieldId="field-effective-date">
            <input
              id="field-effective-date"
              type="date"
              className={inputClass}
              value={values.effectiveDate}
              onChange={(e) => set("effectiveDate", e.target.value)}
            />
          </Field>

          <Field label="MNDA Term">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mndaTermType"
                  aria-label="Expires after"
                  checked={values.mndaTermType === "expires"}
                  onChange={() => set("mndaTermType", "expires")}
                />
                <span className="text-sm">Expires after</span>
                <input
                  type="number"
                  min={1}
                  aria-label="MNDA term years"
                  className="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={values.mndaTermYears}
                  onChange={(e) => set("mndaTermYears", Math.max(1, Number(e.target.value) || 1))}
                  disabled={values.mndaTermType !== "expires"}
                />
                <span className="text-sm">year(s) from Effective Date</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mndaTermType"
                  aria-label="Continues until terminated"
                  checked={values.mndaTermType === "perpetual"}
                  onChange={() => set("mndaTermType", "perpetual")}
                />
                <span className="text-sm">Continues until terminated</span>
              </label>
            </div>
          </Field>

          <Field label="Term of Confidentiality">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="confidentialityTermType"
                  aria-label="Confidentiality term years"
                  checked={values.confidentialityTermType === "years"}
                  onChange={() => set("confidentialityTermType", "years")}
                />
                <input
                  type="number"
                  min={1}
                  aria-label="Confidentiality term year count"
                  className="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={values.confidentialityTermYears}
                  onChange={(e) =>
                    set("confidentialityTermYears", Math.max(1, Number(e.target.value) || 1))
                  }
                  disabled={values.confidentialityTermType !== "years"}
                />
                <span className="text-sm">
                  year(s) from Effective Date (trade secrets protected until no
                  longer a trade secret)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="confidentialityTermType"
                  aria-label="In perpetuity"
                  checked={values.confidentialityTermType === "perpetual"}
                  onChange={() => set("confidentialityTermType", "perpetual")}
                />
                <span className="text-sm">In perpetuity</span>
              </label>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Governing Law (State)" fieldId="field-governing-law">
              <input
                id="field-governing-law"
                type="text"
                className={inputClass}
                value={values.governingLaw}
                onChange={(e) => set("governingLaw", e.target.value)}
                placeholder="e.g. Delaware"
              />
            </Field>
            <Field label="Jurisdiction" fieldId="field-jurisdiction">
              <input
                id="field-jurisdiction"
                type="text"
                className={inputClass}
                value={values.jurisdiction}
                onChange={(e) => set("jurisdiction", e.target.value)}
                placeholder='e.g. "courts in New Castle, DE"'
              />
            </Field>
          </div>
        </div>
      </section>

      {/* Party 1 */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b">
          Party 1
        </h2>
        <div className="space-y-4">
          <Field label="Company" fieldId="field-party1-company">
            <input
              id="field-party1-company"
              type="text"
              className={inputClass}
              value={values.party1Company}
              onChange={(e) => set("party1Company", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Print Name" fieldId="field-party1-name">
              <input
                id="field-party1-name"
                type="text"
                className={inputClass}
                value={values.party1Name}
                onChange={(e) => set("party1Name", e.target.value)}
              />
            </Field>
            <Field label="Title" fieldId="field-party1-title">
              <input
                id="field-party1-title"
                type="text"
                className={inputClass}
                value={values.party1Title}
                onChange={(e) => set("party1Title", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Notice Address" fieldId="field-party1-address">
              <input
                id="field-party1-address"
                type="text"
                className={inputClass}
                value={values.party1Address}
                onChange={(e) => set("party1Address", e.target.value)}
                placeholder="Email or postal address"
              />
            </Field>
            <Field label="Date" fieldId="field-party1-date">
              <input
                id="field-party1-date"
                type="date"
                className={inputClass}
                value={values.party1Date}
                onChange={(e) => set("party1Date", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </section>

      {/* Party 2 */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b">
          Party 2
        </h2>
        <div className="space-y-4">
          <Field label="Company" fieldId="field-party2-company">
            <input
              id="field-party2-company"
              type="text"
              className={inputClass}
              value={values.party2Company}
              onChange={(e) => set("party2Company", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Print Name" fieldId="field-party2-name">
              <input
                id="field-party2-name"
                type="text"
                className={inputClass}
                value={values.party2Name}
                onChange={(e) => set("party2Name", e.target.value)}
              />
            </Field>
            <Field label="Title" fieldId="field-party2-title">
              <input
                id="field-party2-title"
                type="text"
                className={inputClass}
                value={values.party2Title}
                onChange={(e) => set("party2Title", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Notice Address" fieldId="field-party2-address">
              <input
                id="field-party2-address"
                type="text"
                className={inputClass}
                value={values.party2Address}
                onChange={(e) => set("party2Address", e.target.value)}
                placeholder="Email or postal address"
              />
            </Field>
            <Field label="Date" fieldId="field-party2-date">
              <input
                id="field-party2-date"
                type="date"
                className={inputClass}
                value={values.party2Date}
                onChange={(e) => set("party2Date", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </section>
    </div>
  );
}
