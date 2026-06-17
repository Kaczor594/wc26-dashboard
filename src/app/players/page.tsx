import PlayersClient from "./PlayersClient";
import { fetchBlob } from "@/lib/serverFetch";
import type { PlayersBlob } from "@/lib/types";

export default async function Page() {
  const players = await fetchBlob<PlayersBlob>("players");
  return <PlayersClient initialPlayers={players} />;
}
