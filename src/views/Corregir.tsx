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

const INICIO_INHALACION_PROFUNDA  = 423;

export default function Corregir({ onBack, onNavigate, data }: CorregirProps) {
  const guardarManiobra = usePacientStore((state) => state.guardarManiobra);
  const pacienteActual  = usePacientStore((state) => state.pacienteSeleccionado);

  const [criterios, setCriterios] = useState({
    vtestables: false,
    esfuerzomaximo: false,
    volumenextrapolado: false,
    pefcontinuo: false,
  });

  const todosCumplen = Object.values(criterios).every((v) => v === true);

  const handleToggleCriterio = (key: keyof typeof criterios) => {
    setCriterios((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const parametros = pacienteActual?.espirometrias?.[0]?.parametros ?? null;
  const fvc = parametros?.fvc.m ?? 5.241;

  const datosBucles     = data?.datosFlujoVolumen.slice(0, INICIO_INHALACION_PROFUNDA + 1) ?? [];
  const datosExhalacion = data?.datosFlujoVolumen.slice(INICIO_INHALACION_PROFUNDA) ?? [];

  const handleGuardarYContinuar = () => {
    if (!todosCumplen || !data || !pacienteActual) return;

    const cantidadAntes = pacienteActual.espirometrias[0]?.maniobras?.length ?? 0;

    const nuevaManiobra = {
      datosFlujoVolumen: data.datosFlujoVolumen,
      datosVolumenTiempo: data.datosVolumenTiempo,
      criterios,
      fecha: new Date().toISOString(),
      indices: data.indices, // NUEVO
    };

    guardarManiobra(pacienteActual.id, nuevaManiobra);

    const cantidadDespues = cantidadAntes + 1;

    if (onNavigate) {
      if (cantidadDespues >= 3) {
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
        <button onClick={onBack} className={styles.mobileBackBtn}>← Volver</button>

        <div className={styles.chartCard}>
          <GraficoPaciente
            titulo="Flujo / Volumen"
            ejeX="Vol (L)"
            ejeY="Flujo (L/s)"
            colorLinea="#3b82f6"
            colorSecundario="#94a3b8"
            data={datosExhalacion}
            dataSecundaria={datosBucles}
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
            maxX={17}
            minY={-0.5}
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

        {/* Índices de esta maniobra */}
        {data.indices && (
          <div className={styles.card}>
            <span className={styles.label}>Índices de esta maniobra</span>
            <div className={styles.indicesGrid}>
              <div className={styles.indiceItem}>
                <span className={styles.indiceLabel}>FVC</span>
                <span className={styles.indiceValor}>{data.indices.fvc.toFixed(2)} L</span>
              </div>
              <div className={styles.indiceItem}>
                <span className={styles.indiceLabel}>FEV1</span>
                <span className={styles.indiceValor}>{data.indices.fev1.toFixed(2)} L</span>
              </div>
              <div className={styles.indiceItem}>
                <span className={styles.indiceLabel}>FEV1/FVC</span>
                <span className={styles.indiceValor}>{(data.indices.fev1fvc * 100).toFixed(1)}%</span>
              </div>
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
              { key: "vtestables",         label: "3 Vt estables" },
              { key: "esfuerzomaximo",     label: "Esfuerzo máximo" },
              { key: "volumenextrapolado", label: "Volumen extrapolado < 100 ml" },
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