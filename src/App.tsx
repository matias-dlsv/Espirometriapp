import "./App.css";
// 1. IMPORTAR EL TOASTER
import { Toaster } from "react-hot-toast";
import GraficoPaciente from "./components/GraficoPaciente";
import PacientForm from "./components/PacientForm";
import PacientItem from "./components/PacientItem"; // Ojo: ¿Lo usas aquí o dentro de List?
import PacientList from "./components/PacientList";

function App() {
  return (
    <main className="container">
      {/* 2. PONER EL COMPONENTE AQUÍ PARA QUE SE VEAN LOS MENSAJES */}
      <Toaster position="bottom-right" />

      <h1>Espirometría</h1>
      <div className="bg-neutral-950 h-screen w-screen text-white grid grid-cols-12">
        <div className="col-span-3 bg-zinc-900">
          <PacientForm />
          <PacientList />
        </div>
        <div className="col-span-9 bg-neutral-950">
          <GraficoPaciente />
        </div>
      </div>
    </main>
  );
}

export default App;
