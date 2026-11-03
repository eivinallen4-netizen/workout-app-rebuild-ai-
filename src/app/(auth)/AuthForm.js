"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoEye, GoEyeClosed } from "react-icons/go";
import Button from "../components/ui/Button";
import { TextInput } from "../components/ui/Field";
import { ErrorState } from "../components/ui/States";
import Logo from "../components/Logo";
import { api } from "@/lib/api";

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  function validate() {
    const er = {};
    if (isSignup && !form.name.trim()) er.name = "Enter your name";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) er.email = "Enter a valid email";
    if (isSignup ? form.password.length < 8 : !form.password) er.password = isSignup ? "Use at least 8 characters" : "Enter your password";
    setErrors(er);
    return !Object.keys(er).length;
  }

  async function submit(e) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api(`/api/auth/${mode}`, { method: "POST", body: form });
      router.replace(res.next);
      router.refresh();
    } catch (err) {
      setServerError(err.message);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="mb-5" />
          <h1 className="text-2xl font-bold tracking-tight">{isSignup ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-1.5 text-muted">
            {isSignup ? "Get a training plan built around your goals." : "Log in to see today's workout."}
          </p>
        </div>

        <form onSubmit={submit} noValidate className="space-y-4">
          {serverError && <ErrorState message={serverError} />}
          {isSignup && (
            <TextInput label="Name" autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} placeholder="Alex" />
          )}
          <TextInput
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
            error={errors.email}
            placeholder="you@example.com"
          />
          <div className="relative">
            <TextInput
              label="Password"
              type={showPw ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={form.password}
              onChange={set("password")}
              error={errors.password}
              hint={isSignup ? "At least 8 characters" : undefined}
              className="[&_input]:pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-1 top-[30px] flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:text-ink"
            >
              {showPw ? <GoEyeClosed size={18} /> : <GoEye size={18} />}
            </button>
          </div>
          <Button type="submit" size="lg" block loading={loading}>
            {isSignup ? "Create account" : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {isSignup ? "Already have an account? " : "New here? "}
          <Link href={isSignup ? "/login" : "/signup"} className="font-semibold text-accent hover:underline">
            {isSignup ? "Log in" : "Create an account"}
          </Link>
        </p>
      </div>
    </main>
  );
}
