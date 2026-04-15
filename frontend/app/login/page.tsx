import AuthScreen from "@/components/auth/AuthScreen";

type LoginPageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  return <AuthScreen mode="login" prefilledEmail={email} />;
}
