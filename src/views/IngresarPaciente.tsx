import styles from "./DashboardPersonalizado.module.css";
import PacientForm from "../components/PacientForm";
import { AppView } from "../App";

interface DashboardProps {
  onBack: () => void;
  onNavigate: (view: AppView) => void;
}

export default function IngresarPaciente({
  onBack,
  onNavigate,
}: DashboardProps) {
  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.mainContent}>
        <div className={styles.mainHeader}>
          <h1 className={styles.appTitle}>Gestión Pacientes</h1>
          <button onClick={onBack} className={styles.backButton}>
            ← Salir
          </button>
        </div>

        <div className={styles.formSection}>
          <p className={styles.sectionLabel}>Nuevo Ingreso</p>
          <PacientForm onNavigate={onNavigate} />
        </div>
      </aside>
    </div>
  );
}
