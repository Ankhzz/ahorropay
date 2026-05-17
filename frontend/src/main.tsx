import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider, http, createConfig, useAccount, useConnect, useDisconnect } from "wagmi";
import { celo, celoSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected } from "wagmi/connectors";
import App from "./App";
import { useEffect } from "react";

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
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    const isMiniPay = typeof window !== "undefined" && (window as any).ethereum?.isMiniPay;
    if (isMiniPay && !isConnected) {
      connect();
    }
  }, [connect, isConnected]);

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
          ) : (
            <button onClick={() => connect()} style={{
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
      <main style={{ padding: "24px", maxWidth: 600, margin: "0 auto" }}>
        {isConnected ? <App /> : <p style={{ textAlign: "center", color: "#888" }}>Conecta tu wallet para empezar</p>}
      </main>
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