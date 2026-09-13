import { BasketProvider } from "@/components/customer/BasketContext";

export default async function CustomerMenuLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ restaurantId: string; tableId: string }>;
}) {
  const { restaurantId, tableId } = await params;

  return (
    <BasketProvider restaurantId={restaurantId} tableId={tableId}>
      {children}
    </BasketProvider>
  );
}
