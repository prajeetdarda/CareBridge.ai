"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createBrowserSupabaseClient,
  isSupabaseAuthConfigured,
} from "@/lib/supabase/browser";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "mr", label: "Marathi" },
  { value: "gu", label: "Gujarati" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "bn", label: "Bengali" },
  { value: "kn", label: "Kannada" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
];

const RELATIONSHIP_OPTIONS = [
  "Daughter",
  "Son",
  "Grandchild",
  "Sibling",
  "Niece / Nephew",
  "Caregiver",
  "Other",
];

const CARE_TOPIC_OPTIONS = [
  { id: "medication", label: "Medication & prescriptions" },
  { id: "food", label: "Meals & nutrition" },
  { id: "activity", label: "Physical activity" },
  { id: "mood", label: "Mood & emotional state" },
  { id: "sleep", label: "Sleep quality" },
  { id: "pain", label: "Pain & discomfort" },
  { id: "social", label: "Social interaction" },
  { id: "hygiene", label: "Personal hygiene" },
];

const inputClass =
  "w-full rounded-xl border border-white/50 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[#d36c9c] focus:ring-2 focus:ring-[#d36c9c]/25";

type Step = 1 | 2 | 3;

function SignupProgress({
  authConfigured,
  step,
}: {
  authConfigured: boolean;
  step: Step;
}) {
  const dot = (n: number, active: boolean, done: boolean) => (
    <span
      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
        active
          ? "bg-[#d36c9c] text-white shadow-md shadow-[#d36c9c]/30"
          : done
            ? "bg-[#d36c9c]/15 text-[#d36c9c]"
            : "bg-white/50 text-[#31243d]/35"
      }`}
    >
      {n}
    </span>
  );

  if (authConfigured) {
    return (
      <div className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3].map((n, i) => (
          <div key={n} className="flex items-center gap-2">
            {dot(n, step === n, step > n)}
            {i < 2 ? <span className="h-px w-8 bg-[#d36c9c]/30" /> : null}
          </div>
        ))}
      </div>
    );
  }

  if (step === 1) return null;

  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      <div className="flex items-center gap-2">
        {dot(1, step === 2, step === 3)}
        <span className="h-px w-8 bg-[#d36c9c]/30" />
        {dot(2, step === 3, false)}
      </div>
    </div>
  );
}

export default function SignupOnboardingPage() {
  const router = useRouter();
  const authConfigured = isSupabaseAuthConfigured();

  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — account (when Supabase auth is configured)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2 — caregiver
  const [familyMemberName, setFamilyMemberName] = useState("");
  const [relationshipLabel, setRelationshipLabel] = useState(RELATIONSHIP_OPTIONS[0]);
  const [preferredLanguage, setPreferredLanguage] = useState("en");

  // Step 3 — loved one
  const [lovedOneName, setLovedOneName] = useState("");
  const [lovedOneDateOfBirth, setLovedOneDateOfBirth] = useState("");
  const [careTopics, setCareTopics] = useState<string[]>(["medication", "food", "mood"]);

  function toggleCareTopic(id: string) {
    setCareTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  function goNextFromAccount() {
    setError(null);
    if (!authConfigured) return;
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setStep(2);
  }

  async function saveProfileAndFinish() {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        familyMemberName: familyMemberName.trim(),
        lovedOneName: lovedOneName.trim(),
        lovedOneDateOfBirth,
        preferredLanguage,
        relationshipLabel,
        careTopics,
      }),
    });
    if (!res.ok) throw new Error("Failed to save profile");
    router.push("/family");
    router.refresh();
  }

  async function handleFinalSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (authConfigured) {
        const supabase = createBrowserSupabaseClient();
        const { data, error: signErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signErr) {
          setError(signErr.message);
          setSaving(false);
          return;
        }
        if (!data.session) {
          setSaving(false);
          router.push("/login?message=confirm");
          return;
        }
      }

      await saveProfileAndFinish();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  function skipAuthContinue() {
    setError(null);
    setStep(2);
  }

  return (
    <main className="landing-body landing-mesh-bg min-h-screen px-6 py-10 text-[#31243d] md:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <SignupProgress authConfigured={authConfigured} step={step} />

        <div className="landing-glass rounded-2xl p-8 shadow-xl md:p-10">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-[#d36c9c]/80">
            {authConfigured
              ? step === 1
                ? "Sign up"
                : step === 2
                  ? "Your profile"
                  : "Loved one"
              : step === 1
                ? "Start"
                : step === 2
                  ? "Your profile"
                  : "Loved one"}
          </p>

          {/* ─── Step 1: Account (Supabase) or local skip ─── */}
          {authConfigured && step === 1 && (
            <>
              <h1 className="landing-headline mb-2 text-2xl font-extrabold leading-tight md:text-4xl">
                Create your account
              </h1>
              <p className="mb-8 text-sm text-[#31243d]/60">
                Use your email and a password. You&apos;ll set up care details in the next steps.
              </p>
              <div className="space-y-5">
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
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Password</span>
                  <input
                    required
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Confirm password</span>
                  <input
                    required
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className={inputClass}
                  />
                </label>
                {error && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </p>
                )}
                <button
                  type="button"
                  onClick={goNextFromAccount}
                  className="w-full rounded-xl bg-[#d36c9c] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#d36c9c]/30 transition hover:-translate-y-0.5"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {!authConfigured && step === 1 && (
            <>
              <h1 className="landing-headline mb-2 text-2xl font-extrabold leading-tight md:text-4xl">
                Set up your profile
              </h1>
              <p className="mb-8 text-sm text-[#31243d]/60">
                Auth is not configured (add Supabase anon key for email sign-up). Continue below to
                enter care details only — data still saves to your local or configured storage.
              </p>
              <button
                type="button"
                onClick={skipAuthContinue}
                className="w-full rounded-xl bg-[#d36c9c] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#d36c9c]/30 transition hover:-translate-y-0.5"
              >
                Continue to care profile
              </button>
            </>
          )}

          {/* ─── Step 2: About you ─── */}
          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mb-4 flex items-center gap-1 text-xs font-semibold text-[#d36c9c] transition hover:text-[#b8527e]"
              >
                <span className="text-base leading-none">&larr;</span> Back
              </button>
              <h1 className="landing-headline mb-2 text-2xl font-extrabold leading-tight md:text-4xl">
                About you
              </h1>
              <p className="mb-8 text-sm text-[#31243d]/60">
                Tell us a little about yourself so we can personalise your experience.
              </p>
              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Your name</span>
                  <input
                    required
                    type="text"
                    value={familyMemberName}
                    onChange={(e) => setFamilyMemberName(e.target.value)}
                    placeholder="e.g. Anjali Sharma"
                    className={inputClass}
                  />
                </label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Your relationship</span>
                    <select
                      value={relationshipLabel}
                      onChange={(e) => setRelationshipLabel(e.target.value)}
                      className={inputClass}
                    >
                      {RELATIONSHIP_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Preferred language</span>
                    <select
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value)}
                      className={inputClass}
                    >
                      {LANGUAGE_OPTIONS.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button
                  type="button"
                  disabled={!familyMemberName.trim()}
                  onClick={() => setStep(3)}
                  className="w-full rounded-xl bg-[#d36c9c] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#d36c9c]/30 transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {/* ─── Step 3: Loved one + submit ─── */}
          {step === 3 && (
            <form onSubmit={handleFinalSubmit}>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="mb-4 flex items-center gap-1 text-xs font-semibold text-[#d36c9c] transition hover:text-[#b8527e]"
              >
                <span className="text-base leading-none">&larr;</span> Back
              </button>
              <h1 className="landing-headline mb-2 text-2xl font-extrabold leading-tight md:text-4xl">
                About your loved one
              </h1>
              <p className="mb-8 text-sm text-[#31243d]/60">
                Essential details so CareBridge can have meaningful, personalised conversations.
              </p>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Their name</span>
                    <input
                      required
                      type="text"
                      value={lovedOneName}
                      onChange={(e) => setLovedOneName(e.target.value)}
                      placeholder="e.g. Amma"
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">
                      Date of birth{" "}
                      <span className="font-normal text-[#31243d]/40">(optional)</span>
                    </span>
                    <input
                      type="date"
                      value={lovedOneDateOfBirth}
                      onChange={(e) => setLovedOneDateOfBirth(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                </div>
                <div>
                  <span className="mb-3 block text-sm font-semibold">
                    What should we check in about?
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {CARE_TOPIC_OPTIONS.map((t) => {
                      const active = careTopics.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleCareTopic(t.id)}
                          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                            active
                              ? "bg-[#d36c9c] text-white shadow-sm shadow-[#d36c9c]/25"
                              : "bg-white/70 text-[#31243d]/70 hover:bg-white"
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {error && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={!lovedOneName.trim() || saving}
                  className="w-full rounded-xl bg-[#d36c9c] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#d36c9c]/30 transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  {saving ? "Saving..." : authConfigured ? "Create account & finish" : "Finish"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-10 border-t border-[#d36c9c]/15 pt-6 space-y-3">
            <p className="text-center text-sm text-[#31243d]/70">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-[#d36c9c] hover:underline">
                Log in
              </Link>
            </p>
            <Link
              href="/family"
              className="block w-full rounded-xl border border-[#d36c9c]/25 bg-white/60 px-6 py-3 text-center text-sm font-semibold text-[#31243d] transition hover:bg-white"
            >
              Skip and continue to Family Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
