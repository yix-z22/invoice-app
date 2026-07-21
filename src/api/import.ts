import { supabase } from "../lib/supabase";
import type { ParsedRow } from "../lib/parseExcel";

export interface ImportSummary {
  companiesCreated: number;
  contactsCreated: number;
  invoicesCreated: number;
  draftsCreated: number;
}

export async function importInvoices(
  rows: ParsedRow[],
): Promise<ImportSummary> {
  // ── 1. Deduplicate & insert companies ──
  const companyNames = new Set<string>();
  for (const row of rows) {
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

  // ── 2. Deduplicate & insert contacts ──
  const contactKeys = new Set<string>();
  for (const row of rows) {
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

  // ── 3. Insert invoices — set status based on available data ──
  let draftsCreated = 0;

  for (const row of rows) {
    const contactKey = `${row.contact_person}|${row.customer}`;
    const contactId = contactIds.get(contactKey) ?? null;

    // no issue date = draft, has issue date = issued
    const isDraft = !row.issue_date;
    if (isDraft) draftsCreated++;

    // has payment date = paid, no payment date = unpaid
    const paymentStatus = row.payment_received_date ? "paid" : "unpaid";

    const { error } = await supabase.from("invoices").insert({
      invoice_no: row.invoice_no,
      our_ref_no: row.our_ref_no ?? 0,
      contact_id: contactId,
      invoice_status: isDraft ? "draft" : "issued",
      invoice_date: row.issue_date ?? "1970-01-01",
      paid_date: row.payment_received_date ?? null,
      payment_status: paymentStatus,
      remark: row.remarks ?? null,
    });

    if (error) throw new Error(error.message);
  }

  // ── 4. Update counters ──
  const maxInvoiceNo = Math.max(...rows.map((r) => r.invoice_no ?? 0));
  const maxRefNo = Math.max(...rows.map((r) => r.our_ref_no ?? 0));

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
    invoicesCreated: rows.length - draftsCreated,
    draftsCreated,
  };
}
