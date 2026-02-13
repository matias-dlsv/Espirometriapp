import styles from "./Corregir.module.css";
import { useRef } from "react"; // 1. Importar useRef
//import { AppView } from "../App";
import GraficoPaciente, { GraficoRef } from "../components/GraficoPaciente";

interface CorregirProps {
  onBack: () => void;
  //onNavigate: (view: AppView) => void;
}
export default function IngresarPaciente({
  onBack,
  //onNavigate,
}: CorregirProps) {
  const grafico1Ref = useRef<GraficoRef>(null);
  const grafico2Ref = useRef<GraficoRef>(null);
  return (
    <div>
      {/* SIDEBAR */}
      <button onClick={() => onBack()} className={styles.nextButton}>
        Salir
      </button>
      <div>
        <h3>Flujo / Volumen</h3>
        <div>
          {/* 4. Conectar la referencia y pasar props personalizadas */}
          <GraficoPaciente
            ref={grafico1Ref}
            colorLinea="#3b82f6" // Azul
            ejeX="Volumen (L)"
            ejeY="Flujo (L/s)"
          />
        </div>
      </div>

      <div>
        <h3>Volumen / Tiempo</h3>
        <div>
          <GraficoPaciente
            ref={grafico2Ref}
            colorLinea="#10b981" // Verde
            ejeX="Tiempo (s)"
            ejeY="Volumen (L)"
          />
        </div>
      </div>
    </div>
  );
}
