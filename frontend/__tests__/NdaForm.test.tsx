import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NdaForm from "@/components/NdaForm";
import { getDefaultFormValues, NdaFormValues } from "@/lib/templateUtils";

function renderForm(overrides: Partial<NdaFormValues> = {}, onChange = jest.fn()) {
  const values = { ...getDefaultFormValues(), ...overrides };
  render(<NdaForm values={values} onChange={onChange} />);
  return { onChange };
}

// ─── Rendering ───────────────────────────────────────────────────────────────

describe("NdaForm rendering", () => {
  it("renders all section headings", () => {
    renderForm();
    expect(screen.getByText("Agreement Details")).toBeInTheDocument();
    expect(screen.getByText("Party 1")).toBeInTheDocument();
    expect(screen.getByText("Party 2")).toBeInTheDocument();
  });

  it("renders Purpose textarea with default value", () => {
    renderForm();
    expect(screen.getByLabelText(/purpose/i)).toHaveValue(getDefaultFormValues().purpose);
  });

  it("renders Effective Date input with the right id", () => {
    renderForm();
    // Use ID directly to avoid ambiguity with Party 1/2 Date labels
    const input = document.getElementById("field-effective-date");
    expect(input).toBeInTheDocument();
  });

  it("renders MNDA Term radio buttons", () => {
    renderForm();
    expect(screen.getByRole("radio", { name: /expires after/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /continues until terminated/i })).toBeInTheDocument();
  });

  it("renders Term of Confidentiality radio buttons", () => {
    renderForm();
    expect(screen.getByRole("radio", { name: /in perpetuity/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /confidentiality term months/i })).toBeInTheDocument();
  });

  it("renders Governing Law input", () => {
    renderForm();
    expect(screen.getByLabelText(/governing law/i)).toBeInTheDocument();
  });

  it("renders Jurisdiction input", () => {
    renderForm();
    expect(screen.getByLabelText(/jurisdiction/i)).toBeInTheDocument();
  });

  it("renders Party 1 Company field", () => {
    renderForm();
    expect(document.getElementById("field-party1-company")).toBeInTheDocument();
  });

  it("renders Party 2 Company field", () => {
    renderForm();
    expect(document.getElementById("field-party2-company")).toBeInTheDocument();
  });

  it("renders Party 1 and Party 2 Print Name fields", () => {
    renderForm();
    expect(document.getElementById("field-party1-name")).toBeInTheDocument();
    expect(document.getElementById("field-party2-name")).toBeInTheDocument();
  });

  it("renders Party 1 and Party 2 Title fields", () => {
    renderForm();
    expect(document.getElementById("field-party1-title")).toBeInTheDocument();
    expect(document.getElementById("field-party2-title")).toBeInTheDocument();
  });

  it("renders Party 1 and Party 2 Notice Address fields", () => {
    renderForm();
    expect(document.getElementById("field-party1-address")).toBeInTheDocument();
    expect(document.getElementById("field-party2-address")).toBeInTheDocument();
  });

  it("pre-fills fields from values prop", () => {
    renderForm({ party1Company: "Acme Corp", governingLaw: "Delaware" });
    expect(screen.getByDisplayValue("Acme Corp")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Delaware")).toBeInTheDocument();
  });

  it("MNDA expires radio is checked by default", () => {
    renderForm();
    expect(screen.getByRole("radio", { name: /expires after/i })).toBeChecked();
  });

  it("MNDA perpetual radio is checked when value is perpetual", () => {
    renderForm({ mndaTermType: "perpetual" });
    expect(screen.getByRole("radio", { name: /continues until terminated/i })).toBeChecked();
  });
});

// ─── Interactions ────────────────────────────────────────────────────────────

describe("NdaForm interactions", () => {
  it("calls onChange when Purpose is typed into", async () => {
    const onChange = jest.fn();
    // Start with empty purpose so each keystroke creates a clean diff
    renderForm({ purpose: "" }, onChange);
    const textarea = screen.getByLabelText(/purpose/i);
    await userEvent.type(textarea, "X");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ purpose: "X" }));
  });

  it("calls onChange when Governing Law is typed into", async () => {
    const onChange = jest.fn();
    renderForm({ governingLaw: "" }, onChange);
    const input = screen.getByLabelText(/governing law/i);
    await userEvent.type(input, "Z");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ governingLaw: "Z" }));
  });

  it("calls onChange when Jurisdiction is typed into", async () => {
    const onChange = jest.fn();
    renderForm({ jurisdiction: "" }, onChange);
    const input = screen.getByLabelText(/jurisdiction/i);
    await userEvent.type(input, "Q");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ jurisdiction: "Q" }));
  });

  it("selecting perpetual MNDA Term radio calls onChange with correct type", async () => {
    const onChange = jest.fn();
    renderForm({}, onChange);
    await userEvent.click(screen.getByRole("radio", { name: /continues until terminated/i }));
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.mndaTermType).toBe("perpetual");
  });

  it("selecting expires MNDA Term radio calls onChange with correct type", async () => {
    const onChange = jest.fn();
    renderForm({ mndaTermType: "perpetual" }, onChange);
    await userEvent.click(screen.getByRole("radio", { name: /expires after/i }));
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.mndaTermType).toBe("expires");
  });

  it("selecting in perpetuity confidentiality term calls onChange with correct type", async () => {
    const onChange = jest.fn();
    renderForm({}, onChange);
    await userEvent.click(screen.getByRole("radio", { name: /in perpetuity/i }));
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.confidentialityTermType).toBe("perpetual");
  });

  it("MNDA months input is disabled when type is perpetual", () => {
    renderForm({ mndaTermType: "perpetual" });
    expect(screen.getByRole("spinbutton", { name: /mnda term months/i })).toBeDisabled();
  });

  it("Confidentiality months input is disabled when type is perpetual", () => {
    renderForm({ confidentialityTermType: "perpetual" });
    expect(screen.getByRole("spinbutton", { name: /confidentiality term month count/i })).toBeDisabled();
  });

  it("MNDA months input is enabled when type is expires", () => {
    renderForm({ mndaTermType: "expires" });
    expect(screen.getByRole("spinbutton", { name: /mnda term months/i })).not.toBeDisabled();
  });

  it("calls onChange with updated party1Company", async () => {
    const onChange = jest.fn();
    renderForm({ party1Company: "" }, onChange);
    const input = document.getElementById("field-party1-company")!;
    await userEvent.type(input, "A");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ party1Company: "A" }));
  });

  it("calls onChange with updated party2Company", async () => {
    const onChange = jest.fn();
    renderForm({ party2Company: "" }, onChange);
    const input = document.getElementById("field-party2-company")!;
    await userEvent.type(input, "B");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ party2Company: "B" }));
  });

  it("does not mutate other fields when one field changes", async () => {
    const onChange = jest.fn();
    renderForm({ party2Name: "Jane Smith", governingLaw: "" }, onChange);
    const input = screen.getByLabelText(/governing law/i);
    await userEvent.type(input, "X");
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.party2Name).toBe("Jane Smith");
  });
});
