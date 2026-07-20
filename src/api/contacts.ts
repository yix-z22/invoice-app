import { supabase } from "../lib/supabase";
import type { Contact } from "./types";

export async function getContacts(): Promise<Contact[]> {
  const { data, error } = await supabase.from("contacts").select("*");

  if (error) throw new Error(error.message);
  return data as Contact[];
}

export async function getContact(id: string): Promise<Contact> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data as Contact;
}

export async function createContact(
  data: Omit<Contact, "id" | "created_at">,
): Promise<Contact> {
  const { data: created, error } = await supabase
    .from("contacts")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return created as Contact;
}

export async function updateContact(
  id: string,
  data: Partial<Omit<Contact, "id" | "created_at">>,
): Promise<Contact> {
  const { data: updated, error } = await supabase
    .from("contacts")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return updated as Contact;
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from("contacts").delete().eq("id", id);

  if (error) throw new Error(error.message);
}

export async function searchContacts(searchTerm: string): Promise<Contact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .ilike("name", `%${searchTerm}%`);

  if (error) throw new Error(error.message);
  return data as Contact[];
}

export async function getContactsByCompany(
  companyId: string,
): Promise<Contact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("company_id", companyId);

  if (error) throw new Error(error.message);
  return data as Contact[];
}
