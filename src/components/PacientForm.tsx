import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  writeTextFile,
  readTextFile,
  BaseDirectory,
  exists,
  mkdir,
} from "@tauri-apps/plugin-fs";
// Importamos el hook Y la interfaz 'Paciente' para tipar los datos
import { usePacientStore, Paciente } from "../store/pacientStore";

function PacientForm() {
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState("");
  const [talla, setTalla] = useState("");
  const [raza, setRaza] = useState("");

  const addPaciente = usePacientStore((state) => state.addPaciente);
  const pacientes = usePacientStore((state) => state.pacientes);

  const rangosEdad = [
    "0-10",
    "10-20",
    "20-30",
    "30-40",
    "40-50",
    "50-60",
    "60-70",
    "70-80",
    "80-90",
    "90+",
  ];

  // AGREGAMOS TIPO AQUÍ: React.FormEvent
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!nombre.trim() || !edad || !sexo || !talla || !raza) {
      toast.error("Por favor completa todos los campos", {
        style: { background: "#202020", color: "#fff" },
      });
      return;
    }

    const existe = pacientes.some(
      (p) => p.nombre.toLowerCase() === nombre.toLowerCase()
    );

    if (existe) {
      toast.error("Este paciente ya existe", {
        style: { background: "#202020", color: "#fff" },
      });
      return;
    }

    // --- CORRECCIÓN LÓGICA DE ALTURA REAL ---
    const tallaNum = Number(talla);

    // Validamos que sea un número y un rango humano realista (ej: 20cm a 300cm)
    if (isNaN(tallaNum) || tallaNum < 20 || tallaNum > 300) {
      toast.error("Ingresa una altura real en cm (entre 20 y 300)", {
        style: { background: "#202020", color: "#fff" },
      });
      return;
    }
    // ----------------------------------------

    try {
      // AGREGAMOS TIPO AQUÍ: Forzamos que esto sea un 'Paciente'
      const nuevoPaciente: Paciente = {
        id: crypto.randomUUID(),
        nombre,
        edad,
        sexo,
        talla: tallaNum, // Usamos la variable numérica ya convertida
        raza,
        fechaRegistro: new Date().toLocaleDateString(),
        espirometrias: [],
      };

      const fileName = "pacientes_db.json";
      const directory = BaseDirectory.AppData;

      if (!(await exists("", { baseDir: directory }))) {
        await mkdir("", { baseDir: directory, recursive: true });
      }

      // AGREGAMOS TIPO AQUÍ: Definimos que es un array de Pacientes
      let dataDisco: Paciente[] = [];

      if (await exists(fileName, { baseDir: directory })) {
        const contenido = await readTextFile(fileName, { baseDir: directory });
        dataDisco = JSON.parse(contenido);
      }

      dataDisco.push(nuevoPaciente);

      await writeTextFile(fileName, JSON.stringify(dataDisco, null, 2), {
        baseDir: directory,
      });

      addPaciente(nuevoPaciente);

      setNombre("");
      setEdad("");
      setSexo("");
      setTalla("");
      setRaza("");

      toast.success("Paciente guardado", {
        duration: 2000,
        position: "bottom-right",
        style: { background: "#202020", color: "#fff" },
      });
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar archivo");
    }
  };

  return (
    <form onSubmit={onSubmit} className="p-4 bg-zinc-900 rounded-md">
      <input
        type="text"
        placeholder="Nombre del Paciente"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        autoFocus
        className="w-full bg-zinc-800 text-white p-2 mb-2 rounded border-none outline-none focus:ring-1 focus:ring-blue-500"
      />

      <select
        value={edad}
        onChange={(e) => setEdad(e.target.value)}
        className="w-full bg-zinc-800 text-white p-2 mb-2 rounded border-none outline-none"
      >
        <option value="">Rango de edad</option>
        {rangosEdad.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <select
        value={sexo}
        onChange={(e) => setSexo(e.target.value)}
        className="w-full bg-zinc-800 text-white p-2 mb-4 rounded border-none outline-none"
      >
        <option value="">Sexo</option>
        <option value="Masculino">Masculino</option>
        <option value="Femenino">Femenino</option>
      </select>

      <input
        type="number"
        placeholder="Talla (cm)"
        value={talla}
        onChange={(e) => setTalla(e.target.value)}
        className="w-full bg-zinc-800 text-white p-2 mb-4 rounded border-none outline-none"
      />

      <select
        value={raza}
        onChange={(e) => setRaza(e.target.value)}
        className="w-full bg-zinc-800 text-white p-2 mb-4 rounded border-none outline-none"
      >
        <option value="">Raza</option>
        <option value="Caucásico">Caucásico</option>
        <option value="Afrodescendiente">Afrodescendiente</option>
        <option value="Asiatico">Asiatico</option>
      </select>

      <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded">
        Guardar
      </button>
    </form>
  );
}

export default PacientForm;
