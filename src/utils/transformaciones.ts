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
  { nombre: "Normal", obstruccion: false, restriccion: false, tos: false },
  { nombre: "Obstructivo", obstruccion: true, restriccion: false, tos: false },
  { nombre: "Restrictivo", obstruccion: false, restriccion: true, tos: false },
  { nombre: "Obstructivo + Tos", obstruccion: true, restriccion: false, tos: true },
  { nombre: "Restrictivo + Tos", obstruccion: false, restriccion: true, tos: true },
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
    if (x <= 0 || y <= 0) return [x, y];

    const progreso = x / fvc;
    // Subimos de 0.45 a 0.70 y el exponente de 1.5 a 2.0
    // — más agresivo y más curvo hacia el final
    const factor = 1 - 0.70 * Math.pow(progreso, 2.0);
    return [x, y * Math.max(factor, 0.05)]; // nunca llega a negativo
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

  // Spike proporcional al flujo en ese momento en vez de valores fijos
  // Una tos realista sube ~40-60% sobre el flujo local
  const alturaPico = flujoBase * 0.5;
  const alturaCima = flujoBase * 0.7;
  const alturaBajada = flujoBase * 0.25;

  const spikePico: number[] = [xTos - 0.05, flujoBase + alturaPico];
  const spikeCima: number[] = [xTos, flujoBase + alturaCima];
  const spikeBajada: number[] = [xTos + 0.05, flujoBase + alturaBajada];
  const spikeRetorno: number[] = [xTos + 0.1, flujoBase];

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
  if (patron.tos) resultado = aplicarTos(resultado, fvc);
  return resultado;
};

// Calcula índices con variación correlacionada al peak real de la maniobra.
// Si el peak fue más alto que el esperado, FEV1 sube proporcionalmente.
// FVC también sube pero menos. FEV1/FVC se deriva de ambos.
export const calcularIndicesManiobra = (
  fvcTeorico: number,
  fev1Teorico: number,
  peakFlujo: number,
): { fvc: number; fev1: number; fev1fvc: number } => {
  // El peak esperado es fev1 * 1.45 (punto medio del rango de peakFlujo)
  const peakEsperado = fev1Teorico * 1.525;
  // Cuánto se desvió el peak real del esperado (positivo = más fuerte)
  const correlacion = (peakFlujo / peakEsperado) - 1; // aprox -0.05 a +0.05

  // FEV1: fuerte correlación con el peak + ruido pequeño independiente
  const deltaFev1 = correlacion * 0.6 + (Math.random() * 0.04 - 0.02);
  const fev1 = fev1Teorico * (1 + deltaFev1);

  // FVC: correlación más débil + ruido independiente
  const deltaFvc = correlacion * 0.3 + (Math.random() * 0.04 - 0.02);
  const fvc = fvcTeorico * (1 + deltaFvc);

  // FEV1/FVC derivado — no perturbado independientemente
  const fev1fvc = fev1 / fvc;

  return { fvc, fev1, fev1fvc };
};