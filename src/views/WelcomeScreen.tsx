import styles from "./WelcomeScreen.module.css";
import logo from "../assets/E.-de-Kinesiología.png";
import espiroLogo from "../assets/Logo moderno de EspiroSim.png";

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
  const textColorClass =
    color === "indigo" ? styles.textIndigo : styles.textEmerald;

  return (
    <button onClick={onClick} className={`${styles.cardButton} ${themeClass}`}>
      <div className={`${styles.iconBox} ${textColorClass}`}>
        <div className={styles.iconSvg} />
      </div>
      <h3 className={`${styles.cardTitle} ${textColorClass}`}>{title}</h3>
      <p className={styles.cardDescription}>{description}</p>
    </button>
  );
}
