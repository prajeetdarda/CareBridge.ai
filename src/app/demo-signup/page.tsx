"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function DemoSignupPage() {
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="landing-body landing-mesh-bg min-h-screen px-6 py-10 text-[#4A4F5A] md:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="landing-glass rounded-2xl p-8 shadow-xl md:p-10">
          <h1 className="landing-headline mb-3 text-3xl font-extrabold leading-tight md:text-5xl">
            Create your profile
          </h1>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Full name</span>
                <input
                  required
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  className="w-full rounded-xl border border-white/50 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[#A38ACD] focus:ring-2 focus:ring-[#A38ACD]/25"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Email</span>
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/50 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[#A38ACD] focus:ring-2 focus:ring-[#A38ACD]/25"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Your relationship</span>
                <select className="w-full rounded-xl border border-white/50 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[#A38ACD] focus:ring-2 focus:ring-[#A38ACD]/25">
                  <option>Daughter / Son</option>
                  <option>Grandchild</option>
                  <option>Sibling</option>
                  <option>Caregiver</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Preferred language</span>
                <select className="w-full rounded-xl border border-white/50 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[#A38ACD] focus:ring-2 focus:ring-[#A38ACD]/25">
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Marathi</option>
                  <option>Gujarati</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Parent/elder name</span>
              <input
                type="text"
                placeholder="e.g. Sunita Sharma"
                className="w-full rounded-xl border border-white/50 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[#A38ACD] focus:ring-2 focus:ring-[#A38ACD]/25"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Phone number</span>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                className="w-full rounded-xl border border-white/50 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[#A38ACD] focus:ring-2 focus:ring-[#A38ACD]/25"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#A38ACD] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#A38ACD]/30 transition hover:-translate-y-0.5"
            >
              Create Demo Account
            </button>

            {submitted ? (
              <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                Demo account created (simulation only). Use Skip below to continue.
              </p>
            ) : null}
          </form>

          <div className="mt-10 border-t border-[#A38ACD]/15 pt-6">
            <Link
              href="/family"
              className="block w-full rounded-xl border border-[#A38ACD]/25 bg-white/60 px-6 py-3 text-center text-sm font-semibold text-[#4A4F5A] transition hover:bg-white"
            >
              Skip and continue to Family Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
