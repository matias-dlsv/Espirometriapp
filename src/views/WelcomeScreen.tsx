import styles from "./WelcomeScreen.module.css";

interface WelcomeProps {
  onNavigate: (view: "custom" | "clinical") => void;
}

export default function WelcomeScreen({ onNavigate }: WelcomeProps) {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.backgroundDecoration} />

      <div className={styles.headerSection}>
        <h1 className={styles.mainTitle}>
          Simulador interactivo de <br /> espirometría para estudiantes
        </h1>
        <p className={styles.subTitle}>
          Selecciona el modo de trabajo para comenzar
        </p>
      </div>

      <div className={styles.cardsGrid}>
        <SelectionCard
          title="Modo Personalizado"
          description="Gestión manual de pacientes, ingreso de datos y análisis en tiempo real."
          onClick={() => onNavigate("custom")}
          color="indigo"
        />

        <SelectionCard
          title="Casos Clínicos"
          description="Biblioteca de casos predefinidos para estudio y simulación."
          onClick={() => onNavigate("clinical")}
          color="emerald"
        />
      </div>
    </div>
  );
}

// Subcomponente optimizado
function SelectionCard({ title, description, onClick, color }: any) {
  // Seleccionamos la clase del tema basada en la prop color
  const themeClass =
    color === "indigo" ? styles.indigoTheme : styles.emeraldTheme;
  // Seleccionamos la clase de texto para colorear icono y título
  const textColorClass =
    color === "indigo" ? styles.textIndigo : styles.textEmerald;

  return (
    <button
      onClick={onClick}
      // Combinamos la clase base del botón + la clase del tema
      className={`${styles.cardButton} ${themeClass}`}
    >
      {/* Icono: Recibe la clase de color para reaccionar al hover del padre */}
      <div className={`${styles.iconBox} ${textColorClass}`}>
        <div className={styles.iconSvg} />
      </div>

      {/* Título: También recibe la clase de color */}
      <h3 className={`${styles.cardTitle} ${textColorClass}`}>{title}</h3>

      {/* Descripción: Tiene su propia lógica en el CSS */}
      <p className={styles.cardDescription}>{description}</p>
    </button>
  );
}
