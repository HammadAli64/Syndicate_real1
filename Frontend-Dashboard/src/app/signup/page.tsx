import AuthScreen from "@/components/syndicate-otp/AuthScreen";

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function SignupPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  return (
    <div id="syndicate-otp-mount" className="min-h-dvh">
      <AuthScreen mode="signup" prefilledEmail={email} />
    </div>
  );
}
