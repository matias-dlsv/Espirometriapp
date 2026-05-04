import styles from "./Resultado.module.css";
import { AppView, NavigationPayload } from "../App";
import { usePacientStore, ManiobraGuardada } from "../store/pacientStore";
import { useMemo } from "react";

interface ResultadoProps {
  onBack: () => void;
  onNavigate: (view: AppView, payload?: NavigationPayload) => void;
}

const COLORES = ["#3b82f6", "#10b981", "#f59e0b"];

// ============================================================
// Z-SCORE (método LMS — GLI 2012)
// ============================================================
// Si L ≈ 0, se usa la fórmula logarítmica de seguridad.
// El LLN corresponde a Z = -1.645 (percentil 5).
const calcularZScore = (
  yObs: number,
  m: number,
  l: number,
  s: number,
): number => {
  if (m <= 0 || s <= 0) return NaN;

  if (Math.abs(l) < 1e-10) {
    // Caso l ≈ 0: fórmula logarítmica alternativa
    return Math.log(yObs / m) / s;
  }

  return (Math.pow(yObs / m, l) - 1) / (l * s);
};

// Devuelve etiqueta clínica y color para el Z-score
const interpretarZ = (
  z: number,
): { label: string; color: string } => {
  if (isNaN(z)) return { label: "—", color: "#333" };
  if (z >= -1.645) return { label: "Normal", color: "#10b981" };
  if (z >= -2.5)   return { label: "Leve ↓",     color: "#f59e0b" };
  if (z >= -4.0)   return { label: "Moderado ↓", color: "#f97316" };
  return             { label: "Grave ↓",          color: "#ef4444" };
};

// ============================================================
// HELPERS EXISTENTES
// ============================================================
const encontrarMejor = (
  maniobras: ManiobraGuardada[],
): ManiobraGuardada | null => {
  if (maniobras.length === 0) return null;
  const perfecta = maniobras.find(
    (m) => m.criterios && Object.values(m.criterios).every(Boolean),
  );
  return perfecta ?? maniobras[0];
};

export default function Resultado({ onBack, onNavigate }: ResultadoProps) {
  const pacienteActual = usePacientStore((state) => state.pacienteSeleccionado);
  const patronActivo   = usePacientStore((state) => state.patronActivo);
  const faseActual     = usePacientStore((state) => state.faseActual);
  const setFase        = usePacientStore((state) => state.setFase);

  const maniobrasPreRaw  = pacienteActual?.espirometrias?.[0]?.maniobras     ?? [];
  const maniobrasPostRaw = pacienteActual?.espirometrias?.[0]?.maniobrasPost ?? [];
  const parametros       = pacienteActual?.espirometrias?.[0]?.parametros    ?? null;

  // Valores teóricos (M) y parámetros LMS extraídos de las tablas GLI 2012
  const fvcMLS     = parametros?.fvc     ?? { m: 0, l: 0, s: 1 };
  const fev1MLS    = parametros?.fev1    ?? { m: 0, l: 0, s: 1 };
  const fev1fvcMLS = parametros?.fev1fvc ?? { m: 0, l: 0, s: 1 };

  const mejorPre  = useMemo(() => encontrarMejor(maniobrasPreRaw),  [maniobrasPreRaw]);
  const mejorPost = useMemo(() => encontrarMejor(maniobrasPostRaw), [maniobrasPostRaw]);

  const mejorActual = faseActual === "pre" ? mejorPre : mejorPost;
  const indiceActual =
    faseActual === "pre"
      ? maniobrasPreRaw.indexOf(mejorPre!)
      : maniobrasPostRaw.indexOf(mejorPost!);
  const colorMejor = COLORES[indiceActual % COLORES.length];

  const hayPost = maniobrasPostRaw.length > 0 && mejorPost;

  // ── Construcción de filas ──────────────────────────────────────────────────
  const filas = mejorActual
    ? [
        {
          variable: "FVC",
          unidad: "L",
          real:     mejorActual.indices?.fvc     ?? fvcMLS.m,
          realPost: mejorPost?.indices?.fvc,
          teorico:  fvcMLS.m,
          mls:      fvcMLS,
        },
        {
          variable: "FEV1",
          unidad: "L",
          real:     mejorActual.indices?.fev1     ?? fev1MLS.m,
          realPost: mejorPost?.indices?.fev1,
          teorico:  fev1MLS.m,
          mls:      fev1MLS,
        },
        {
          variable: "FEV1/FVC",
          unidad: "%",
          real:     mejorActual.indices?.fev1fvc     ?? fev1fvcMLS.m,
          realPost: mejorPost?.indices?.fev1fvc,
          teorico:  fev1fvcMLS.m,
          mls:      fev1fvcMLS,
          esRatio:  true,
        },
      ]
    : [];

  const formatear = (val: number, esRatio?: boolean, unidad?: string) =>
    esRatio ? `${(val * 100).toFixed(1)}%` : `${val.toFixed(2)} ${unidad}`;

  const colorPct = (pct: number) =>
    pct >= 80 ? "#10b981" : pct >= 70 ? "#f59e0b" : "#ef4444";

  // ── Estado vacío ───────────────────────────────────────────────────────────
  if (!mejorActual) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h2>No hay maniobras disponibles</h2>
          <button onClick={onBack} className={styles.salbutamolBtn}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>
          ← Volver
        </button>
        <div>
          <h1>
            Resultado{" "}
            {faseActual === "post"
              ? "Post-Broncodilatador"
              : "Pre-Broncodilatador"}
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
        <div className={styles.mejorBadgeWrapper}>
          <div
            className={styles.mejorBadge}
            style={{ borderColor: colorMejor }}
          >
            <span className={styles.mejorLabel}>Mejor maniobra</span>
            <span className={styles.mejorNumero} style={{ color: colorMejor }}>
              M{indiceActual + 1}
            </span>
          </div>
        </div>

        <section className={styles.tableSection}>
          <table className={styles.resultsTable}>
            <thead>
              <tr>
                <th>Variable</th>
                <th>Pre-BD</th>
                {hayPost && <th>Post-BD</th>}
                <th>Teórico</th>
                <th>% Pre</th>
                {hayPost && <th>% Post</th>}
                <th className={styles.llnCol}>Z-score</th>
                <th className={styles.llnCol}>LLN</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(
                ({ variable, unidad, real, realPost, teorico, mls, esRatio }) => {
                  const pctPre  = teorico > 0 ? (real / teorico) * 100 : 0;
                  const pctPost =
                    realPost && teorico > 0 ? (realPost / teorico) * 100 : null;

                  // Z-score sobre la mejor maniobra (pre o post según fase)
                  const zPre = calcularZScore(real, mls.m, mls.l, mls.s);
                  const { label: zLabel, color: zColor } = interpretarZ(zPre);

                  // Fórmula exacta GLI 2012 (ver lookup tables):
                  //   LLN = exp( ln(1 − 1.645·L·S) / L + ln(M) )
                  //       = M · (1 − 1.645·L·S)^(1/L)     si L ≠ 0
                  //       = M · exp(−1.645·S)              si L ≈ 0
                  const lln = (() => {
                    if (mls.m <= 0 || mls.s <= 0) return null;
                    if (Math.abs(mls.l) < 1e-10) {
                      return mls.m * Math.exp(-1.645 * mls.s);
                    }
                    const base = 1 - 1.645 * mls.l * mls.s;
                    if (base <= 0) return null; // dominio inválido para log
                    return mls.m * Math.pow(base, 1 / mls.l);
                  })();

                  return (
                    <tr key={variable}>
                      <td className={styles.variableCell}>{variable}</td>
                      <td className={styles.realCell}>
                        {formatear(real, esRatio, unidad)}
                      </td>
                      {hayPost && (
                        <td className={styles.postCell}>
                          {realPost ? formatear(realPost, esRatio, unidad) : "—"}
                        </td>
                      )}
                      <td className={styles.teoricoCell}>
                        {formatear(teorico, esRatio, unidad)}
                      </td>
                      {/* % Pre */}
                      <td>
                        <span
                          className={styles.porcentajeBadge}
                          style={{
                            color: colorPct(pctPre),
                            borderColor: colorPct(pctPre),
                          }}
                        >
                          {pctPre.toFixed(1)}%
                        </span>
                      </td>
                      {/* % Post */}
                      {hayPost && (
                        <td>
                          {pctPost !== null ? (
                            <span
                              className={styles.porcentajeBadge}
                              style={{
                                color: colorPct(pctPost),
                                borderColor: colorPct(pctPost),
                              }}
                            >
                              {pctPost.toFixed(1)}%
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      )}
                      {/* Z-score */}
                      <td>
                        <span
                          className={styles.zscoreBadge}
                          style={{ color: zColor, borderColor: zColor }}
                          title={zLabel}
                        >
                          {isNaN(zPre) ? "—" : zPre.toFixed(2)}
                        </span>
                      </td>
                      {/* LLN */}
                      <td className={styles.llnCell}>
                        {lln !== null ? (
                          <span className={styles.llnValue}>
                            {formatear(lln, esRatio, unidad)}
                          </span>
                        ) : (
                          <span className={styles.llnPending}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </section>

        {/* Leyenda de interpretación */}
        <div className={styles.zscoreLegend}>
          <span className={styles.legendTitle}>Z-score (GLI 2012):</span>
          <span style={{ color: "#10b981" }}>≥ −1.64 Normal</span>
          <span style={{ color: "#f59e0b" }}>−2.5 a −1.64 Leve ↓</span>
          <span style={{ color: "#f97316" }}>−4.0 a −2.5 Moderado ↓</span>
          <span style={{ color: "#ef4444" }}>&lt; −4.0 Grave ↓</span>
        </div>
      </main>

      <footer className={styles.footer}>
        {faseActual === "pre" && (
          <button
            className={styles.salbutamolBtn}
            onClick={() => {
              setFase("post");
              onNavigate("maniobra");
            }}
          >
            Salbutamol →
          </button>
        )}
        <button
          onClick={() => {
            setFase("pre");
            onNavigate("welcome");
          }}
          className={styles.finalizarBtn}
        >
          Finalizar
        </button>
      </footer>
    </div>
  );
}