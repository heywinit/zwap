"use client";
import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function DemoBanner({ onQuickDeposit }: { onQuickDeposit?: () => void }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <Card className="mb-4 p-3 bg-yellow-50 border-yellow-200">
      <div className="flex items-center justify-between">
        <span className="text-sm">
          demo mode — simulated private transfer; no funds moved
        </span>
        {onQuickDeposit && (
          <Button variant="outline" size="sm" onClick={onQuickDeposit}>
            run demo deposit
          </Button>
        )}
      </div>
    </Card>
  );
}