import { supabase } from "../lib/supabase";
import type { Company } from "./types";

export async function getCompanies(): Promise<Company[]> {
  const { data, error } = await supabase.from("companies").select("*");

  if (error) throw new Error(error.message);
  return data as Company[];
}

export async function getCompany(id: string): Promise<Company> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data as Company;
}

export async function createCompany(
  data: Omit<Company, "id" | "created_at">,
): Promise<Company> {
  const { data: created, error } = await supabase
    .from("companies")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return created as Company;
}

export async function updateCompany(
  id: string,
  data: Partial<Omit<Company, "id" | "created_at">>,
): Promise<Company> {
  const { data: updated, error } = await supabase
    .from("companies")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return updated as Company;
}

export async function deleteCompany(id: string): Promise<void> {
  const { error } = await supabase.from("companies").delete().eq("id", id);

  if (error) throw new Error(error.message);
}

export async function searchCompanies(searchTerm: string): Promise<Company[]> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .ilike("name", `%${searchTerm}%`);

  if (error) throw new Error(error.message);
  return data as Company[];
}
