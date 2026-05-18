import { useRef, useState, useMemo } from "react";
import styles from "./Maniobra.module.css";
import GraficoPaciente, { GraficoRef } from "../components/GraficoPaciente";
import { usePacientStore } from "../store/pacientStore";
import { AppView, NavigationPayload } from "../App";
import {
  aplicarPatron,
  calcularRespuestaBD,
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
  const faseActual = usePacientStore((state) => state.faseActual);

  const maniobrasGuardadas =
    faseActual === "pre"
      ? (pacienteActual?.espirometrias?.[0]?.maniobras?.length ?? 0)
      : (pacienteActual?.espirometrias?.[0]?.maniobrasPost?.length ?? 0);

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
      faseActual,
    );

    let factorObstruccion = 1;
    if (faseActual === "post" && patronActivo) {
      const bd = calcularRespuestaBD(patronActivo.respuestaBD);
      factorObstruccion = bd.factorObstruccion;
    }

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

    const tiempos = [
      0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.07, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6,
      0.7, 0.8, 0.9, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0,
      10.0,
    ];

    const propFvc = [
      0, 0.01, 0.02, 0.04, 0.05, 0.06, 0.08, 0.11, 0.16, 0.21, 0.3, 0.38, 0.45,
      0.51, 0.57, 0.62, 0.66, 0.7, 0.76, 0.83, 0.91, 0.95, 0.97, 0.99, 0.995,
      0.998, 0.999, 0.9995, 0.9998, 1.0,
    ];

    const earlyExponent = 2.8 + Math.random() * 0.8;
    const tTransFin = 0.25;
    const idxTransFin = tiempos.findIndex((t) => t >= tTransFin);
    const volEnTransFin = propFvc[idxTransFin] * fvcM;

    const volumenTiempo: number[][] = tiempos.map((t, i) => {
      const volBase = propFvc[i] * fvcM;

      if (t <= tTransFin) {
        const tNorm = t / tTransFin;
        const volRamp = volEnTransFin * Math.pow(tNorm, earlyExponent);
        const blend = tNorm * tNorm * (3 - 2 * tNorm);
        return [t, Math.max(0, volRamp * (1 - blend) + volBase * blend)];
      }

      return [t, volBase];
    });

    let maxPendiente = 0;
    let idxMaxPend = 1;
    for (let i = 1; i < volumenTiempo.length - 1; i++) {
      if (volumenTiempo[i][0] > 0.2) break;
      const dt = volumenTiempo[i + 1][0] - volumenTiempo[i - 1][0];
      const dv = volumenTiempo[i + 1][1] - volumenTiempo[i - 1][1];
      const pend = dv / dt;
      if (pend > maxPendiente) {
        maxPendiente = pend;
        idxMaxPend = i;
      }
    }

    const tPico = volumenTiempo[idxMaxPend][0];
    const vPico = volumenTiempo[idxMaxPend][1];
    const vbe = Math.max(0, vPico - maxPendiente * tPico);

    const flujoVolumenFinal = aplicarPatron(
      flujoVolumen,
      fvcM,
      patronActivo,
      factorObstruccion,
    );

    return {
      datosFlujoVolumen: flujoVolumenFinal,
      datosVolumenTiempo: volumenTiempo,
      indicesManiobra,
      volResidual,
      idxInicioExhalacionForzada,
      vbe,
    };
  }, [fev1, fvc, mls, patronActivo, faseActual]);

  const guardarManiobra = usePacientStore((state) => state.guardarManiobra);

  const generarUnaManiobra = () => {
    const indices = generarIndicesAleatorios(
      fvc,
      fev1,
      mls,
      patronActivo,
      faseActual,
    );
    let factorObstruccion = 1;
    if (faseActual === "post" && patronActivo) {
      factorObstruccion = calcularRespuestaBD(
        patronActivo.respuestaBD,
      ).factorObstruccion;
    }
    const fvcM = indices.fvc;
    const fev1M = indices.fev1;
    const peakFlujo = fev1M * (1.45 + Math.random() * 0.15);
    const peakVol = fvcM * (0.13 + Math.random() * 0.05);
    const cx = fvcM * 0.55;
    const rx = fvcM * 0.12;
    const ry = 0.6;
    const casiFvc = fvcM * 0.96;
    const mr = 0.6;

    const elipse = (
      cX: number,
      rX: number,
      _rY: number,
      n = 120,
    ): number[][] => {
      const pts: number[][] = [];
      for (let i = 0; i <= n; i++) {
        const theta = (i / n) * 2 * Math.PI;
        const ff = Math.sin(theta) > 0 ? 0.9 : 1.2;
        pts.push([
          perturbar(
            cX + perturbar(rX, 0.02 * mr) * Math.cos(theta),
            0.005 * mr,
          ),
          -perturbar(ry, 0.05 * mr) *
            Math.sign(Math.sin(theta)) *
            Math.pow(Math.abs(Math.sin(theta)), ff),
        ]);
      }
      return pts;
    };

    const b3i: number[][] = [];
    for (let i = 0; i <= 80; i++) {
      const theta = (i / 80) * Math.PI;
      b3i.push([
        perturbar(cx + perturbar(rx, 0.02 * mr) * Math.cos(theta), 0.005),
        -perturbar(ry * 1.1, 0.08 * mr) * Math.pow(Math.sin(theta), 0.8),
      ]);
    }
    const b3e: number[][] = [];
    const cxe = (cx - rx + casiFvc) / 2;
    const rxe = (casiFvc - (cx - rx)) / 2;
    for (let i = 1; i <= 100; i++) {
      const theta = Math.PI + (i / 100) * Math.PI;
      b3e.push([
        perturbar(cxe + rxe * Math.cos(theta), 0.005),
        -perturbar(ry * 1.3, 0.1 * mr) * Math.sin(theta),
      ]);
    }
    const insp: number[][] = [];
    const cxi = casiFvc / 2;
    for (let i = 1; i <= 150; i++) {
      const t = i / 150;
      const theta = t * Math.PI;
      insp.push([
        perturbar(cxi + cxi * Math.cos(theta), 0.005),
        perturbar(
          -2.0 * Math.sin(theta) * (1 + 0.3 * Math.sin(theta * 0.5)),
          0.03 * mr,
        ),
      ]);
    }
    const exh: number[][] = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      exh.push([
        perturbar(t * peakVol, 0.001),
        perturbar(peakFlujo * Math.pow(t, 0.7), 0.01),
      ]);
    }
    for (let i = 1; i <= 300; i++) {
      const t = i / 300;
      const ct = Math.pow(t, 0.7);
      exh.push([
        perturbar(peakVol + (fvcM - peakVol) * ct, 0.002),
        perturbar(peakFlujo * Math.pow(1 - ct, 1.5), 0.01),
      ]);
    }
    const vr = Math.random() * 0.09 + 0.005;
    const pkInsp = -(fev1M * (0.55 + Math.random() * 0.1));
    const inh: number[][] = [];
    for (let i = 0; i <= 200; i++) {
      const t = i / 200;
      inh.push([
        perturbar(fvcM * (1 - t) + vr * t, 0.003),
        perturbar(
          pkInsp *
            Math.sin(Math.PI * Math.pow(t, 0.75)) *
            (1 - 0.15 * Math.sin(2 * Math.PI * t)),
          0.02 * mr,
        ),
      ]);
    }

    const flujoVolumen = aplicarPatron(
      [
        ...elipse(cx, rx, ry),
        ...elipse(cx, rx, ry * 1.05),
        ...b3i,
        ...b3e,
        ...insp,
        ...exh,
        ...inh,
      ],
      fvcM,
      patronActivo,
      factorObstruccion,
    );

    const tiempos = [
      0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.07, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6,
      0.7, 0.8, 0.9, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0,
      10.0,
    ];

    const propFvc = [
      0, 0.01, 0.015, 0.02, 0.025, 0.03, 0.04, 0.06, 0.09, 0.11, 0.16, 0.21,
      0.26, 0.3, 0.34, 0.38, 0.42, 0.45, 0.51, 0.59, 0.7, 0.78, 0.84, 0.91,
      0.95, 0.97, 0.985, 0.992, 0.998, 1.0,
    ];
    const earlyExp = 2.8 + Math.random() * 0.8;
    const tTF = 0.25;
    const idxTF = tiempos.findIndex((t) => t >= tTF);
    const volTF = propFvc[idxTF] * fvcM;
    const volumenTiempo: number[][] = tiempos.map((t, i) => {
      const vb = propFvc[i] * fvcM;
      if (t <= tTF) {
        const tn = t / tTF;
        const vr2 = volTF * Math.pow(tn, earlyExp);
        const bl = tn * tn * (3 - 2 * tn);
        return [t, Math.max(0, vr2 * (1 - bl) + vb * bl)];
      }
      return [t, vb];
    });

    let maxP = 0;
    let idxMP = 1;
    for (let i = 1; i < volumenTiempo.length - 1; i++) {
      if (volumenTiempo[i][0] > 0.2) break;
      const dt = volumenTiempo[i + 1][0] - volumenTiempo[i - 1][0];
      const dv = volumenTiempo[i + 1][1] - volumenTiempo[i - 1][1];
      if (dv / dt > maxP) {
        maxP = dv / dt;
        idxMP = i;
      }
    }
    const vbe = Math.max(
      0,
      volumenTiempo[idxMP][1] - maxP * volumenTiempo[idxMP][0],
    );

    return {
      datosFlujoVolumen: flujoVolumen,
      datosVolumenTiempo: volumenTiempo,
      indices,
      vbe,
    };
  };

  const saltarAResultados = () => {
    if (!pacienteActual) return;
    for (let i = 0; i < 3; i++) {
      const m = generarUnaManiobra();
      guardarManiobra(pacienteActual.id, {
        datosFlujoVolumen: m.datosFlujoVolumen,
        datosVolumenTiempo: m.datosVolumenTiempo,
        criterios: {
          vtestables: true,
          esfuerzomaximo: true,
          volumenextrapolado: true,
          pefcontinuo: true,
        },
        fecha: new Date().toISOString(),
        indices: m.indices,
      });
    }
    onNavigate("interpolacion");
  };

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
      {/* ── Columna izquierda: título + gráfico ── */}
      <div className={styles.chartsColumn}>
        <button onClick={onBack} className={styles.mobileBackBtn}>
          ← Salir
        </button>

        <div className={styles.chartTitle}>
          Maniobra
          {faseActual === "post" && (
            <span className={styles.chartTitleBadge}>Post-BD</span>
          )}
        </div>

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

      {/* ── Panel derecho ── */}
      <aside className={styles.controlsPanel}>
        <div className={styles.panelHeader}>
          <div className={styles.patientInfoBlock}>
            {pacienteActual ? (
              <>
                <span className={styles.patientName}>
                  {pacienteActual.nombre}
                </span>
                {(pacienteActual.edad || pacienteActual.sexo) && (
                  <span className={styles.patientMeta}>
                    {pacienteActual.edad && `${pacienteActual.edad} años`}
                    {pacienteActual.edad && pacienteActual.sexo && " · "}
                    {pacienteActual.sexo}
                  </span>
                )}
                {patronActivo && (
                  <span className={styles.patronBadge}>
                    {patronActivo.nombre}
                  </span>
                )}
              </>
            ) : (
              <span className={styles.patientName}>Sin paciente</span>
            )}
          </div>
          <button onClick={onBack} className={styles.backButtonOutline}>
            Salir
          </button>
        </div>

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

        <button
          onClick={saltarAResultados}
          disabled={isExamining}
          style={{
            marginTop: 8,
            width: "100%",
            padding: "10px",
            background: "transparent",
            border: "1px solid #334155",
            borderRadius: 8,
            color: "#64748b",
            fontSize: "0.82rem",
            cursor: "pointer",
            transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#94a3b8";
            e.currentTarget.style.borderColor = "#475569";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#64748b";
            e.currentTarget.style.borderColor = "#334155";
          }}
        >
          Saltar a resultados →
        </button>
      </aside>
    </div>
  );
}
