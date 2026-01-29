interface Props {
  onBack: () => void;
}

export default function CasosClinicos({ onBack }: Props) {
  return (
    <div className="h-full flex flex-col items-center justify-center relative bg-neutral-950 text-white">
      <button
        onClick={onBack}
        className="absolute top-6 left-6 text-neutral-400 hover:text-white transition"
      >
        ← Volver al menú
      </button>
      <h2 className="text-2xl font-bold text-emerald-500 mb-4">
        Casos Clínicos
      </h2>
      <p className="text-neutral-500">Biblioteca de casos en construcción...</p>
    </div>
  );
}
