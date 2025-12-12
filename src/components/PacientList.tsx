import { useEffect } from "react";
// En Tauri v2 usamos plugin-fs, no api/fs
import { readTextFile, BaseDirectory, exists } from "@tauri-apps/plugin-fs";
import { usePacientStore, Paciente } from "../store/pacientStore";
// Importamos tu componente individual (equivalente a SnippetItem)
import PacientItem from "./PacientItem";

function PacientList() {
  // 1. Accedemos al store (Igual que el video)
  const setPacientes = usePacientStore((state) => state.setPacientes);
  const pacientes = usePacientStore((state) => state.pacientes);

  useEffect(() => {
    async function loadFiles() {
      try {
        const fileName = "pacientes_db.json";
        const directory = BaseDirectory.AppData;

        // A. Verificamos si existe la base de datos
        const archivoExiste = await exists(fileName, { baseDir: directory });

        if (archivoExiste) {
          // B. Leemos EL contenido del archivo (En vez de listar archivos con readDir)
          const contenido = await readTextFile(fileName, {
            baseDir: directory,
          });

          // C. Convertimos el texto JSON a un Array de objetos
          const datos: Paciente[] = JSON.parse(contenido);

          // D. Guardamos en el Store
          setPacientes(datos);
        }
      } catch (error) {
        console.error("Error cargando pacientes:", error);
      }
    }

    loadFiles();
  }, []); // Se ejecuta solo al montar el componente

  if (pacientes.length === 0) {
    return <p className="text-white p-4">No hay pacientes registrados.</p>;
  }

  return (
    <div className="grid gap-2 p-2">
      {/* Aquí está la diferencia clave con el video:
         El video mapeaba nombres de archivo (strings).
         Tú mapeas OBJETOS completos con id, nombre, edad, etc.
      */}
      {[...pacientes].reverse().map((paciente) => (
        <PacientItem key={paciente.id} paciente={paciente} />
      ))}
    </div>
  );
}

export default PacientList;
