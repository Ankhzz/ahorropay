import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider, http, createConfig, useAccount, useConnect, useDisconnect, useReadContract } from "wagmi";
import { celo, celoSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected } from "wagmi/connectors";
import App from "./App";
import { useEffect } from "react";
import { MOCK_USDM_SEPOLIA, MOCK_USDM_ABI, SEPOLIA_CHAIN_ID } from "./contract";

const config = createConfig({
  chains: [celo, celoSepolia],
  connectors: [injected()],
  transports: {
    [celo.id]: http("https://forno.celo.org"),
    [celoSepolia.id]: http("https://forno.celo-sepolia.celo-testnet.org"),
  },
});

const queryClient = new QueryClient();

function Root() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { chainId } = useAccount();

  const stablecoinAddr = chainId === SEPOLIA_CHAIN_ID ? MOCK_USDM_SEPOLIA : MOCK_USDM_SEPOLIA;

  const { data: usdmBalance } = useReadContract({
    address: stablecoinAddr,
    abi: MOCK_USDM_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useEffect(() => {
    const isMiniPay = typeof window !== "undefined" && (window as any).ethereum?.isMiniPay;
    if (isMiniPay && !isConnected) {
      connect({ connector: connectors[0] });
    }
  }, [connect, connectors, isConnected]);

  const handleConnect = () => connect({ connector: connectors[0] });
  const balance = usdmBalance ? Number(usdmBalance) / 1e18 : 0;

  return (
    <div>
      <header style={{
        background: "#0f3460",
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "#fff",
      }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>AhorroPay</h1>
        <div>
          {isConnected ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14, color: "#4caf50", fontWeight: 600 }}>
                {balance.toFixed(2)} USDm
              </span>
              <button onClick={() => disconnect()} style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #e94560",
                background: "transparent",
                color: "#e94560",
                cursor: "pointer",
              }}>
                {address.slice(0, 6)}...{address.slice(-4)}
              </button>
            </div>
          ) : (
            <button onClick={handleConnect} style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "#e94560",
              color: "#fff",
              cursor: "pointer",
            }}>
              Conectar Wallet
            </button>
          )}
        </div>
      </header>

      {isConnected ? (
        <main style={{ padding: "24px", maxWidth: 600, margin: "0 auto" }}>
          <App />
        </main>
      ) : (
        <main style={{ padding: "48px 24px", maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>$</div>
          <h2 style={{ color: "#fff", fontSize: 28, margin: "0 0 12px" }}>AhorroPay</h2>
          <p style={{ color: "#aaa", fontSize: 18, margin: "0 0 32px", lineHeight: 1.6 }}>
            Circulos de ahorro grupales en Celo.
            <br />
            La tanda digital, segura y transparente.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 36 }}>
            {[
              { step: "1", title: "Crea un circulo", desc: "Define el monto, la duracion y los participantes" },
              { step: "2", title: "Invita miembros", desc: "Cada quien se une con su wallet y contribuye" },
              { step: "3", title: "Recibe tu tanda", desc: "Por turnos, cada miembro cobra el pozo completo" },
            ].map((item) => (
              <div key={item.step} style={{
                display: "flex", alignItems: "center", gap: 16,
                background: "#1a1a2e", borderRadius: 12, padding: "16px 20px", textAlign: "left",
              }}>
                <div style={{
                  background: "#e94560", color: "#fff", width: 32, height: 32,
                  borderRadius: "50%", display: "flex", alignItems: "center",
                  justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0,
                }}>{item.step}</div>
                <div>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{item.title}</div>
                  <div style={{ color: "#aaa", fontSize: 13 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleConnect} style={{
            padding: "16px 40px", borderRadius: 12, border: "none",
            background: "#e94560", color: "#fff", fontSize: 18, fontWeight: 700,
            cursor: "pointer", width: "100%",
          }}>
            Conectar Wallet para empezar
          </button>

          <p style={{ color: "#666", fontSize: 12, marginTop: 24 }}>
            Compatible con MiniPay, MetaMask y wallets de Celo
          </p>
        </main>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Root />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);