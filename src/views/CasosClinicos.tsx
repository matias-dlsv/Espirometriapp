import { usePacientStore } from "../store/pacientStore";
import { CASOS_CLINICOS } from "../utils/transformaciones";
import { AppView } from "../App";

interface Props {
  onBack: () => void;
  onNavigate: (view: AppView) => void;
}

export default function CasosClinicos({ onBack, onNavigate }: Props) {
  const setPatron = usePacientStore((state) => state.setPatron);
  const pacienteActual = usePacientStore((state) => state.pacienteSeleccionado);

  const seleccionarCaso = (indice: number) => {
    setPatron(CASOS_CLINICOS[indice]);
    onNavigate("maniobra");
  };

  return (
    <div className="h-full flex flex-col items-center justify-center relative bg-neutral-950 text-white px-8">
      <button
        onClick={onBack}
        className="absolute top-6 left-6 text-neutral-400 hover:text-white transition"
      >
        ← Volver al menú
      </button>

      <h2 className="text-2xl font-bold text-emerald-500 mb-2">
        Casos Clínicos
      </h2>

      {pacienteActual && (
        <p className="text-neutral-400 text-sm mb-8">
          Paciente:{" "}
          <span className="text-white font-medium">
            {pacienteActual.nombre}
          </span>
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 w-full max-w-md">
        {CASOS_CLINICOS.map((caso, i) => (
          <button
            key={caso.nombre}
            onClick={() => seleccionarCaso(i)}
            className="flex items-center justify-between bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-emerald-500 text-left px-6 py-4 rounded-xl transition-all group"
          >
            <div>
              <p className="font-semibold text-white group-hover:text-emerald-400 transition">
                {caso.nombre}
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                {[
                  caso.obstruccion && "Obstrucción",
                  caso.restriccion && "Restricción",
                  caso.tos && "Tos",
                ]
                  .filter(Boolean)
                  .join(" · ") || "Patrón normal"}
              </p>
            </div>
            <span className="text-emerald-500 opacity-0 group-hover:opacity-100 transition text-lg">
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
