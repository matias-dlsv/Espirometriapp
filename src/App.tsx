import { useState, useEffect } from "react";
import "./App.css";
import { Toaster } from "react-hot-toast";

import WelcomeScreen from "./views/WelcomeScreen";
import CasosClinicos from "./views/CasosClinicos";
import IngresarPaciente from "./views/IngresarPaciente";
import Maniobra from "./views/Maniobra";
import Corregir from "./views/Corregir";
import Interpolacion from "./views/Interpolacion";

import { readTextFile, exists, BaseDirectory } from "@tauri-apps/plugin-fs";
import { usePacientStore, Paciente } from "./store/pacientStore";

export type AppView =
  | "welcome"
  | "custom"
  | "clinical"
  | "maniobra"
  | "corregir"
  | "interpolacion";

export interface NavigationPayload {
  datosFlujoVolumen: number[][];
  datosVolumenTiempo: number[][];
}

function App() {
  const [currentView, setCurrentView] = useState<AppView>("welcome");
  const [previousView, setPreviousView] = useState<AppView>("welcome");
  const [navigationData, setNavigationData] =
    useState<NavigationPayload | null>(null);

  const setPacientes = usePacientStore((state) => state.setPacientes);

  useEffect(() => {
    const cargarPacientes = async () => {
      try {
        const fileName = "pacientes_db.json";
        const directory = BaseDirectory.AppData;

        if (await exists(fileName, { baseDir: directory })) {
          const contenido = await readTextFile(fileName, {
            baseDir: directory,
          });
          const pacientesDisco: Paciente[] = JSON.parse(contenido);
          setPacientes(pacientesDisco);
        }
      } catch (err) {
        console.error("Error al cargar pacientes:", err);
      }
    };

    cargarPacientes();
  }, []);

  const handleNavigate = (view: AppView, payload?: NavigationPayload) => {
    setPreviousView(currentView);
    setCurrentView(view);
    if (payload) {
      setNavigationData(payload);
    }
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
          onBack={() => setCurrentView(previousView)}
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
        <Interpolacion onBack={() => setCurrentView("maniobra")} />
      )}
    </main>
  );
}

export default App;
