import styles from "./WelcomeScreen.module.css";
import logo from "../assets/E.-de-Kinesiología.png";

interface WelcomeProps {
  onNavigate: (view: "custom" | "clinical") => void;
}

export default function WelcomeScreen({ onNavigate }: WelcomeProps) {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.backgroundDecoration} />

      <img
        src={logo}
        alt="Escuela de Kinesiología – UAndes"
        style={{
          position: "absolute",
          top: 20,
          left: 24,
          height: 96,
          width: "auto",
        }}
      />

      <div className={styles.headerSection}>
        <h1 className={styles.mainTitle}>
          Espiro<span className={styles.simAccent}>Sim</span>
        </h1>
        <p className={styles.subTitle}>
          Selecciona el modo de trabajo para comenzar
        </p>
      </div>

      <div className={styles.cardsGrid}>
        <SelectionCard
          title="Modo Personalizado"
          description="Simula un paciente personalizado  o genera uno aleatorio."
          onClick={() => onNavigate("custom")}
          color="indigo"
        />

        <SelectionCard
          title="Casos Clínicos"
          description="Casos clínicos predefinidos para explorar distintos patrones espirométricos."
          onClick={() => onNavigate("clinical")}
          color="emerald"
        />
      </div>
    </div>
  );
}

function SelectionCard({ title, description, onClick, color }: any) {
  const themeClass =
    color === "indigo" ? styles.indigoTheme : styles.emeraldTheme;

  const icon =
    color === "indigo" ? (
      // Persona / usuario personalizado
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.iconSvg}
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ) : (
      // Carpeta / casos clínicos
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.iconSvg}
      >
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      </svg>
    );

  return (
    <button onClick={onClick} className={`${styles.cardButton} ${themeClass}`}>
      <div className={styles.iconBox}>{icon}</div>
      <h3 className={styles.cardTitle}>{title}</h3>
      <p className={styles.cardDescription}>{description}</p>
    </button>
  );
}
