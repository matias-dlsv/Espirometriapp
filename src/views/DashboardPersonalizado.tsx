import styles from "./DashboardPersonalizado.module.css";
import GraficoPaciente from "../components/GraficoPaciente";
import PacientForm from "../components/PacientForm";
import PacientList from "../components/PacientList";
import { AppView } from "../App";

interface DashboardProps {
  onBack: () => void;
  onNavigate: (view: AppView) => void;
}

export default function DashboardPersonalizado({
  onNavigate,
  onBack,
}: DashboardProps) {
  return (
    <div className={styles.dashboardContainer}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        {/* Cabecera Sidebar */}
        <div className={styles.sidebarHeader}>
          <h1 className={styles.appTitle}>Gestión Pacientes</h1>
          <button onClick={onBack} className={styles.backButton}>
            ← Salir
          </button>
        </div>

        {/* Formulario */}
        <div className={styles.formSection}>
          <p className={styles.sectionLabel}>Nuevo Ingreso</p>
          <PacientForm onNavigate={onNavigate} /> {/* <-- Agrega esto */}
        </div>

        {/* Lista de pacientes */}
        <div className={styles.listSection}>
          <PacientList />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <section className={styles.mainContent}>
        {/* Cabecera Principal */}
        <header className={styles.mainHeader}>
          <h2 className={styles.headerTitle}>Análisis en tiempo real</h2>
        </header>

        {/* Área Gráfico */}
        <div className={styles.graphWrapper}>
          <div className={styles.graphContainer}>
            <GraficoPaciente />
          </div>
        </div>
      </section>
    </div>
  );
}
