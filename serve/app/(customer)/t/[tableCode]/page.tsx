import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export default async function TableCodePage({
  params,
}: {
  params: Promise<{ tableCode: string }>;
}) {
  const { tableCode } = await params;
  const supabase = await createClient();

  const { data: table, error } = await supabase
    .from("tables")
    .select("id, restaurant_id")
    .eq("code", tableCode)
    .single();

  if (error || !table) {
    return notFound();
  }

  // Redirect to the existing working customer route
  redirect(`/menu/${table.restaurant_id}/${table.id}`);
}
