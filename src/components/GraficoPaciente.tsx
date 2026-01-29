import React, { useEffect, useRef } from "react";

// 1. Imports de valores (Runtime)
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

// 2. Imports de TIPOS (TypeScript)
import type { ComposeOption } from "echarts/core";
import type { LineSeriesOption } from "echarts/charts";
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
  DatasetComponentOption,
} from "echarts/components";

// 3. Registramos los módulos
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  LineChart,
  CanvasRenderer,
]);

// 4. Definición de tipos
type ECOption = ComposeOption<
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | DatasetComponentOption
>;

const GraficoPaciente: React.FC = () => {
  // Referencia al div del DOM
  const chartRef = useRef<HTMLDivElement>(null);
  // Referencia a la instancia de ECharts para poder llamarla desde el botón
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // Constante de tiempo
  const TIEMPO_ANIMACION = 3000;

  // Opciones del gráfico (Extraídas fuera para mantener el código limpio,
  // aunque pueden estar dentro si dependen de props)
  const option: ECOption = {
    title: { text: "Monitor Cíclico (Manual)" },
    tooltip: { trigger: "axis" },
    xAxis: { type: "value" },
    yAxis: { type: "value" },
    animationDuration: TIEMPO_ANIMACION,
    series: [
      {
        data: [
          [1, 6],
          [1.1, 20],
          [1.15, 32],
          [1.3, 40.3],
          [1.6, 37.7],
          [1.9, 35.9],
          [2.2, 33.1],
          [2.4, 30.3],
          [2.6, 28.5],
          [2.8, 25],
          [3, 23.3],
          [3.3, 20.1],
          [3.4, 17.2],
          [3.6, 14.5],
          [3.8, 12.2],
          [4.0, 9],
          [4.2, 8],
          [4.3, 5],
        ],
        type: "line",
        smooth: false,
        showSymbol: false,
        lineStyle: { width: 4, color: "#ef4444" },
      },
    ],
  };

  useEffect(() => {
    // 1. Inicializamos el gráfico SOLO UNA VEZ al montar
    if (chartRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);

      // Opcional: Pintar un estado inicial vacío o con ejes
      // chartInstanceRef.current.setOption(option);
    }

    // Limpieza al desmontar
    return () => {
      chartInstanceRef.current?.dispose();
    };
  }, []);

  // Función controladora del botón
  const handleRunAnimation = () => {
    const instance = chartInstanceRef.current;

    if (instance) {
      // .clear() borra el gráfico, forzando a ECharts a redibujar desde cero
      // esto es lo que crea el efecto de "reinicio" de la animación.
      instance.clear();
      instance.setOption(option);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Botón de control */}
      <div>
        <button
          onClick={handleRunAnimation}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Ejecutar Animación
        </button>
      </div>

      {/* Contenedor del Gráfico */}
      <div
        ref={chartRef}
        style={{ width: "100%", height: "400px", border: "1px solid #ccc" }}
      />
    </div>
  );
};

export default GraficoPaciente;
