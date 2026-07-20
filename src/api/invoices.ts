import { supabase } from "../lib/supabase";
import type { Invoice, LineItem } from "./types";

export async function getInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*, line_items(*)");

  if (error) throw new Error(error.message);
  return data as Invoice[];
}

export async function getInvoice(id: string): Promise<Invoice> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*, line_items(*)")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data as Invoice;
}

export async function createInvoice(
  data: Omit<Invoice, "id" | "invoice_no" | "our_ref_no" | "created_at">,
  lineItems: Omit<LineItem, "id" | "invoice_id" | "created_at">[],
): Promise<Invoice> {
  const { data: counters, error: countersError } = await supabase.rpc(
    "increment_counters",
    {
      line_item_count: lineItems.length,
    },
  );
  if (countersError) throw new Error(countersError.message);

  const { invoice_no, our_ref_no } = counters[0];

  const { data: created, error } = await supabase
    .from("invoices")
    .insert({ ...data, invoice_no, our_ref_no })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const { error: lineItemsError } = await supabase
    .from("line_items")
    .insert(lineItems.map((item) => ({ ...item, invoice_id: created.id })));

  if (lineItemsError) throw new Error(lineItemsError.message);

  return created as Invoice;
}

export async function updateInvoice(
  id: string,
  data: Partial<
    Omit<Invoice, "id" | "invoice_no" | "our_ref_no" | "created_at">
  >,
  lineItems: Omit<LineItem, "id" | "invoice_id" | "created_at">[],
): Promise<Invoice> {
  const { data: updated, error } = await supabase
    .from("invoices")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  const { error: deleteError } = await supabase
    .from("line_items")
    .delete()
    .eq("invoice_id", id);
  if (deleteError) throw new Error(deleteError.message);

  const { error: lineItemsError } = await supabase
    .from("line_items")
    .insert(lineItems.map((item) => ({ ...item, invoice_id: id })));

  if (lineItemsError) throw new Error(lineItemsError.message);
  return updated as Invoice;
}

export async function deleteInvoice(id: string): Promise<void> {
  const { error } = await supabase.from("invoices").delete().eq("id", id);

  if (error) throw new Error(error.message);
}

export async function getDistinctBillTo(contactId?: string): Promise<string[]> {
  let query = supabase
    .from("invoices")
    .select("bill_to")
    .not("bill_to", "is", null);

  if (contactId) query = query.eq("contact_id", contactId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return [...new Set(data.map((r) => r.bill_to as string))];
}

export async function getDistinctDeliverTo(
  contactId?: string,
  billTo?: string,
): Promise<string[]> {
  let query = supabase
    .from("invoices")
    .select("deliver_to")
    .not("deliver_to", "is", null);

  if (contactId) query = query.eq("contact_id", contactId);
  if (billTo) query = query.eq("bill_to", billTo);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return [...new Set(data.map((r) => r.deliver_to as string))];
}

export async function getDistinctAttn(
  contactId?: string,
  billTo?: string,
  deliverTo?: string,
): Promise<string[]> {
  let query = supabase.from("invoices").select("attn").not("attn", "is", null);

  if (contactId) query = query.eq("contact_id", contactId);
  if (billTo) query = query.eq("bill_to", billTo);
  if (deliverTo) query = query.eq("deliver_to", deliverTo);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return [...new Set(data.map((r) => r.attn as string))];
}

export async function getDistinctReferences(): Promise<string[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select("reference")
    .not("reference", "is", null);
  if (error) throw new Error(error.message);
  return [...new Set(data.map((r) => r.reference as string))];
}
