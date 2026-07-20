import { supabase } from "../lib/supabase";
import type { ParsedRow } from "../lib/parseExcel";

export interface ImportSummary {
  companiesCreated: number;
  contactsCreated: number;
  invoicesCreated: number;
  flaggedRows: ParsedRow[];
}

export async function importInvoices(
  rows: ParsedRow[],
): Promise<ImportSummary> {
  const good = rows.filter((r) => r.flags.length === 0);
  const flagged = rows.filter((r) => r.flags.length > 0);

  const companyNames = new Set<string>();
  for (const row of good) {
    if (row.customer) companyNames.add(row.customer);
  }

  const companyIds = new Map<string, string>();
  for (const name of companyNames) {
    const { data, error } = await supabase
      .from("companies")
      .upsert({ name }, { onConflict: "name" })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    companyIds.set(name, data.id);
  }

  const contactKeys = new Set<string>();
  for (const row of good) {
    if (row.contact_person) {
      contactKeys.add(`${row.contact_person}|${row.customer}`);
    }
  }

  const contactIds = new Map<string, string>();
  for (const key of contactKeys) {
    const [name, companyName] = key.split("|");
    const companyId = companyIds.get(companyName) ?? null;

    const { data, error } = await supabase
      .from("contacts")
      .insert({ name, company_id: companyId })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    contactIds.set(key, data.id);
  }

  for (const row of good) {
    const contactKey = `${row.contact_person}|${row.customer}`;
    const contactId = contactIds.get(contactKey) ?? null;

    const { error } = await supabase.from("invoices").insert({
      invoice_no: row.invoice_no,
      our_ref_no: row.our_ref_no ?? 0,
      contact_id: contactId,
      invoice_date: row.issue_date ?? "1980-01-01",
      paid_date: row.payment_received_date ?? null,
      payment_status: row.payment_received_date ? "paid" : "unpaid",
      remark: row.remarks ?? null,
    });

    if (error) throw new Error(error.message);
  }

  const maxInvoiceNo = Math.max(...good.map((r) => r.invoice_no ?? 0));
  const maxRefNo = Math.max(...good.map((r) => r.our_ref_no ?? 0));

  await supabase
    .from("settings")
    .update({
      next_invoice_no: maxInvoiceNo + 1,
      next_ref_no: maxRefNo + 1,
    })
    .eq("id", 1);

  return {
    companiesCreated: companyNames.size,
    contactsCreated: contactKeys.size,
    invoicesCreated: good.length,
    flaggedRows: flagged,
  };
}
