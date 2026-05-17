import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useChainId } from "wagmi";
import { parseUnits } from "viem";
import { MOCK_USDM_SEPOLIA, MOCK_USDM_ABI, SEPOLIA_CHAIN_ID } from "../contract";

const FAUCET_AMOUNT = parseUnits("100", 18);

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
    }
  }, [isConfirmed, refetchBalance]);

  const handleGetTokens = () => {
    if (!address) return;
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
        Obtén USDm de prueba para contribuir a círculos en testnet.
      </p>

      {balance && (
        <p style={{ color: "#4caf50", fontSize: 14, marginBottom: 16 }}>
          Tu balance: {Number(balance) / 1e18} USDm
        </p>
      )}

      <button
        onClick={handleGetTokens}
        disabled={isPending || !address}
        style={{
          padding: 14,
          borderRadius: 8,
          border: "none",
          background: isPending ? "#666" : "#f0c040",
          color: "#000",
          fontSize: 16,
          fontWeight: 600,
          cursor: isPending || !address ? "not-allowed" : "pointer",
          opacity: isPending ? 0.7 : 1,
          width: "100%",
        }}
      >
        {isPending ? "Confirmando..." : `Obtener 100 USDm`}
      </button>

      {isConfirming && <p style={{ color: "#f0c040", marginTop: 12 }}>Minteando tokens...</p>}
      {isConfirmed && minted && (
        <p style={{ color: "#4caf50", marginTop: 12 }}>
          100 USDm minteados a tu wallet. Recarga la página si no ves el cambio.
        </p>
      )}
    </div>
  );
}