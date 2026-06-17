import TournamentClient from "./TournamentClient";
import { fetchBlob } from "@/lib/serverFetch";
import type { Meta, TournamentBlob } from "@/lib/types";

export default async function Page() {
  const [tournament, meta] = await Promise.all([
    fetchBlob<TournamentBlob>("tournament"),
    fetchBlob<Meta>("meta"),
  ]);
  return (
    <TournamentClient initialTournament={tournament} initialMeta={meta} />
  );
}
