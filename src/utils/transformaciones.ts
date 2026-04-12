// ============================================================
// TIPOS
// ============================================================

export interface PatronClinico {
  nombre: string;
  obstruccion: boolean;
  restriccion: boolean;
  tos: boolean;
}

// Casos clínicos predefinidos
export const CASOS_CLINICOS: PatronClinico[] = [
  { nombre: "Normal",              obstruccion: false, restriccion: false, tos: false },
  { nombre: "Obstructivo",         obstruccion: true,  restriccion: false, tos: false },
  { nombre: "Restrictivo",         obstruccion: false, restriccion: true,  tos: false },
  { nombre: "Obstructivo + Tos",   obstruccion: true,  restriccion: false, tos: true  },
  { nombre: "Restrictivo + Tos",   obstruccion: false, restriccion: true,  tos: true  },
];

// ============================================================
// TRANSFORMACIONES
// ============================================================

// Obstrucción: aplica un "scoop" cóncavo al tramo descendente.
// A mayor x/fvc, más se deprime el flujo.
// El peak no se toca — el efecto empieza después.
export const aplicarObstruccion = (
  curva: number[][],
  fvc: number
): number[][] => {
  return curva.map(([x, y]) => {
    // Solo afecta el tramo de exhalación forzada (x > 0, y > 0)
    if (x <= 0 || y <= 0) return [x, y];

    const progreso = x / fvc; // 0 a 1 a lo largo de la exhalación
    // Factor que crece cuadráticamente: sin efecto al inicio, fuerte al final
    const factor = 1 - 0.45 * Math.pow(progreso, 1.5);
    return [x, y * factor];
  });
};

// Restricción: escala la curva completa hacia adentro.
// FVC y FEV1 se reducen proporcionalmente, preservando la forma.
export const aplicarRestriccion = (
  curva: number[][],
  //fvc: number
): number[][] => {
  const factorX = 0.65; // FVC reducida al 65%
  const factorY = 0.70; // flujos reducidos al 70%

  return curva.map(([x, y]) => {
    // Ancla el origen y el eje negativo (inspiración) intactos
    if (x <= 0) return [x, y * factorY];
    return [x * factorX, y * factorY];
  });
};

// Tos: inserta un spike brusco en un punto aleatorio del tramo medio.
// Se implementa insertando 3 puntos extra que crean un pico y vuelven.
export const aplicarTos = (
  curva: number[][],
  fvc: number
): number[][] => {
  // La tos ocurre en el tramo medio de la exhalación (30%-60% del FVC)
  const xTos = fvc * (0.3 + Math.random() * 0.3);

  // Encontramos el índice más cercano al punto de tos
  let insertarEn = curva.length - 1;
  for (let i = 0; i < curva.length - 1; i++) {
    if (curva[i][0] <= xTos && curva[i + 1][0] > xTos) {
      insertarEn = i + 1;
      break;
    }
  }

  // Interpolamos el flujo en ese punto para que el spike salga desde ahí
  const puntoBase = curva[insertarEn] ?? curva[curva.length - 1];
  const flujoBase = puntoBase[1];

  // El spike sube bruscamente y vuelve
  const spikePico: number[] = [xTos - 0.05, flujoBase + 2.5];
  const spikeCima: number[] = [xTos,         flujoBase + 4.0];
  const spikeBajada: number[] = [xTos + 0.05, flujoBase + 1.0];
  const spikeRetorno: number[] = [xTos + 0.1,  flujoBase];

  const resultado = [...curva];
  resultado.splice(insertarEn, 0, spikePico, spikeCima, spikeBajada, spikeRetorno);
  return resultado;
};

// ============================================================
// APLICADOR PRINCIPAL
// ============================================================
// Aplica las transformaciones en orden según el patrón activo.
// El orden importa: obstruccion → restriccion → tos

export const aplicarPatron = (
  curva: number[][],
  fvc: number,
  patron: PatronClinico | null
): number[][] => {
  if (!patron) return curva;

  let resultado = curva;
  if (patron.obstruccion) resultado = aplicarObstruccion(resultado, fvc);
  if (patron.restriccion) resultado = aplicarRestriccion(resultado);
  if (patron.tos)         resultado = aplicarTos(resultado, fvc);
  return resultado;
};