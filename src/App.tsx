import { useState } from "react";
import "./App.css";
import { Toaster } from "react-hot-toast";

// IMPORTAR TUS NUEVAS VISTAS
import WelcomeScreen from "./views/WelcomeScreen";
import CasosClinicos from "./views/CasosClinicos";
import IngresarPaciente from "./views/IngresarPaciente";
import Maniobra from "./views/Maniobra";
import Corregir from "./views/Corregir";
import Interpolacion from "./views/Interpolacion";

// Defines el tipo de vistas
export type AppView =
  | "welcome"
  | "custom"
  | "clinical"
  | "maniobra"
  | "corregir"
  | "interpolacion";

// Definimos la interfaz de los datos que viajan entre componentes
export interface NavigationPayload {
  datosFlujoVolumen: number[][];
  datosVolumenTiempo: number[][];
}

function App() {
  const [currentView, setCurrentView] = useState<AppView>("welcome");

  // NUEVO: Estado para almacenar los datos (payload) que viajan entre las vistas
  const [navigationData, setNavigationData] =
    useState<NavigationPayload | null>(null);

  // NUEVO: Función centralizada para manejar la navegación y recibir datos
  const handleNavigate = (view: AppView, payload?: NavigationPayload) => {
    setCurrentView(view);
    if (payload) {
      setNavigationData(payload); // Si vienen datos, los guardamos en el estado
    }
  };

  return (
    <main className="dark text-zinc-100 bg-neutral-950 h-screen w-screen overflow-hidden font-sans">
      {/* Toaster Global */}
      <Toaster
        position="bottom-right"
        toastOptions={{ style: { background: "#333", color: "#fff" } }}
      />

      {/* Renderizado Condicional Limpio */}
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
          onBack={() => setCurrentView("custom")}
          onNavigate={handleNavigate}
        />
      )}

      {currentView === "corregir" && (
        <Corregir
          onBack={() => setCurrentView("maniobra")}
          onNavigate={handleNavigate} // <-- ¡FALTABA ESTO!
          data={navigationData}
        />
      )}

      {currentView === "interpolacion" && (
        <Interpolacion
          onBack={() => setCurrentView("maniobra")} // Te sugiero que al terminar vuelva al inicio ('welcome') o al perfil del paciente
        />
      )}
    </main>
  );
}

export default App;
