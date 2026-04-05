"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDME3QR0jtoEe0k3Gw0hq23RUe4lIxc0vav07LKvjzvFgh6YSTLpKjPknYCfpgXoL5LJJsVJHq8zoDd6R9n3LENXMLtnoza1TzQlFqsttIhxPX9Ylw32NBDE0SKSYFSN6EQ17LydjVDemCAV5uiswYKa1dmMfzTpBz7XIGB-rCutnBlhVbc2CXWh4TLpu9LyhaxOiJ2mM8EXM8TPMTrLYjYvCys8jjj1MyVa2UfHibgNg4Z1LwwKHUFYb-QrHFow9Quq8eUfZoKTEQ";

const BG_IMAGES = [
  "/family-photos/1.jpg",
  "/family-photos/2.jpeg",
  "/family-photos/3.jpg",
  "/family-photos/4.jpg",
  "/family-photos/5.jpeg",
  "/family-photos/6.jpeg",
  "/family-photos/6.jpg",
  "/family-photos/8.jpg",
  "/family-photos/9.webp",
  "/family-photos/11.png",
];

const WAVE_DELAYS = ["0.1s", "0.3s", "0.5s", "0.2s", "0.4s", "0.6s", "0.1s", "0.3s", "0.5s"];

const ESCALATION_STEPS = [
  { icon: "person", label: "Primary Caregiver", delay: "0s" },
  { icon: "diversity_1", label: "Family Member", delay: "1s" },
  { icon: "house", label: "Local Support", delay: "2s" },
  { icon: "medical_services", label: "Medical Help", delay: "3s" },
];

const AI_TIERS = [
  {
    dot: "bg-green-500",
    title: "Daily Digest",
    titleColor: "",
    desc: "Daily highlights and small updates you can review anytime.",
    triggerColor: "text-[#d36c9c]",
    triggers: ["Positive mood trends", "Routine completion", "Social activity mentions"],
    triggerDot: "bg-green-500",
    footerIcon: "schedule",
    footerLabel: "Routine Update",
    footerColor: "text-on-surface-variant",
    borderClass: "border border-white/50",
    shadow: "",
  },
  {
    dot: "bg-orange-400",
    title: "Care Alert",
    titleColor: "",
    desc: "Changes in mood, routine, or health that need attention soon.",
    triggerColor: "text-orange-500",
    triggers: ["Missed medication", "Appetite changes", "Unusual sleep patterns"],
    triggerDot: "bg-orange-400",
    footerIcon: "notifications_active",
    footerLabel: "Push Notification",
    footerColor: "text-on-surface-variant",
    borderClass: "border border-white/50 shadow-xl",
    shadow: "",
  },
  {
    dot: "bg-[#E66A6A]",
    title: "Urgent Action",
    titleColor: "text-[#E66A6A]",
    desc: "Immediate concerns detected — alerts sent so someone can act fast.",
    triggerColor: "text-[#E66A6A]",
    triggers: ["Potential fall detection", "Pain/SOS keywords", "Extreme disorientation"],
    triggerDot: "bg-[#E66A6A]",
    footerIcon: "warning",
    footerLabel: "Immediate Alert",
    footerColor: "text-[#E66A6A]",
    borderClass: "border-2 border-[#E66A6A]/10 shadow-2xl",
    shadow: "",
  },
];

function MIcon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

export default function LandingPage() {
  const glowRef = useRef<HTMLDivElement>(null);
  const [navVisible, setNavVisible] = useState(false);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.left = `${e.clientX}px`;
        glowRef.current.style.top = `${e.clientY}px`;
      }
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  useEffect(() => {
    const onScroll = () => setNavVisible(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll(".landing-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("active");
        });
      },
      { threshold: 0.1 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-body bg-[#fff8f4] text-[#31243d] selection:bg-[#d36c9c]/20 selection:text-[#d36c9c]">
      {/* Cursor glow */}
      <div ref={glowRef} className="landing-cursor-glow" />

      {/* Floating orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute left-[5%] top-[10%] h-96 w-96 rounded-full bg-[#d36c9c]/10 blur-[120px]"
          style={{ animation: "landing-drift 20s linear infinite" }}
        />
        <div
          className="absolute bottom-[20%] right-[10%] h-80 w-80 rounded-full bg-[#fde8ef]/40 blur-[100px]"
          style={{ animation: "landing-drift 20s linear infinite", animationDelay: "-5s" }}
        />
      </div>

      {/* Navigation — revealed on scroll */}
      <nav
        className={`fixed top-8 z-50 w-full transition-all duration-500 ${
          navVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="landing-glass mx-8 flex h-20 max-w-7xl items-center justify-between rounded-2xl px-8 shadow-sm xl:mx-auto">
          <div className="landing-headline text-2xl font-bold tracking-tight text-[#d36c9c]">
            CareBridge.ai
          </div>
          <div className="landing-headline hidden items-center space-x-8 text-sm tracking-wide md:flex">
            <a href="#" className="border-b-2 border-[#d36c9c] font-bold text-[#d36c9c]">
              Home
            </a>
            <a href="#features" className="text-[#31243d]/70 transition-colors duration-300 hover:text-[#d36c9c]">
              Features
            </a>
            <a href="#intelligence" className="text-[#31243d]/70 transition-colors duration-300 hover:text-[#d36c9c]">
              How It Works
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/demo-signup"
              className="hidden text-sm font-semibold text-[#31243d]/70 transition-colors hover:text-[#31243d] sm:block"
            >
              Login
            </Link>
            <Link
              href="/demo-signup"
              className="rounded-xl bg-[#d36c9c] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#d36c9c]/20 transition-all hover:scale-105 active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* ─── Hero ─── */}
        <section className="landing-mesh-bg relative flex min-h-screen items-center justify-center overflow-hidden">
          {/* Scrolling background images — alternating columns */}
          <div className="pointer-events-none absolute inset-0 z-0 flex gap-5 overflow-hidden px-6 opacity-[0.28]">
            {[0, 1, 2, 3].map((col) => {
              const colImages = BG_IMAGES.filter((_, i) => i % 4 === col);
              const doubled = [...colImages, ...colImages];
              const goesUp = col % 2 === 0;
              return (
                <div
                  key={col}
                  className="hidden flex-1 md:block"
                  style={{
                    maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
                    WebkitMaskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
                  }}
                >
                  <div
                    className="flex flex-col gap-5"
                    style={{
                      animation: `${goesUp ? "landing-scrollUp" : "landing-scrollDown"} ${28 + col * 4}s linear infinite`,
                    }}
                  >
                    {doubled.map((src, i) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        key={i}
                        alt=""
                        className="w-full rounded-2xl object-cover shadow-lg ring-1 ring-white/40 saturate-110 contrast-105"
                        style={{ height: "280px" }}
                        src={src}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-8 text-center"
            style={{ animation: "landing-fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards" }}
          >
              {/* Brand */}
              <div className="mb-8 flex items-center justify-center gap-4">
                <span className="landing-headline text-[3.4rem] font-extrabold tracking-tight md:text-[4.2rem]">
                  <span className="landing-brand-care">Care</span>
                  <span className="landing-brand-duotone">Bridge.ai</span>
                </span>
                <MIcon name="favorite" className="hero-heart-icon text-[#be0f0f]" />
              </div>

              {/* Tagline with subtle glass backdrop */}
              <div className="mb-10 inline-block rounded-2xl bg-white/55 px-8 py-5 shadow-lg ring-1 ring-white/30 backdrop-blur-md">
                <h1 className="landing-headline landing-headline-glow whitespace-nowrap text-2xl font-extrabold leading-snug text-[#31243d] md:text-4xl">
                  Bridging Distance with{" "}
                  <span className="italic text-[#d36c9c]">Empathetic AI.</span>
                </h1>
              </div>

              <div className="mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/demo-signup"
                  className="rounded-xl bg-[#d36c9c] px-8 py-4 text-lg font-bold text-white shadow-lg shadow-[#d36c9c]/25 transition-all hover:-translate-y-0.5"
                >
                  Start a Check-In
                </Link>
                <a
                  href="#features"
                  className="landing-glass rounded-xl px-8 py-4 text-lg font-semibold text-[#31243d] transition-colors hover:bg-white/40"
                >
                  See How It Works
                </a>
              </div>

              <div className="flex items-center justify-center gap-6 opacity-60">
                <span className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">
                  Powered by
                </span>
                <div className="landing-headline flex items-center gap-4">
                  <span className="text-sm font-bold">Google Gemini</span>
                  <span className="h-4 w-px bg-[#6B7280]/20" />
                  <span className="text-sm font-bold">ElevenLabs</span>
                </div>
              </div>

            {/* Right — hero image */}
            {/* Hero image + floating card — temporarily hidden */}
            <div
              className="relative hidden justify-end"
              style={{ animation: "landing-fadeIn 1s ease-out forwards" }}
            >
              <div className="group relative">
                <div
                  className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(211,108,156,0.25)] lg:rotate-1"
                  style={{ animation: "landing-float 6s ease-in-out infinite" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Elderly woman smiling during a check-in call"
                    className="h-[500px] w-full object-cover"
                    src={HERO_IMAGE}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                {/* Floating status card */}
                <div
                  className="landing-glass absolute -bottom-10 -left-12 z-20 max-w-[280px] rounded-2xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.1),0_0_20px_rgba(211,108,156,0.2)]"
                  style={{ animation: "landing-float 6s ease-in-out infinite", animationDelay: "-2s" }}
                >
                  <div className="mb-3 flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <MIcon
                        name="fiber_manual_record"
                        className="text-base text-[#d36c9c]"
                        aria-hidden
                      />
                      <span className="text-sm font-bold text-[#d36c9c]">Gemini Live Active</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-[#6B7280]">
                    &ldquo;Daily update: She&apos;s feeling better today. Mentioned mild headache
                    yesterday.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Problem ─── */}
        <section className="landing-reveal bg-white py-32">
          <div className="mx-auto max-w-4xl px-8 text-center">
            <span className="mb-6 inline-block rounded-full bg-[#fde8ef] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#d36c9c]">
              The Challenge
            </span>
            <h2 className="landing-headline mb-4 whitespace-nowrap text-[clamp(1.9rem,4vw,3.75rem)] font-bold leading-tight">
              Caring across borders is hard.
            </h2>
            <h2 className="landing-headline mb-8 whitespace-nowrap text-[clamp(1.9rem,4vw,3.75rem)] font-bold leading-tight text-[#d36c9c]/70">
              Staying informed shouldn&apos;t be.
            </h2>
            <p className="mx-auto max-w-2xl text-xl leading-relaxed text-[#6B7280]">
              Time zones, language gaps, and busy lives often mean important updates are missed.
              CareBridge helps families stay continuously aware — not just during calls.
            </p>
          </div>
        </section>

        {/* ─── Feature split ─── */}
        <section id="features" className="mx-auto max-w-7xl px-8 py-24">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            {/* Parent view */}
            <div className="landing-reveal landing-glass group relative overflow-hidden rounded-2xl p-12 shadow-sm md:col-span-7">
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-8 flex items-start justify-between">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d36c9c]/10 transition-transform group-hover:scale-110">
                    <MIcon name="record_voice_over" className="text-4xl text-[#d36c9c]" />
                  </div>
                  {/* Transcript widget */}
                  <div className="w-64 rounded-xl border border-white/10 bg-black/80 p-4 shadow-xl backdrop-blur-md">
                    <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                        Live Gemini Transcript
                      </span>
                    </div>
                    <div className="relative h-20 overflow-hidden">
                      <div
                        className="landing-transcript-line absolute top-2"
                        style={{ animationDelay: "2s" }}
                      >
                        <span className="text-xs font-bold text-green-400">Gemini:</span>
                        <p className="text-xs leading-tight text-white">
                          &ldquo;That&apos;s great! How is your knee feeling today?&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="landing-headline mb-4 text-3xl font-bold">
                  Simple for parents. No tech stress.
                </h3>
                <p className="mb-8 max-w-md text-lg text-[#6B7280]">
                  Parents receive friendly check-ins in their own language and can share updates
                  anytime — by voice, text, or photo.
                </p>
                {/* Waveform */}
                <div className="mb-8 flex h-12 items-center gap-1 overflow-hidden">
                  {WAVE_DELAYS.map((d, i) => (
                    <div
                      key={i}
                      className="landing-waveform-bar"
                      style={{ animation: `landing-wave 1.2s ease-in-out infinite`, animationDelay: d }}
                    />
                  ))}
                </div>
                <div className="mt-auto flex items-center gap-3 border-t border-[#d36c9c]/10 pt-8">
                  <MIcon name="info" className="text-xl text-[#d36c9c]" />
                  <span className="font-medium text-[#6B7280]">
                    No apps to learn. Just natural conversation.
                  </span>
                </div>
              </div>
            </div>

            {/* Family view */}
            <div className="landing-reveal flex flex-col justify-between rounded-2xl bg-[#d36c9c] p-12 shadow-lg md:col-span-5">
              <div>
                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                  <MIcon name="family_restroom" className="text-4xl text-white" />
                </div>
                <h3 className="landing-headline mb-4 text-3xl font-bold text-white">
                  Everything you need, in one place.
                </h3>
                <p className="text-lg text-white/80">
                  Get structured summaries, detect changes early, and receive alerts when something
                  needs attention.
                </p>
              </div>
              <div className="landing-glass mt-12 rounded-xl p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#31243d]">TODAY&apos;S STATUS</span>
                  <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-bold uppercase text-green-600">
                    All Good Today
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#31243d]/10">
                  <div className="h-full w-full bg-[#d36c9c]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Safety net ─── */}
        <section className="landing-reveal overflow-hidden bg-[#fff8f4] py-24">
          <div className="mx-auto max-w-7xl px-8">
            <div className="mb-16 text-center">
              <h2 className="landing-headline mb-4 text-4xl font-bold">
                Never miss what matters.
              </h2>
              <p className="mx-auto max-w-xl text-[#6B7280]">
                CareBridge ensures important signals don&apos;t get lost — escalating concerns to
                the right people at the right time.
              </p>
            </div>
            <div className="relative flex flex-col items-center justify-between gap-8 md:flex-row">
              <div className="absolute left-0 top-1/2 hidden h-0.5 w-full -translate-y-1/2 bg-[#d36c9c]/10 md:block" />
              {ESCALATION_STEPS.map((step) => (
                <div
                  key={step.label}
                  className="group relative z-10 flex w-full flex-col items-center gap-4 md:w-auto"
                >
                  <div
                    className="landing-escalation-node flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#d36c9c] shadow-lg transition-all duration-500"
                    style={{ animationDelay: step.delay }}
                  >
                    <MIcon name={step.icon} className="text-3xl" />
                  </div>
                  <span className="text-center text-xs font-bold uppercase tracking-wider">
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── AI Intelligence ─── */}
        <section id="intelligence" className="landing-reveal landing-mesh-bg py-24">
          <div className="mx-auto max-w-7xl px-8">
            <div className="mb-16">
              <span className="mb-6 inline-block rounded-full bg-[#d36c9c] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
                AI Intelligence
              </span>
              <h2 className="landing-headline mb-4 text-4xl font-bold leading-tight">
                Smart insights. Clear action.
              </h2>
              <p className="max-w-xl text-lg text-[#6B7280]">
                Our AI turns conversations into meaningful updates — so you know what&apos;s
                happening without reading everything.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {AI_TIERS.map((tier) => (
                <div
                  key={tier.title}
                  className={`landing-glass flex flex-col rounded-2xl p-8 transition-transform duration-500 hover:-translate-y-2 ${tier.borderClass}`}
                >
                  <div className="mb-6 flex items-center gap-2">
                    <div className={`h-3 w-3 animate-pulse rounded-full ${tier.dot}`} />
                    <span
                      className={`landing-headline text-lg font-bold ${tier.titleColor}`}
                    >
                      {tier.title}
                    </span>
                  </div>
                  <p className="mb-6 flex-grow text-[#6B7280]">{tier.desc}</p>
                  <div className="mb-8">
                    <span
                      className={`mb-3 block text-[10px] font-bold uppercase tracking-widest ${tier.triggerColor}`}
                    >
                      AI Triggers
                    </span>
                    <ul className="space-y-2">
                      {tier.triggers.map((t) => (
                        <li
                          key={t}
                          className="flex items-center gap-2 text-sm text-[#6B7280]"
                        >
                          <span className={`h-1 w-1 rounded-full ${tier.triggerDot}`} />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className={`flex items-center gap-2 border-t border-[#d36c9c]/10 pt-6 text-xs font-bold uppercase tracking-widest ${tier.footerColor}`}
                  >
                    <MIcon name={tier.footerIcon} className="text-sm" />
                    {tier.footerLabel}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="landing-reveal px-8 py-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[3rem] bg-[#d36c9c] p-16 text-center md:p-24">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
            <div className="relative z-10">
              <h2 className="landing-headline mb-8 text-4xl font-extrabold leading-tight text-white md:text-6xl">
                Stay connected. Stay informed. Stay ready.
              </h2>
              <p className="mx-auto mb-12 max-w-2xl text-xl text-white/80">
                CareBridge helps families care better — across distance, time zones, and busy lives.
              </p>
              <Link
                href="/family/check-in"
                className="inline-block rounded-2xl bg-white px-12 py-5 text-xl font-bold text-[#d36c9c] shadow-2xl transition-transform hover:scale-105"
              >
                Start Your First Check-In
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Powered by */}
      <div className="border-t border-[#d36c9c]/5 bg-white py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-8 px-8 opacity-40 transition-opacity hover:opacity-70 md:flex-row">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-[#6B7280]">
            Powered by advanced AI voice &amp; intelligence
          </span>
          <div className="landing-headline flex items-center gap-8">
            <span className="text-lg font-bold">Google Gemini</span>
            <span className="text-lg font-bold">ElevenLabs</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white pb-12">
        <div className="mx-auto mb-20 grid max-w-7xl grid-cols-1 gap-16 px-8 pt-12 md:grid-cols-2">
          <div>
            <div className="landing-headline mb-6 text-2xl font-bold text-[#d36c9c]">
              CareBridge.ai
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-[#6B7280]">
              Built to support real families, not replace them. &copy; 2025 CareBridge.ai.
              Empowering families with empathetic AI globally.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="landing-headline text-sm font-bold text-[#d36c9c]">Product</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/parent/update"
                    className="text-sm text-[#6B7280] transition-colors hover:text-[#d36c9c]"
                  >
                    Parent Portal
                  </Link>
                </li>
                <li>
                  <Link
                    href="/family"
                    className="text-sm text-[#6B7280] transition-colors hover:text-[#d36c9c]"
                  >
                    Family Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="landing-headline text-sm font-bold text-[#d36c9c]">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-[#6B7280] transition-colors hover:text-[#d36c9c]">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-[#6B7280] transition-colors hover:text-[#d36c9c]">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl justify-center gap-8 border-t border-[#d36c9c]/5 px-8 pt-8">
          <a href="#" className="text-[#d36c9c]/40 transition-colors hover:text-[#d36c9c]">
            <MIcon name="public" />
          </a>
          <a href="#" className="text-[#d36c9c]/40 transition-colors hover:text-[#d36c9c]">
            <MIcon name="share" />
          </a>
          <a href="#" className="text-[#d36c9c]/40 transition-colors hover:text-[#d36c9c]">
            <MIcon name="mail" />
          </a>
        </div>
      </footer>
    </div>
  );
}
