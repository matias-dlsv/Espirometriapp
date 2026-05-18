import { useMemo } from "react";
import styles from "./Interpolacion.module.css";
import GraficoPaciente from "../components/GraficoPaciente";
import { AppView, NavigationPayload } from "../App";
import { usePacientStore } from "../store/pacientStore";

interface InterpolacionProps {
  onBack: () => void;
  onNavigate: (view: AppView, payload?: NavigationPayload) => void;
}

const COLORES = ["#3b82f6", "#10b981", "#f59e0b"];

export default function Interpolacion({
  onBack,
  onNavigate,
}: InterpolacionProps) {
  const pacienteActual = usePacientStore((state) => state.pacienteSeleccionado);
  const patronActivo = usePacientStore((state) => state.patronActivo);

  const faseActual = usePacientStore((state) => state.faseActual);

  const maniobrasGuardadas =
    faseActual === "pre"
      ? (pacienteActual?.espirometrias?.[0]?.maniobras ?? [])
      : (pacienteActual?.espirometrias?.[0]?.maniobrasPost ?? []);
  const parametros = pacienteActual?.espirometrias?.[0]?.parametros ?? null;

  const fvc = parametros?.fvc.m ?? 0;
  const fev1 = parametros?.fev1.m ?? 0;
  const fev1fvc = parametros?.fev1fvc.m ?? 0;

  const maniobras = useMemo(() => {
    return maniobrasGuardadas.map((m, i) => ({
      id: i + 1,
      color: COLORES[i % COLORES.length],
      flujoVolumen: m.datosFlujoVolumen,
      volumenTiempo: m.datosVolumenTiempo,
      criterios: m.criterios,
      fecha: m.fecha,
      indices: m.indices ?? { fvc, fev1, fev1fvc },
    }));
  }, [maniobrasGuardadas, fvc, fev1, fev1fvc]);

  // Mejor maniobra: mayor FVC + FEV1
  const mejorManiobraId = useMemo(() => {
    if (maniobras.length === 0) return null;
    return maniobras.reduce((mejor, actual) => {
      const sumaActual = actual.indices.fvc + actual.indices.fev1;
      const sumaMejor = mejor.indices.fvc + mejor.indices.fev1;
      return sumaActual > sumaMejor ? actual : mejor;
    }).id;
  }, [maniobras]);

  if (maniobras.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h2>No hay maniobras guardadas</h2>
          <p>Debes completar al menos una maniobra aceptable.</p>
          <button onClick={onBack} className={styles.finishBtn}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>
          ← Volver
        </button>
        <div>
          <h1>
            {faseActual === "post"
              ? "Comparativa Post-BD"
              : "Comparativa de Maniobras"}
          </h1>
          {pacienteActual && (
            <span className={styles.patientName}>{pacienteActual.nombre}</span>
          )}
          {patronActivo && (
            <span className={styles.patronBadge}>{patronActivo.nombre}</span>
          )}
        </div>
      </header>

      <main className={styles.content}>
        {/* GRÁFICOS */}
        <div className={styles.chartsSection}>
          <div className={styles.chartWrapper}>
            <GraficoPaciente
              titulo="Comparativa Flujo / Volumen"
              ejeX="Volumen (L)"
              ejeY="Flujo (L/s)"
              mostrarEstatico={true}
              multiData={maniobras.map((m) => ({
                puntos: m.flujoVolumen,
                color: m.color,
                label: `M${m.id}${m.id === mejorManiobraId ? " (mejor)" : ""}`,
              }))}
              minX={-3}
              maxX={12}
              minY={-4}
              maxY={12}
            />
          </div>

          <div className={styles.chartWrapper}>
            <GraficoPaciente
              titulo="Comparativa Volumen / Tiempo"
              ejeX="Tiempo (s)"
              ejeY="Volumen (L)"
              mostrarEstatico={true}
              multiData={maniobras.map((m) => ({
                puntos: m.volumenTiempo,
                color: m.color,
                label: `M${m.id}`,
              }))}
              minX={0}
              maxX={17}
              minY={0}
              maxY={Math.ceil(fvc) + 1}
            />
          </div>
        </div>

        {/* TABLA — filas = maniobras, columnas = índices */}
        <section className={styles.tableSection}>
          <table className={styles.resultsTable}>
            <thead>
              <tr>
                <th>Maniobra</th>
                <th>FVC (L)</th>
                <th>FEV1 (L)</th>
                <th>FEV1/FVC (%)</th>
              </tr>
            </thead>
            <tbody>
              {maniobras.map((m) => {
                const esMejor = m.id === mejorManiobraId;
                return (
                  <tr key={m.id} className={esMejor ? styles.bestRow : ""}>
                    <td>
                      <div className={styles.maniobraCell}>
                        <span
                          className={styles.colorDot}
                          style={{ background: m.color }}
                        />
                        <span>Maniobra {m.id}</span>
                        {esMejor && (
                          <span className={styles.mejorBadge}>MEJOR</span>
                        )}
                      </div>
                    </td>
                    <td className={esMejor ? styles.best : ""}>
                      {m.indices.fvc.toFixed(2)}
                    </td>
                    <td className={esMejor ? styles.best : ""}>
                      {m.indices.fev1.toFixed(2)}
                    </td>
                    <td className={esMejor ? styles.best : ""}>
                      {(m.indices.fev1fvc * 100).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </main>

      <footer className={styles.footer}>
        <button
          className={styles.finishBtn}
          onClick={() => onNavigate("resultado")}
        >
          Siguiente →
        </button>
      </footer>
    </div>
  );
}
