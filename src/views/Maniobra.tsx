import { useRef } from "react"; // 1. Importar useRef
import styles from "./Maniobra.module.css";
import { AppView } from "../App";
// Importar el componente y su tipo de Referencia
import GraficoPaciente, { GraficoRef } from "../components/GraficoPaciente";

interface ManiobraProps {
  onBack: () => void;
  onNavigate: (view: AppView) => void;
}

export default function Maniobra({ onBack, onNavigate }: ManiobraProps) {
  // 2. Crear las referencias ("Los mandos a distancia")
  const grafico1Ref = useRef<GraficoRef>(null);
  const grafico2Ref = useRef<GraficoRef>(null);

  // 3. Función para activar ambos gráficos
  const iniciarPrueba = () => {
    // Aquí podrías iniciar también el Timer
    grafico1Ref.current?.ejecutarAnimacion();
    grafico2Ref.current?.ejecutarAnimacion();
  };

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Salir
        </button>
        <h2 className={styles.pageTitle}>Prueba en curso</h2>
      </header>

      <main className={styles.mainGrid}>
        {/* COLUMNA IZQUIERDA */}
        <section className={styles.leftPanel}>
          <div className={styles.graphCard}>
            <h3>Flujo / Volumen</h3>
            <div className={styles.graphWrapper}>
              {/* 4. Conectar la referencia y pasar props personalizadas */}
              <GraficoPaciente
                ref={grafico1Ref}
                colorLinea="#3b82f6" // Azul
                ejeX="Volumen (L)"
                ejeY="Flujo (L/s)"
              />
            </div>
          </div>

          <div className={styles.graphCard}>
            <h3>Volumen / Tiempo</h3>
            <div className={styles.graphWrapper}>
              <GraficoPaciente
                ref={grafico2Ref}
                colorLinea="#10b981" // Verde
                ejeX="Tiempo (s)"
                ejeY="Volumen (L)"
              />
            </div>
          </div>
        </section>

        {/* COLUMNA DERECHA */}
        <aside className={styles.rightPanel}>
          <div className={styles.controlCard}>
            <h3 className={styles.cardTitle}>Instrucciones</h3>
            {/* 5. Conectar el botón a la función */}
            <button onClick={iniciarPrueba} className={styles.actionButton}>
              Respire normal 3 veces
            </button>
            <button
              onClick={() => onNavigate("corregir")}
              className={styles.nextButton}
            >
              siguiente
            </button>
          </div>

          {/* MEDIO: Tiempo */}
          <div className={styles.controlCard}>
            <h3 className={styles.cardTitle}>Tiempo</h3>
            <div className={styles.timerBox}>
              <span className={styles.timerValue}>00:00 s</span>
            </div>
          </div>

          {/* ABAJO: Checklist */}
          <div className={styles.controlCard}>
            <h3 className={styles.cardTitle}>Progreso</h3>
            <ul className={styles.checklist}>
              <li>
                <input type="checkbox" id="step1" />
                <label htmlFor="step1">Respiración normal</label>
              </li>
              <li>
                <input type="checkbox" id="step2" />
                <label htmlFor="step2">Insp. max</label>
              </li>
              <li>
                <input type="checkbox" id="step3" />
                <label htmlFor="step3">Exp. forz</label>
              </li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
