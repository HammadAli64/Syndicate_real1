import CheckoutSuccessScreen from "@/components/checkout/CheckoutSuccessScreen";

type CheckoutSuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const params = await searchParams;
  const sessionId =
    typeof params.session_id === "string" ? params.session_id : "";
  return <CheckoutSuccessScreen sessionId={sessionId} />;
}
