import type { Metadata } from "next";
import PerformanceClient from "./PerformanceClient";
import perfJson from "@/data/performance.json";
import type { PerformanceBlob } from "@/lib/types";

export const metadata: Metadata = {
  title: "WC26 model — final performance record",
  description:
    "The complete model-vs-market scoreboard for all 100 odds-matched World Cup 2026 matches: Brier and log scores, per-match edge, and the full performance log.",
};

// The tournament is over: the performance blob is frozen in the repo
// (fetched once from R2 on 2026-07-21) and the page prerenders from it.
const perf = perfJson as unknown as PerformanceBlob;

export default function Page() {
  return <PerformanceClient perf={perf} />;
}
