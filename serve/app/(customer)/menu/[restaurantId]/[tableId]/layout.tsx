import { BasketProvider } from "@/components/customer/BasketContext";

export default async function CustomerMenuLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ restaurantId: string; tableId: string }>;
}) {
  const { restaurantId } = await params;

  return (
    <BasketProvider restaurantId={restaurantId}>
      {children}
    </BasketProvider>
  );
}
