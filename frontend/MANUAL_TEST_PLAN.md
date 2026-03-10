# Manual Test Plan — Mutual NDA Creator

Run `npm run dev` in `frontend/` and open http://localhost:3000.

---

## 1. Initial Load

| # | Step | Expected |
|---|------|----------|
| 1.1 | Open the app | Header shows "Mutual NDA Creator", form panel on left, document preview on right |
| 1.2 | Check Purpose field | Pre-filled with "Evaluating whether to enter into a business relationship…" |
| 1.3 | Check Effective Date field | Pre-filled with today's date |
| 1.4 | Check MNDA Term | "Expires after" radio selected, year value = 1 |
| 1.5 | Check Term of Confidentiality | Year radio selected, year value = 1 |
| 1.6 | Check preview cover page | Shows today's date, default purpose, "1 year from Effective Date" for both terms |
| 1.7 | Check preview Standard Terms | Rendered markdown visible below a horizontal rule |

---

## 2. Live Preview — Agreement Details

| # | Step | Expected |
|---|------|----------|
| 2.1 | Clear and retype Purpose | Preview cover page Purpose row updates immediately |
| 2.2 | Change Effective Date | Preview shows newly selected date in "Month D, YYYY" format |
| 2.3 | Change Effective Date to empty | Preview shows "[Not provided]" for Effective Date |
| 2.4 | Leave Purpose blank | Preview shows "[Not provided]" for Purpose |
| 2.5 | Select "Continues until terminated" MNDA Term | Preview MNDA Term row shows perpetual text; year input becomes disabled |
| 2.6 | Re-select "Expires after" | Year input re-enables; preview reverts to year-based text |
| 2.7 | Change MNDA term years to 3 | Preview shows "3 years from Effective Date" |
| 2.8 | Try entering 0 or -1 for MNDA years | Value clamps to 1 (no "0 years" or "-1 years" in preview) |
| 2.9 | Select "In perpetuity" Confidentiality Term | Preview shows "In perpetuity" |
| 2.10 | Type "California" in Governing Law | Preview cover page and Standard Terms section 9 both show "California" |
| 2.11 | Type "courts in Los Angeles, CA" in Jurisdiction | Preview Standard Terms section 9 shows jurisdiction text |

---

## 3. Live Preview — Party Details

| # | Step | Expected |
|---|------|----------|
| 3.1 | Enter Company name for Party 1 (e.g. "Acme Corp") | Signature table column header shows "Acme Corp" |
| 3.2 | Enter Company name for Party 2 (e.g. "Widget Ltd") | Signature table second column shows "Widget Ltd" |
| 3.3 | Leave both companies blank | Signature table shows "PARTY 1" / "PARTY 2" as fallback headers |
| 3.4 | Enter Print Name for Party 1 (e.g. "Alice Johnson") | Signature row shows "/s/ Alice Johnson"; Print Name row shows "Alice Johnson" |
| 3.5 | Enter Title for both parties | Title row in signature table populates |
| 3.6 | Enter Notice Address (e.g. "alice@acme.com") | Notice Address row populates |
| 3.7 | Set Party 1 Date | Date row shows formatted date (e.g. "June 1, 2025") |

---

## 4. XSS / Input Safety

| # | Step | Expected |
|---|------|----------|
| 4.1 | Enter `<script>alert(1)</script>` in Purpose | Text appears literally as "&lt;script&gt;…" — no alert fires |
| 4.2 | Enter `<b>bold</b>` in Governing Law | Rendered as plain text, not as bold HTML |
| 4.3 | Enter `" onclick="alert(1)` in Jurisdiction | Rendered safely; no event fires |

---

## 5. PDF Download

| # | Step | Expected |
|---|------|----------|
| 5.1 | Click "Download PDF" | Button shows spinner and "Generating PDF…" text; button is disabled |
| 5.2 | After generation completes | Button returns to "Download PDF"; PDF file downloaded |
| 5.3 | Open the PDF | Document contains Cover Page and Standard Terms with filled values |
| 5.4 | Check Effective Date in PDF | Matches what was shown in preview |
| 5.5 | Check party names in PDF signature table | Match what was entered in the form |
| 5.6 | Check Standard Terms in PDF | `coverpage_link` spans replaced with bolded user values |

---

## 6. Edge Cases

| # | Step | Expected |
|---|------|----------|
| 6.1 | Fill all fields completely | Full document renders with no "[Not provided]" or "[FieldName]" placeholders |
| 6.2 | Leave all fields blank | Preview shows "[Not provided]" / placeholder fallbacks throughout |
| 6.3 | Resize browser window to narrow width | Form panel remains scrollable; preview doesn't overflow |
| 6.4 | Scroll the form | Header and Download button remain fixed at top |
| 6.5 | Scroll the preview | Form panel stays in place independently |

---

## 7. Accessibility

| # | Step | Expected |
|---|------|----------|
| 7.1 | Click "Purpose" label text | Focus moves to the textarea |
| 7.2 | Click "Governing Law (State)" label text | Focus moves to the input |
| 7.3 | Tab through all form fields | Focus order is logical top-to-bottom |
| 7.4 | Use keyboard to select radio buttons (arrow keys) | MNDA Term and Confidentiality Term radios respond to keyboard |
