import { useState } from "react";
import { parseInvoiceExcel } from "../lib/parseExcel";
import { importInvoices } from "../api/import";
import type { ParsedRow } from "../lib/parseExcel";
import type { ImportSummary } from "../api/import";
import "./Import.css";

type Step = "upload" | "preview" | "importing" | "done";

export default function Import() {
  const [step, setStep] = useState<Step>("upload");
  const [goodRows, setGoodRows] = useState<ParsedRow[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    const parsed = await parseInvoiceExcel(file);
    const good = parsed.filter((r) => r.flags.length === 0);
    const skipped = parsed.filter((r) => r.flags.length > 0);
    setGoodRows(good);
    setSkippedCount(skipped.length);
    setStep("preview");
  }

  async function handleConfirm() {
    setStep("importing");
    const result = await importInvoices(goodRows);
    setSummary(result);
    setStep("done");
  }

  // Step 1: drag-and-drop upload zone
  if (step === "upload") {
    return (
      <div
        className={`drop-zone ${dragOver ? "drag-over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <p>Drag Excel file here</p>
        <p>or</p>
        <label className="file-button">
          Browse
          <input
            type="file"
            accept=".xls,.xlsx"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      </div>
    );
  }

  // Step 2: preview
  if (step === "preview") {
    return (
      <div className="import-preview">
        <h2>{goodRows.length} rows to import</h2>

        {skippedCount > 0 && (
          <p className="skipped-note">
            {skippedCount} rows skipped due to missing data
          </p>
        )}

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {goodRows.map((row, i) => (
                <tr key={i}>
                  <td>{row.invoice_no}</td>
                  <td>{row.customer}</td>
                  <td>{row.contact_person}</td>
                  <td>{row.issue_date}</td>
                  <td>{row.total_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="confirm-button" onClick={handleConfirm}>
          Import {goodRows.length} invoices
        </button>
      </div>
    );
  }

  // Step 3: importing
  if (step === "importing") {
    return (
      <div className="import-status">
        <p>Importing...</p>
      </div>
    );
  }

  // Step 4: done
  return (
    <div className="import-status">
      <h2>Import complete</h2>
      <ul>
        <li>{summary?.companiesCreated} companies created</li>
        <li>{summary?.contactsCreated} contacts created</li>
        <li>{summary?.invoicesCreated} invoices imported</li>
        {skippedCount > 0 && <li>{skippedCount} rows skipped</li>}
      </ul>
      <button
        onClick={() => {
          setStep("upload");
          setGoodRows([]);
          setSkippedCount(0);
          setSummary(null);
        }}
      >
        Import another file
      </button>
    </div>
  );
}
