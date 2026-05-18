import { useState } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useAccount,
  useChainId,
} from "wagmi";
import { getAhorroPayAddress, AHORROPAY_ABI, MOCK_USDM_SEPOLIA, MOCK_USDM_ABI, SEPOLIA_CHAIN_ID } from "../contract";

export default function JoinContribute() {
  const chainId = useChainId();
  const { address } = useAccount();
  const [joinId, setJoinId] = useState("");
  const [selectedId, setSelectedId] = useState<bigint | null>(null);

  const { data: joinHash, isPending: isJoining, writeContract: writeJoin } = useWriteContract();
  const { isLoading: isJoinConfirming, isSuccess: isJoinSuccess } = useWaitForTransactionReceipt({ hash: joinHash });

  const { data: contributeHash, isPending: isContributing, writeContract: writeContribute } = useWriteContract();
  const { isLoading: isContributeConfirming, isSuccess: isContributeSuccess } = useWaitForTransactionReceipt({ hash: contributeHash });

  const { data: circleIdsRaw } = useReadContract({
    address: getAhorroPayAddress(chainId),
    abi: AHORROPAY_ABI,
    functionName: "getCirclesByHolder",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Derive typed ids
  const circleIds: readonly bigint[] | undefined = circleIdsRaw as readonly bigint[] | undefined;

  const { data: circleData } = useReadContract({
    address: getAhorroPayAddress(chainId),
    abi: AHORROPAY_ABI,
    functionName: "getCircle",
    args: selectedId !== null ? [selectedId] : undefined,
    query: { enabled: selectedId !== null },
  });

  const stablecoinAddr = chainId === SEPOLIA_CHAIN_ID ? MOCK_USDM_SEPOLIA : MOCK_USDM_SEPOLIA;

  const { data: usdmBalance, refetch: refetchBalance } = useReadContract({
    address: stablecoinAddr,
    abi: MOCK_USDM_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const ids = circleIds ? Array.from(circleIds) : [];

  const amountPerRound = circleData ? Number((circleData as any)[1]) / 1e18 : 0;
  const balance = usdmBalance ? Number(usdmBalance) / 1e18 : 0;

  const contrib = () => {
    if (selectedId === null) return;
    writeContribute({
      address: getAhorroPayAddress(chainId),
      abi: AHORROPAY_ABI,
      functionName: "contribute",
      args: [selectedId],
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ background: "#1a1a2e", borderRadius: 16, padding: 24 }}>
        <h3 style={{ margin: "0 0 16px", color: "#e94560" }}>Unirse a un Círculo</h3>
        <p style={{ color: "#aaa", fontSize: 13, marginBottom: 12 }}>Pega el ID que te compartieron</p>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="number" placeholder="ID del círculo" value={joinId}
            onChange={(e) => setJoinId(e.target.value)} min="0"
            style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #333",
              background: "#16213e", color: "#fff", fontSize: 16 }} />
          <button onClick={() => writeJoin({
            address: getAhorroPayAddress(chainId), abi: AHORROPAY_ABI,
            functionName: "joinCircle", args: [BigInt(joinId)],
          })} disabled={isJoining || !joinId}
            style={{ padding: "12px 20px", borderRadius: 8, border: "none",
              background: isJoining ? "#666" : "#f0c040", color: "#000",
              fontWeight: 600, cursor: isJoining || !joinId ? "not-allowed" : "pointer",
              whiteSpace: "nowrap" }}>
            {isJoining ? "..." : "Unirse"}
          </button>
        </div>
        {isJoinConfirming && <p style={{ color: "#f0c040", marginTop: 8, fontSize: 13 }}>Confirmando...</p>}
        {isJoinSuccess && <p style={{ color: "#4caf50", marginTop: 8, fontSize: 13 }}>Te uniste al círculo!</p>}
      </div>

      <div style={{ background: "#1a1a2e", borderRadius: 16, padding: 24 }}>
        <h3 style={{ margin: "0 0 16px", color: "#e94560" }}>Contribuir</h3>
        <p style={{ color: "#aaa", fontSize: 13, marginBottom: 12 }}>
          Tu balance: <strong style={{ color: "#4caf50" }}>{balance.toFixed(2)} USDm</strong>
        </p>

        {ids.length === 0 ? (
          <p style={{ color: "#888", fontSize: 14 }}>No tienes círculos. Crea uno o únete a uno primero.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ids.map((id: bigint) => (
              <button key={id.toString()} onClick={() => setSelectedId(id)}
                style={{ padding: "12px 16px", borderRadius: 8,
                  border: selectedId === id ? "2px solid #e94560" : "1px solid #333",
                  background: selectedId === id ? "#16213e" : "#1a1a2e",
                  color: "#fff", cursor: "pointer", textAlign: "left", fontSize: 14 }}>
                Circulo #{id.toString()}
                {selectedId === id && " ← seleccionado"}
              </button>
            ))}
          </div>
        )}

        {selectedId !== null && (
          <div style={{ marginTop: 16, background: "#0f3460", borderRadius: 12, padding: 16, fontSize: 14, lineHeight: 1.8 }}>
            <div style={{ color: "#fff" }}>Monto a contribuir: <strong>{amountPerRound.toFixed(2)} USDm</strong></div>
            <div style={{ color: balance >= amountPerRound ? "#4caf50" : "#e94560" }}>
              Tu balance: <strong>{balance.toFixed(2)} USDm</strong>
            </div>
            {balance < amountPerRound && (
              <p style={{ color: "#e94560", fontSize: 12, margin: "8px 0 0" }}>
                No tienes suficiente USDm. Ve al tab Faucet para obtener tokens de prueba.
              </p>
            )}
          </div>
        )}

        {selectedId !== null && (
          <button onClick={contrib} disabled={isContributing || balance < amountPerRound}
            style={{ marginTop: 16, padding: 14, borderRadius: 8, border: "none",
              background: isContributing || balance < amountPerRound ? "#333" : "#4caf50",
              color: "#fff", fontSize: 16, fontWeight: 600,
              cursor: isContributing || balance < amountPerRound ? "not-allowed" : "pointer",
              width: "100%" }}>
            {isContributing
              ? "Confirmando..."
              : balance < amountPerRound
                ? "Saldo insuficiente"
                : `Contribuir ${amountPerRound.toFixed(2)} USDm`}
          </button>
        )}

        {isContributeConfirming && <p style={{ color: "#f0c040", marginTop: 8, fontSize: 13 }}>Contribuyendo...</p>}
        {isContributeSuccess && <p style={{ color: "#4caf50", marginTop: 8, fontSize: 13 }}>Contribucion exitosa!</p>}
      </div>
    </div>
  );
}