import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Dashboard.css";

interface DashboardInvoice {
  id: string;
  invoice_no: number;
  invoice_status: string;
  bill_to: string | null;
  invoice_date: string;
  payment_status: string;
  line_items: { amount: number }[];
}

export default function Dashboard() {
  const [invoices, setInvoices] = useState<DashboardInvoice[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    async function load() {
      const { data } = await supabase
      .from("invoices")
      .select("id, invoice_no, invoice_status, bill_to, invoice_date, payment_status, line_items(amount)")
      .order("invoice_date", { ascending: false });

      if (!ignore) setInvoices(data ?? []);
    }
    load();

    return () => { ignore = true; };
  }, []);

  const issued = invoices.filter((inv) => inv.invoice_status === "issued");
  const unpaid = issued.filter((inv) => inv.payment_status === "unpaid").length;
  const overdue = issued.filter((inv) => inv.payment_status === "overdue").length;
  const drafts = invoices.filter((inv) => inv.invoice_status === "draft").length;
  const recent = invoices.slice(0, 10);

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="cards">
        <div className="card">
          <div className="count">{issued.length}</div>
          <div className="label">Issued</div>
        </div>
        <div className="card">
          <div className="count">{unpaid}</div>
          <div className="label">Unpaid</div>
        </div>
        <div className="card">
          <div className="count">{overdue}</div>
          <div className="label">Overdue</div>
        </div>
        <div className="card">
          <div className="count">{drafts}</div>
          <div className="label">Drafts</div>
        </div>
      </div>

      <h2>Recent Invoices</h2>
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Bill To</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((inv) => (
            <tr key={inv.id} onClick={() => navigate(`/invoice/${inv.id}`)}>
              <td>{inv.invoice_no}</td>
              <td>{inv.bill_to ?? "-"}</td>
              <td>{inv.invoice_date}</td>
              <td>
                {inv.line_items
                .reduce((sum, li) => sum + li.amount, 0)
                .toFixed(2)}
              </td>
              <td>
                <span className={`badge ${inv.payment_status}`}>
                  {inv.payment_status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}