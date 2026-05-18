// ============================================================
// TIPOS
// ============================================================

export interface PatronClinico {
  nombre: string;
  obstruccion: boolean;
  restriccion: boolean;
  tos: boolean;
  /** Cómo responde este patrón al broncodilatador */
  respuestaBD: "ninguna" | "leve" | "significativa";
}

export interface ValoresMLS {
  m: number;
  l: number;
  s: number;
}

// Casos clínicos predefinidos
export const CASOS_CLINICOS: PatronClinico[] = [
  {
    nombre: "Normal",
    obstruccion: false,
    restriccion: false,
    tos: false,
    respuestaBD: "ninguna",       // variabilidad fisiológica <4 %
  },
  {
    nombre: "Asma",
    obstruccion: true,
    restriccion: false,
    tos: false,
    respuestaBD: "significativa", // única con respuesta >12 % FEV1
  },
  {
    nombre: "EPOC",
    obstruccion: true,
    restriccion: false,
    tos: false,
    respuestaBD: "leve",          // obstructivo poco reversible <12 %
  },
  {
    nombre: "Escoliosis Severa",
    obstruccion: false,
    restriccion: true,
    tos: false,
    respuestaBD: "leve",          // restrictivo extrapulmonar, cambios menores
  },
  {
    nombre: "Lobectomía",
    obstruccion: false,
    restriccion: true,
    tos: false,
    respuestaBD: "leve",          // restrictivo postquirúrgico, cambios menores
  },
];

// ============================================================
// RESPUESTA BRONCODILATADORA
// ============================================================

export interface RespuestaBD {
  /** Factor multiplicador sobre el FVC generado  (p.ej. 1.10 = +10 %) */
  factorFVC: number;
  /** Factor multiplicador sobre el FEV1 generado */
  factorFEV1: number;
  /**
   * Qué tanto se mantiene el "scoop" obstructivo en la curva post-BD.
   * 1.0 = igual que pre-BD  |  0.0 = curva completamente normal.
   */
  factorObstruccion: number;
}

/**
 * Devuelve factores para el scoop visual de la curva post-BD.
 * Los índices numéricos ya se generan directamente en rangos Z correctos
 * mediante generarIndicesAleatorios con faseActual="post".
 */
export const calcularRespuestaBD = (
  tipo: PatronClinico["respuestaBD"],
): RespuestaBD => {
  const r = Math.random();

  switch (tipo) {
    case "ninguna":
      return {
        factorFVC:         1.01 + r * 0.02,
        factorFEV1:        1.02 + r * 0.02,
        factorObstruccion: 1.0,
      };

    case "leve":
      return {
        factorFVC:         1.03 + r * 0.03,
        factorFEV1:        1.04 + r * 0.04,
        factorObstruccion: 0.75,
      };

    case "significativa":
      return {
        factorFVC:         1.08 + r * 0.06,
        factorFEV1:        1.12 + r * 0.08,
        factorObstruccion: 0.25,
      };
  }
};

// ============================================================
// UTILIDADES Z-SCORE / LMS
// ============================================================

const yDesdeZ = (z: number, mls: ValoresMLS): number => {
  const { m, l, s } = mls;
  if (Math.abs(l) < 1e-10) return m * Math.exp(z * s);
  return m * Math.pow(1 + z * l * s, 1 / l);
};

const zAleatorio = (zMin: number, zMax: number): number =>
  zMin + Math.random() * (zMax - zMin);

// ============================================================
// RANGOS Z POR PATRÓN
// ============================================================

interface RangoZ { min: number; max: number }
interface RangosPatron { fvc: RangoZ; fev1: RangoZ; fev1fvc: RangoZ }

// ── Pre-BD ───────────────────────────────────────────────────

const NORMAL: RangosPatron = {
  fvc:     { min: -1.54, max: 1.54 },
  fev1:    { min: -1.54, max: 1.54 },
  fev1fvc: { min: -1.54, max: 1.54 },
};

const OBSTRUCTIVO_LEVE: RangosPatron = {
  fvc:     { min: -1.54, max:  0.5  },
  fev1:    { min: -2.4,  max: -1.74 },
  fev1fvc: { min: -2.4,  max: -1.74 },
};

const OBSTRUCTIVO_MODERADO: RangosPatron = {
  fvc:     { min: -2.4, max: -1.54 },
  fev1:    { min: -3.9, max: -2.6  },
  fev1fvc: { min: -3.9, max: -2.6  },
};

const RESTRICTIVO_LEVE: RangosPatron = {
  fvc:     { min: -2.4, max: -1.74 },
  fev1:    { min: -2.4, max: -1.74 },
  fev1fvc: { min: -0.5, max:  1.0  },
};

const RESTRICTIVO_MODERADO: RangosPatron = {
  fvc:     { min: -3.9, max: -2.6 },
  fev1:    { min: -3.9, max: -2.6 },
  fev1fvc: { min:  0.0, max:  1.5 },
};

// ── Post-BD ──────────────────────────────────────────────────
// Los rangos post-BD reflejan la mejora esperada según tipo de respuesta.

/** Obstructivo con respuesta significativa: FEV1 puede alcanzar el LLN o superarlo */
const OBSTRUCTIVO_POST_SIGNIFICATIVO: RangosPatron = {
  fvc:     { min: -1.0,  max:  0.5  },  // FVC mejora a casi normal
  fev1:    { min: -1.64, max: -0.3  },  // FEV1 sube notablemente, puede cruzar el LLN
  fev1fvc: { min: -1.64, max: -0.3  },  // ratio mejora, puede normalizarse
};

/** Restrictivo con respuesta leve: mejora pequeña, sigue por debajo del LLN */
const RESTRICTIVO_POST_LEVE: RangosPatron = {
  fvc:     { min: -2.2, max: -1.54 },
  fev1:    { min: -2.2, max: -1.54 },
  fev1fvc: { min: -0.5, max:  1.0  },
};

/** Normal / sin respuesta: variabilidad fisiológica mínima */
const NORMAL_POST: RangosPatron = {
  fvc:     { min: -1.54, max: 0.5 },
  fev1:    { min: -1.54, max: 0.5 },
  fev1fvc: { min: -1.54, max: 0.5 },
};

// ============================================================
// TRANSFORMACIONES DE CURVA
// ============================================================

/**
 * Obstrucción: scoop cóncavo en el tramo descendente.
 *
 * @param factor  0–1.  1 = obstrucción completa (pre-BD).
 *                      Valores menores abren la curva progresivamente (post-BD).
 */
export const aplicarObstruccion = (
  curva: number[][],
  fvc: number,
  factor = 1,
): number[][] => {
  return curva.map(([x, y]) => {
    if (x <= 0 || y <= 0) return [x, y];
    const progreso = x / fvc;
    const scoop = 0.70 * factor;
    const f = 1 - scoop * Math.pow(progreso, 2.0);
    return [x, y * Math.max(f, 0.05)];
  });
};

// Restricción: escala la curva hacia adentro preservando la forma
export const aplicarRestriccion = (curva: number[][]): number[][] => {
  const factorX = 0.65;
  const factorY = 0.70;
  return curva.map(([x, y]) => {
    if (x <= 0) return [x, y * factorY];
    return [x * factorX, y * factorY];
  });
};

// Tos: spike brusco en un punto aleatorio del tramo medio
export const aplicarTos = (curva: number[][], fvc: number): number[][] => {
  const xTos = fvc * (0.3 + Math.random() * 0.3);

  let insertarEn = curva.length - 1;
  for (let i = 0; i < curva.length - 1; i++) {
    if (curva[i][0] <= xTos && curva[i + 1][0] > xTos) {
      insertarEn = i + 1;
      break;
    }
  }

  const puntoBase = curva[insertarEn] ?? curva[curva.length - 1];
  const flujoBase = puntoBase[1];

  const spikePico: number[]    = [xTos - 0.05, flujoBase + flujoBase * 0.5];
  const spikeCima: number[]    = [xTos,         flujoBase + flujoBase * 0.7];
  const spikeBajada: number[]  = [xTos + 0.05,  flujoBase + flujoBase * 0.25];
  const spikeRetorno: number[] = [xTos + 0.10,  flujoBase];

  const resultado = [...curva];
  resultado.splice(insertarEn, 0, spikePico, spikeCima, spikeBajada, spikeRetorno);
  return resultado;
};

// ============================================================
// APLICADOR PRINCIPAL DE CURVA
// ============================================================

/**
 * @param factorObstruccion  Pasado directamente a aplicarObstruccion.
 *                           En fase post-BD usar el valor de calcularRespuestaBD().
 */
export const aplicarPatron = (
  curva: number[][],
  fvc: number,
  patron: PatronClinico | null,
  factorObstruccion = 1,
): number[][] => {
  if (!patron) return curva;
  let resultado = curva;
  if (patron.obstruccion) resultado = aplicarObstruccion(resultado, fvc, factorObstruccion);
  if (patron.restriccion) resultado = aplicarRestriccion(resultado);
  if (patron.tos)         resultado = aplicarTos(resultado, fvc);
  return resultado;
};

// ============================================================
// GENERADOR DE ÍNDICES ANCLADO A RANGOS Z
// ============================================================

export interface ParametrosMLS {
  fvc: ValoresMLS;
  fev1: ValoresMLS;
  fev1fvc: ValoresMLS;
}

/**
 * Genera índices espirométricos dentro del rango Z clínico correcto.
 *
 * En fase "post" los rangos Z son más favorables (mejora post-BD),
 * eliminando la necesidad de multiplicar factores sobre valores ya bajos.
 */
export const generarIndicesAleatorios = (
  fvcTeorico: number,
  fev1Teorico: number,
  mls?: ParametrosMLS,
  patron?: PatronClinico | null,
  faseActual: "pre" | "post" = "pre",
): { fvc: number; fev1: number; fev1fvc: number } => {

  // Sin MLS disponibles: fallback con mejora empírica en post
  if (!mls) {
    const mejora = faseActual === "post" && patron?.respuestaBD === "significativa"
      ? 1.14
      : faseActual === "post" && patron?.respuestaBD === "leve"
        ? 1.06
        : 1;
    const fvc  = fvcTeorico  * mejora * (1 + Math.random() * 0.06 - 0.03);
    const fev1 = fev1Teorico * mejora * (1 + Math.random() * 0.06 - 0.03);
    return { fvc, fev1, fev1fvc: fev1 / fvc };
  }

  let rangos: RangosPatron;

  if (faseActual === "post") {
    // Rangos post-BD: directamente en la zona de mejoría esperada
    if (patron?.obstruccion && patron.respuestaBD === "significativa") {
      rangos = OBSTRUCTIVO_POST_SIGNIFICATIVO;
    } else if (patron?.restriccion) {
      rangos = RESTRICTIVO_POST_LEVE;
    } else {
      rangos = NORMAL_POST;
    }
  } else {
    // Rangos pre-BD: lógica original
    if (patron?.obstruccion && !patron?.restriccion) {
      rangos = Math.random() < 0.5 ? OBSTRUCTIVO_LEVE : OBSTRUCTIVO_MODERADO;
    } else if (patron?.restriccion && !patron?.obstruccion) {
      rangos = Math.random() < 0.5 ? RESTRICTIVO_LEVE : RESTRICTIVO_MODERADO;
    } else {
      rangos = NORMAL;
    }
  }

  const zFvc     = zAleatorio(rangos.fvc.min,     rangos.fvc.max);
  const zFev1    = zAleatorio(rangos.fev1.min,    rangos.fev1.max);
  const zFev1fvc = zAleatorio(rangos.fev1fvc.min, rangos.fev1fvc.max);

  const fvc     = yDesdeZ(zFvc,     mls.fvc);
  const fev1    = yDesdeZ(zFev1,    mls.fev1);
  const fev1fvc = yDesdeZ(zFev1fvc, mls.fev1fvc);

  return { fvc, fev1, fev1fvc };
};