"use client";

import { useEffect, useRef, type ReactNode } from "react";
import UrgentEmergencyDemo from "@/components/family/UrgentEmergencyDemo";

function NotifySoonAttention({ children }: { children: ReactNode }) {
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const playBeep = () => {
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!Ctx) return;
        if (!ctxRef.current || ctxRef.current.state === "closed") {
          ctxRef.current = new Ctx();
        }
        const ctx = ctxRef.current;
        void ctx.resume();
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        g.gain.value = 0.11;
        osc.type = "sine";
        osc.frequency.value = 620;
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } catch {
        // ignore
      }
    };

    let n = 0;
    const max = 5;
    const id = window.setInterval(() => {
      playBeep();
      n += 1;
      if (n >= max) clearInterval(id);
    }, 350);

    return () => {
      clearInterval(id);
      const ctx = ctxRef.current;
      if (ctx && ctx.state !== "closed") void ctx.close();
      ctxRef.current = null;
    };
  }, []);

  return (
    <div className="dashboard-attention-notify flex min-h-0 flex-1 flex-col rounded-xl">
      {children}
    </div>
  );
}

/**
 * Urgent unacked: looping alarm + 10s demo escalation (see UrgentEmergencyDemo).
 * Notify-soon only: short beeps + amber pulse.
 */
export default function FamilyDashboardAttention({
  urgentCount,
  notifySoonCount,
  backupContactNames,
  children,
}: {
  urgentCount: number;
  notifySoonCount: number;
  /** Names for fake escalation lines; optional */
  backupContactNames?: string[];
  children: ReactNode;
}) {
  if (urgentCount === 0 && notifySoonCount === 0) {
    return <>{children}</>;
  }

  if (urgentCount > 0) {
    return (
      <div className="dashboard-attention-urgent flex min-h-0 flex-1 flex-col rounded-xl">
        <UrgentEmergencyDemo backupContactNames={backupContactNames}>
          {children}
        </UrgentEmergencyDemo>
      </div>
    );
  }

  return <NotifySoonAttention>{children}</NotifySoonAttention>;
}
