import { useState } from "react";
import { parseInvoiceExcel } from "../lib/parseExcel";
import { importInvoices } from "../api/import";
import type { ParsedRow } from "../lib/parseExcel";
import type { ImportSummary } from "../api/import";
import "./Import.css";

type Step = "upload" | "preview" | "importing" | "done";

export default function Import() {
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    const parsed = await parseInvoiceExcel(file);
    setRows(parsed);
    setStep("preview");
  }

  async function handleConfirm() {
    setStep("importing");
    const result = await importInvoices(rows);
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
    const drafts = rows.filter((r) => !r.issue_date).length;

    return (
      <div className="import-preview">
        <h2>{rows.length} rows to import</h2>
        {drafts > 0 && (
          <p className="draft-note">
            {drafts} rows without issue date will be saved as drafts
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
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={!row.issue_date ? "draft-row" : ""}>
                  <td>{row.invoice_no}</td>
                  <td>{row.customer}</td>
                  <td>{row.contact_person}</td>
                  <td>{row.issue_date ?? "—"}</td>
                  <td>{row.total_amount}</td>
                  <td>{row.issue_date ? (row.payment_received_date ? "Paid" : "Unpaid") : "Draft"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="confirm-button" onClick={handleConfirm}>
          Import {rows.length} invoices
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
        <li>{summary?.draftsCreated} drafts saved</li>
      </ul>
      <button
        onClick={() => {
          setStep("upload");
          setRows([]);
          setSummary(null);
        }}
      >
        Import another file
      </button>
    </div>
  );
}
