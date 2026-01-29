import styles from "./DashboardPersonalizado.module.css";
import PacientForm from "../components/PacientForm";

interface DashboardProps {
  onBack: () => void;
}
export default function IngresarPaciente({ onBack }: DashboardProps) {
  return (
    <div className={styles.dashboardContainer}>
      {/* SIDEBAR */}
      <aside className={styles.mainContent}>
        {/* Cabecera Sidebar */}
        <div className={styles.mainHeader}>
          <h1 className={styles.appTitle}>Gestión Pacientes</h1>
          <button onClick={onBack} className={styles.backButton}>
            ← Salir
          </button>
        </div>

        {/* Formulario */}
        <div className={styles.formSection}>
          <p className={styles.sectionLabel}>Nuevo Ingreso</p>
          <PacientForm />
        </div>
      </aside>
    </div>
  );
}
