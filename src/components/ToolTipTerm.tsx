import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// ============================================================
// DICCIONARIO DE TÉRMINOS
// ============================================================
export const GLOSARIO: Record<string, { titulo: string; cuerpo: string }> = {
  FVC: {
    titulo: "FVC (Forced Vital Capacity) / CVF (Capacidad Vital Forzada) ",
    cuerpo:
      "Volumen máximo de aire que una persona puede exhalar con el máximo esfuerzo y rapidez posible, partiendo desde una inspiración máxima previa.",
  },
  FEV1: {
    titulo:
      "FEV1 (Forced Expiratory Volume in 1 s) / VEF1 (Volumen Espiratorio Forzado en el primer segundo)",
    cuerpo:
      "Volumen de aire expulsado durante el primer segundo de la maniobra de espiración forzada.",
  },
  "FEV1/FVC": {
    titulo: "FEV1/FVC",
    cuerpo:
      "Relación entre el volumen espiratorio en el primer segundo y la capacidad vital forzada. Es el parámetro principal para diagnosticar obstrucción de las vías aéreas.",
  },
  "Z-score": {
    titulo: "Z-score (Puntuación Z)",
    cuerpo:
      "Valor estadístico que indica cuántas desviaciones estándar se aleja el resultado del paciente respecto al promedio teórico de su población de referencia. Permite estandarizar los datos e informar la gravedad de una alteración respiratoria.",
  },
  Salbutamol: {
    titulo: "Salbutamol",
    cuerpo:
      "Broncodilatador de acción corta utilizado como estándar en las pruebas de función pulmonar. Se administra en dosis de 400 µg mediante aerocámara para evaluar la reversibilidad de la obstrucción (respuesta post-broncodilatador).",
  },
  LLN: {
    titulo: "LLN (Lower Limit of Normal)",
    cuerpo:
      "Límite Inferior de la Normalidad: umbral establecido en el percentil 5 (−1.645 DE de la media), por debajo del cual un valor se considera estadísticamente patológico.",
  },
  VBE: {
    titulo: "VBE (Back Extrapolated Volume)",
    cuerpo:
      "Volumen de aire acumulado antes del inicio explosivo de la maniobra (tiempo cero). Se utiliza para verificar que el comienzo de la espiración fue suficientemente rápido e inmediato.",
  },
  Interpolacion: {
    titulo: "Interpolación de maniobras",
    cuerpo:
      "Selección y combinación de las mejores maniobras aceptables para obtener los valores representativos del estudio. Según normas ATS-ERS, se toma el mayor FVC y el mayor FEV1 aunque provengan de maniobras distintas.",
  },
  Reproducibilidad: {
    titulo: "Reproducibilidad",
    cuerpo:
      "Criterio de calidad que evalúa la consistencia entre las mejores maniobras aceptadas. Se considera reproducible cuando la diferencia entre los dos mayores FVC y entre los dos mayores FEV1 es ≤ 150 ml (≤ 100 ml si FVC < 1 L).",
  },
  PEF: {
    titulo: "PEF (Peak Expiratory Flow)",
    cuerpo:
      "Flujo Espiratorio Máximo: valor pico de flujo alcanzado al inicio de la espiración forzada. Refleja el esfuerzo del paciente y la permeabilidad de las vías aéreas superiores. Se expresa en L/s o L/min.",
  },
  FET: {
    titulo: "FET (Forced Expiratory Time)",
    cuerpo:
      "Tiempo de Espiración Forzada: duración total de la maniobra desde el inicio hasta el cese del flujo. La norma ATS-ERS exige un mínimo de 6 segundos (3 s en niños) para garantizar el vaciamiento completo.",
  },
};

// Normaliza la clave para tolerar variaciones de capitalización (ej. Z-score / Z-Score)
function buscarEntrada(term: string) {
  return (
    GLOSARIO[term] ??
    GLOSARIO[term.toLowerCase()] ??
    GLOSARIO[term.charAt(0).toUpperCase() + term.slice(1).toLowerCase()] ??
    null
  );
}

// ============================================================
// PANEL LATERAL — se renderiza via portal en document.body
// ============================================================
interface PanelProps {
  term: string;
  onClose: () => void;
  onPanelMouseEnter: () => void;
  onPanelMouseLeave: () => void;
}

function GlossaryPanel({
  term,
  onClose,
  onPanelMouseEnter,
  onPanelMouseLeave,
}: PanelProps) {
  const entrada = buscarEntrada(term);
  if (!entrada) return null;

  return createPortal(
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 340,
          zIndex: 9999,
          backgroundColor: "#0f172a",
          borderLeft: "1px solid #1e3a5f",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
          animation: "slideInRight 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        onMouseEnter={onPanelMouseEnter}
        onMouseLeave={onPanelMouseLeave}
      >
        {/* Cabecera */}
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid #1e3a5f",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#64748b",
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              Glosario espirométrico
            </div>
            <div
              style={{
                fontSize: "1.05rem",
                fontWeight: 600,
                color: "#93c5fd",
                lineHeight: 1.3,
              }}
            >
              {entrada.titulo}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              fontSize: "1.1rem",
              padding: "2px 4px",
              lineHeight: 1,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f1f5f9")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
          >
            ✕
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: "24px 20px", flex: 1, overflowY: "auto" }}>
          <p
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.85,
              color: "#cbd5e1",
              margin: 0,
            }}
          >
            {entrada.cuerpo}
          </p>
        </div>

        {/* Pie */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #1e3a5f",
            fontSize: "0.72rem",
            color: "#475569",
          }}
        >
          GLI 2012 / ATS-ERS Standards
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>,
    document.body,
  );
}

// ============================================================
// COMPONENTE PÚBLICO
// ============================================================
interface TooltipTermProps {
  term: keyof typeof GLOSARIO;
  children?: React.ReactNode;
  className?: string;
}

export default function TooltipTerm({
  term,
  children,
  className = "",
}: TooltipTermProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const scheduleClose = () => {
    timerRef.current = setTimeout(() => setVisible(false), 200);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <>
      <span
        style={{
          display: "inline-flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "6px",
          whiteSpace: "nowrap",
        }}
        className={className}
      >
        <span>{children ?? term}</span>

        <span
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.transform = "scale(1.15)";
            e.currentTarget.style.boxShadow =
              "0 0 8px rgba(147, 197, 253, 0.6)";
            cancelClose();
            setVisible(true);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.75";
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "none";
            scheduleClose();
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "rgba(147, 197, 253, 0.15)",
            border: "2.5px solid #3B82F6",
            color: "#3B82F6",
            fontSize: "0.65rem",
            fontWeight: 800,
            lineHeight: 1,
            cursor: "help",
            opacity: 1,
            flexShrink: 0,
            transition: "opacity 0.15s, transform 0.15s, box-shadow 0.15s",
            userSelect: "none",
          }}
          aria-label={`Definición de ${term}`}
        >
          i
        </span>
      </span>

      {visible && (
        <GlossaryPanel
          term={term}
          onClose={() => setVisible(false)}
          onPanelMouseEnter={cancelClose}
          onPanelMouseLeave={scheduleClose}
        />
      )}
    </>
  );
}
