import AuthScreen from "@/components/auth/AuthScreen";

type SignupPageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  return <AuthScreen mode="signup" prefilledEmail={email} />;
}
