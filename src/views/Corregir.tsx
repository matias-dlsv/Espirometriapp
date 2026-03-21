import { useRef, useState } from "react";
import styles from "./Corregir.module.css";
import GraficoPaciente, { GraficoRef } from "../components/GraficoPaciente";
// IMPORTANTE: Traemos NavigationPayload de App
import { AppView, NavigationPayload } from "../App";
import { usePacientStore } from "../store/pacientStore";

interface CorregirProps {
  onBack: () => void;
  onNavigate?: (view: AppView) => void;
  data: NavigationPayload | null; // <-- NUEVO: Recibimos los datos de App.tsx
}

export default function Corregir({ onBack, onNavigate, data }: CorregirProps) {
  // ¡AQUÍ ESTÁ LA CORRECCIÓN! El hook debe ir dentro del componente
  const guardarManiobra = usePacientStore((state) => state.guardarManiobra);

  const grafico1Ref = useRef<GraficoRef>(null);
  const grafico2Ref = useRef<GraficoRef>(null);

  const [isReplaying, setIsReplaying] = useState(false);

  // --- ESTADO DEL CHECKLIST DE ACEPTABILIDAD ---
  const [criterios, setCriterios] = useState({
    vtestables: false,
    esfuerzomaximo: false,
    volumenextrapolado: false,
    pefcontinuo: false,
  });

  // Verifica si los 4 criterios están en true
  const todosCumplen = Object.values(criterios).every((v) => v === true);

  const handleToggleCriterio = (key: keyof typeof criterios) => {
    setCriterios((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // --- DATOS DEL PACIENTE ACTUAL ---
  const pacientes = usePacientStore((state) => state.pacientes);
  const pacienteActual = pacientes[pacientes.length - 1];

  // Ajustado para asegurar que lea correctamente el valor
  const parametros = pacienteActual?.espirometrias?.[0]?.parametros || {
    fvc: { m: 5.241 },
    fev1: { m: 4.511 },
  };

  const fvc =
    typeof parametros.fvc === "number"
      ? parametros.fvc
      : parametros.fvc?.m || 5.241;

  // --- FUNCIONES ---
  const reproducirAnimacion = () => {
    if (isReplaying) return;
    setIsReplaying(true);

    grafico1Ref.current?.ejecutarAnimacion();
    grafico2Ref.current?.ejecutarAnimacion();

    setTimeout(() => {
      setIsReplaying(false);
    }, 10000); // Ajusta este tiempo al de la duración de tu gráfica
  };

  const handleGuardarYContinuar = () => {
    if (!todosCumplen || !data || !pacienteActual) return;

    // 1. Armamos el objeto con los datos de la maniobra aprobada
    const nuevaManiobra = {
      datosFlujoVolumen: data.datosFlujoVolumen,
      datosVolumenTiempo: data.datosVolumenTiempo,
      criterios: criterios,
      fecha: new Date().toISOString(),
    };

    // 2. La guardamos en Zustand
    guardarManiobra(pacienteActual.id, nuevaManiobra);

    // 3. Verificamos cuántas maniobras llevamos ahora
    const cantidadActual =
      (pacienteActual.espirometrias[0]?.maniobras?.length || 0) + 1;

    // 4. Lógica de redirección (Hasta 3 maniobras)
    if (onNavigate) {
      if (cantidadActual >= 3) {
        // Asegúrate de agregar "interpolacion" a tu type AppView en App.tsx
        onNavigate("interpolacion" as AppView);
      } else {
        onNavigate("maniobra");
      }
    }
  };

  // --- PROTECCIÓN ---
  if (!data) {
    return (
      <div className={styles.layout}>
        <div
          className={styles.card}
          style={{ margin: "auto", textAlign: "center" }}
        >
          <h2>No hay datos de maniobra disponibles</h2>
          <p>Debe realizar una maniobra primero para poder evaluarla.</p>
          <button
            onClick={onBack}
            className={styles.mainActionButton}
            style={{ background: "#3b82f6", marginTop: "20px" }}
          >
            Volver a Maniobra
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      {/* SECCIÓN IZQUIERDA: GRÁFICOS */}
      <div className={styles.chartsColumn}>
        <button onClick={onBack} className={styles.mobileBackBtn}>
          ← Volver
        </button>

        {/* GRÁFICO 1 */}
        <div className={styles.chartContainer}>
          <GraficoPaciente
            ref={grafico1Ref}
            titulo="Flujo / Volumen"
            ejeX="Vol (L)"
            ejeY="Flujo (L/s)"
            colorLinea="#3b82f6"
            data={data.datosFlujoVolumen}
            minX={-0.5}
            maxX={12}
            minY={-2}
            maxY={12}
          />
        </div>

        {/* GRÁFICO 2 */}
        <div className={styles.chartContainer}>
          <GraficoPaciente
            ref={grafico2Ref}
            titulo="Volumen / Tiempo"
            ejeX="Tiempo (s)"
            ejeY="Vol (L)"
            colorLinea="#10b981"
            data={data.datosVolumenTiempo}
            minX={-0.2}
            maxX={17.0}
            minY={-0.5}
            maxY={Math.ceil(fvc) + 1}
          />
        </div>
      </div>

      {/* SECCIÓN DERECHA: CONTROLES Y CHECKLIST */}
      <aside className={styles.controlsPanel}>
        <div className={styles.panelHeader}>
          <h2>Revisión</h2>
          <button onClick={onBack} className={styles.backButtonOutline}>
            Descartar Prueba
          </button>
        </div>

        {/* REPRODUCIR MANIOBRA */}
        <div className={styles.card}>
          <p className={styles.instructionsText}>
            Revise la curva obtenida y marque los criterios cumplidos.
          </p>
          <button
            onClick={reproducirAnimacion}
            className={styles.mainActionButton}
            disabled={isReplaying}
            style={{
              backgroundColor: isReplaying ? "#94a3b8" : "#6366f1",
              cursor: isReplaying ? "not-allowed" : "pointer",
            }}
          >
            <span>{isReplaying ? "REPRODUCIENDO..." : "REPRODUCIR CURVA"}</span>
          </button>
        </div>

        {/* CHECKLIST DE ACEPTABILIDAD */}
        <div className={styles.card}>
          <span className={styles.label}>Criterios de Aceptabilidad</span>
          <div className={styles.checkList}>
            <label className={styles.checkItem}>
              <input
                type="checkbox"
                checked={criterios.vtestables}
                onChange={() => handleToggleCriterio("vtestables")}
              />
              3 Vt estables
            </label>

            <label className={styles.checkItem}>
              <input
                type="checkbox"
                checked={criterios.esfuerzomaximo}
                onChange={() => handleToggleCriterio("esfuerzomaximo")}
              />
              Esfuerzo maximo
            </label>

            <label className={styles.checkItem}>
              <input
                type="checkbox"
                checked={criterios.volumenextrapolado}
                onChange={() => handleToggleCriterio("volumenextrapolado")}
              />
              Volumen extrapolado {"<"} 100 ml
            </label>

            <label className={styles.checkItem}>
              <input
                type="checkbox"
                checked={criterios.pefcontinuo}
                onChange={() => handleToggleCriterio("pefcontinuo")}
              />
              Pico de flujo espiratorio (PEF) continuo y libre de artefactos
            </label>
          </div>
        </div>

        {/* BOTÓN CONTINUAR */}
        <button
          onClick={handleGuardarYContinuar}
          disabled={!todosCumplen}
          className={styles.nextButton}
          style={{
            opacity: todosCumplen ? 1 : 0.5,
            cursor: todosCumplen ? "pointer" : "not-allowed",
            backgroundColor: todosCumplen ? "#10b981" : "#cbd5e1",
            color: todosCumplen ? "white" : "#64748b",
          }}
        >
          Guardar y Continuar →
        </button>
      </aside>
    </div>
  );
}
