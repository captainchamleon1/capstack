import { AuthForm } from "@/components/auth/auth-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; invite?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthForm
      mode="signup"
      defaultEmail={params.email}
      inviteToken={params.invite}
    />
  );
}
