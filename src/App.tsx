import "./App.css";
import GraficoPaciente from "./components/GraficoPaciente";
import PacientForm from "./components/PacientForm";
import PacientItem from "./components/PacientItem";
import PacientList from "./components/PacientList";
function App() {
  return (
    <main className="container">
      <h1>Espirometría</h1>
      <div className="bg-neutral-950 h-screen w-screen text-white grid grid-cols-12">
        <div className="col-span-9 bg-neutral-950">
          <GraficoPaciente />
        </div>
        <div className="col-span-3 bg-zinc-900">
          <PacientForm />

          <PacientList />
        </div>
      </div>
    </main>
  );
}

export default App;
