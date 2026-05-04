import { useRef, useState, useMemo } from "react";
import styles from "./Maniobra.module.css";
import GraficoPaciente, { GraficoRef } from "../components/GraficoPaciente";
import { usePacientStore } from "../store/pacientStore";
import { AppView, NavigationPayload } from "../App";
import {
  aplicarPatron,
  generarIndicesAleatorios,
} from "../utils/transformaciones";

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

  const maniobrasGuardadas =
    pacienteActual?.espirometrias?.[0]?.maniobras?.length ?? 0;

  const parametros = pacienteActual?.espirometrias?.[0]?.parametros ?? null;
  const fvc = parametros?.fvc.m ?? 5.241;
  const fev1 = parametros?.fev1.m ?? 4.511;

  const mls = useMemo(() => {
    if (!parametros) return undefined;
    return {
      fvc: parametros.fvc,
      fev1: parametros.fev1,
      fev1fvc: parametros.fev1fvc,
    };
  }, [parametros]);

  const {
    datosFlujoVolumen,
    datosVolumenTiempo,
    indicesManiobra,
    volResidual,
    idxInicioExhalacionForzada,
    vbe,
  } = useMemo(() => {
    const indicesManiobra = generarIndicesAleatorios(
      fvc,
      fev1,
      mls,
      patronActivo,
    );

    const fvcM = indicesManiobra.fvc;
    const fev1M = indicesManiobra.fev1;

    const peakFlujo = fev1M * (1.45 + Math.random() * 0.15);
    const peakVol = fvcM * (0.13 + Math.random() * 0.05);

    const cx = fvcM * 0.55;
    const rx = fvcM * 0.12;
    const ry = 0.6;
    const casiFvc = fvcM * 0.96;
    const multiplicadorRuido = 0.6;

    const generarElipseOrganica = (
      centroX: number,
      radioX: number,
      radioY: number,
      puntos = 120,
    ): number[][] => {
      const elipse: number[][] = [];
      for (let i = 0; i <= puntos; i++) {
        const theta = (i / puntos) * 2 * Math.PI;
        const factorForma = Math.sin(theta) > 0 ? 0.9 : 1.2;
        const rXActual = perturbar(radioX, 0.02 * multiplicadorRuido);
        const rYActual = perturbar(radioY, 0.05 * multiplicadorRuido);
        const x = centroX + rXActual * Math.cos(theta);
        const y =
          -rYActual *
          Math.sign(Math.sin(theta)) *
          Math.pow(Math.abs(Math.sin(theta)), factorForma);
        elipse.push([
          perturbar(x, 0.005 * multiplicadorRuido),
          perturbar(y, 0.02 * multiplicadorRuido),
        ]);
      }
      return elipse;
    };

    const bucle1 = generarElipseOrganica(cx, rx, ry, 120);
    const bucle2 = generarElipseOrganica(cx, rx, ry * 1.05, 120);

    const bucle3Inhalacion: number[][] = [];
    for (let i = 0; i <= 80; i++) {
      const theta = (i / 80) * Math.PI;
      const x = cx + perturbar(rx, 0.02 * multiplicadorRuido) * Math.cos(theta);
      const y =
        -perturbar(ry * 1.1, 0.08 * multiplicadorRuido) *
        Math.pow(Math.sin(theta), 0.8);
      bucle3Inhalacion.push([perturbar(x, 0.005), y]);
    }

    const bucle3Exhalacion: number[][] = [];
    const cx_exh = (cx - rx + casiFvc) / 2;
    const rx_exh = (casiFvc - (cx - rx)) / 2;
    for (let i = 1; i <= 100; i++) {
      const theta = Math.PI + (i / 100) * Math.PI;
      const x = cx_exh + rx_exh * Math.cos(theta);
      const y =
        -perturbar(ry * 1.3, 0.1 * multiplicadorRuido) * Math.sin(theta);
      bucle3Exhalacion.push([perturbar(x, 0.005), y]);
    }

    const inspiracionProfunda: number[][] = [];
    const cx_insp = casiFvc / 2;
    for (let i = 1; i <= 150; i++) {
      const t = i / 150;
      const theta = t * Math.PI;
      const x = cx_insp + cx_insp * Math.cos(theta);
      const flujoBase = -2.0 * Math.sin(theta);
      const deformacionAsimetrica = 1 + 0.3 * Math.sin(theta * 0.5);
      const y = flujoBase * deformacionAsimetrica;
      inspiracionProfunda.push([
        perturbar(x, 0.005),
        perturbar(y, 0.03 * multiplicadorRuido),
      ]);
    }

    const exhalacionForzada: number[][] = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      exhalacionForzada.push([
        perturbar(t * peakVol, 0.001),
        perturbar(peakFlujo * Math.pow(t, 0.7), 0.01),
      ]);
    }
    for (let i = 1; i <= 300; i++) {
      const t = i / 300;
      const curveT = Math.pow(t, 0.7);
      const vol = peakVol + (fvcM - peakVol) * curveT;
      const flujo = peakFlujo * Math.pow(1 - curveT, 1.5);
      exhalacionForzada.push([perturbar(vol, 0.002), perturbar(flujo, 0.01)]);
    }

    const volResidual = Math.random() * 0.09 + 0.005;
    const peakInspForzado = -(fev1M * (0.55 + Math.random() * 0.1));
    const inhalacionPostForzada: number[][] = [];
    const nPuntosInhForzada = 200;
    for (let i = 0; i <= nPuntosInhForzada; i++) {
      const t = i / nPuntosInhForzada;
      const vol = fvcM * (1 - t) + volResidual * t;
      const flujo =
        peakInspForzado *
        Math.sin(Math.PI * Math.pow(t, 0.75)) *
        (1 - 0.15 * Math.sin(2 * Math.PI * t));
      inhalacionPostForzada.push([
        perturbar(vol, 0.003),
        perturbar(flujo, 0.02 * multiplicadorRuido),
      ]);
    }

    const idxInicioExhalacionForzada =
      bucle1.length +
      bucle2.length +
      bucle3Inhalacion.length +
      bucle3Exhalacion.length +
      inspiracionProfunda.length;

    const flujoVolumen: number[][] = [
      ...bucle1,
      ...bucle2,
      ...bucle3Inhalacion,
      ...bucle3Exhalacion,
      ...inspiracionProfunda,
      ...exhalacionForzada,
      ...inhalacionPostForzada,
    ];

    // ── Volumen/Tiempo ────────────────────────────────────────────────────
    const tiempos = [
      0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.07, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6,
      0.7, 0.8, 0.9, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0,
      10.0,
    ];

    const propFvc: number[] = [
  0,    0.25, 0.42, 0.55, 0.64, 0.71, 0.79, 0.86, 0.905, 0.928,   // 0–0.15s  empinado
  0.944, 0.956, 0.965, 0.972, 0.978, 0.982, 0.985, 0.988,          // 0.2–0.9s desaceleración gradual
  0.9905, 0.9925,                                                     // 1.0–1.5s
  0.9945, 0.9960, 0.9970, 0.9980, 0.9987, 0.9992,                   // 2.0–5.0s
  0.9995, 0.9997, 0.9999, 1.0,                                       // 6.0–10.0s
];

    // Curva cóncava suave al inicio usando función potencia
    // El exponente >1 garantiza arranque lento que acelera (cóncavo)
    const earlyExponent = 2.8 + Math.random() * 0.8; // 1.8–2.4
    const tTransFin = 0.25;

    // Volumen objetivo al final de la zona de arranque (para empalme)
    const idxTransFin = tiempos.findIndex((t) => t >= tTransFin);
    const volEnTransFin = propFvc[idxTransFin] * fvcM;

    const volumenTiempo: number[][] = tiempos.map((t, i) => {
      const volBase = propFvc[i] * fvcM;

      if (t <= tTransFin) {
        const tNorm = t / tTransFin;
        // Power ramp: en t=0 vale 0, en t=tTransFin vale volEnTransFin
        const volRamp = volEnTransFin * Math.pow(tNorm, earlyExponent);
        // Smoothstep blend para empalme continuo en tTransFin
        const blend = tNorm * tNorm * (3 - 2 * tNorm);
        return [t, Math.max(0, volRamp * (1 - blend) + volBase * blend)];
      }

      return [t, volBase];
    });

    // Buscar máxima pendiente
    let maxPendiente = 0;
    let idxMaxPend   = 1;
    for (let i = 1; i < volumenTiempo.length - 1; i++) {
      if (volumenTiempo[i][0] > 0.2) break;
      const dt   = volumenTiempo[i + 1][0] - volumenTiempo[i - 1][0];
      const dv   = volumenTiempo[i + 1][1] - volumenTiempo[i - 1][1];
      const pend = dv / dt;
      if (pend > maxPendiente) {
        maxPendiente = pend;
        idxMaxPend   = i;
      }
    }

    // ✅ Extrapolación de la tangente hacia t=0
    const tPico = volumenTiempo[idxMaxPend][0];
    const vPico = volumenTiempo[idxMaxPend][1];
    const vbe   = Math.max(0, vPico - maxPendiente * tPico);
    const flujoVolumenFinal = aplicarPatron(flujoVolumen, fvcM, patronActivo);

    return {
      datosFlujoVolumen: flujoVolumenFinal,
      datosVolumenTiempo: volumenTiempo,
      indicesManiobra,
      volResidual,
      idxInicioExhalacionForzada,
      vbe,
    };
  }, [fev1, fvc, mls, patronActivo]);

  const iniciar = () => {
    if (isExamining) return;
    setIsExamining(true);
    setTimer("00:00");
    setProgressStep(0);

    requestAnimationFrame(() => {
      grafico1Ref.current?.ejecutarAnimacion();
    });

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
            onNavigate("corregir", {
              datosFlujoVolumen,
              datosVolumenTiempo,
              indices: indicesManiobra,
              volResidual,
              idxInicioExhalacionForzada,
              vbe,
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
