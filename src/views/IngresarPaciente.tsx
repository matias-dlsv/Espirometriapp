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
        <button
          onClick={() => onNavigate("maniobra")}
          className={styles.nextButton}
        >
          Ingresar Paciente
        </button>
      </aside>
    </div>
  );
}
