"use client";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

export function ZaddrGenerator({
  value,
  onChange,
}: {
  value: string;
  onChange: (addr: string, mode?: "real" | "demo") => void;
}) {
  const [mode, setMode] = useState<"real" | "demo" | undefined>();
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    try {
      setLoading(true);
      const res = await trpc.zaddr.generate.mutate({});
      onChange(res.address, res.mode as any);
      setMode(res.mode as any);
      toast.success(
        res.mode === "real"
          ? "Generated shielded address via zcashd"
          : "Generated demo address"
      );
    } catch (e: any) {
      toast.error(e.message ?? "Failed to generate address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={generate} disabled={loading}>
          {loading ? "Generating..." : "Generate shielded address"}
        </Button>
        {mode && (
          <span className="text-xs px-2 py-1 rounded bg-muted">
            generated: {mode}
          </span>
        )}
      </div>
    </div>
  );
}