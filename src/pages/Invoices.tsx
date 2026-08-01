import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Invoices.css";
import type { Invoice } from "../api/types";

interface InvoiceRow {
  id: string;
  invoice_no: number;
  invoice_status: string;
  bill_to: string | null;
  attn: string | null;
  invoice_date: string;
  payment_status: string;
  line_items: { amount: number }[];
}

type StatusFilter = "all" | "unpaid" | "paid" | "overdue" | "draft";

export default function Invoices() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    async function load() {
      const { data } = await supabase
        .from("invoices")
        .select(
          "id, invoice_no, invoice_status, bill_to, attn, invoice_date, payment_status, line_items(amount)",
        )
        .order("invoice_no,", { ascending: false });

      if (!ignore) setInvoices(data ?? []);
    }
    load();

    return () => {
      ignore = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = invoices;

    // Status filter
    if (status === "draft") {
      list = list.filter((inv) => inv.invoice_status === "draft");
    } else if (status !== "all") {
      list = list.filter(
        (inv) =>
          inv.invoice_status === "issued" && inv.payment_status === status,
      );
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (inv) =>
          String(inv.invoice_no).includes(q) ||
          (inv.bill_to && inv.bill_to.toLowerCase().includes(q)) ||
          (inv.attn && inv.attn.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [invoices, status, search]);

  function total(inv: InvoiceRow) {
    return inv.line_items.reduce((sum, li) => sum + li.amount, 0);
  }

  function statusLabel(inv: InvoiceRow) {
    if (inv.invoice_status === "draft") return "draft";
    return inv.payment_status;
  }

  return (
    <div className="invoices-page">
      <div className="invoices-header">
        <h1>Invoices</h1>
        <button
          className="btn-primary"
          onClick={() => navigate("/invoice/new")}
        >
          + New Invoice
        </button>
      </div>

      <div className="invoices-filters">
        <input
          type="text"
          placeholder="Search by invoice #, bill to , or attn..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="status-select"
        >
          <option value="all">All statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Bill To</th>
            <th>Attn</th>
            <th>Date</th>
            <th className="col-right">Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((inv) => (
            <tr key={inv.id} onClick={() => navigate(`/invoice${inv.id}`)}>
              <td>{inv.invoice_no}</td>
              <td>{inv.bill_to}</td>
              <td>{inv.attn ?? "-"}</td>
              <td>{inv.invoice_date}</td>
              <td className="col-right">{total(inv).toFixed(2)}</td>
              <td>
                <span className={`badge ${statusLabel(inv)}`}>
                  {statusLabel(inv)}
                </span>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="empty">
                No invoices found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
