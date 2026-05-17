import { useReadContract, useAccount, useChainId } from "wagmi";
import { getAhorroPayAddress, AHORROPAY_ABI } from "../contract";

const STATE_LABELS = ["Pendiente", "Activo", "Completado", "Disputa"];
const STATE_COLORS: Record<string, string> = {
  Pendiente: "#f0c040", Activo: "#4caf50", Completado: "#888", Disputa: "#e94560",
};

export default function CircleList() {
  const chainId = useChainId();
  const { address } = useAccount();

  const { data: circleIds } = useReadContract({
    address: getAhorroPayAddress(chainId),
    abi: AHORROPAY_ABI,
    functionName: "getCirclesByHolder",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const ids = circleIds ? Array.from(circleIds) : [];

  return (
    <div>
      <h3 style={{ margin: "0 0 16px", color: "#e94560" }}>Mis Círculos</h3>
      {ids.length === 0 ? (
        <p style={{ color: "#888" }}>No tienes círculos aún.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ids.map((id) => <CircleCard key={id.toString()} circleId={id} />)}
        </div>
      )}
    </div>
  );
}

function CircleCard({ circleId }: { circleId: bigint }) {
  const chainId = useChainId();
  const { address } = useAccount();
  const { data: circle } = useReadContract({
    address: getAhorroPayAddress(chainId),
    abi: AHORROPAY_ABI,
    functionName: "getCircle",
    args: [circleId],
  });

  if (!circle) return null;
  const [creator, amount, , maxMembers, memberCount, currentRound, , receiver, state] = circle as any;
  const label = STATE_LABELS[Number(state)] || "Desconocido";

  return (
    <div style={{ background: "#1a1a2e", borderRadius: 12, padding: 16, border: "1px solid #333" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ color: "#fff", fontWeight: 600 }}>Circulo #{circleId.toString()}</span>
        <span style={{ color: STATE_COLORS[label], background: `${STATE_COLORS[label]}20`, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 14, color: "#aaa", lineHeight: 1.8 }}>
        <div>Monto: <strong>{Number(amount) / 1e18} USDm</strong></div>
        <div>Miembros: <strong>{Number(memberCount)}/{Number(maxMembers)}</strong></div>
        {Number(state) === 1 && (
          <div>
            Ronda: <strong>{Number(currentRound) + 1}/{Number(memberCount)}</strong>
            {address?.toLowerCase() === (receiver as string)?.toLowerCase() && (
              <span style={{ color: "#4caf50", marginLeft: 8 }}>Es tu turno</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}