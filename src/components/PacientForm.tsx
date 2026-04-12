import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  writeTextFile,
  readTextFile,
  BaseDirectory,
  exists,
  mkdir,
} from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import {
  usePacientStore,
  Paciente,
  DatosEspirometria,
} from "../store/pacientStore";
import { AppView } from "../App"; // <-- Importa el tipo AppView
import styles from "./PacientForm.module.css";

// 1. Creamos la interfaz para recibir onNavigate
interface PacientFormProps {
  onNavigate: (view: AppView) => void;
}

// 2. Pasamos la prop al componente
function PacientForm({ onNavigate }: PacientFormProps) {
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState("");
  const [talla, setTalla] = useState("");
  const [raza, setRaza] = useState("");
  const [peso, setPeso] = useState("");

  const addPaciente = usePacientStore((state) => state.addPaciente);
  const pacientes = usePacientStore((state) => state.pacientes);
  const seleccionarPaciente = usePacientStore(
    (state) => state.seleccionarPaciente,
  );

  const validar = (): string | null => {
    if (!nombre.trim() || !edad || !sexo || !talla || !raza || !peso)
      return "Por favor completa todos los campos";
    if (pacientes.some((p) => p.nombre.toLowerCase() === nombre.toLowerCase()))
      return "Este paciente ya existe";

    const edadNum = Number(edad);
    const tallaNum = Number(talla);
    const pesoNum = Number(peso);

    if (isNaN(edadNum) || edadNum < 3 || edadNum > 100)
      return "Ingresa una edad real (entre 3 y 100 años)";
    if (isNaN(tallaNum) || tallaNum < 20 || tallaNum > 300)
      return "Ingresa una altura real en cm (entre 20 y 300)";
    if (isNaN(pesoNum) || pesoNum < 20 || pesoNum > 300)
      return "Ingresa un peso real en kg (entre 20 y 300)";

    return null;
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const mensajeError = validar();
    if (mensajeError) {
      toast.error(mensajeError, {
        style: { background: "#202020", color: "#fff" },
      });
      return;
    }

    const edadNum = Number(edad);
    const tallaNum = Number(talla);
    const pesoNum = Number(peso);

    try {
      // Se calculan los datos en Rust automáticamente
      const espirometriaDefault: DatosEspirometria = await invoke(
        "procesar_nuevo_paciente",
        {
          datos: {
            nombre,
            edad: edadNum,
            talla: tallaNum,
            peso: pesoNum,
            sexo,
            raza,
          },
        },
      );

      const nuevoPaciente: Paciente = {
        id: crypto.randomUUID(),
        nombre,
        edad: edadNum,
        sexo,
        talla: tallaNum,
        raza,
        peso: pesoNum,
        fechaRegistro: new Date().toLocaleDateString(),
        espirometrias: [espirometriaDefault],
      };

      const fileName = "pacientes_db.json";
      const directory = BaseDirectory.AppData;

      if (!(await exists("", { baseDir: directory }))) {
        await mkdir("", { baseDir: directory, recursive: true });
      }

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
      seleccionarPaciente(nuevoPaciente.id); // NUEVO

      setNombre("");
      setEdad("");
      setSexo("");
      setTalla("");
      setRaza("");
      setPeso("");

      toast.success("Paciente guardado exitosamente", {
        duration: 2000,
        position: "bottom-right",
        style: { background: "#202020", color: "#fff" },
      });

      // 3. ¡Navegamos a la siguiente vista automáticamente!
      onNavigate("maniobra");
    } catch (err) {
      console.error("Error detallado:", err);
      toast.error("Error al procesar los datos con Rust");
    }
  };

  return (
    <form onSubmit={onSubmit} className={styles.formContainer}>
      {/* ... (Todos tus inputs quedan exactamente igual que antes) ... */}
      <input
        type="text"
        placeholder="Nombre del Paciente"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        autoFocus
        className={`${styles.inputField} ${styles.textInput}`}
      />

      <div className={styles.columnsWrapper}>
        <div className={styles.columnGroup}>
          <input
            type="number"
            placeholder="Edad (años)"
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            className={`${styles.inputField} ${styles.textInput}`}
          />
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
            <option value="Caucasico" className={styles.optionItem}>
              Caucásico
            </option>
            <option value="Afrodescendiente" className={styles.optionItem}>
              Afrodescendiente
            </option>
            <option value="Asiatico NE" className={styles.optionItem}>
              Asiático (Noreste)
            </option>
            <option value="Asiatico SE" className={styles.optionItem}>
              Asiático (Sureste)
            </option>
            <option
              value="Otra Raza / Etnia mixta"
              className={styles.optionItem}
            >
              Otro
            </option>
          </select>
        </div>

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

      {/* Cambiamos el texto del botón para que tenga más sentido */}
      <button type="submit" className={styles.submitButton}>
        Ingresar Paciente
      </button>
    </form>
  );
}

export default PacientForm;
