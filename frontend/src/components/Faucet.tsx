import { useState, useEffect, useCallback } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useChainId } from "wagmi";
import { parseUnits } from "viem";
import { MOCK_USDM_SEPOLIA, MOCK_USDM_ABI, SEPOLIA_CHAIN_ID } from "../contract";

const FAUCET_AMOUNT = parseUnits("100", 18);
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function getLastClaim(address: string): number {
  try {
    return Number(localStorage.getItem(`faucet_${address}`) || "0");
  } catch {
    return 0;
  }
}

function setLastClaim(address: string) {
  try {
    localStorage.setItem(`faucet_${address}`, Date.now().toString());
  } catch {}
}

function getRemainingTime(address: string): number {
  const last = getLastClaim(address);
  if (!last) return 0;
  return Math.max(0, COOLDOWN_MS - (Date.now() - last));
}

export default function Faucet() {
  const chainId = useChainId();
  const { address } = useAccount();
  const [minted, setMinted] = useState(false);

  const { data: hash, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: MOCK_USDM_SEPOLIA,
    abi: MOCK_USDM_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useEffect(() => {
    if (isConfirmed) {
      setMinted(true);
      refetchBalance();
      if (address) setLastClaim(address);
    }
  }, [isConfirmed, refetchBalance, address]);

  const remaining = address ? getRemainingTime(address) : 0;
  const canClaim = remaining <= 0;

  const formatRemaining = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} min`;
  };

  const handleGetTokens = () => {
    if (!address || !canClaim) return;
    writeContract({
      address: MOCK_USDM_SEPOLIA,
      abi: MOCK_USDM_ABI,
      functionName: "mint",
      args: [address, FAUCET_AMOUNT],
    });
  };

  if (chainId !== SEPOLIA_CHAIN_ID) {
    return (
      <div style={{ background: "#1a1a2e", borderRadius: 16, padding: 24, textAlign: "center" }}>
        <p style={{ color: "#f0c040" }}>Conéctate a Celo Sepolia para obtener tokens de prueba</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#1a1a2e", borderRadius: 16, padding: 24 }}>
      <h3 style={{ margin: "0 0 16px", color: "#e94560" }}>Faucet de Prueba</h3>
      <p style={{ color: "#aaa", fontSize: 14, marginBottom: 16 }}>
        Obtén 100 USDm de prueba cada 24 horas.
      </p>

      {balance && (
        <p style={{ color: "#4caf50", fontSize: 14, marginBottom: 16 }}>
          Tu balance: {Number(balance) / 1e18} USDm
        </p>
      )}

      <button
        onClick={handleGetTokens}
        disabled={isPending || !address || !canClaim}
        style={{
          padding: 14,
          borderRadius: 8,
          border: "none",
          background: isPending || !canClaim ? "#333" : "#f0c040",
          color: isPending || !canClaim ? "#666" : "#000",
          fontSize: 16,
          fontWeight: 600,
          cursor: isPending || !address || !canClaim ? "not-allowed" : "pointer",
          opacity: isPending ? 0.7 : 1,
          width: "100%",
        }}
      >
        {isPending
          ? "Confirmando..."
          : canClaim
          ? "Obtener 100 USDm"
          : `Espera ${formatRemaining(remaining)}`}
      </button>

      {isConfirming && <p style={{ color: "#f0c040", marginTop: 12 }}>Minteando tokens...</p>}
      {isConfirmed && minted && (
        <p style={{ color: "#4caf50", marginTop: 12 }}>
          100 USDm minteados. Vuelve en 24h para más.
        </p>
      )}
    </div>
  );
}