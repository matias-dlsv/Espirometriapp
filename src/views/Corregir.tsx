import { useState } from "react";
import styles from "./Corregir.module.css";
import GraficoPaciente from "../components/GraficoPaciente";
import { AppView, NavigationPayload } from "../App";
import { usePacientStore } from "../store/pacientStore";

interface CorregirProps {
  onBack: () => void;
  onNavigate?: (view: AppView) => void;
  data: NavigationPayload | null;
}

export default function Corregir({ onBack, onNavigate, data }: CorregirProps) {
  const guardarManiobra = usePacientStore((state) => state.guardarManiobra);
  const pacienteActual  = usePacientStore((state) => state.pacienteSeleccionado);
  const faseActual      = usePacientStore((state) => state.faseActual);

  const parametros = pacienteActual?.espirometrias?.[0]?.parametros ?? null;
  const fvc        = parametros?.fvc.m ?? 5.241;

  const vbe       = data?.vbe ?? 0;
  const vbeMl     = Math.round(vbe * 1000);
  const umbralVBE = Math.max(0.150, fvc * 0.05);
  const vbeCumple = vbe < umbralVBE;

  const [criterios, setCriterios] = useState({
    vtestables:         false,
    esfuerzomaximo:     false,
    volumenextrapolado: false,
    pefcontinuo:        false,
  });

  const todosCumplen = Object.values(criterios).every((v) => v === true);

  const handleToggleCriterio = (key: keyof typeof criterios) => {
    setCriterios((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const idxCorte  = data?.idxInicioExhalacionForzada ?? 0;
  const datosGris = data?.datosFlujoVolumen.slice(0, idxCorte + 1) ?? [];
  const datosAzul = data?.datosFlujoVolumen.slice(idxCorte)        ?? [];

  const handleGuardarYContinuar = () => {
    if (!todosCumplen || !data || !pacienteActual) return;

    const cantidadAntes =
      faseActual === "pre"
        ? (pacienteActual.espirometrias[0]?.maniobras?.length     ?? 0)
        : (pacienteActual.espirometrias[0]?.maniobrasPost?.length ?? 0);

    guardarManiobra(pacienteActual.id, {
      datosFlujoVolumen:  data.datosFlujoVolumen,
      datosVolumenTiempo: data.datosVolumenTiempo,
      criterios,
      fecha:   new Date().toISOString(),
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
        <div className={styles.card} style={{ margin: "auto", textAlign: "center" }}>
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

        <div className={styles.chartCard}>
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
          />
        </div>

        <div className={styles.chartCard}>
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
          />
        </div>
      </div>

      <aside className={styles.controlsPanel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Revisión</h2>
            {pacienteActual && (
              <span className={styles.patientName}>{pacienteActual.nombre}</span>
            )}
          </div>
          <button onClick={onBack} className={styles.backButtonOutline}>
            Descartar
          </button>
        </div>

        {data.indices && (
          <div className={styles.card}>
            <span className={styles.label}>Índices de esta maniobra</span>

            {/* Índices principales */}
            <div className={styles.indicesGrid}>
              <div className={styles.indiceItem}>
                <span className={styles.indiceLabel}>FVC</span>
                <span className={styles.indiceValor}>
                  {data.indices.fvc.toFixed(2)} L
                </span>
              </div>
              <div className={styles.indiceItem}>
                <span className={styles.indiceLabel}>FEV1</span>
                <span className={styles.indiceValor}>
                  {data.indices.fev1.toFixed(2)} L
                </span>
              </div>
              <div className={styles.indiceItem}>
                <span className={styles.indiceLabel}>FEV1/FVC</span>
                <span className={styles.indiceValor}>
                  {(data.indices.fev1fvc * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* VBE separado visualmente */}
            <div className={styles.vbeSeparador} />
            <div className={styles.vbeRow}>
              <div className={styles.vbeRowLeft}>
                <span className={styles.indiceLabel}>VBE</span>
              </div>
              <span
                className={styles.indiceValor}
                style={{ color: vbeCumple ? "#10b981" : "#ef4444" }}
              >
                {vbeMl} ml
              </span>
            </div>
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
            {[
              { key: "vtestables",         label: "3 Vt estables"                      },
              { key: "esfuerzomaximo",     label: "Esfuerzo máximo"                    },
              { key: "volumenextrapolado", label: "Volumen extrapolado aceptable (<100ml)"       },
              { key: "pefcontinuo",        label: "PEF continuo y libre de artefactos" },
            ].map(({ key, label }) => (
              <label key={key} className={styles.checkItem}>
                <input
                  type="checkbox"
                  checked={criterios[key as keyof typeof criterios]}
                  onChange={() => handleToggleCriterio(key as keyof typeof criterios)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleGuardarYContinuar}
          disabled={!todosCumplen}
          className={`${styles.nextButton} ${!todosCumplen ? styles.nextButtonDisabled : ""}`}
        >
          Guardar y Continuar →
        </button>
      </aside>
    </div>
  );
}