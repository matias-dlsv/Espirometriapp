import { useRef, useState, useMemo } from "react";
import styles from "./Maniobra.module.css";
import GraficoPaciente, { GraficoRef } from "../components/GraficoPaciente";
import { usePacientStore } from "../store/pacientStore";
import { AppView, NavigationPayload } from "../App";
import { aplicarPatron } from "../utils/transformaciones";

interface ManiobraProps {
  onBack: () => void;
  onNavigate: (view: AppView, payload?: NavigationPayload) => void;
}

const perturbar = (valor: number, porcentaje: number): number => {
  const variacion = valor * porcentaje;
  return valor + (Math.random() * 2 - 1) * variacion;
};

export default function Maniobra({ onBack, onNavigate }: ManiobraProps) {
  const grafico1Ref = useRef<GraficoRef>(null);

  const [timer, setTimer] = useState("00:00");
  const [progressStep, setProgressStep] = useState(0);
  const [isExamining, setIsExamining] = useState(false);

  const pacienteActual = usePacientStore((state) => state.pacienteSeleccionado);
  const patronActivo = usePacientStore((state) => state.patronActivo);

  const parametros = pacienteActual?.espirometrias?.[0]?.parametros ?? null;
  const fvc = parametros?.fvc.m ?? 5.241;
  const fev1 = parametros?.fev1.m ?? 4.511;

  const { datosFlujoVolumen, datosVolumenTiempo } = useMemo(() => {
    const peakFlujo = fev1 * (1.45 + Math.random() * 0.15);
    const peakVol = fvc * (0.13 + Math.random() * 0.05);

    const flujoVolumen: number[][] = [
      // --- Bucle 1 ---
      [0, 0],
      [perturbar(0.1, 0.1), perturbar(0.2, 0.1)],
      [perturbar(0.2, 0.1), perturbar(0.3, 0.1)],
      [perturbar(0.3, 0.1), perturbar(0.2, 0.1)],
      [perturbar(0.4, 0.1), 0],
      [perturbar(0.3, 0.1), perturbar(-0.2, 0.1)],
      [perturbar(0.2, 0.1), perturbar(-0.3, 0.1)],
      [0, 0],
      // --- Bucle 2 ---
      [perturbar(0.125, 0.1), perturbar(0.3, 0.1)],
      [perturbar(0.25, 0.1), perturbar(0.4, 0.1)],
      [perturbar(0.375, 0.1), perturbar(0.3, 0.1)],
      [perturbar(0.5, 0.1), 0],
      [perturbar(0.375, 0.1), perturbar(-0.3, 0.1)],
      [perturbar(0.25, 0.1), perturbar(-0.4, 0.1)],
      [perturbar(0.125, 0.1), perturbar(-0.3, 0.1)],
      [0, 0],
      // --- Bucle 3 ---
      [perturbar(0.15, 0.1), perturbar(0.4, 0.1)],
      [perturbar(0.3, 0.1), perturbar(0.5, 0.1)],
      [perturbar(0.45, 0.1), perturbar(0.4, 0.1)],
      [perturbar(0.6, 0.1), 0],
      [perturbar(0.45, 0.1), perturbar(-0.4, 0.1)],
      [perturbar(0.3, 0.1), perturbar(-0.5, 0.1)],
      [perturbar(0.15, 0.1), perturbar(-0.4, 0.1)],
      [0, 0],
      // --- Exhalación Forzada ---
      [0, 0],
      [peakVol, peakFlujo],
      [fvc * 0.21, perturbar(fev1 * 1.38, 0.01)],
      [fvc * 0.25, perturbar(fev1 * 1.3, 0.01)],
      [fvc * 0.3, perturbar(fev1 * 1.22, 0.02)],
      [fvc * 0.35, perturbar(fev1 * 1.13, 0.02)],
      [fvc * 0.4, perturbar(fev1 * 1.06, 0.02)],
      [fvc * 0.45, perturbar(fev1 * 0.97, 0.03)],
      [fvc * 0.5, perturbar(fev1 * 0.89, 0.03)],
      [fvc * 0.55, perturbar(fev1 * 0.79, 0.03)],
      [fvc * 0.6, perturbar(fev1 * 0.69, 0.03)],
      [fvc * 0.65, perturbar(fev1 * 0.6, 0.04)],
      [fvc * 0.7, perturbar(fev1 * 0.52, 0.04)],
      [fvc * 0.75, perturbar(fev1 * 0.43, 0.04)],
      [fvc * 0.8, perturbar(fev1 * 0.33, 0.05)],
      [fvc * 0.85, perturbar(fev1 * 0.22, 0.05)],
      [fvc * 0.9, perturbar(fev1 * 0.15, 0.05)],
      [fvc * 0.95, perturbar(fev1 * 0.08, 0.05)],
      [fvc, 0],
    ];

    const volumenTiempo: number[][] = [
      [0, 1],
      [0.15, 1.2],
      [0.3, 1.3],
      [0.45, 1.4],
      [0.6, 1.3],
      [0.75, 1.2],
      [0.9, 1.1],
      [1.0, 1],
      [1.15, 1.15],
      [1.3, 1.3],
      [1.45, 1.45],
      [1.6, 1.5],
      [1.75, 1.4],
      [1.9, 1.25],
      [2.05, 1.1],
      [2.2, 1],
      [2.3, 0.9],
      [2.4, 0.8],
      [2.6, 1.1],
      [2.8, 0.8],
      [3.0, 0.5],
      [3.2, 0.2],
      [3.4, 0.05],
      [3.5, 0],
      [3.5, 0],
      [3.6, fev1 * 0.25],
      [3.7, fev1 * 0.5],
      [3.9, fev1 * 0.75],
      [4.1, fev1 * 0.9],
      [4.5, fev1],
      [5.0, fvc * 0.88],
      [5.5, fvc * 0.9],
      [6.0, fvc * 0.91],
      [6.5, fvc * 0.92],
      [7.0, fvc * 0.93],
      [7.5, fvc * 0.94],
      [8.0, fvc * 0.95],
      [8.5, fvc * 0.96],
      [9.0, fvc * 0.97],
      [9.5, fvc * 0.98],
      [10.0, fvc * 0.985],
      [10.5, fvc * 0.99],
      [10.8, fvc * 0.995],
      [11.0, fvc],
    ];

    const flujoVolumenFinal = aplicarPatron(flujoVolumen, fvc, patronActivo);

    return {
      datosFlujoVolumen: flujoVolumenFinal,
      datosVolumenTiempo: volumenTiempo,
    };
  }, [patronActivo]); // recalcula si cambia el patrón

  const iniciar = () => {
    if (isExamining) return;
    setIsExamining(true);
    setTimer("00:00");
    setProgressStep(0);
    grafico1Ref.current?.ejecutarAnimacion();

    let segundos = 0;
    const intervaloTimer = setInterval(() => {
      segundos++;
      const mins = String(Math.floor(segundos / 60)).padStart(2, "0");
      const secs = String(segundos % 60).padStart(2, "0");
      setTimer(`${mins}:${secs}`);
    }, 1000);

    setTimeout(() => setProgressStep(1), 5000);
    setTimeout(() => setProgressStep(2), 7000);
    setTimeout(() => setProgressStep(3), 7800);
    setTimeout(() => {
      clearInterval(intervaloTimer);
      setIsExamining(false);
    }, 12000);
  };

  return (
    <div className={styles.layout}>
      {/* COLUMNA IZQUIERDA */}
      <div className={styles.chartsColumn}>
        <button onClick={onBack} className={styles.mobileBackBtn}>
          ← Salir
        </button>

        <div className={styles.chartCard}>
          <GraficoPaciente
            ref={grafico1Ref}
            titulo="Flujo / Volumen"
            ejeX="Vol (L)"
            ejeY="Flujo (L/s)"
            colorLinea="#3b82f6"
            data={datosFlujoVolumen}
            minX={-3}
            maxX={12}
            minY={-4}
            maxY={12}
          />
        </div>
      </div>

      {/* COLUMNA DERECHA */}
      <aside className={styles.controlsPanel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Maniobra</h2>
            {pacienteActual && (
              <span className={styles.patientName}>
                {pacienteActual.nombre}
              </span>
            )}
          </div>
          <button onClick={onBack} className={styles.backButtonOutline}>
            Salir
          </button>
        </div>

        {patronActivo && (
          <div className={styles.patronBadge}>
            <span className={styles.patronLabel}>Caso clínico</span>
            <span className={styles.patronNombre}>{patronActivo.nombre}</span>
          </div>
        )}

        <div className={styles.card}>
          <p className={styles.instructionsText}>
            <strong>Instrucciones:</strong> Respire normal 3 veces
          </p>
          <button
            onClick={iniciar}
            className={styles.mainActionButton}
            disabled={isExamining}
          >
            <span>▶ INICIAR</span>
          </button>
        </div>

        <div className={styles.card}>
          <span className={styles.label}>Tiempo</span>
          <div className={styles.timerDisplay}>
            {timer} <span className={styles.timerUnit}>s</span>
          </div>
        </div>

        <div className={styles.card}>
          <span className={styles.label}>Progreso de Maniobra</span>
          <ul className={styles.checklist}>
            {[
              { step: 1, label: "Resp. Normal" },
              { step: 2, label: "Insp. Máxima" },
              { step: 3, label: "Esp. Forzada" },
            ].map(({ step, label }) => (
              <li
                key={step}
                className={progressStep >= step ? styles.stepActive : ""}
              >
                <div
                  className={`${styles.checkCircle} ${progressStep >= step ? styles.checkCircleActive : ""}`}
                >
                  {progressStep >= step && "✓"}
                </div>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() =>
            onNavigate("corregir", { datosFlujoVolumen, datosVolumenTiempo })
          }
          className={styles.nextButton}
        >
          Criterios de aceptabilidad →
        </button>
      </aside>
    </div>
  );
}
