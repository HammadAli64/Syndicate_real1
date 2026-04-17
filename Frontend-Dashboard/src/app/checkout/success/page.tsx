import CheckoutSuccessScreen from "@/components/syndicate-otp/CheckoutSuccessScreen";

type PageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionId = typeof params.session_id === "string" ? params.session_id : "";
  return (
    <div id="syndicate-otp-mount" className="min-h-dvh">
      <CheckoutSuccessScreen sessionId={sessionId} />
    </div>
  );
}
