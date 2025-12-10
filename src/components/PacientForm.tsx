import React, { useState } from "react";
// Importamos las funciones de Tauri v2
import {
  writeTextFile,
  readTextFile,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";

function PacientForm() {
  const [patientName, setPatientName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!patientName.trim()) return; // Evitar guardar nombres vacíos
    setLoading(true);

    try {
      const fileName = "pacientes_db.json";
      // Usamos AppData porque es para lo que configuramos los permisos
      const directory = BaseDirectory.AppData;

      // 1. Estructura del nuevo paciente (pensada para espirometría)
      const nuevoPaciente = {
        id: crypto.randomUUID(), // Genera un ID único automáticamente
        nombre: patientName,
        fechaRegistro: new Date().toLocaleDateString(),
        // Aquí guardarás los arrays para tus gráficos futuros
        espirometrias: [],
      };

      // 2. Lógica de Base de Datos: Leer lo existente
      let dataExistente = [];
      try {
        // Intentamos leer el archivo
        const contenido = await readTextFile(fileName, { baseDir: directory });
        dataExistente = JSON.parse(contenido);
      } catch (err) {
        // Si entra aquí, es porque el archivo no existe (es el primer paciente)
        console.log("Creando base de datos nueva...");
        dataExistente = [];
      }

      // 3. Agregar el nuevo paciente a la lista
      dataExistente.push(nuevoPaciente);

      // 4. Guardar la lista actualizada en el disco
      await writeTextFile(fileName, JSON.stringify(dataExistente, null, 2), {
        baseDir: directory,
      });

      alert(`Paciente "${patientName}" guardado correctamente.`);
      setPatientName(""); // Limpiar formulario
    } catch (err) {
      console.error("Error al guardar:", err);
      alert("Hubo un error al guardar: " + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        maxWidth: "300px",
      }}
    >
      <h3>Registrar Paciente</h3>

      <input
        type="text"
        placeholder="Nombre completo"
        value={patientName}
        onChange={(e) => setPatientName(e.target.value)}
        disabled={loading}
        style={{ padding: "8px" }}
      />

      <button
        type="submit"
        disabled={loading}
        style={{ padding: "10px", cursor: "pointer" }}
      >
        {loading ? "Guardando..." : "Guardar Paciente"}
      </button>
    </form>
  );
}

export default PacientForm;
