import { useState, useMemo } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Item {
  categoria: string;
  icono: React.ReactNode;
  texto: string;
}

interface HistoriaClinicaProps {
  patronNombre?: string;
  semilla?: string;
}

// ─── Iconos SVG inline (sin dependencias externas) ───────────────────────────
const p = {
  width: 15,
  height: 15,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const Icon = {
  Clipboard: (
    <svg {...p}>
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M9 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-2" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  ),
  Activity: (
    <svg {...p}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  CigaretteOff: (
    <svg {...p}>
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M16.47 10.22A2 2 0 0 1 17 10h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1" />
      <path d="M10.22 7.78A2 2 0 0 1 12 7h1" />
      <path d="M3 10h5" />
      <path d="M3 14h4" />
    </svg>
  ),
  Cigarette: (
    <svg {...p}>
      <path d="M18 12H2v4h16" />
      <path d="M22 12v4" />
      <path d="M7 12v4" />
      <path d="M18 8c0-2.5-2-2.5-2-5" />
      <path d="M22 8c0-2.5-2-2.5-2-5" />
    </svg>
  ),
  Wind: (
    <svg {...p}>
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  ),
  Flame: (
    <svg {...p}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  ),
  User: (
    <svg {...p}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  CheckCircle: (
    <svg {...p}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Leaf: (
    <svg {...p}>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  ),
  Users: (
    <svg {...p}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Music: (
    <svg {...p}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  Snowflake: (
    <svg {...p}>
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="m20 16-4-4 4-4" />
      <path d="m4 8 4 4-4 4" />
      <path d="m16 4-4 4-4-4" />
      <path d="m8 20 4-4 4 4" />
    </svg>
  ),
  Brain: (
    <svg {...p}>
      <path d="M12 5a3 3 0 0 1 3 3 3 3 0 0 1 3 3 3.5 3.5 0 0 1-1.5 6.5L12 19l-4.5-2.5A3.5 3.5 0 0 1 6 10a3 3 0 0 1 3-3 3 3 0 0 1 3-2z" />
      <path d="M12 5v14" />
    </svg>
  ),
  Dumbbell: (
    <svg {...p}>
      <path d="m6.5 6.5 11 11" />
      <path d="m21 21-1-1" />
      <path d="m3 3 1 1" />
      <path d="m18 22 4-4" />
      <path d="m2 6 4-4" />
      <path d="m3 10 7-7" />
      <path d="m14 21 7-7" />
    </svg>
  ),
  BedDouble: (
    <svg {...p}>
      <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
      <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
      <path d="M12 10v10" />
      <path d="M2 20h20" />
    </svg>
  ),
  MessageSquare: (
    <svg {...p}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Stethoscope: (
    <svg {...p}>
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  ),
  Scissors: (
    <svg {...p}>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  ),
  Microscope: (
    <svg {...p}>
      <path d="M6 18h8" />
      <path d="M3 22h18" />
      <path d="M14 22a7 7 0 1 0 0-14h-1" />
      <path d="M9 14h2" />
      <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2z" />
      <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
    </svg>
  ),
  Bug: (
    <svg {...p}>
      <path d="m8 2 1.88 1.88" />
      <path d="M14.12 3.88 16 2" />
      <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z" />
      <path d="M12 20v-9" />
      <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
      <path d="M6 13H2" />
      <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
      <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
      <path d="M22 13h-4" />
      <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
    </svg>
  ),
  Pill: (
    <svg {...p}>
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z" />
      <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
    </svg>
  ),
  Droplets: (
    <svg {...p}>
      <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
      <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
    </svg>
  ),
  Hospital: (
    <svg {...p}>
      <path d="M12 6v4" />
      <path d="M14 14h-4" />
      <path d="M14 18h-4" />
      <path d="M14 8h-4" />
      <path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2" />
      <path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18" />
    </svg>
  ),
  Syringe: (
    <svg {...p}>
      <path d="m18 2 4 4" />
      <path d="m17 7 3-3" />
      <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" />
      <path d="m9 11 4 4" />
      <path d="m5 19-3 3" />
      <path d="m14 4 6 6" />
    </svg>
  ),
  GlassWater: (
    <svg {...p}>
      <path d="M15.2 22H8.8a2 2 0 0 1-2-1.79L5 3h14l-1.81 17.21A2 2 0 0 1 15.2 22z" />
      <path d="M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0" />
    </svg>
  ),
  Heart: (
    <svg {...p}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  FolderOpen: (
    <svg {...p}>
      <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  ChevronDown: (
    <svg {...p}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
};

// ─── PRNG simple (Mulberry32) ─────────────────────────────────────────────────
function crearRNG(semilla: string) {
  let h = 2166136261;
  for (let i = 0; i < semilla.length; i++) {
    h ^= semilla.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Banco de items por patrón ────────────────────────────────────────────────
type PatronKey = "Normal" | "EPOC" | "Asma" | "Esclerosis" | "Lobectomia";

const BANCO: Record<
  PatronKey,
  Array<{ p: number; categoria: string; icono: React.ReactNode; texto: string }>
> = {
  Normal: [
    {
      p: 0.75,
      categoria: "Motivo de consulta",
      icono: Icon.Clipboard,
      texto:
        "Chequeo médico de rutina pre-ocupacional (certificación minería).",
    },
    {
      p: 0.4,
      categoria: "Motivo de consulta",
      icono: Icon.Clipboard,
      texto: "Evaluación para iniciar actividad física de alta intensidad.",
    },
    {
      p: 0.35,
      categoria: "Estilo de vida",
      icono: Icon.Activity,
      texto: "Deportista regular de alto rendimiento (maratonista).",
    },
    {
      p: 0.85,
      categoria: "Tabaquismo",
      icono: Icon.CigaretteOff,
      texto: "No fumador.",
    },
    {
      p: 0.9,
      categoria: "Síntomas",
      icono: Icon.CheckCircle,
      texto: "Completamente asintomático. Sin disnea ni tos crónica.",
    },
  ],
  EPOC: [
    {
      p: 0.9,
      categoria: "Tabaquismo",
      icono: Icon.Cigarette,
      texto: "Fumador activo con índice tabáquico de 25 paquetes/año.",
    },
    {
      p: 0.1,
      categoria: "Exposición",
      icono: Icon.Flame,
      texto:
        "Exposición prolongada a humo de leña en cocina rural durante más de 20 años.",
    },
    {
      p: 0.85,
      categoria: "Síntomas",
      icono: Icon.Wind,
      texto: "Disnea progresiva ante esfuerzos mínimos (subir escaleras).",
    },
    {
      p: 0.75,
      categoria: "Síntomas",
      icono: Icon.Wind,
      texto:
        'Tos crónica matutina con expectoración mucoide ("tos de fumador").',
    },
    {
      p: 0.95,
      categoria: "Edad / contexto",
      icono: Icon.User,
      texto: "Mayor de 45 años. Derivado por médico de atención primaria.",
    },
  ],
  Asma: [
    {
      p: 0.7,
      categoria: "Antecedentes",
      icono: Icon.Leaf,
      texto:
        "Rinitis alérgica diagnosticada en la infancia; episodios estacionales.",
    },
    {
      p: 0.5,
      categoria: "Antecedentes",
      icono: Icon.Users,
      texto: "Madre con diagnóstico de asma bronquial.",
    },
    {
      p: 0.8,
      categoria: "Síntomas",
      icono: Icon.Wind,
      texto: "Episodios paroxísticos de disnea, sin síntomas entre crisis.",
    },
    {
      p: 0.85,
      categoria: "Síntomas",
      icono: Icon.Music,
      texto: "Sibilancias recurrentes especialmente nocturnas o al despertar.",
    },
    {
      p: 0.65,
      categoria: "Síntomas",
      icono: Icon.Snowflake,
      texto: "Tos seca que empeora con el frío, la risa o el ejercicio.",
    },
  ],
  Esclerosis: [
    {
      p: 1.0,
      categoria: "Diagnóstico",
      icono: Icon.Brain,
      texto: "Diagnóstico confirmado de Esclerosis Lateral Amiotrófica (ELA).",
    },
    {
      p: 0.85,
      categoria: "Síntomas",
      icono: Icon.Dumbbell,
      texto:
        "Debilidad muscular progresiva en extremidades superiores e inferiores.",
    },
    {
      p: 0.7,
      categoria: "Síntomas",
      icono: Icon.BedDouble,
      texto:
        "Ortopnea: requiere 2–3 almohadas para dormir por disnea en decúbito.",
    },
    {
      p: 0.45,
      categoria: "Síntomas",
      icono: Icon.MessageSquare,
      texto:
        "Disfagia progresiva y cambios en la calidad de la voz (disartria).",
    },
    {
      p: 0.75,
      categoria: "Signos",
      icono: Icon.Stethoscope,
      texto: "Tos débil e ineficaz; dificultad para expectorar secreciones.",
    },
  ],
  Lobectomia: [
    {
      p: 1.0,
      categoria: "Antecedente quirúrgico",
      icono: Icon.Scissors,
      texto: "Lobectomía del lóbulo superior derecho realizada hace 14 meses.",
    },
    {
      p: 0.6,
      categoria: "Causa de cirugía",
      icono: Icon.Microscope,
      texto:
        "Nódulo pulmonar resecado con diagnóstico de adenocarcinoma in situ.",
    },
    {
      p: 0.4,
      categoria: "Causa de cirugía",
      icono: Icon.Bug,
      texto:
        "Secuelas graves de tuberculosis antigua con destrucción parenquimatosa.",
    },
    {
      p: 0.7,
      categoria: "Síntomas",
      icono: Icon.Wind,
      texto:
        "Disnea de esfuerzo estable; el paciente refiere conocer su límite físico desde la cirugía.",
    },
    {
      p: 0.9,
      categoria: "Examen físico",
      icono: Icon.Stethoscope,
      texto:
        "Cicatriz de toracotomía posterolateral visible en hemitórax derecho.",
    },
  ],
};

const RUIDO: Array<{
  p: number;
  categoria: string;
  icono: React.ReactNode;
  texto: string;
}> = [
  {
    p: 0.3,
    categoria: "Antecedentes",
    icono: Icon.Pill,
    texto: "Hipertensión arterial en tratamiento con enalapril 10 mg/día.",
  },
  {
    p: 0.25,
    categoria: "Antecedentes",
    icono: Icon.Droplets,
    texto: "Diabetes mellitus tipo 2 con buen control metabólico.",
  },
  {
    p: 0.2,
    categoria: "Antecedentes",
    icono: Icon.Hospital,
    texto: "Colecistectomía laparoscópica hace 5 años. Sin complicaciones.",
  },
  {
    p: 0.15,
    categoria: "Medicamentos",
    icono: Icon.Syringe,
    texto: "Vacunación antineumocócica e influenza al día.",
  },
  {
    p: 0.2,
    categoria: "Hábitos",
    icono: Icon.GlassWater,
    texto: "Consumo ocasional de alcohol (fines de semana).",
  },
  {
    p: 0.1,
    categoria: "Antecedentes",
    icono: Icon.Heart,
    texto: "Cardiopatía isquémica estable; ecocardiograma normal hace 2 años.",
  },
];

// ─── Normalizar nombre de patrón ──────────────────────────────────────────────
function resolverPatron(nombre?: string): PatronKey | null {
  if (!nombre) return null;
  const n = nombre.toLowerCase();
  if (n.includes("epoc") || n.includes("obstructi")) return "EPOC";
  if (n.includes("asma") || n.includes("reversib")) return "Asma";
  if (
    n.includes("esclero") ||
    n.includes("ela") ||
    (n.includes("restrict") && n.includes("neuro"))
  )
    return "Esclerosis";
  if (
    n.includes("lobec") ||
    n.includes("neumonec") ||
    (n.includes("restrict") && n.includes("paren"))
  )
    return "Lobectomia";
  if (n.includes("normal")) return "Normal";
  return null;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function HistoriaClinica({
  patronNombre,
  semilla = "paciente",
}: HistoriaClinicaProps) {
  const [abierta, setAbierta] = useState(false);

  const items: Item[] = useMemo(() => {
    const rng = crearRNG(semilla + (patronNombre ?? ""));
    const patron = resolverPatron(patronNombre);
    const resultado: Item[] = [];

    if (patron) {
      for (const item of BANCO[patron]) {
        if (rng() < item.p)
          resultado.push({
            categoria: item.categoria,
            icono: item.icono,
            texto: item.texto,
          });
      }
    }
    for (const item of RUIDO) {
      if (rng() < item.p)
        resultado.push({
          categoria: item.categoria,
          icono: item.icono,
          texto: item.texto,
        });
    }
    for (let i = resultado.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [resultado[i], resultado[j]] = [resultado[j], resultado[i]];
    }
    return resultado;
  }, [patronNombre, semilla]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, Item[]>();
    for (const item of items) {
      if (!mapa.has(item.categoria)) mapa.set(item.categoria, []);
      mapa.get(item.categoria)!.push(item);
    }
    return Array.from(mapa.entries());
  }, [items]);

  return (
    <div
      style={{
        border: "1px solid #D6D1CA",
        borderRadius: 10,
        overflow: "hidden",
        background: "#ffffff",
        marginBottom: 0,
      }}
    >
      {/* ── Cabecera / toggle ── */}
      <button
        onClick={() => setAbierta((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: abierta ? "#faf9f8" : "#ffffff",
          border: "none",
          cursor: "pointer",
          gap: 10,
          transition: "background 0.15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: "rgba(138, 0, 26, 0.08)",
              border: "1px solid rgba(138, 0, 26, 0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "#8A001A",
            }}
          >
            {Icon.FolderOpen}
          </span>
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "#131E29",
              letterSpacing: "0.02em",
            }}
          >
            Historia Clínica
          </span>
          <span
            style={{
              fontSize: "0.68rem",
              background: "rgba(138,0,26,0.08)",
              color: "#8A001A",
              border: "1px solid rgba(138,0,26,0.18)",
              borderRadius: 4,
              padding: "1px 6px",
              fontWeight: 600,
            }}
          >
            {items.length} registros
          </span>
        </div>
        <span
          style={{
            color: "#758592",
            transform: abierta ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            display: "flex",
            alignItems: "center",
          }}
        >
          {Icon.ChevronDown}
        </span>
      </button>

      {/* ── Contenido expandible ── */}
      <div
        style={{
          maxHeight: abierta ? 480 : 0,
          overflow: "hidden",
          transition: "max-height 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          style={{
            borderTop: "1px solid #f0ece8",
            padding: "14px 16px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            overflowY: "auto",
            maxHeight: 464,
          }}
        >
          {grupos.length === 0 ? (
            <p style={{ color: "#758592", fontSize: "0.85rem", margin: 0 }}>
              Sin datos clínicos registrados.
            </p>
          ) : (
            grupos.map(([categoria, catItems]) => (
              <div key={categoria}>
                <div
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    letterSpacing: "0.09em",
                    textTransform: "uppercase",
                    color: "#8A001A",
                    marginBottom: 6,
                  }}
                >
                  {categoria}
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 5 }}
                >
                  {catItems.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        padding: "7px 10px",
                        background: "#faf9f8",
                        borderRadius: 7,
                        border: "1px solid #f0ece8",
                      }}
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          marginTop: 2,
                          color: "#8A001A",
                          opacity: 0.65,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {item.icono}
                      </span>
                      <span
                        style={{
                          fontSize: "0.83rem",
                          color: "#415364",
                          lineHeight: 1.5,
                        }}
                      >
                        {item.texto}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
