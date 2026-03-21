import { usePacientStore } from "../store/pacientStore";
import styles from "./Interpolacion.module.css";

interface InterpolacionProps {
  onBack: () => void;
}

export default function Interpolacion({ onBack }: InterpolacionProps) {
  const pacientes = usePacientStore((state) => state.pacientes);
  const pacienteActual = pacientes[pacientes.length - 1];

  if (
    !pacienteActual ||
    !pacienteActual.espirometrias ||
    pacienteActual.espirometrias.length === 0
  ) {
    return (
      <div className={styles.layout}>
        <h2>
          Error: No se encontró la información del paciente o la espirometría.
        </h2>
        <button onClick={onBack}>Volver al inicio</button>
      </div>
    );
  }

  const espirometriaActual = pacienteActual.espirometrias[0];
  const parametros = espirometriaActual.parametros;
  const maniobras = espirometriaActual.maniobras || [];

  const getValor = (param: any) => {
    if (typeof param === "number") return param.toFixed(2);
    if (param?.m !== undefined) return param.m.toFixed(2);
    return "0.00";
  };

  const fvc = getValor(parametros.fvc);
  const fev1 = getValor(parametros.fev1);
  const fev1fvc = getValor(parametros.fev1fvc);

  const handleFinalizar = () => {
    alert("¡Prueba finalizada y guardada con éxito!");
    onBack();
  };

  return (
    <div className={styles.layout}>
      {/* SECCIÓN IZQUIERDA: GRÁFICOS SUPERPUESTOS */}
      <div className={styles.chartsColumn}>
        <h2 style={{ color: "white", margin: 0 }}>
          Curvas Interpoladas ({maniobras.length}/3)
        </h2>

        {/* GRÁFICO 1: Flujo / Volumen Interpolado */}
        <div className={styles.chartContainer}>
          <p style={{ color: "#64748b" }}>
            [Área para GraficoMultiPaciente: Flujo / Volumen con{" "}
            {maniobras.length} curvas superpuestas]
          </p>
        </div>

        {/* GRÁFICO 2: Volumen / Tiempo Interpolado */}
        <div className={styles.chartContainer}>
          <p style={{ color: "#64748b" }}>
            [Área para GraficoMultiPaciente: Volumen / Tiempo con{" "}
            {maniobras.length} curvas superpuestas]
          </p>
        </div>
      </div>

      {/* SECCIÓN DERECHA: RESULTADOS E ÍNDICES */}
      <aside className={styles.resultsPanel}>
        <h2 className={styles.title}>Resultados Finales</h2>

        <p style={{ color: "#64748b", marginBottom: "20px" }}>
          Paciente: <strong>{pacienteActual.nombre}</strong>
          <br />
          Edad: {pacienteActual.edad} años | Talla: {pacienteActual.talla} cm
        </p>

        <div className={styles.indicesCard}>
          <div className={styles.indiceRow}>
            <span className={styles.indiceLabel}>FVC (L)</span>
            <span className={styles.indiceLabel}>Predicho</span>
            <span className={styles.indiceValue}>{fvc}</span>
          </div>

          <div className={styles.indiceRow}>
            <span className={styles.indiceLabel}>FEV1 (L)</span>
            <span className={styles.indiceLabel}>Predicho</span>
            <span className={styles.indiceValue}>{fev1}</span>
          </div>

          <div className={styles.indiceRow}>
            <span className={styles.indiceLabel}>FEV1/FVC (%)</span>
            <span className={styles.indiceLabel}>Predicho</span>
            <span className={styles.indiceValue}>{fev1fvc}</span>
          </div>
        </div>

        <button onClick={handleFinalizar} className={styles.finishButton}>
          Finalizar y Guardar Reporte
        </button>
      </aside>
    </div>
  );
}
