import AuthScreen from "@/components/auth/AuthScreen";

type VerifyOtpPageProps = {
  searchParams: Promise<{ email?: string; flow?: string }>;
};

export default async function VerifyOtpPage({ searchParams }: VerifyOtpPageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const flow = params.flow === "signup" ? "signup" : "login";
  return <AuthScreen mode="otp" prefilledEmail={email} otpFlow={flow} />;
}
