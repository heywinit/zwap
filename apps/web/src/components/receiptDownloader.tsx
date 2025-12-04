"use client";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

export default function ReceiptDownloader({ depositId }: { depositId: string }) {
  const [password, setPassword] = useState("");
  const [open, setOpen] = useState(false);

  const generate = async () => {
    try {
      const res = await trpc.receipts.generate.mutate({ depositId, password: password || undefined });
      const blob = Uint8Array.from(Buffer.from(res.blob_b64, "base64"));
      const file = new Blob([blob], { type: "application/octet-stream" });
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.download_name;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Receipt downloaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate receipt");
    }
  };

  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
        {open ? "Close" : "Download private receipt"}
      </Button>
      {open && (
        <Card className="p-3 mt-2">
          <p className="text-xs text-muted-foreground mb-2">
            encrypted receipt contains blinded amounts for auditors; you can share the password with auditors
          </p>
          <div className="flex items-center gap-2">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="optional password"
              type="password"
            />
            <Button size="sm" onClick={generate}>Generate</Button>
          </div>
        </Card>
      )}
    </div>
  );
}