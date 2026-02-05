import styles from "./Corregir.module.css";
import PacientForm from "../components/PacientForm";
import { AppView } from "../App";

interface CorregirProps {
  onBack: () => void;
  onNavigate: (view: AppView) => void;
}
export default function IngresarPaciente({
  onBack,
  //onNavigate,
}: CorregirProps) {
  return (
    <div className={styles.dashboardContainer}>
      {/* SIDEBAR */}
      <button onClick={() => onBack()} className={styles.nextButton}>
        Salir
      </button>
    </div>
  );
}
