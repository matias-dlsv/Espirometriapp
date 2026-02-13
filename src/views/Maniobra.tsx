import { useRef, useState } from "react";
import styles from "./Maniobra.module.css";
import GraficoPaciente, { GraficoRef } from "../components/GraficoPaciente";
import { AppView } from "../App";

interface ManiobraProps {
  onBack: () => void;
  onNavigate: (view: AppView) => void;
}

export default function Maniobra({ onBack, onNavigate }: ManiobraProps) {
  const grafico1Ref = useRef<GraficoRef>(null);
  const grafico2Ref = useRef<GraficoRef>(null);

  const [timer, setTimer] = useState("00:00 s");

  const iniciar = () => {
    setTimer("00:01 s"); // Simulación
    grafico1Ref.current?.ejecutarAnimacion();
    grafico2Ref.current?.ejecutarAnimacion();
  };

  return (
    <div className={styles.layout}>
      {/* SECCIÓN IZQUIERDA: GRÁFICOS */}
      <div className={styles.chartsColumn}>
        {/* Botón solo visible en móvil */}
        <button onClick={onBack} className={styles.mobileBackBtn}>
          ← Salir
        </button>

        <div className={styles.squareBox}>
          <GraficoPaciente
            ref={grafico1Ref}
            titulo="Flujo / Volumen"
            ejeX="Vol (L)"
            ejeY="Flujo (L/s)"
            colorLinea="#3b82f6"
          />
        </div>

        <div className={styles.squareBox}>
          <GraficoPaciente
            ref={grafico2Ref}
            titulo="Volumen / Tiempo"
            ejeX="Tiempo (s)"
            ejeY="Vol (L)"
            colorLinea="#10b981"
          />
        </div>
      </div>

      {/* SECCIÓN DERECHA: CONTROLES (Sticky) */}
      <aside className={styles.controlsPanel}>
        <div className={styles.panelHeader}>
          <h2>Control</h2>
          <button onClick={onBack} className={styles.backButtonOutline}>
            Salir
          </button>
        </div>

        <div className={styles.card}>
          <button onClick={iniciar} className={styles.mainActionButton}>
            <span>INICIAR</span>
            <span style={{ fontSize: "0.8em", opacity: 0.8 }}>
              3 respiraciones normales
            </span>
          </button>
        </div>

        <div className={styles.card}>
          <span className={styles.label}>Tiempo</span>
          <div className={styles.timerDisplay}>{timer}</div>
        </div>

        <div className={styles.card}>
          <span className={styles.label}>Checklist</span>
          <ul className={styles.checklist}>
            <li>
              <input type="checkbox" id="c1" />{" "}
              <label htmlFor="c1">Resp. Normal</label>
            </li>
            <li>
              <input type="checkbox" id="c2" />{" "}
              <label htmlFor="c2">Insp. Máxima</label>
            </li>
            <li>
              <input type="checkbox" id="c3" />{" "}
              <label htmlFor="c3">Esp. Forzada</label>
            </li>
          </ul>
        </div>

        <button
          onClick={() => onNavigate("corregir")}
          className={styles.nextButton}
        >
          Siguiente →
        </button>
      </aside>
    </div>
  );
}
