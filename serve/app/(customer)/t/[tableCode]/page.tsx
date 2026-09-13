import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export default async function TableCodePage({
  params,
}: {
  params: Promise<{ tableCode: string }>;
}) {
  const { tableCode } = await params;
  const supabase = await createClient();

  // Look up the table by its unique public code
  const { data: table } = await supabase
    .from("tables")
    .select("id, restaurant_id")
    .eq("code", tableCode)
    .single();

  if (!table) {
    return notFound();
  }

  // Redirect to the existing working customer menu route
  redirect(`/menu/${table.restaurant_id}/${table.id}`);
}
