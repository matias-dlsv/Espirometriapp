import { useState } from "react";
import styles from "./Corregir.module.css";
import GraficoPaciente from "../components/GraficoPaciente";
import { AppView, NavigationPayload } from "../App";
import { usePacientStore } from "../store/pacientStore";
import TooltipTerm from "../components/ToolTipTerm.tsx";

interface CorregirProps {
  onBack: () => void;
  onNavigate?: (view: AppView) => void;
  data: NavigationPayload | null;
}

const LABELS: Record<string, string> = {
  vtestables: "3 Vt estables",
  esfuerzomaximo: "Esfuerzo máximo",
  volumenextrapolado: "Volumen extrapolado aceptable (<100ml)",
  pefcontinuo: "PEF continuo y libre de artefactos",
  tiempoespiracion: "Tiempo de espiración ≥ 6 segundos",
};

export default function Corregir({ onBack, onNavigate, data }: CorregirProps) {
  const guardarManiobra = usePacientStore((state) => state.guardarManiobra);
  const pacienteActual = usePacientStore((state) => state.pacienteSeleccionado);
  const patronActivo = usePacientStore((state) => state.patronActivo);
  const faseActual = usePacientStore((state) => state.faseActual);

  const parametros = pacienteActual?.espirometrias?.[0]?.parametros ?? null;
  const fvc = parametros?.fvc.m ?? 5.241;

  const vbe = data?.vbe ?? 0;
  const vbeMl = Math.round(vbe * 1000);
  const umbralVBE = Math.max(0.15, fvc * 0.05);
  const vbeCumple = vbe < umbralVBE;

  const tiempoEspiracion = (() => {
    const pts = data?.datosVolumenTiempo ?? [];
    if (pts.length === 0) return 0;
    const fvcObservada = data?.indices?.fvc ?? 0;
    const umbral = fvcObservada * 0.97;
    for (let i = pts.length - 1; i >= 0; i--) {
      if (pts[i][1] >= umbral) return pts[i][0];
    }
    return pts[pts.length - 1][0];
  })();
  const tiempoEspiracionCumple = tiempoEspiracion >= 6;

  const criteriosGenerados = {
    ...(data?.criteriosGenerados ?? {
      vtestables: true,
      esfuerzomaximo: true,
      volumenextrapolado: true,
      pefcontinuo: true,
      tiempoespiracion: true,
    }),
  };

  const hayFallos = Object.values(criteriosGenerados).some((v) => !v);

  const [criterios, setCriterios] = useState({
    vtestables: false,
    esfuerzomaximo: false,
    volumenextrapolado: false,
    pefcontinuo: false,
    tiempoespiracion: false,
  });

  const [intentoGuardar, setIntentoGuardar] = useState(false);

  const todosMarcados = Object.values(criterios).every(Boolean);

  const handleToggleCriterio = (key: keyof typeof criterios) => {
    if (intentoGuardar && !criteriosGenerados[key]) return;
    setCriterios((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const idxCorte = data?.idxInicioExhalacionForzada ?? 0;
  const datosGris = data?.datosFlujoVolumen.slice(0, idxCorte + 1) ?? [];
  const datosAzul = data?.datosFlujoVolumen.slice(idxCorte) ?? [];

  const handleGuardarYContinuar = () => {
    if (!todosMarcados || !data || !pacienteActual) return;

    if (hayFallos) {
      setIntentoGuardar(true);
      // Actualizamos el estado para forzar a "OFF" (false) los switches que no cumplen los criterios
      setCriterios((prev) => {
        const nuevosCriterios = { ...prev };
        (
          Object.keys(criteriosGenerados) as Array<keyof typeof criterios>
        ).forEach((key) => {
          if (!criteriosGenerados[key]) {
            nuevosCriterios[key] = false;
          }
        });
        return nuevosCriterios;
      });
      return;
    }

    const cantidadAntes =
      faseActual === "pre"
        ? (pacienteActual.espirometrias[0]?.maniobras?.length ?? 0)
        : (pacienteActual.espirometrias[0]?.maniobrasPost?.length ?? 0);

    guardarManiobra(pacienteActual.id, {
      datosFlujoVolumen: data.datosFlujoVolumen,
      datosVolumenTiempo: data.datosVolumenTiempo,
      criterios,
      fecha: new Date().toISOString(),
      indices: data.indices,
    });

    if (onNavigate) {
      if (cantidadAntes + 1 >= 3) {
        onNavigate("interpolacion");
      } else {
        onNavigate("maniobra");
      }
    }
  };

  if (!data) {
    return (
      <div className={styles.layout}>
        <div
          className={styles.card}
          style={{ margin: "auto", textAlign: "center" }}
        >
          <h2>No hay datos de maniobra disponibles</h2>
          <p>Debe realizar una maniobra primero para poder evaluarla.</p>
          <button onClick={onBack} className={styles.mainActionButton}>
            Volver a Maniobra
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <div className={styles.chartsColumn}>
        <button onClick={onBack} className={styles.mobileBackBtn}>
          ← Volver
        </button>

        <div className={`${styles.chartCard} ${styles.chartCardFV}`}>
          <GraficoPaciente
            titulo="Flujo / Volumen"
            ejeX="Vol (L)"
            ejeY="Flujo (L/s)"
            colorLinea="#3b82f6"
            colorSecundario="#94a3b8"
            data={datosAzul}
            dataSecundaria={datosGris}
            mostrarEstatico={true}
            minX={-3}
            maxX={12}
            minY={-4}
            maxY={12}
            lineasReferencia={
              data.indices?.pef != null
                ? [
                    {
                      valor: data.indices.pef,
                      color: "#000000",
                      etiqueta: `PEF ${data.indices.pef.toFixed(2)} L/s`,
                    },
                  ]
                : []
            }
          />
        </div>

        <div className={`${styles.chartCard} ${styles.chartCardFV}`}>
          <GraficoPaciente
            titulo="Volumen / Tiempo"
            ejeX="Tiempo (s)"
            ejeY="Vol (L)"
            colorLinea="#10b981"
            data={data.datosVolumenTiempo}
            mostrarEstatico={true}
            minX={-0.2}
            maxX={11}
            minY={-0.2}
            maxY={Math.ceil(fvc) + 1}
            lineasReferencia={[
              {
                valor: tiempoEspiracion,
                color: tiempoEspiracionCumple ? "#10b981" : "#ef4444",
                etiqueta: `${tiempoEspiracion.toFixed(1)}s`,
              },
            ]}
          />
        </div>
      </div>

      <aside className={styles.controlsPanel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Revisión</h2>
            {pacienteActual && (
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
              </>
            )}
            {patronActivo && (
              <span className={styles.patronBadge}>{patronActivo.nombre}</span>
            )}
          </div>
          <button onClick={onBack} className={styles.backButtonOutline}>
            Descartar
          </button>
        </div>

        {data.indices && (
          <div className={styles.card}>
            <span className={styles.label}>Índices de esta maniobra</span>
            <div className={styles.indicesGrid}>
              <div className={styles.indiceItem}>
                <span className={styles.indiceLabel}>
                  <TooltipTerm term="FVC" />
                </span>
                <span className={styles.indiceValor}>
                  {data.indices.fvc.toFixed(2)} L
                </span>
              </div>
              <div className={styles.indiceItem}>
                <span className={styles.indiceLabel}>
                  <TooltipTerm term="FEV1" />
                </span>
                <span className={styles.indiceValor}>
                  {data.indices.fev1.toFixed(2)} L
                </span>
              </div>
              <div className={styles.indiceItem}>
                <span className={styles.indiceLabel}>
                  <TooltipTerm term="FEV1/FVC" />
                </span>
                <span className={styles.indiceValor}>
                  {(data.indices.fev1fvc * 100).toFixed(1)}%
                </span>
              </div>
              <div className={styles.indiceItem}>
                <span className={styles.indiceLabel}>
                  <TooltipTerm term="PEF" />
                </span>
                <span className={styles.indiceValor}>
                  {data.indices.pef != null
                    ? `${data.indices.pef.toFixed(2)} L/s`
                    : "—"}
                </span>
              </div>
            </div>
            <div className={styles.vbeSeparador} />
            <div className={styles.vbeRow}>
              <div className={styles.vbeRowLeft}>
                <span className={styles.indiceLabel}>
                  <TooltipTerm term="VBE" />
                </span>
              </div>
              <span
                className={styles.indiceValor}
                style={{ color: vbeCumple ? "#10b981" : "#ef4444" }}
              >
                {vbeMl} ml
              </span>
            </div>
            <div className={styles.vbeSeparador} />
          </div>
        )}

        {intentoGuardar && hayFallos && (
          <div
            style={{
              background: "#450a0a",
              border: "1px solid #991b1b",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: "0.82rem",
              color: "#fca5a5",
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: "#f87171" }}>Maniobra no aceptable.</strong>{" "}
            Los siguientes criterios no se cumplen:{" "}
            <strong>
              {Object.entries(criteriosGenerados)
                .filter(([, v]) => !v)
                .map(([k]) => LABELS[k])
                .join(", ")}
            </strong>
            . Debe descartar esta maniobra.
          </div>
        )}

        <div className={styles.card}>
          <p className={styles.instructionsText}>
            Revise la curva obtenida y marque los criterios cumplidos.
          </p>
        </div>

        <div className={styles.card}>
          <span className={styles.label}>Criterios de Aceptabilidad</span>
          <div className={styles.checkList}>
            {(Object.keys(criterios) as Array<keyof typeof criterios>).map(
              (key) => {
                const esFallo = intentoGuardar && !criteriosGenerados[key];
                const bloqueado = esFallo;
                return (
                  <label
                    key={key}
                    className={styles.checkItem}
                    style={{
                      color: esFallo ? "#ef4444" : undefined,
                      cursor: bloqueado ? "not-allowed" : "pointer",
                    }}
                  >
                    <div className={styles.switchWrapper}>
                      <input
                        type="checkbox"
                        // Adicionalmente forzamos a que, si es fallo, se renderice apagado como medida de seguridad visual
                        checked={criterios[key] && !esFallo}
                        disabled={bloqueado}
                        onChange={() => handleToggleCriterio(key)}
                        className={styles.switchInput}
                      />
                      <span className={styles.switchTrack} />
                    </div>
                    {LABELS[key]}
                    {esFallo && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: "0.75rem",
                          color: "#ef4444",
                          fontStyle: "italic",
                        }}
                      >
                        — no cumple
                      </span>
                    )}
                  </label>
                );
              },
            )}
          </div>
        </div>

        <button
          onClick={handleGuardarYContinuar}
          disabled={!todosMarcados || (intentoGuardar && hayFallos)}
          className={`${styles.nextButton} ${!todosMarcados || (intentoGuardar && hayFallos) ? styles.nextButtonDisabled : ""}`}
        >
          Guardar y Continuar →
        </button>

        <button onClick={onBack} className={styles.discardButton}>
          Descartar maniobra
        </button>
      </aside>
    </div>
  );
}
