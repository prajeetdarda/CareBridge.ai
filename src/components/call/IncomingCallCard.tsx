"use client";

interface IncomingCallCardProps {
  callerName: string;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * Dev 1 owns this component.
 * Displays the incoming call UI for the parent/grandparent.
 */
export default function IncomingCallCard({
  callerName,
  onAccept,
  onDecline,
}: IncomingCallCardProps) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-card-border bg-card p-8 shadow-lg">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <span className="text-4xl">📞</span>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold">{callerName}&apos;s Care Assistant</p>
        <p className="text-sm text-muted">Incoming check-in call</p>
      </div>
      <div className="flex gap-4">
        <button
          onClick={onAccept}
          className="rounded-full bg-success px-8 py-3 font-medium text-white transition-colors hover:bg-success/80"
        >
          Accept
        </button>
        <button
          onClick={onDecline}
          className="rounded-full bg-danger px-8 py-3 font-medium text-white transition-colors hover:bg-danger/80"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
