import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { parseUnits } from "viem";
import { getAhorroPayAddress, AHORROPAY_ABI } from "../contract";

export default function CreateCircle() {
  const chainId = useChainId();
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("86400");
  const [maxMembers, setMaxMembers] = useState("5");

  const { data: hash, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const handleCreate = () => {
    if (!amount || !duration || !maxMembers) return;
    writeContract({
      address: getAhorroPayAddress(chainId),
      abi: AHORROPAY_ABI,
      functionName: "createCircle",
      args: [parseUnits(amount, 18), BigInt(duration), BigInt(maxMembers)],
    });
  };

  return (
    <div style={{ background: "#1a1a2e", borderRadius: 16, padding: 24 }}>
      <h3 style={{ margin: "0 0 16px", color: "#e94560" }}>Crear Círculo</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input type="number" placeholder="Monto por ronda (USDm)" value={amount}
          onChange={(e) => setAmount(e.target.value)} min="0.01" step="0.01"
          style={inputStyle} />
        <input type="number" placeholder="Duración por ronda (segundos)" value={duration}
          onChange={(e) => setDuration(e.target.value)} min="3600" style={inputStyle} />
        <input type="number" placeholder="Máximo de miembros" value={maxMembers}
          onChange={(e) => setMaxMembers(e.target.value)} min="2" max="20" style={inputStyle} />
        <button onClick={handleCreate} disabled={isPending || !amount}
          style={{ ...btnStyle, opacity: isPending ? 0.7 : 1 }}>
          {isPending ? "Confirmando..." : "Crear Círculo"}
        </button>
        {isConfirming && <p style={{ color: "#f0c040" }}>Confirmando transacción...</p>}
        {isConfirmed && <p style={{ color: "#4caf50" }}>Circulo creado!</p>}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 12, borderRadius: 8, border: "1px solid #333",
  background: "#16213e", color: "#fff", fontSize: 16,
};

const btnStyle: React.CSSProperties = {
  padding: 14, borderRadius: 8, border: "none", background: "#e94560",
  color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer",
};