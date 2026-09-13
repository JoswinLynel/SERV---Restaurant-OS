import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

/**
 * Known short-code prefixes mapped to restaurant slugs.
 * Add new restaurants here as they onboard.
 */
const PREFIX_TO_SLUG: Record<string, string> = {
  MT: "madras-table",
};

/**
 * Parse a table code like "MT1" into { prefix: "MT", tableNumber: "1" }.
 * Returns null if the code doesn't match the expected format.
 */
function parseTableCode(code: string): { prefix: string; tableNumber: string } | null {
  const match = code.match(/^([A-Za-z]+)(\d+)$/);
  if (!match) return null;
  return { prefix: match[1].toUpperCase(), tableNumber: match[2] };
}

export default async function TableCodePage({
  params,
}: {
  params: Promise<{ tableCode: string }>;
}) {
  const { tableCode } = await params;

  // 1. Parse the short code (e.g. "MT1" → prefix "MT", tableNumber "1")
  const parsed = parseTableCode(tableCode);
  if (!parsed) return notFound();

  // 2. Map prefix to restaurant slug
  const slug = PREFIX_TO_SLUG[parsed.prefix];
  if (!slug) return notFound();

  const supabase = await createClient();

  // 3. Look up the restaurant by slug (column that already exists)
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!restaurant) return notFound();

  // 4. Look up the table by restaurant_id + table_number (columns that already exist)
  const { data: table } = await supabase
    .from("tables")
    .select("id")
    .eq("restaurant_id", restaurant.id)
    .eq("table_number", parsed.tableNumber)
    .single();

  if (!table) return notFound();

  // 5. Redirect to the existing working customer menu route
  redirect(`/menu/${restaurant.id}/${table.id}`);
}
