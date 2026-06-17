import MatchesClient from "./MatchesClient";
import { fetchBlob } from "@/lib/serverFetch";
import type { MatchesBlob, PerformanceBlob } from "@/lib/types";

export default async function Page() {
  const [matches, perf] = await Promise.all([
    fetchBlob<MatchesBlob>("matches"),
    fetchBlob<PerformanceBlob>("performance"),
  ]);
  return <MatchesClient initialMatches={matches} initialPerf={perf} />;
}
