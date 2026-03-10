"use client";

import { NdaFormValues } from "@/lib/templateUtils";

interface NdaFormProps {
  values: NdaFormValues;
  onChange: (values: NdaFormValues) => void;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <Field label="Purpose">
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              value={values.purpose}
              onChange={(e) => set("purpose", e.target.value)}
              placeholder="How Confidential Information may be used"
            />
          </Field>

          <Field label="Effective Date">
            <input
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
                  checked={values.mndaTermType === "expires"}
                  onChange={() => set("mndaTermType", "expires")}
                />
                <span className="text-sm">Expires after</span>
                <input
                  type="number"
                  min={1}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                  value={values.mndaTermYears}
                  onChange={(e) => set("mndaTermYears", Number(e.target.value))}
                  disabled={values.mndaTermType !== "expires"}
                />
                <span className="text-sm">year(s) from Effective Date</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mndaTermType"
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
                  checked={values.confidentialityTermType === "years"}
                  onChange={() => set("confidentialityTermType", "years")}
                />
                <input
                  type="number"
                  min={1}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                  value={values.confidentialityTermYears}
                  onChange={(e) =>
                    set("confidentialityTermYears", Number(e.target.value))
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
                  checked={values.confidentialityTermType === "perpetual"}
                  onChange={() => set("confidentialityTermType", "perpetual")}
                />
                <span className="text-sm">In perpetuity</span>
              </label>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Governing Law (State)">
              <input
                type="text"
                className={inputClass}
                value={values.governingLaw}
                onChange={(e) => set("governingLaw", e.target.value)}
                placeholder="e.g. Delaware"
              />
            </Field>
            <Field label="Jurisdiction">
              <input
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
          <Field label="Company">
            <input
              type="text"
              className={inputClass}
              value={values.party1Company}
              onChange={(e) => set("party1Company", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Print Name">
              <input
                type="text"
                className={inputClass}
                value={values.party1Name}
                onChange={(e) => set("party1Name", e.target.value)}
              />
            </Field>
            <Field label="Title">
              <input
                type="text"
                className={inputClass}
                value={values.party1Title}
                onChange={(e) => set("party1Title", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Notice Address">
              <input
                type="text"
                className={inputClass}
                value={values.party1Address}
                onChange={(e) => set("party1Address", e.target.value)}
                placeholder="Email or postal address"
              />
            </Field>
            <Field label="Date">
              <input
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
          <Field label="Company">
            <input
              type="text"
              className={inputClass}
              value={values.party2Company}
              onChange={(e) => set("party2Company", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Print Name">
              <input
                type="text"
                className={inputClass}
                value={values.party2Name}
                onChange={(e) => set("party2Name", e.target.value)}
              />
            </Field>
            <Field label="Title">
              <input
                type="text"
                className={inputClass}
                value={values.party2Title}
                onChange={(e) => set("party2Title", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Notice Address">
              <input
                type="text"
                className={inputClass}
                value={values.party2Address}
                onChange={(e) => set("party2Address", e.target.value)}
                placeholder="Email or postal address"
              />
            </Field>
            <Field label="Date">
              <input
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
