// ============================================================
// TIPOS
// ============================================================

export interface PatronClinico {
  nombre: string;
  obstruccion: boolean;
  restriccion: boolean;
  tos: boolean;
}

export interface ValoresMLS {
  m: number;
  l: number;
  s: number;
}

// Casos clínicos predefinidos
export const CASOS_CLINICOS: PatronClinico[] = [
  { nombre: "Normal", obstruccion: false, restriccion: false, tos: false },
  { nombre: "Obstructivo", obstruccion: true, restriccion: false, tos: false },
  { nombre: "Restrictivo", obstruccion: false, restriccion: true, tos: false },
  { nombre: "Obstructivo + Tos", obstruccion: true, restriccion: false, tos: true },
  { nombre: "Restrictivo + Tos", obstruccion: false, restriccion: true, tos: true },
];

// ============================================================
// UTILIDADES Z-SCORE / LMS
// ============================================================

// Calcula el valor real Y que corresponde a un Z-score dado,
// usando la fórmula inversa LMS de las tablas GLI 2012.
//   Y = M · (1 − 1.645·L·S)^(1/L)   generalizada para cualquier Z:
//   Y = M · (1 + Z·L·S)^(1/L)        si L ≠ 0
//   Y = M · exp(Z·S)                  si L ≈ 0
const yDesdeZ = (z: number, mls: ValoresMLS): number => {
  const { m, l, s } = mls;
  if (Math.abs(l) < 1e-10) return m * Math.exp(z * s);
  return m * Math.pow(1 + z * l * s, 1 / l);
};

// Genera un Z aleatorio uniforme dentro de [zMin, zMax]
const zAleatorio = (zMin: number, zMax: number): number =>
  zMin + Math.random() * (zMax - zMin);

// ============================================================
// RANGOS Z POR PATRÓN
// ============================================================
// Cada patrón define en qué rango Z deben caer FVC, FEV1 y FEV1/FVC.
// Se usa un margen interno de ±0.1 para evitar caer exactamente en el borde.

interface RangoZ { min: number; max: number }
interface RangosPatron { fvc: RangoZ; fev1: RangoZ; fev1fvc: RangoZ }

// Normal: Z entre -1.54 y +1.54  (bien dentro del rango normal)
const NORMAL: RangosPatron = {
  fvc: { min: -1.54, max: 1.54 },
  fev1: { min: -1.54, max: 1.54 },
  fev1fvc: { min: -1.54, max: 1.54 },
};

// Obstructivo leve: FVC normal o levemente reducida,
// FEV1 claramente reducido, FEV1/FVC bajo el LLN
const OBSTRUCTIVO_LEVE: RangosPatron = {
  fvc: { min: -1.54, max: 0.5 },   // normal a levemente reducida
  fev1: { min: -2.4, max: -1.74 },   // leve (justo bajo LLN)
  fev1fvc: { min: -2.4, max: -1.74 },   // leve
};

// Obstructivo moderado
const OBSTRUCTIVO_MODERADO: RangosPatron = {
  fvc: { min: -2.4, max: -1.54 },
  fev1: { min: -3.9, max: -2.6 },
  fev1fvc: { min: -3.9, max: -2.6 },
};

// Restrictivo leve: FVC bajo el LLN, FEV1/FVC normal o elevado
const RESTRICTIVO_LEVE: RangosPatron = {
  fvc: { min: -2.4, max: -1.74 },
  fev1: { min: -2.4, max: -1.74 },
  fev1fvc: { min: -0.5, max: 1.0 },   // normal o elevado (patrón restrictivo puro)
};

// Restrictivo moderado
const RESTRICTIVO_MODERADO: RangosPatron = {
  fvc: { min: -3.9, max: -2.6 },
  fev1: { min: -3.9, max: -2.6 },
  fev1fvc: { min: 0.0, max: 1.5 },
};

// ============================================================
// TRANSFORMACIONES DE CURVA
// ============================================================

// Obstrucción: scoop cóncavo en el tramo descendente
export const aplicarObstruccion = (
  curva: number[][],
  fvc: number,
): number[][] => {
  return curva.map(([x, y]) => {
    if (x <= 0 || y <= 0) return [x, y];
    const progreso = x / fvc;
    const factor = 1 - 0.70 * Math.pow(progreso, 2.0);
    return [x, y * Math.max(factor, 0.05)];
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

  const spikePico: number[] = [xTos - 0.05, flujoBase + flujoBase * 0.5];
  const spikeCima: number[] = [xTos, flujoBase + flujoBase * 0.7];
  const spikeBajada: number[] = [xTos + 0.05, flujoBase + flujoBase * 0.25];
  const spikeRetorno: number[] = [xTos + 0.10, flujoBase];

  const resultado = [...curva];
  resultado.splice(insertarEn, 0, spikePico, spikeCima, spikeBajada, spikeRetorno);
  return resultado;
};

// ============================================================
// APLICADOR PRINCIPAL DE CURVA
// ============================================================
export const aplicarPatron = (
  curva: number[][],
  fvc: number,
  patron: PatronClinico | null,
): number[][] => {
  if (!patron) return curva;
  let resultado = curva;
  if (patron.obstruccion) resultado = aplicarObstruccion(resultado, fvc);
  if (patron.restriccion) resultado = aplicarRestriccion(resultado);
  if (patron.tos) resultado = aplicarTos(resultado, fvc);
  return resultado;
};

// ============================================================
// GENERADOR DE ÍNDICES ANCLADO A RANGOS Z
// ============================================================
// Si hay patrón activo, los índices caen en el rango Z clínico correcto.
// Si no hay patrón (Normal), caen dentro del rango normal (Z > -1.64).
// Los MLS son necesarios para convertir Z → valor real.

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
): { fvc: number; fev1: number; fev1fvc: number } => {

  // Sin MLS disponibles: fallback al comportamiento original (±3%)
  if (!mls) {
    const fvc = fvcTeorico * (1 + Math.random() * 0.06 - 0.03);
    const fev1 = fev1Teorico * (1 + Math.random() * 0.06 - 0.03);
    return { fvc, fev1, fev1fvc: fev1 / fvc };
  }

  // Seleccionar rangos según patrón
  let rangos: RangosPatron = NORMAL;

  if (patron?.obstruccion && !patron?.restriccion) {
    // Alternar aleatoriamente entre leve y moderado para variedad
    rangos = Math.random() < 0.5 ? OBSTRUCTIVO_LEVE : OBSTRUCTIVO_MODERADO;
  } else if (patron?.restriccion && !patron?.obstruccion) {
    rangos = Math.random() < 0.5 ? RESTRICTIVO_LEVE : RESTRICTIVO_MODERADO;
  }
  // Nota: patrón mixto (obstrucción + restricción) usaría rangos combinados
  // por ahora se deja en NORMAL hasta definir el criterio clínico.

  // Generar Z aleatorio dentro del rango y convertir a valor real
  const zFvc = zAleatorio(rangos.fvc.min, rangos.fvc.max);
  const zFev1 = zAleatorio(rangos.fev1.min, rangos.fev1.max);
  const zFev1fvc = zAleatorio(rangos.fev1fvc.min, rangos.fev1fvc.max);

  const fvc = yDesdeZ(zFvc, mls.fvc);
  const fev1 = yDesdeZ(zFev1, mls.fev1);
  const fev1fvc = yDesdeZ(zFev1fvc, mls.fev1fvc);

  return { fvc, fev1, fev1fvc };
};