"use client";
import { useEffect, useMemo, useRef } from "react";
import { CheckCircle2, Lock, Sparkles, Radio } from "lucide-react";
import { Card } from "./ui/card";

type StepKey = "LOCK" | "COMMIT" | "NULLIFY";

export type PipelineStatus = "SUBMITTED" | "CONFIRMED" | "PROCESSING" | "SENT" | "FAILED";

export function mapBackendToPipeline(
  status: string,
  demoMode?: boolean,
): PipelineStatus {
  const s = status?.toUpperCase();
  if (s === "SIMULATED_SUBMITTED" || s === "PENDING" || s === "SUBMITTED") return "SUBMITTED";
  if (s === "CONFIRMED") return "CONFIRMED";
  if (s === "PROCESSING") return "PROCESSING";
  if (s === "SENT") return "SENT";
  if (s === "FAILED") return "FAILED";
  // demo phases mapping
  if (demoMode) {
    if (s === "SIMULATED_SUBMITTED") return "SUBMITTED";
    if (s === "PROCESSING") return "PROCESSING";
    if (s === "SENT") return "SENT";
  }
  return "SUBMITTED";
}

function fmt(ts?: string | number) {
  if (!ts) return "";
  try {
    const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
    return d.toLocaleTimeString();
  } catch {
    return "";
  }
}

export default function PipelineStepper({
  status,
  demoMode,
  timestamps,
}: {
  status: string;
  demoMode?: boolean;
  timestamps?: { lock?: number | string; commit?: number | string; nullify?: number | string };
}) {
  const mapped = useMemo(() => mapBackendToPipeline(status, demoMode), [status, demoMode]);
  const ariaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const message =
      mapped === "CONFIRMED"
        ? "solana deposit confirmed"
        : mapped === "PROCESSING"
        ? "relayer computed shield commitment"
        : mapped === "SENT"
        ? "zcash shielded tx broadcast"
        : "deposit submitted";
    if (ariaRef.current) ariaRef.current.textContent = message;
  }, [mapped]);

  const reached = {
    LOCK: mapped === "CONFIRMED" || mapped === "PROCESSING" || mapped === "SENT",
    COMMIT: mapped === "PROCESSING" || mapped === "SENT",
    NULLIFY: mapped === "SENT",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        {/* LOCK step */}
        <Step
          icon={reached.LOCK ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Lock className="h-4 w-4" />}
          label="lock"
          active={mapped === "CONFIRMED"}
          done={reached.LOCK}
          timestamp={fmt(timestamps?.lock)}
          animation="check"
        />
        <Divider />
        {/* COMMIT step */}
        <Step
          icon={<Radio className={`h-4 w-4 ${mapped === "PROCESSING" ? "animate-pulse" : ""}`} />}
          label="commit"
          active={mapped === "PROCESSING"}
          done={reached.COMMIT}
          timestamp={fmt(timestamps?.commit)}
          animation="pulse"
        />
        <Divider />
        {/* NULLIFY step */}
        <Step
          icon={<Sparkles className={`h-4 w-4 ${mapped === "SENT" ? "tw-animate-css-animate-fadeIn" : ""}`} />}
          label="nullify"
          active={mapped === "SENT"}
          done={reached.NULLIFY}
          timestamp={fmt(timestamps?.nullify)}
          animation="sparkle"
        />
      </div>
      <div className="sr-only" aria-live="polite" ref={ariaRef} />
      <Card className="p-2">
        <ul className="text-xs text-muted-foreground">
          <li>lock: solana deposit confirmed</li>
          <li>commit: relayer computed shield commitment</li>
          <li>nullify: zcash shielded tx broadcast (txid shown)</li>
        </ul>
      </Card>
    </div>
  );
}

function Divider() {
  return <div className="h-px w-8 bg-muted" />;
}

function Step({
  icon,
  label,
  active,
  done,
  timestamp,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  done?: boolean;
  timestamp?: string;
  animation?: "check" | "pulse" | "sparkle";
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center justify-center h-6 w-6 rounded-full border ${done ? "border-green-500" : "border-muted-foreground"}`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className={`text-xs ${active ? "font-semibold" : ""}`}>{label}</span>
        {timestamp ? <span className="text-[10px] text-muted-foreground">{timestamp}</span> : null}
      </div>
    </div>
  );
}