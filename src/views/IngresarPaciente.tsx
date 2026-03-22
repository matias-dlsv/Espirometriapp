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
          <h1 className={styles.appTitle}>Ingresar Paciente</h1>
          <button onClick={onBack} className={styles.backButton}>
            ← Salir
          </button>
        </div>

        <div className="bg-transparent flex flex-col gap-4 p-6">
          <PacientForm onNavigate={onNavigate} />
        </div>
      </aside>
    </div>
  );
}
