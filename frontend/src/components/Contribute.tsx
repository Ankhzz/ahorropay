import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { getAhorroPayAddress, AHORROPAY_ABI } from "../contract";

export default function Contribute({ circleId }: { circleId: bigint }) {
  const chainId = useChainId();
  const [cid, setCid] = useState(circleId.toString());
  const { data: hash, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const handleContribute = () => {
    if (!cid) return;
 writeContract({
      address: getAhorroPayAddress(chainId),
      abi: AHORROPAY_ABI,
      functionName: "contribute",
      args: [BigInt(cid)],
    });
  };

  return (
    <div style={{ background: "#1a1a2e", borderRadius: 16, padding: 24 }}>
      <h3 style={{ margin: "0 0 16px", color: "#e94560" }}>Contribuir</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input type="number" placeholder="ID del circulo" value={cid}
          onChange={(e) => setCid(e.target.value)} min="0"
          style={{ padding: 12, borderRadius: 8, border: "1px solid #333", background: "#16213e", color: "#fff", fontSize: 16 }} />
        <button onClick={handleContribute} disabled={isPending || !cid}
          style={{ padding: 14, borderRadius: 8, border: "none", background: "#4caf50", color: "#fff", fontSize: 16, fontWeight: 600, cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.7 : 1 }}>
          {isPending ? "Confirmando..." : "Contribuir (USDm)"}
        </button>
        {isConfirming && <p style={{ color: "#f0c040" }}>Confirmando...</p>}
      </div>
    </div>
  );
}