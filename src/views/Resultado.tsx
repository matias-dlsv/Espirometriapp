import styles from "./Resultado.module.css";
import { AppView, NavigationPayload } from "../App";
import { usePacientStore, ManiobraGuardada } from "../store/pacientStore";
import { useMemo } from "react";

interface ResultadoProps {
  onBack: () => void;
  onNavigate: (view: AppView, payload?: NavigationPayload) => void;
}

const COLORES = ["#3b82f6", "#10b981", "#f59e0b"];

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
  const patronActivo = usePacientStore((state) => state.patronActivo);
  const faseActual = usePacientStore((state) => state.faseActual);
  const setFase = usePacientStore((state) => state.setFase);

  const maniobrasPreRaw = pacienteActual?.espirometrias?.[0]?.maniobras ?? [];
  const maniobrasPostRaw =
    pacienteActual?.espirometrias?.[0]?.maniobrasPost ?? [];
  const parametros = pacienteActual?.espirometrias?.[0]?.parametros ?? null;

  const fvcTeorico = parametros?.fvc.m ?? 0;
  const fev1Teorico = parametros?.fev1.m ?? 0;
  const fev1fvcTeorico = parametros?.fev1fvc.m ?? 0;

  const mejorPre = useMemo(
    () => encontrarMejor(maniobrasPreRaw),
    [maniobrasPreRaw],
  );
  const mejorPost = useMemo(
    () => encontrarMejor(maniobrasPostRaw),
    [maniobrasPostRaw],
  );

  // La maniobra a mostrar depende de la fase actual
  const mejorActual = faseActual === "pre" ? mejorPre : mejorPost;
  const indiceActual =
    faseActual === "pre"
      ? maniobrasPreRaw.indexOf(mejorPre!)
      : maniobrasPostRaw.indexOf(mejorPost!);
  const colorMejor = COLORES[indiceActual % COLORES.length];

  const hayPost = maniobrasPostRaw.length > 0 && mejorPost;

  const filas = mejorActual
    ? [
        {
          variable: "FVC",
          unidad: "L",
          real: mejorActual.indices?.fvc ?? fvcTeorico,
          realPost: mejorPost?.indices?.fvc,
          teorico: fvcTeorico,
        },
        {
          variable: "FEV1",
          unidad: "L",
          real: mejorActual.indices?.fev1 ?? fev1Teorico,
          realPost: mejorPost?.indices?.fev1,
          teorico: fev1Teorico,
        },
        {
          variable: "FEV1/FVC",
          unidad: "%",
          real: mejorActual.indices?.fev1fvc ?? fev1fvcTeorico,
          realPost: mejorPost?.indices?.fev1fvc,
          teorico: fev1fvcTeorico,
          esRatio: true,
        },
      ]
    : [];

  const formatear = (val: number, esRatio?: boolean, unidad?: string) =>
    esRatio ? `${(val * 100).toFixed(1)}%` : `${val.toFixed(2)} ${unidad}`;

  const colorPct = (pct: number) =>
    pct >= 80 ? "#10b981" : pct >= 70 ? "#f59e0b" : "#ef4444";

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
                <th className={styles.llnCol}>LLN</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(
                ({ variable, unidad, real, realPost, teorico, esRatio }) => {
                  const pctPre = teorico > 0 ? (real / teorico) * 100 : 0;
                  const pctPost =
                    realPost && teorico > 0 ? (realPost / teorico) * 100 : null;

                  return (
                    <tr key={variable}>
                      <td className={styles.variableCell}>{variable}</td>
                      <td className={styles.realCell}>
                        {formatear(real, esRatio, unidad)}
                      </td>
                      {hayPost && (
                        <td className={styles.postCell}>
                          {realPost
                            ? formatear(realPost, esRatio, unidad)
                            : "—"}
                        </td>
                      )}
                      <td className={styles.teoricoCell}>
                        {formatear(teorico, esRatio, unidad)}
                      </td>
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
                      <td className={styles.llnCell}>
                        <span className={styles.llnPending}>—</span>
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </section>

        <p className={styles.llnNote}>
          * LLN (Límite inferior de la normalidad) será calculado en una próxima
          versión.
        </p>
      </main>

      <footer className={styles.footer}>
        {/* Salbutamol solo aparece si aún no hay fase post */}
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
            setFase("pre"); // reset para próxima sesión
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
