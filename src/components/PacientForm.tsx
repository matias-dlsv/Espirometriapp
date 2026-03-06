import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  writeTextFile,
  readTextFile,
  BaseDirectory,
  exists,
  mkdir,
} from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core"; // <-- 1. Importamos invoke para hablar con Rust
import {
  usePacientStore,
  Paciente,
  DatosEspirometria,
} from "../store/pacientStore"; // <-- Asegúrate de importar DatosEspirometria
import styles from "./PacientForm.module.css";

function PacientForm() {
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState("");
  const [talla, setTalla] = useState("");
  const [raza, setRaza] = useState("");
  const [peso, setPeso] = useState("");

  const addPaciente = usePacientStore((state) => state.addPaciente);
  const pacientes = usePacientStore((state) => state.pacientes);

  const rangosEdad = [
    "3-10",
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

  let error: boolean = false;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!nombre.trim() || !edad || !sexo || !talla || !raza || !peso) {
      toast.error("Por favor completa todos los campos", {
        style: { background: "#202020", color: "#fff" },
      });
      error = true;
      return;
    }

    const existe = pacientes.some(
      (p) => p.nombre.toLowerCase() === nombre.toLowerCase(),
    );

    if (existe) {
      toast.error("Este paciente ya existe", {
        style: { background: "#202020", color: "#fff" },
      });
      error = true;
    }

    const tallaNum = Number(talla);
    const pesoNum = Number(peso);

    if (isNaN(tallaNum) || tallaNum < 20 || tallaNum > 300) {
      toast.error("Ingresa una altura real en cm (entre 20 y 300)", {
        style: { background: "#202020", color: "#fff" },
      });
      error = true;
    }

    if (isNaN(pesoNum) || pesoNum < 20 || pesoNum > 300) {
      toast.error("Ingresa un peso real en kg (entre 20 y 300)", {
        style: { background: "#202020", color: "#fff" },
      });
      error = true;
    }

    if (error === true) {
      return;
    }

    try {
      // 2. LLAMADA A RUST: Pedimos los datos default de la espirometría
      // Nota cómo le pasamos 'datos' tal cual lo definimos en lib.rs
      const espirometriaDefault: DatosEspirometria = await invoke(
        "procesar_nuevo_paciente",
        {
          datos: {
            nombre: nombre,
            talla: tallaNum,
            peso: pesoNum,
            sexo: sexo,
            raza: raza,
          },
        },
      );

      // 3. Armamos el paciente y le inyectamos la respuesta de Rust
      const nuevoPaciente: Paciente = {
        id: crypto.randomUUID(),
        nombre,
        edad,
        sexo,
        talla: tallaNum,
        raza,
        peso: pesoNum,
        fechaRegistro: new Date().toLocaleDateString(),
        espirometrias: [espirometriaDefault], // <-- Aquí entra la magia de Rust
      };

      const fileName = "pacientes_db.json";
      const directory = BaseDirectory.AppData;

      if (!(await exists("", { baseDir: directory }))) {
        await mkdir("", { baseDir: directory, recursive: true });
      }

      let dataDisco: Paciente[] = [];

      if (await exists(fileName, { baseDir: directory })) {
        const contenido = await readTextFile(fileName, {
          baseDir: directory,
        });
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
      setPeso("");

      toast.success("Paciente guardado con datos base", {
        duration: 2000,
        position: "bottom-right",
        style: { background: "#202020", color: "#fff" },
      });
    } catch (err) {
      console.error("Error detallado:", err);
      toast.error("Error al procesar o guardar archivo");
    }
  };

  return (
    <form onSubmit={onSubmit} className={styles.formContainer}>
      {/* NOMBRE (Full Width) */}
      <input
        type="text"
        placeholder="Nombre del Paciente"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        autoFocus
        className={`${styles.inputField} ${styles.textInput}`}
      />

      {/* ZONA DE COLUMNAS */}
      <div className={styles.columnsWrapper}>
        {/* COLUMNA 1: Edad, Talla, Etnia (Raza) */}
        <div className={styles.columnGroup}>
          <select
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            className={styles.inputField}
          >
            <option value="" className={styles.optionItem}>
              Rango de edad
            </option>
            {rangosEdad.map((r) => (
              <option key={r} value={r} className={styles.optionItem}>
                {r}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Talla (cm)"
            value={talla}
            onChange={(e) => setTalla(e.target.value)}
            className={`${styles.inputField} ${styles.textInput}`}
          />

          <select
            value={raza}
            onChange={(e) => setRaza(e.target.value)}
            className={styles.inputField}
          >
            <option value="" className={styles.optionItem}>
              Raza / Etnia
            </option>
            <option value="Caucásico" className={styles.optionItem}>
              Caucásico
            </option>
            <option value="Afrodescendiente" className={styles.optionItem}>
              Afrodescendiente
            </option>
            <option value="Asiatico" className={styles.optionItem}>
              Asiatico
            </option>
          </select>
        </div>

        {/* COLUMNA 2: Sexo, Peso (Pendiente) */}
        <div className={styles.columnGroup}>
          <select
            value={sexo}
            onChange={(e) => setSexo(e.target.value)}
            className={styles.inputField}
          >
            <option value="" className={styles.optionItem}>
              Sexo
            </option>
            <option value="Masculino" className={styles.optionItem}>
              Masculino
            </option>
            <option value="Femenino" className={styles.optionItem}>
              Femenino
            </option>
          </select>

          <input
            type="number"
            placeholder="Peso (Kg)"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            className={`${styles.inputField} ${styles.textInput}`}
          />
        </div>
      </div>

      <button className={styles.submitButton}>Guardar</button>
    </form>
  );
}

export default PacientForm;
