import { useState } from "react";
import { usePacientStore } from "../store/pacientStore";
import { CASOS_CLINICOS } from "../utils/transformaciones";
import { AppView } from "../App";
import { crearPacienteAleatorio } from "../utils/pacienteAleatorio";
import { toast } from "react-hot-toast";

interface Props {
  onBack: () => void;
  onNavigate: (view: AppView) => void;
}

export default function CasosClinicos({ onBack, onNavigate }: Props) {
  const setPatron          = usePacientStore((state) => state.setPatron);
  const addPaciente        = usePacientStore((state) => state.addPaciente);
  const seleccionarPaciente = usePacientStore((state) => state.seleccionarPaciente);
  const pacientes          = usePacientStore((state) => state.pacientes);

  const [cargando, setCargando] = useState(false);
  const [casoSeleccionado, setCasoSeleccionado] = useState<number | null>(null);

  const seleccionarCaso = async (indice: number) => {
    if (cargando) return;
    setCargando(true);
    setCasoSeleccionado(indice);

    try {
      const paciente = await crearPacienteAleatorio(
        addPaciente,
        seleccionarPaciente,
        pacientes,
      );

      setPatron(CASOS_CLINICOS[indice]);

      toast.success(`Paciente: ${paciente.nombre}`, {
        duration: 2500,
        position: "bottom-right",
        style: { background: "#202020", color: "#fff" },
      });

      onNavigate("maniobra");
    } catch (err) {
      console.error("Error al crear paciente aleatorio:", err);
      toast.error("Error al generar el paciente", {
        style: { background: "#202020", color: "#fff" },
      });
    } finally {
      setCargando(false);
      setCasoSeleccionado(null);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center relative bg-neutral-950 text-white px-8">
      <button
        onClick={onBack}
        disabled={cargando}
        className="absolute top-6 left-6 text-neutral-400 hover:text-white transition disabled:opacity-40"
      >
        ← Volver al menú
      </button>

      <h2 className="text-2xl font-bold text-emerald-500 mb-2">
        Casos Clínicos
      </h2>

      <p className="text-neutral-500 text-sm mb-8 text-center max-w-sm">
        Se generará un paciente aleatorio con los índices correspondientes
        al patrón elegido.
      </p>

      <div className="grid grid-cols-1 gap-4 w-full max-w-md">
        {CASOS_CLINICOS.map((caso, i) => {
          const estaCargando = cargando && casoSeleccionado === i;

          return (
            <button
              key={caso.nombre}
              onClick={() => seleccionarCaso(i)}
              disabled={cargando}
              className="flex items-center justify-between bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-emerald-500 text-left px-6 py-4 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div>
                <p className="font-semibold text-white group-hover:text-emerald-400 transition">
                  {caso.nombre}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {[
                    caso.obstruccion && "Obstrucción",
                    caso.restriccion && "Restricción",
                    caso.tos        && "Tos",
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Patrón normal"}
                </p>
              </div>

              <span className="text-emerald-500 text-lg w-6 flex justify-center">
                {estaCargando ? (
                  <span className="animate-spin inline-block">⟳</span>
                ) : (
                  <span className="opacity-0 group-hover:opacity-100 transition">→</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}