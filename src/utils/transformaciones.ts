// ============================================================
// TIPOS
// ============================================================

export interface PatronClinico {
  nombre: string;
  obstruccion: boolean;
  restriccion: boolean;
  tos: boolean;
  respuestaBD: "ninguna" | "leve" | "significativa";
}

export interface ValoresMLS {
  m: number;
  l: number;
  s: number;
}

export const CASOS_CLINICOS: PatronClinico[] = [
  { nombre: "Normal",            obstruccion: false, restriccion: false, tos: false, respuestaBD: "ninguna"       },
  { nombre: "Asma",              obstruccion: true,  restriccion: false, tos: false, respuestaBD: "significativa" },
  { nombre: "EPOC",              obstruccion: true,  restriccion: false, tos: false, respuestaBD: "leve"          },
  { nombre: "Escoliosis Severa", obstruccion: false, restriccion: true,  tos: false, respuestaBD: "leve"          },
  { nombre: "Lobectomía",        obstruccion: false, restriccion: true,  tos: false, respuestaBD: "leve"          },
];

// ============================================================
// CRITERIOS DE ACEPTABILIDAD
// ============================================================

export interface CriteriosAceptabilidad {
  vtestables: boolean;
  esfuerzomaximo: boolean;
  volumenextrapolado: boolean;
  pefcontinuo: boolean;
  tiempoespiracion: boolean;
}

export type FalloKey = keyof CriteriosAceptabilidad | "tiempoespiracion" | null;

/**
 * Probabilidad global de que una maniobra tenga UN fallo.
 * Si cae en fallo, se sortea al azar cuál de los 5 criterios falla.
 * Garantía: máximo un criterio falla a la vez.
 */
const PROB_FALLO_GLOBAL = 0.3;

export const generarCriterios = (): {
  criterios: CriteriosAceptabilidad;
  falloKey: FalloKey;
} => {
  const hayFallo = Math.random() < PROB_FALLO_GLOBAL;

  if (!hayFallo) {
    return {
      criterios: {
        vtestables: true,
        esfuerzomaximo: true,
        volumenextrapolado: true,
        pefcontinuo: true,
        tiempoespiracion: true
        
      },
      falloKey: null,
    };
  }

  const opciones: Array<keyof CriteriosAceptabilidad | "tiempoespiracion"> = [
    "vtestables",
    "esfuerzomaximo",
    "volumenextrapolado",
    "pefcontinuo",
    "tiempoespiracion",
  ];
  const falloKey = opciones[Math.floor(Math.random() * opciones.length)];

  return {
    criterios: {
      vtestables:         falloKey !== "vtestables",
      esfuerzomaximo:     falloKey !== "esfuerzomaximo",
      volumenextrapolado: falloKey !== "volumenextrapolado",
      pefcontinuo:        falloKey !== "pefcontinuo",
      tiempoespiracion:   falloKey !== "tiempoespiracion",

    },
    falloKey,
  };
};

// ============================================================
// RESPUESTA BRONCODILATADORA
// ============================================================

export interface RespuestaBD {
  factorFVC: number;
  factorFEV1: number;
  factorObstruccion: number;
}

export const calcularRespuestaBD = (
  tipo: PatronClinico["respuestaBD"],
): RespuestaBD => {
  const r = Math.random();
  switch (tipo) {
    case "ninguna":
      return { factorFVC: 1.01 + r * 0.02, factorFEV1: 1.02 + r * 0.02, factorObstruccion: 1.0  };
    case "leve":
      return { factorFVC: 1.03 + r * 0.03, factorFEV1: 1.04 + r * 0.04, factorObstruccion: 0.75 };
    case "significativa":
      return { factorFVC: 1.08 + r * 0.06, factorFEV1: 1.12 + r * 0.08, factorObstruccion: 0.25 };
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

const NORMAL:                        RangosPatron = { fvc: { min: -1.54, max:  1.54 }, fev1: { min: -1.54, max:  1.54 }, fev1fvc: { min: -1.54, max:  1.54 } };
const OBSTRUCTIVO_LEVE:              RangosPatron = { fvc: { min: -1.54, max:  0.5  }, fev1: { min: -2.4,  max: -1.74 }, fev1fvc: { min: -2.4,  max: -1.74 } };
const OBSTRUCTIVO_MODERADO:          RangosPatron = { fvc: { min: -2.4,  max: -1.54 }, fev1: { min: -3.9,  max: -2.6  }, fev1fvc: { min: -3.9,  max: -2.6  } };
const RESTRICTIVO_LEVE:              RangosPatron = { fvc: { min: -2.4,  max: -1.74 }, fev1: { min: -2.4,  max: -1.74 }, fev1fvc: { min: -0.5,  max:  1.0  } };
const RESTRICTIVO_MODERADO:          RangosPatron = { fvc: { min: -3.9,  max: -2.6  }, fev1: { min: -3.9,  max: -2.6  }, fev1fvc: { min:  0.0,  max:  1.5  } };
const OBSTRUCTIVO_POST_SIGNIFICATIVO:RangosPatron = { fvc: { min: -1.0,  max:  0.5  }, fev1: { min: -1.64, max: -0.3  }, fev1fvc: { min: -1.64, max: -0.3  } };
const RESTRICTIVO_POST_LEVE:         RangosPatron = { fvc: { min: -2.2,  max: -1.54 }, fev1: { min: -2.2,  max: -1.54 }, fev1fvc: { min: -0.5,  max:  1.0  } };
const NORMAL_POST:                   RangosPatron = { fvc: { min: -1.54, max:  0.5  }, fev1: { min: -1.54, max:  0.5  }, fev1fvc: { min: -1.54, max:  0.5  } };

// ============================================================
// TRANSFORMACIONES — PATRÓN CLÍNICO
// ============================================================

/** Obstrucción: scoop cóncavo en el tramo descendente. factor 0–1. */
export const aplicarObstruccion = (
  curva: number[][],
  fvc: number,
  factor = 1,
): number[][] =>
  curva.map(([x, y]) => {
    if (x <= 0 || y <= 0) return [x, y];
    const f = 1 - 0.88 * factor * Math.pow(x / fvc, 2.5);
    return [x, y * Math.max(f, 0.05)];
  });

/** Restricción: escala la curva hacia adentro. */
export const aplicarRestriccion = (curva: number[][]): number[][] =>
  curva.map(([x, y]) =>
    x <= 0 ? [x, y * 0.70] : [x * 0.65, y * 0.70],
  );

/**
 * Tos: spike asimétrico (subida rápida, bajada lenta).
 * Posición dispersa (15–75 % del FVC), amplitud y ancho variables,
 * ~13 puntos en un rango de 0.35–0.50 L.
 */
export const aplicarTos = (curva: number[][], fvc: number): number[][] => {
  const xTos = fvc * (0.15 + Math.random() * 0.60);

  let insertarEn = curva.length - 1;
  for (let i = 0; i < curva.length - 1; i++) {
    if (curva[i][0] <= xTos && curva[i + 1][0] > xTos) {
      insertarEn = i + 1;
      break;
    }
  }

  const flujoBase = (curva[insertarEn] ?? curva[curva.length - 1])[1];
  const amplitud  = flujoBase * (0.40 + Math.random() * 0.50);
  const anchoTotal  = 0.35 + Math.random() * 0.15;
  const anchoSubida = anchoTotal * (0.12 + Math.random() * 0.08);
  const anchoBajada = anchoTotal - anchoSubida;

  const nuevos: number[][] = [
    [xTos - anchoSubida * 0.70, flujoBase + amplitud * 0.15],
    [xTos - anchoSubida * 0.30, flujoBase + amplitud * 0.60],
    [xTos,                       flujoBase + amplitud],
    [xTos + anchoBajada * 0.08,  flujoBase + amplitud * 0.82],
    [xTos + anchoBajada * 0.17,  flujoBase + amplitud * 0.65],
    [xTos + anchoBajada * 0.28,  flujoBase + amplitud * 0.50],
    [xTos + anchoBajada * 0.40,  flujoBase + amplitud * 0.37],
    [xTos + anchoBajada * 0.52,  flujoBase + amplitud * 0.26],
    [xTos + anchoBajada * 0.63,  flujoBase + amplitud * 0.17],
    [xTos + anchoBajada * 0.73,  flujoBase + amplitud * 0.10],
    [xTos + anchoBajada * 0.83,  flujoBase + amplitud * 0.05],
    [xTos + anchoBajada * 0.92,  flujoBase + amplitud * 0.02],
    [xTos + anchoBajada,         flujoBase],
  ];

  const resultado = [...curva];
  resultado.splice(insertarEn, 0, ...nuevos);
  return resultado;
};

/** Aplica patrón clínico completo (obstrucción + restricción + tos). */
export const aplicarPatron = (
  curva: number[][],
  fvc: number,
  patron: PatronClinico | null,
  factorObstruccion = 1,
): number[][] => {
  if (!patron) return curva;
  let r = curva;
  if (patron.obstruccion) r = aplicarObstruccion(r, fvc, factorObstruccion);
  if (patron.restriccion) r = aplicarRestriccion(r);
  if (patron.tos)         r = aplicarTos(r, fvc);
  return r;
};

// ============================================================
// TRANSFORMACIONES — CRITERIOS DE ACEPTABILIDAD
// ============================================================

/**
 * ESFUERZO MÁXIMO (fallo): reduce el flujo en toda la curva de exhalación
 * forzada. Sin ondulaciones — el aspecto es una maniobra uniformemente baja
 * que no alcanza el esfuerzo esperado.
 */
export const aplicarFalloEsfuerzoMaximo = (
  curva: number[][],
  _fvc: number,
): number[][] => {
  let idxPef = 0;
  let maxFlujo = -Infinity;
  for (let i = 0; i < curva.length; i++) {
    if (curva[i][1] > maxFlujo) {
      maxFlujo = curva[i][1];
      idxPef = i;
    }
  }

  return curva.map(([x, y], i) => {
    if (i <= idxPef) {
      return [x, y * 0.4];
    }
    const tDesc = (i - idxPef) / Math.max(1, curva.length - 1 - idxPef);
    // factor base de aplastamiento
    const base = y * (0.4 + tDesc * 0.08);
    // ondulaciones sutiles sobre el tramo descendente
    const ondula = base * 0.12 * Math.sin(tDesc * Math.PI * 9) * (1 - tDesc);
    return [x, base + ondula];
  });
};

/**
 * VOLUMEN EXTRAPOLADO (fallo): desplaza el tramo final de la inhalación
 * post-forzada para que termine en x = −vbeArtificial en lugar del volumen
 * residual (~0). Simula que el paciente no completó la inspiración previa
 * antes de comenzar la espiración forzada.
 */
export const aplicarFalloVolumenExtrapolado = (
  inhalacionPostForzada: number[][],
  fvcM: number,
): { inhalacion: number[][]; vbeArtificial: number } => {
  const vbeArtificial = fvcM * (0.08 + Math.random() * 0.06);

  if (inhalacionPostForzada.length === 0) {
    return { inhalacion: inhalacionPostForzada, vbeArtificial };
  }

  const xFinal = -vbeArtificial;
  const nConservar = Math.floor(inhalacionPostForzada.length * 0.70);
  const pivote  = inhalacionPostForzada[nConservar];
  const xPivote = pivote[0];
  const yPivote = pivote[1];

  const nRedibujar = inhalacionPostForzada.length - nConservar;
  const nuevoCierre: number[][] = [];
  for (let i = 1; i <= nRedibujar; i++) {
    const t = i / nRedibujar;
    nuevoCierre.push([
      xPivote + t * (xFinal - xPivote),
      yPivote * (1 - Math.pow(t, 0.7)),
    ]);
  }

  return {
    inhalacion: [
      ...inhalacionPostForzada.slice(0, nConservar + 1),
      ...nuevoCierre,
    ],
    vbeArtificial,
  };
};

/**
 * PEF CONTINUO (fallo): artefacto de tos sobre la exhalación forzada.
 */
export const aplicarFalloPefContinuo = (
  curva: number[][],
  fvc: number,
): number[][] => {
  const xTos = fvc * (0.15 + Math.random() * 0.60);
  const amplitud = 0.35 + Math.random() * 0.40;
  const ancho = 0.30 + Math.random() * 0.20;

  return curva.map(([x, y]) => {
    if (x <= 0) return [x, y];
    const dist = Math.abs(x - xTos);
    if (dist > ancho) return [x, y];
    const t = dist / ancho;
    // pico asimétrico: sube rápido antes del centro, baja lento después
    const factor = x < xTos
      ? amplitud * Math.pow(1 - t, 0.4)
      : amplitud * Math.pow(1 - t, 1.8);
    return [x, y + y * factor];
  });
};

/**
 * TIEMPO ESPIRACIÓN (fallo): corta la exhalación forzada en el espacio F/V
 * al 70–85 % del recorrido REAL de la curva (xMax), independiente del FVC
 * teórico y de factorCompresionX. Cae abruptamente a 0.
 *
 * IMPORTANTE: la curva V/T no se toca. Corregir.tsx detecta este fallo
 * directamente desde el falloKey del payload (no desde V/T), por lo que
 * tiempoEspiracionCumple debe forzarse a false cuando falloKey === "tiempoespiracion".
 */
export const aplicarFalloTiempoEspiracion = (
  exhalacionForzada: number[][],
  _fvcM: number,
): number[][] => {
  if (exhalacionForzada.length === 0) return exhalacionForzada;

  // Usar el máximo x real de la curva (ya incorpora factorCompresionX)
  const xMax = Math.max(...exhalacionForzada.map(([x]) => x));
  const proporcionCorte = 0.50 + Math.random() * 0.15;
  const volCorte = xMax * proporcionCorte;

  let idxCorte = exhalacionForzada.length - 1;
  for (let i = 0; i < exhalacionForzada.length; i++) {
    if (exhalacionForzada[i][0] >= volCorte) {
      idxCorte = i;
      break;
    }
  }

  const cortada = exhalacionForzada.slice(0, idxCorte + 1);
  const ultimo  = cortada[cortada.length - 1] ?? [volCorte, 0];

  cortada.push([ultimo[0] + 0.03, ultimo[1] * 0.4]);
  cortada.push([ultimo[0] + 0.05, 0]);

  return cortada;
};

// ── vtestables: no se necesita función de transformación.
// El fallo se maneja en Maniobra.tsx omitiendo bucle1 y bucle2 del ensamblado.

// ============================================================
// GENERADOR DE ÍNDICES ANCLADO A RANGOS Z
// ============================================================

export interface ParametrosMLS {
  fvc: ValoresMLS;
  fev1: ValoresMLS;
  fev1fvc: ValoresMLS;
}

export const generarIndicesAleatorios = (
  fvcTeorico: number,
  fev1Teorico: number,
  mls?: ParametrosMLS,
  patron?: PatronClinico | null,
  faseActual: "pre" | "post" = "pre",
): { fvc: number; fev1: number; fev1fvc: number } => {
  if (!mls) {
    const mejora =
      faseActual === "post" && patron?.respuestaBD === "significativa" ? 1.14 :
      faseActual === "post" && patron?.respuestaBD === "leve"          ? 1.06 : 1;
    const fvc  = fvcTeorico  * mejora * (1 + Math.random() * 0.06 - 0.03);
    const fev1 = fev1Teorico * mejora * (1 + Math.random() * 0.06 - 0.03);
    return { fvc, fev1, fev1fvc: fev1 / fvc };
  }

  let rangos: RangosPatron;
  if (faseActual === "post") {
    rangos =
      patron?.obstruccion && patron.respuestaBD === "significativa"
        ? OBSTRUCTIVO_POST_SIGNIFICATIVO
        : patron?.restriccion
          ? RESTRICTIVO_POST_LEVE
          : NORMAL_POST;
  } else {
    rangos =
      patron?.obstruccion && !patron?.restriccion
        ? Math.random() < 0.5 ? OBSTRUCTIVO_LEVE : OBSTRUCTIVO_MODERADO
        : patron?.restriccion && !patron?.obstruccion
          ? Math.random() < 0.5 ? RESTRICTIVO_LEVE : RESTRICTIVO_MODERADO
          : NORMAL;
  }

  return {
    fvc:     yDesdeZ(zAleatorio(rangos.fvc.min,     rangos.fvc.max),     mls.fvc),
    fev1:    yDesdeZ(zAleatorio(rangos.fev1.min,    rangos.fev1.max),    mls.fev1),
    fev1fvc: yDesdeZ(zAleatorio(rangos.fev1fvc.min, rangos.fev1fvc.max), mls.fev1fvc),
  };
};