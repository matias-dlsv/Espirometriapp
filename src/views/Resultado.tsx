import styles from "./Resultado.module.css";
import { AppView, NavigationPayload } from "../App";
import { usePacientStore } from "../store/pacientStore";
import { useMemo } from "react";

interface ResultadoProps {
  onBack: () => void;
  onNavigate: (view: AppView, payload?: NavigationPayload) => void;
}

const COLORES = ["#3b82f6", "#10b981", "#f59e0b"];

export default function Resultado({ onBack, onNavigate }: ResultadoProps) {
  const pacienteActual = usePacientStore((state) => state.pacienteSeleccionado);
  const patronActivo   = usePacientStore((state) => state.patronActivo);

  const maniobrasGuardadas = pacienteActual?.espirometrias?.[0]?.maniobras ?? [];
  const parametros         = pacienteActual?.espirometrias?.[0]?.parametros ?? null;

  const fvcTeorico     = parametros?.fvc.m     ?? 0;
  const fev1Teorico    = parametros?.fev1.m    ?? 0;
  const fev1fvcTeorico = parametros?.fev1fvc.m ?? 0;

  // Encontramos la mejor maniobra — la que cumple todos los criterios
  // Si ninguna es perfecta, la primera
  const mejorManiobra = useMemo(() => {
    if (maniobrasGuardadas.length === 0) return null;
    const perfecta = maniobrasGuardadas.find((m) =>
      m.criterios && Object.values(m.criterios).every(Boolean)
    );
    return perfecta ?? maniobrasGuardadas[0];
  }, [maniobrasGuardadas]);

  const mejorIndice = maniobrasGuardadas.indexOf(mejorManiobra!);
  const colorMejor  = COLORES[mejorIndice % COLORES.length];

  const filas = mejorManiobra ? [
    {
      variable: "FVC",
      unidad: "L",
      real: mejorManiobra.indices?.fvc ?? fvcTeorico,
      teorico: fvcTeorico,
    },
    {
      variable: "FEV1",
      unidad: "L",
      real: mejorManiobra.indices?.fev1 ?? fev1Teorico,
      teorico: fev1Teorico,
    },
    {
      variable: "FEV1/FVC",
      unidad: "%",
      real: (mejorManiobra.indices?.fev1fvc ?? fev1fvcTeorico),
      teorico: fev1fvcTeorico,
      esRatio: true, // para formatear distinto
    },
  ] : [];

  if (!mejorManiobra) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h2>No hay maniobras disponibles</h2>
          <button onClick={onBack} className={styles.salbutamolBtn}>Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>← Volver</button>
        <div>
          <h1>Resultado Final</h1>
          {pacienteActual && (
            <span className={styles.patientName}>{pacienteActual.nombre}</span>
          )}
          {patronActivo && (
            <span className={styles.patronBadge}>{patronActivo.nombre}</span>
          )}
        </div>
      </header>

      {/* CONTENIDO */}
      <main className={styles.content}>
        {/* BADGE MEJOR MANIOBRA */}
        <div className={styles.mejorBadgeWrapper}>
          <div className={styles.mejorBadge} style={{ borderColor: colorMejor }}>
            <span className={styles.mejorLabel}>Mejor maniobra</span>
            <span className={styles.mejorNumero} style={{ color: colorMejor }}>
              M{mejorIndice + 1}
            </span>
          </div>
        </div>

        {/* TABLA */}
        <section className={styles.tableSection}>
          <table className={styles.resultsTable}>
            <thead>
              <tr>
                <th>Variable</th>
                <th>Real</th>
                <th>Teórico</th>
                <th>% Teórico</th>
                <th className={styles.llnCol}>LLN</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ variable, unidad, real, teorico, esRatio }) => {
                const porcentaje = teorico > 0 ? (real / teorico) * 100 : 0;
                const realFormateado  = esRatio
                  ? `${(real * 100).toFixed(1)}%`
                  : `${real.toFixed(2)} ${unidad}`;
                const teoricoFormateado = esRatio
                  ? `${(teorico * 100).toFixed(1)}%`
                  : `${teorico.toFixed(2)} ${unidad}`;

                const colorPorcentaje =
                  porcentaje >= 80 ? "#10b981" :
                  porcentaje >= 70 ? "#f59e0b" :
                  "#ef4444";

                return (
                  <tr key={variable}>
                    <td className={styles.variableCell}>{variable}</td>
                    <td className={styles.realCell}>{realFormateado}</td>
                    <td className={styles.teoricoCell}>{teoricoFormateado}</td>
                    <td>
                      <span
                        className={styles.porcentajeBadge}
                        style={{ color: colorPorcentaje, borderColor: colorPorcentaje }}
                      >
                        {porcentaje.toFixed(1)}%
                      </span>
                    </td>
                    <td className={styles.llnCell}>
                      <span className={styles.llnPending}>—</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <p className={styles.llnNote}>
          * LLN (Límite inferior de la normalidad) será calculado en una próxima versión.
        </p>
      </main>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <button
          className={styles.salbutamolBtn}
          onClick={() => onNavigate("maniobra")}
        >
          Salbutamol →
        </button>
      </footer>
    </div>
  );
}