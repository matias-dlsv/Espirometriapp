import { useRef, useState, useMemo } from "react";
import styles from "./Maniobra.module.css";
import GraficoPaciente, { GraficoRef } from "../components/GraficoPaciente";
import { usePacientStore } from "../store/pacientStore";
import { AppView, NavigationPayload } from "../App";
import { aplicarPatron, calcularIndicesManiobra } from "../utils/transformaciones";

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

  const pacienteActual  = usePacientStore((state) => state.pacienteSeleccionado);
  const patronActivo    = usePacientStore((state) => state.patronActivo);

  const maniobrasGuardadas = pacienteActual?.espirometrias?.[0]?.maniobras?.length ?? 0;

  const parametros = pacienteActual?.espirometrias?.[0]?.parametros ?? null;
  const fvc  = parametros?.fvc.m  ?? 5.241;
  const fev1 = parametros?.fev1.m ?? 4.511;

  const { datosFlujoVolumen, datosVolumenTiempo, indicesManiobra } = useMemo(() => {
    // Peak al inicio del useMemo para que calcularIndicesManiobra lo use
    const peakFlujo = fev1 * (1.45 + Math.random() * 0.15);
    const peakVol   = fvc  * (0.13 + Math.random() * 0.05);

    const cx = fvc * 0.55;
    const rx = fvc * 0.12;
    const ry = 0.6;
    const casiFvc = fvc * 0.96;
    const multiplicadorRuido = 0.6;

    // 1. ELIPSES
    const generarElipseOrganica = (centroX: number, radioX: number, radioY: number, puntos = 120): number[][] => {
      const elipse: number[][] = [];
      for (let i = 0; i <= puntos; i++) {
        const theta = (i / puntos) * 2 * Math.PI;
        const factorForma = Math.sin(theta) > 0 ? 0.9 : 1.2;
        const rXActual = perturbar(radioX, 0.02 * multiplicadorRuido);
        const rYActual = perturbar(radioY, 0.05 * multiplicadorRuido);
        const x = centroX + rXActual * Math.cos(theta);
        const y = -rYActual * Math.sign(Math.sin(theta)) * Math.pow(Math.abs(Math.sin(theta)), factorForma);
        elipse.push([perturbar(x, 0.005 * multiplicadorRuido), perturbar(y, 0.02 * multiplicadorRuido)]);
      }
      return elipse;
    };

    const bucle1 = generarElipseOrganica(cx, rx, ry, 120);
    const bucle2 = generarElipseOrganica(cx, rx, ry * 1.05, 120);

    // 2. BUCLE 3 INHALACIÓN
    const bucle3Inhalacion: number[][] = [];
    for (let i = 0; i <= 80; i++) {
      const theta = (i / 80) * Math.PI;
      const x = cx + perturbar(rx, 0.02 * multiplicadorRuido) * Math.cos(theta);
      const y = -perturbar(ry * 1.1, 0.08 * multiplicadorRuido) * Math.pow(Math.sin(theta), 0.8);
      bucle3Inhalacion.push([perturbar(x, 0.005), y]);
    }

    // 3. EXHALACIÓN EXTENDIDA
    const bucle3Exhalacion: number[][] = [];
    const cx_exh = (cx - rx + casiFvc) / 2;
    const rx_exh = (casiFvc - (cx - rx)) / 2;
    for (let i = 1; i <= 100; i++) {
      const theta = Math.PI + (i / 100) * Math.PI;
      const x = cx_exh + rx_exh * Math.cos(theta);
      const y = -perturbar(ry * 1.3, 0.1 * multiplicadorRuido) * Math.sin(theta);
      bucle3Exhalacion.push([perturbar(x, 0.005), y]);
    }

    // 4. INSPIRACIÓN PROFUNDA MÁXIMA
    const inspiracionProfunda: number[][] = [];
    const cx_insp = casiFvc / 2;
    for (let i = 1; i <= 150; i++) {
      const t = i / 150;
      const theta = t * Math.PI;
      const x = cx_insp + cx_insp * Math.cos(theta);
      const flujoBase = -2.0 * Math.sin(theta);
      const deformacionAsimetrica = 1 + 0.3 * Math.sin(theta * 0.5);
      const y = flujoBase * deformacionAsimetrica;
      inspiracionProfunda.push([perturbar(x, 0.005), perturbar(y, 0.03 * multiplicadorRuido)]);
    }

    // 5. EXHALACIÓN FORZADA
    const exhalacionForzada: number[][] = [];

    // 5.1 SUBIDA RÁPIDA
    const puntosSubida = 30;
    for (let i = 0; i <= puntosSubida; i++) {
      const t = i / puntosSubida;
      const x = t * peakVol;
      const y = peakFlujo * Math.pow(t, 0.7);
      exhalacionForzada.push([perturbar(x, 0.001), perturbar(y, 0.01)]);
    }

    // 5.2 BAJADA PROLONGADA
    const puntosRampa = 300;
    for (let i = 1; i <= puntosRampa; i++) {
      const t = i / puntosRampa;
      const curveT = Math.pow(t, 0.7);
      const vol = peakVol + (fvc - peakVol) * curveT;
      const flujo = peakFlujo * Math.pow(1 - curveT, 1.5);
      exhalacionForzada.push([perturbar(vol, 0.002), perturbar(flujo, 0.01)]);
    }

    const flujoVolumen: number[][] = [
      ...bucle1,
      ...bucle2,
      ...bucle3Inhalacion,
      ...bucle3Exhalacion,
      ...inspiracionProfunda,
      ...exhalacionForzada,
    ];

    const volumenTiempo: number[][] = [
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

    // Índices correlacionados con el peak real de esta maniobra
    const indicesManiobra = calcularIndicesManiobra(fvc, fev1, peakFlujo);

    return {
      datosFlujoVolumen: flujoVolumenFinal,
      datosVolumenTiempo: volumenTiempo,
      indicesManiobra,
    };
  }, [fev1, fvc, patronActivo]);

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

    setTimeout(() => setProgressStep(1), 4000);
    setTimeout(() => setProgressStep(2), 6500);
    setTimeout(() => setProgressStep(3), 7500);
    setTimeout(() => {
      clearInterval(intervaloTimer);
      setIsExamining(false);
    }, 15000);
  };

  return (
    <div className={styles.layout}>
      {/* COLUMNA IZQUIERDA */}
      <div className={styles.chartsColumn}>
        <button onClick={onBack} className={styles.mobileBackBtn}>← Salir</button>

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
              <span className={styles.patientName}>{pacienteActual.nombre}</span>
            )}
          </div>
          <button onClick={onBack} className={styles.backButtonOutline}>Salir</button>
        </div>

        {patronActivo && (
          <div className={styles.patronBadge}>
            <span className={styles.patronLabel}>Caso clínico</span>
            <span className={styles.patronNombre}>{patronActivo.nombre}</span>
          </div>
        )}

        <div className={styles.card}>
          <span className={styles.label}>Estado de sesión</span>
          <div style={{ fontSize: "1.1rem", marginTop: "4px" }}>
            Maniobras aceptadas: <strong>{maniobrasGuardadas} / 3</strong>
          </div>
        </div>

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
              <li key={step} className={progressStep >= step ? styles.stepActive : ""}>
                <div className={`${styles.checkCircle} ${progressStep >= step ? styles.checkCircleActive : ""}`}>
                  {progressStep >= step && "✓"}
                </div>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() =>
            onNavigate("corregir", {
              datosFlujoVolumen,
              datosVolumenTiempo,
              indices: indicesManiobra,
            })
          }
          className={styles.nextButton}
        >
          Criterios de aceptabilidad →
        </button>
      </aside>
    </div>
  );
}