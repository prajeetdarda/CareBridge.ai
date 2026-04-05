"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createBrowserSupabaseClient,
  isSupabaseAuthConfigured,
} from "@/lib/supabase/browser";

const inputClass =
  "w-full rounded-xl border border-white/50 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[#d36c9c] focus:ring-2 focus:ring-[#d36c9c]/25";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notice = searchParams.get("message");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = isSupabaseAuthConfigured();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signErr) {
        setError(signErr.message);
        setLoading(false);
        return;
      }
      router.push("/family");
      router.refresh();
    } catch {
      setError("Could not sign in. Check your Supabase configuration.");
      setLoading(false);
    }
  }

  return (
    <div className="landing-glass rounded-2xl p-8 shadow-xl md:p-10">
      <h1 className="landing-headline mb-2 text-2xl font-extrabold md:text-4xl">Log in</h1>
      <p className="mb-8 text-sm text-[#31243d]/60">
        Sign in with the email and password you used to create your account.
      </p>

      {notice === "confirm" && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Check your email to confirm your account, then sign in here.
        </p>
      )}

      {!configured && (
        <p className="mb-4 rounded-xl border border-[#d36c9c]/25 bg-white/70 px-4 py-3 text-sm text-[#31243d]/80">
          Add{" "}
          <code className="rounded bg-[#fde8ef] px-1 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          and{" "}
          <code className="rounded bg-[#fde8ef] px-1 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> to{" "}
          <code className="text-xs">.env.local</code> to enable email sign-in. For local demos
          without auth, continue to the dashboard below.
        </p>
      )}

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Email</span>
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
            disabled={!configured}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Password</span>
          <input
            required
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
            disabled={!configured}
          />
        </label>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!configured || loading}
          className="w-full rounded-xl bg-[#d36c9c] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#d36c9c]/30 transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#31243d]/70">
        No account yet?{" "}
        <Link href="/demo-signup" className="font-semibold text-[#d36c9c] hover:underline">
          Sign up
        </Link>
      </p>

      <div className="mt-8 border-t border-[#d36c9c]/15 pt-6">
        <Link
          href="/family"
          className="block w-full rounded-xl border border-[#d36c9c]/25 bg-white/60 px-6 py-3 text-center text-sm font-semibold text-[#31243d] transition hover:bg-white"
        >
          Continue without signing in
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="landing-body landing-mesh-bg min-h-screen px-6 py-10 text-[#31243d] md:px-8">
      <div className="mx-auto w-full max-w-md">
        <Suspense
          fallback={
            <div className="landing-glass rounded-2xl p-8 shadow-xl md:p-10">
              <p className="text-sm text-[#31243d]/60">Loading…</p>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
