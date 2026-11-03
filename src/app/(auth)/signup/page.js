import AuthForm from "../AuthForm";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
