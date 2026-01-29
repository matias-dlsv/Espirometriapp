import { useState } from "react";
import "./App.css";
import { Toaster } from "react-hot-toast";

// IMPORTAR TUS NUEVAS VISTAS
import WelcomeScreen from "./views/WelcomeScreen";
import DashboardPersonalizado from "./views/DashboardPersonalizado";
import CasosClinicos from "./views/CasosClinicos";
import IngresarPaciente from "./views/IngresarPaciente";

// Defines el tipo aquí o en un archivo types.ts global si prefieres
export type AppView = "welcome" | "custom" | "clinical";

function App() {
  const [currentView, setCurrentView] = useState<AppView>("welcome");

  return (
    <main className="dark text-zinc-100 bg-neutral-950 h-screen w-screen overflow-hidden font-sans">
      {/* Toaster Global */}
      <Toaster
        position="bottom-right"
        toastOptions={{ style: { background: "#333", color: "#fff" } }}
      />

      {/* Renderizado Condicional Limpio */}
      {currentView === "welcome" && (
        <WelcomeScreen onNavigate={(view) => setCurrentView(view)} />
      )}

      {currentView === "custom" && (
        <IngresarPaciente onBack={() => setCurrentView("welcome")} />
      )}

      {currentView === "clinical" && (
        <CasosClinicos onBack={() => setCurrentView("welcome")} />
      )}
    </main>
  );
}

export default App;
