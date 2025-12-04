import { DEMO_MODE, DEMO_ZEC_DELAY_MS } from "@zwap/api/src/config";
import { enqueueSimulation } from "@zwap/api/src/jobs/simulator";

export function simulateIfDemo(depositId: string) {
  if (!DEMO_MODE) return;
  enqueueSimulation(depositId, DEMO_ZEC_DELAY_MS, Date.now());
}