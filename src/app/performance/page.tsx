import PerformanceClient from "./PerformanceClient";
import { fetchBlob } from "@/lib/serverFetch";
import type { PerformanceBlob } from "@/lib/types";

export default async function Page() {
  const perf = await fetchBlob<PerformanceBlob>("performance");
  return <PerformanceClient initialPerf={perf} />;
}
