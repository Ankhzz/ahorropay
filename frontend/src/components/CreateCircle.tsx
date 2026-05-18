import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { parseUnits } from "viem";
import { getAhorroPayAddress, AHORROPAY_ABI } from "../contract";

const PRESETS = [7, 15, 30];

export default function CreateCircle() {
  const chainId = useChainId();
  const [amount, setAmount] = useState("");
  const [durationDays, setDurationDays] = useState<number | null>(null);
  const [customDays, setCustomDays] = useState("");
  const [maxMembers, setMaxMembers] = useState("");

  const { data: hash, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const selectedDays = durationDays ?? (customDays ? Number(customDays) : 0);
  const durationSeconds = selectedDays > 0 ? BigInt(selectedDays * 86400) : 0n;
  const members = maxMembers ? Number(maxMembers) : 0;
  const payoutPerTurn = members > 0 && Number(amount) > 0
    ? (members - 1) * Number(amount)
    : 0;

  const isValid = Number(amount) > 0 && selectedDays > 0 && members >= 2 && members <= 20;

  const handleCreate = () => {
    if (!isValid) return;
    writeContract({
      address: getAhorroPayAddress(chainId),
      abi: AHORROPAY_ABI,
      functionName: "createCircle",
      args: [parseUnits(amount, 18), durationSeconds, BigInt(members)],
    });
  };

  return (
    <div style={{ background: "#1a1a2e", borderRadius: 16, padding: 24 }}>
      <h3 style={{ margin: "0 0 16px", color: "#e94560" }}>Crear Círculo</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        <div>
          <label style={{ color: "#ccc", fontSize: 14, fontWeight: 600, display: "block", marginBottom: 6 }}>
            ¿Cuánto aporta cada quien por ronda?
          </label>
          <input type="number" placeholder="Ej: 10" value={amount}
            onChange={(e) => setAmount(e.target.value)} min="0.01" step="0.01"
            style={inputStyle} />
        </div>

        <div>
          <label style={{ color: "#ccc", fontSize: 14, fontWeight: 600, display: "block", marginBottom: 6 }}>
            ¿Cada cuánto se paga la tanda?
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            {PRESETS.map((d) => (
              <button key={d} onClick={() => { setDurationDays(d); setCustomDays(""); }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: durationDays === d ? "#e94560" : "#16213e",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: durationDays === d ? 700 : 400,
                }}>
                Cada {d} días
              </button>
            ))}
            <button onClick={() => { setDurationDays(null); setCustomDays(""); }}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #333",
                background: "transparent",
                color: durationDays === null && !customDays ? "#e94560" : "#888",
                cursor: "pointer",
                fontSize: 14,
              }}>
              Personalizado
            </button>
          </div>
          {durationDays === null && (
            <input type="number" placeholder="Días" value={customDays}
              onChange={(e) => setCustomDays(e.target.value)} min="1"
              style={inputStyle} />
          )}
        </div>

        <div>
          <label style={{ color: "#ccc", fontSize: 14, fontWeight: 600, display: "block", marginBottom: 6 }}>
            ¿Cuántas personas participan?
          </label>
          <input type="number" placeholder="Mínimo 2, máximo 20" value={maxMembers}
            onChange={(e) => setMaxMembers(e.target.value)} min="2" max="20"
            style={inputStyle} />
          {maxMembers && (Number(maxMembers) < 2 || Number(maxMembers) > 20) && (
            <p style={{ color: "#e94560", fontSize: 12, margin: "4px 0 0" }}>
              Debe ser entre 2 y 20 personas
            </p>
          )}
        </div>

        {isValid && (
          <div style={{
            background: "#0f3460",
            borderRadius: 12,
            padding: 16,
            fontSize: 14,
            lineHeight: 1.8,
          }}>
            <div style={{ color: "#fff", fontWeight: 600, marginBottom: 8 }}>Resumen</div>
            <div style={{ color: "#aaa" }}>
              {members} miembros · {amount} USDm c/u · Cada {selectedDays} días
            </div>
            <div style={{ color: "#4caf50", marginTop: 4 }}>
              Cuando sea tu turno, recibes {payoutPerTurn.toFixed(2)} USDm
            </div>
          </div>
        )}

        <button onClick={handleCreate} disabled={!isValid || isPending}
          style={{
            ...btnStyle,
            opacity: !isValid || isPending ? 0.5 : 1,
            cursor: !isValid || isPending ? "not-allowed" : "pointer",
          }}>
          {isPending ? "Confirmando en tu wallet..." : "Crear Círculo"}
        </button>

        {isConfirming && <p style={{ color: "#f0c040" }}>Transacción enviada, esperando confirmación...</p>}
        {isConfirmed && (
          <div style={{
            background: "#1b5e20",
            borderRadius: 12,
            padding: 16,
            color: "#fff",
            textAlign: "center",
          }}>
            ¡Círculo creado! Ve a la pestaña "Mis Círculos" para verlo.
          </div>
      )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 12, borderRadius: 8, border: "1px solid #333",
  background: "#16213e", color: "#fff", fontSize: 16, width: "100%", boxSizing: "border-box",
};

const btnStyle: React.CSSProperties = {
  padding: 14, borderRadius: 8, border: "none", background: "#e94560",
  color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer",
};