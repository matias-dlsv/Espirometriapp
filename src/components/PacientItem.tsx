// src/components/PacienteItem.tsx
import { Paciente } from "../store/pacientStore";

interface Props {
  paciente: Paciente;
}

function PacienteItem({ paciente }: Props) {
  return (
    <div
      className="bg-zinc-800 p-4 rounded hover:bg-zinc-700 cursor-pointer transition-colors flex justify-between items-center"
      onClick={() => {
        console.log("Click en paciente:", paciente.nombre);
        // Aquí podrías navegar a una página de detalles en el futuro
      }}
    >
      <div>
        <h3 className="text-white font-bold text-lg">{paciente.nombre}</h3>
        <p className="text-gray-400 text-sm">
          Edad: {paciente.edad} | Sexo: {paciente.sexo} | Talla (cm):{" "}
          {paciente.talla} | Raza: {paciente.raza}
        </p>
      </div>

      {/* Ejemplo de etiqueta visual */}
      <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">
        {paciente.fechaRegistro}
      </span>
    </div>
  );
}

export default PacienteItem;
