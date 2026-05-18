import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { getAhorroPayAddress, AHORROPAY_ABI } from "../contract";

interface EventLog {
  type: "created" | "joined" | "contributed" | "claimed";
  circleId: string;
  round?: string;
  amount?: string;
  timestamp: number;
}

export default function History() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [events, setEvents] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!address || !publicClient) return;
    fetchEvents();
  }, [address, publicClient]);

  async function fetchEvents() {
    if (!address || !publicClient) return;
    setLoading(true);
    setError("");
    try {
      const chainId = await publicClient.getChainId();
      const contractAddr = getAhorroPayAddress(chainId);

      const findEvent = (name: string) =>
        AHORROPAY_ABI.find((e: any) => e.name === name) as any;

      const createdLogs = await publicClient.getLogs({
        address: contractAddr,
        event: findEvent("CircleCreated"),
        args: { creator: address } as any,
        fromBlock: 0n,
        toBlock: "latest",
      });

      const joinedLogs = await publicClient.getLogs({
        address: contractAddr,
        event: findEvent("MemberJoined"),
        args: { member: address } as any,
        fromBlock: 0n,
        toBlock: "latest",
      });

      const contributedLogs = await publicClient.getLogs({
        address: contractAddr,
        event: findEvent("ContributionMade"),
        args: { member: address } as any,
        fromBlock: 0n,
        toBlock: "latest",
      });

      const claimedLogs = await publicClient.getLogs({
        address: contractAddr,
        event: findEvent("PayoutClaimed"),
        args: { receiver: address } as any,
        fromBlock: 0n,
        toBlock: "latest",
      });

      const parsed: EventLog[] = [];

      const addLogs = async (logs: any[], type: EventLog["type"]) => {
        for (const log of logs) {
          try {
            const block = await publicClient.getBlock({ blockHash: log.blockHash });
            const args = log.args as any;
            parsed.push({
              type,
              circleId: args?.circleId?.toString() || "",
              round: args?.round?.toString(),
              timestamp: Number(block.timestamp),
            });
          } catch {
            parsed.push({
              type,
              circleId: "",
              timestamp: 0,
            });
          }
        }
      };

      await addLogs(createdLogs, "created");
      await addLogs(joinedLogs, "joined");
      await addLogs(contributedLogs, "contributed");
      await addLogs(claimedLogs, "claimed");

      parsed.sort((a, b) => b.timestamp - a.timestamp);
      setEvents(parsed);
    } catch (e) {
      console.error("Error fetching events fetch error:", e);
      setError("Error al cargar historial");
    }
    setLoading(false);
  }

  const timeAgo = (ts: number) => {
    if (ts === 0) return "";
    const diff = Math.floor((Date.now() / 1000 - ts) / 60);
    if (diff < 1) return "Ahora";
    if (diff < 60) return `Hace ${diff} min`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
  };

  const iconMap: Record<string, string> = {
    created: "➕",
    joined: "🚪",
    contributed: "💸",
    claimed: "💰",
  };

  const labelMap: Record<string, (e: EventLog) => string> = {
    created: (e) => `Creaste el círculo #${e.circleId}`,
    joined: (e) => `Te uniste al círculo #${e.circleId}`,
    contributed: (e) => `Contribuiste al #${e.circleId}, ronda ${e.round}`,
    claimed: (e) => `Cobraste del #${e.circleId}, ronda ${e.round}`,
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: "#e94560" }}>Historial</h3>
        <button onClick={fetchEvents} disabled={loading} style={{
          padding: "6px 12px", borderRadius: 6, border: "1px solid #333",
          background: "transparent", color: "#aaa", cursor: "pointer", fontSize: 12,
        }}>
          {loading ? "Cargando..." : "Recargar"}
        </button>
      </div>

      {error && <p style={{ color: "#e94560" }}>{error}</p>}

      {loading && <p style={{ color: "#888" }}>Cargando historial...</p>}

      {!loading && events.length === 0 && (
        <p style={{ color: "#888" }}>No hay actividad aún. Crea o únete a un círculo.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {events.map((e, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "#1a1a2e", borderRadius: 10, padding: "12px 16px",
          }}>
            <span style={{ fontSize: 20 }}>{iconMap[e.type]}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontSize: 14 }}>{labelMap[e.type](e)}</div>
              <div style={{ color: "#666", fontSize: 11 }}>{timeAgo(e.timestamp)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}