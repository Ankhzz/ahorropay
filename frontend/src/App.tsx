import CreateCircle from "./components/CreateCircle";
import CircleList from "./components/CircleList";
import Contribute from "./components/Contribute";
import Faucet from "./components/Faucet";
import { useState } from "react";

export default function App() {
  const [tab, setTab] = useState<"create" | "list" | "contribute" | "faucet">("create");

  return (
    <div>
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 24,
        background: "#1a1a2e",
        borderRadius: 12,
        padding: 4,
      }}>
        {[
          { key: "create", label: "Crear" },
          { key: "list", label: "Mis Círculos" },
          { key: "contribute", label: "Contribuir" },
          { key: "faucet", label: "Faucet" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: tab === t.key ? "#e94560" : "transparent",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "create" && <CreateCircle />}
      {tab === "list" && <CircleList />}
      {tab === "contribute" && <Contribute circleId={0n} />}
      {tab === "faucet" && <Faucet />}
    </div>
  );
}