import { useState } from "react";
import "./App.css";
import { Toaster } from "react-hot-toast";

import WelcomeScreen from "./views/WelcomeScreen";
import CasosClinicos from "./views/CasosClinicos";
import IngresarPaciente from "./views/IngresarPaciente";
import Maniobra from "./views/Maniobra";
import Corregir from "./views/Corregir";
import Interpolacion from "./views/Interpolacion";
import Resultado from "./views/Resultado";

export type AppView =
  | "welcome"
  | "custom"
  | "clinical"
  | "maniobra"
  | "corregir"
  | "interpolacion"
  | "resultado";

export interface NavigationPayload {
  datosFlujoVolumen: number[][];
  datosVolumenTiempo: number[][];
  indices: {
    fvc: number;
    fev1: number;
    fev1fvc: number;
  };
  volResidual?: number;
  idxInicioExhalacionForzada?: number;
  vbe?: number;
}

function App() {
  const [currentView, setCurrentView] = useState<AppView>("welcome");
  // Guarda de dónde vino el usuario antes de entrar a maniobra.
  // Solo se actualiza cuando se entra a maniobra desde fuera del ciclo
  // corregir → maniobra, para que el botón "Volver" siempre regrese
  // al origen real (clinical o custom).
  const [origenManiobra, setOrigenManiobra] = useState<AppView>("welcome");
  const [navigationData, setNavigationData] =
    useState<NavigationPayload | null>(null);

  const handleNavigate = (view: AppView, payload?: NavigationPayload) => {
    // Registrar origen solo al entrar a maniobra desde fuera del ciclo
    console.log(`[Nav] ${currentView} → ${view}`);
    if (view === "maniobra" && currentView !== "corregir") {
      setOrigenManiobra(currentView);
    }

    // Al volver a maniobra limpiar datos de la maniobra anterior
    if (view === "maniobra") {
      setNavigationData(null);
    } else if (payload) {
      setNavigationData(payload);
    }

    setCurrentView(view);
  };

  return (
    <main className="dark text-zinc-100 bg-neutral-950 h-screen w-screen overflow-hidden font-sans">
      <Toaster
        position="bottom-right"
        toastOptions={{ style: { background: "#333", color: "#fff" } }}
      />

      {currentView === "welcome" && (
        <WelcomeScreen onNavigate={handleNavigate} />
      )}

      {currentView === "custom" && (
        <IngresarPaciente
          onBack={() => setCurrentView("welcome")}
          onNavigate={handleNavigate}
        />
      )}

      {currentView === "clinical" && (
        <CasosClinicos
          onBack={() => setCurrentView("welcome")}
          onNavigate={handleNavigate}
        />
      )}

      {currentView === "maniobra" && (
        <Maniobra
          onBack={() => setCurrentView(origenManiobra)}
          onNavigate={handleNavigate}
        />
      )}

      {currentView === "corregir" && (
        <Corregir
          onBack={() => setCurrentView("maniobra")}
          onNavigate={handleNavigate}
          data={navigationData}
        />
      )}

      {currentView === "interpolacion" && (
        <Interpolacion
          onBack={() => setCurrentView("maniobra")}
          onNavigate={handleNavigate}
        />
      )}

      {currentView === "resultado" && (
        <Resultado
          onBack={() => setCurrentView("interpolacion")}
          onNavigate={handleNavigate}
        />
      )}
    </main>
  );
}

export default App;
