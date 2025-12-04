"use client";
import { Card } from "./ui/card";

const features = [
  {
    key: "demo",
    title: "Demo Mode",
    desc: "Simulated Solana→Zcash private transfer with deterministic status.",
    badge: "simulated",
  },
  {
    key: "zaddr",
    title: "Shielded Address Generator",
    desc: "Generate Zcash shielded addresses via zcashd or demo fallback.",
    badge: "secure",
  },
  {
    key: "zk",
    title: "zk Health",
    desc: "Live proof metrics: time, circuit, commitments with status color.",
    badge: "live",
  },
];

export function Features() {
  return (
    <div className="mt-2">
      <div className="text-xs text-muted-foreground mb-1">Feature Pack</div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-2">
        {features.map((f) => (
          <Card key={f.key} className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium">{f.title}</div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wide">
                {f.badge}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">{f.desc}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}