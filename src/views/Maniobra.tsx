import { useRef, useState } from "react";
import styles from "./Maniobra.module.css";
import GraficoPaciente, { GraficoRef } from "../components/GraficoPaciente";
import { AppView } from "../App";
import { usePacientStore } from "../store/pacientStore";

interface NavigationPayload {
  datosFlujoVolumen: number[][];
  datosVolumenTiempo: number[][];
}

interface ManiobraProps {
  onBack: () => void;
  // Modificamos onNavigate para que acepte datos opcionales
  onNavigate: (view: AppView, payload?: NavigationPayload) => void;
}

export default function Maniobra({ onBack, onNavigate }: ManiobraProps) {
  const grafico1Ref = useRef<GraficoRef>(null);
  const grafico2Ref = useRef<GraficoRef>(null);

  const [timer, setTimer] = useState("00:00 s");
  const [progressStep, setProgressStep] = useState(0); // 0 = Nada, 1 = Normal, 2 = Máxima, 3 = Forzada
  const [isExamining, setIsExamining] = useState(false); // Para bloquear el botón

  // --- LÓGICA DE DATOS ---
  const pacientes = usePacientStore((state) => state.pacientes);
  const pacienteActual = pacientes[pacientes.length - 1];

  const parametros = pacienteActual?.espirometrias?.[0]?.parametros || {
    fvc: 5.241,
    fev1: 4.511,
  };

  const fvc = parametros.fvc.m;
  const fev1 = parametros.fev1.m;

  const datosFlujoVolumen = [
    // --- Bucle 1 (8 puntos - TU FORMA EXACTA) ---
    [0, 0],
    [0.1, 0.2],
    [0.2, 0.3],
    [0.3, 0.2],
    [0.4, 0],
    [0.3, -0.2],
    [0.2, -0.3],
    [0, 0],
    // --- Bucle 2 (8 puntos - TU FORMA EXACTA) ---
    [0.125, 0.3],
    [0.25, 0.4],
    [0.375, 0.3],
    [0.5, 0],
    [0.375, -0.3],
    [0.25, -0.4],
    [0.125, -0.3],
    [0, 0],
    // --- Bucle 3 (8 puntos - TU FORMA EXACTA) ---
    [0.15, 0.4],
    [0.3, 0.5],
    [0.45, 0.4],
    [0.6, 0],
    [0.45, -0.4],
    [0.3, -0.5],
    [0.15, -0.4],
    [0, 0],
    // --- Exhalación Forzada (Aleta de tiburón - 20 puntos) ---
    [0, 0],
    [fvc * 0.15, fev1 * 1.5],
    [fvc * 0.18, fev1 * 1.45],
    [fvc * 0.21, fev1 * 1.38],
    [fvc * 0.25, fev1 * 1.3],
    [fvc * 0.3, fev1 * 1.22],
    [fvc * 0.35, fev1 * 1.13],
    [fvc * 0.4, fev1 * 1.06],
    [fvc * 0.45, fev1 * 0.97],
    [fvc * 0.5, fev1 * 0.89],
    [fvc * 0.55, fev1 * 0.79],
    [fvc * 0.6, fev1 * 0.69],
    [fvc * 0.65, fev1 * 0.6],
    [fvc * 0.7, fev1 * 0.52],
    [fvc * 0.75, fev1 * 0.43],
    [fvc * 0.8, fev1 * 0.33],
    [fvc * 0.85, fev1 * 0.22],
    [fvc * 0.9, fev1 * 0.15],
    [fvc * 0.95, fev1 * 0.08],
    [fvc, 0], // Fin maniobra
  ];

  const datosVolumenTiempo = [
    // --- Bucle 1 (8 puntos) ---
    [0, 1],
    [0.15, 1.2],
    [0.3, 1.3],
    [0.45, 1.4],
    [0.6, 1.3],
    [0.75, 1.2],
    [0.9, 1.1],
    [1.0, 1],
    // --- Bucle 2 (8 puntos) ---
    [1.15, 1.15],
    [1.3, 1.3],
    [1.45, 1.45],
    [1.6, 1.5],
    [1.75, 1.4],
    [1.9, 1.25],
    [2.05, 1.1],
    [2.2, 1],
    // --- Bucle 3 (8 puntos) ---
    [2.3, 0.9],
    [2.4, 0.8],
    [2.6, 1.1],
    [2.8, 0.8],
    [3.0, 0.5],
    [3.2, 0.2],
    [3.4, 0.05],
    [3.5, 0],
    // --- Exhalación Forzada (Ajustado a 20 puntos para igualar el otro arreglo y llegar a 11s) ---
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
    // Puntos agregados para mantener la longitud de 44 y alcanzar 11s suaves:
    [10.0, fvc * 0.985],
    [10.5, fvc * 0.99],
    [10.8, fvc * 0.995],
    [11.0, fvc],
  ];
  const iniciar = () => {
    if (isExamining) return; // Evita que se presione varias veces
    setIsExamining(true);

    // Arrancamos en el segundo 0 y Paso 1
    setTimer("00:00 s");
    setProgressStep(0); // Paso 1: Resp. Normal

    grafico1Ref.current?.ejecutarAnimacion();
    grafico2Ref.current?.ejecutarAnimacion();

    // 1. Cronómetro dinámico: actualiza el tiempo cada 1 segundo
    let segundos = 0;
    const intervaloTimer = setInterval(() => {
      segundos++;
      setTimer(`00:${segundos} s`);
    }, 1000);

    // 2. Paso 2: Inspiración Máxima
    // Según tus datos, el 3er bucle (inspiración profunda) arranca en el segundo 2.3
    setTimeout(() => {
      setProgressStep(1);
    }, 5000);

    // 3. Paso 3: Espiración Forzada
    // El soplido brusco arranca exactamente en el segundo 3.5 tras una breve pausa
    setTimeout(() => {
      setProgressStep(2);
    }, 7000);

    setTimeout(() => {
      setProgressStep(3);
    }, 7800);

    // 4. Fin de la maniobra
    // Ambos gráficos terminan su recorrido exactamente a los 8 segundos
    setTimeout(() => {
      clearInterval(intervaloTimer); // Detenemos el reloj
      setIsExamining(false); // Liberamos el botón
    }, 12000);
  };

  return (
    <div className={styles.layout}>
      {/* SECCIÓN IZQUIERDA: GRÁFICOS */}
      <div className={styles.chartsColumn}>
        <button onClick={onBack} className={styles.mobileBackBtn}>
          ← Salir
        </button>

        {/* GRÁFICO 1: Flujo / Volumen */}
        {/* X = Volumen (L), Y = Flujo (L/s) */}
        <div style={{ width: "100%", height: "250px", marginBottom: "20px" }}>
          <GraficoPaciente
            ref={grafico1Ref}
            titulo="Flujo / Volumen"
            ejeX="Vol (L)"
            ejeY="Flujo (L/s)"
            colorLinea="#3b82f6"
            data={datosFlujoVolumen}
            minX={-3} // Un poco negativo para ver el eje Y
            maxX={12} //Math.ceil(fvc) + 5} // FVC (ej. 5.2) redondeado hacia arriba + 1 (ej. 7L)
            minY={-4} // Espacio para la inspiración
            maxY={12} // Límite superior fijo para el flujo
          />
        </div>

        {/* GRÁFICO 2: Volumen / Tiempo */}
        {/* X = Tiempo (s), Y = Volumen (L) */}
        <div style={{ width: "100%", height: "250px" }}>
          <GraficoPaciente
            ref={grafico2Ref}
            titulo="Volumen / Tiempo"
            ejeX="Tiempo (s)"
            ejeY="Vol (L)"
            colorLinea="#10b981"
            data={datosVolumenTiempo}
            minX={-1} // Un poco negativo para ver el eje Y
            maxX={17} // La prueba dura 8 segundos clavados
            minY={-1} // Un poco negativo para ver el eje X
            maxY={Math.ceil(fvc) + 1} // Mismo techo que el de arriba para mantener proporción
          />
        </div>
      </div>

      {/* SECCIÓN DERECHA: CONTROLES */}
      <aside className={styles.controlsPanel}>
        <div className={styles.panelHeader}>
          <h2>Instrucciones</h2>
          <button onClick={onBack} className={styles.backButtonOutline}>
            Salir
          </button>
        </div>

        <div className={styles.card}>
          <p className={styles.instructionsText}>
            <strong>Instrucciones:</strong> Respire normal 3 veces
          </p>
          <button
            onClick={iniciar}
            className={styles.mainActionButton}
            disabled={isExamining}
            style={{
              opacity: isExamining ? 0.6 : 1,
              cursor: isExamining ? "not-allowed" : "pointer",
            }}
          >
            <span>INICIAR</span>
          </button>
        </div>

        <div className={styles.card}>
          <span className={styles.label}>Tiempo</span>
          <div className={styles.timerDisplay}>{timer}</div>
        </div>

        <div className={styles.card}>
          <span className={styles.label}>Progreso de Maniobra</span>
          <ul className={styles.checklist}>
            <li className={progressStep >= 1 ? styles.stepActive : ""}>
              <div
                className={`${styles.checkCircle} ${progressStep >= 1 ? styles.checkCircleActive : ""}`}
              >
                {progressStep >= 1 && "✓"}
              </div>
              <span>Resp. Normal</span>
            </li>
            <li className={progressStep >= 2 ? styles.stepActive : ""}>
              <div
                className={`${styles.checkCircle} ${progressStep >= 2 ? styles.checkCircleActive : ""}`}
              >
                {progressStep >= 2 && "✓"}
              </div>
              <span>Insp. Máxima</span>
            </li>
            <li className={progressStep >= 3 ? styles.stepActive : ""}>
              <div
                className={`${styles.checkCircle} ${progressStep >= 3 ? styles.checkCircleActive : ""}`}
              >
                {progressStep >= 3 && "✓"}
              </div>
              <span>Esp. Forzada</span>
            </li>
          </ul>
        </div>

        <button
          // Pasamos los arreglos como segundo parámetro
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
