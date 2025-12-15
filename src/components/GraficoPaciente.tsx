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

// 4. DEFINIMOS EL TIPO COMBINADO
// Esto le dice a TS: "Mi gráfico solo acepta opciones de Línea, Título, Tooltip y Grid"
type ECOption = ComposeOption<
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | DatasetComponentOption
>;

const GraficoPaciente: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      const myChart = echarts.init(chartRef.current);

      const TIEMPO_ANIMACION = 3000;
      const TIEMPO_ESPERA = 2000;
      const INTERVALO_TOTAL = TIEMPO_ANIMACION + TIEMPO_ESPERA;

      // 5. USAMOS EL TIPO AQUÍ
      const option: ECOption = {
        title: { text: "Monitor Cíclico (Tipado)" },
        tooltip: { trigger: "axis" },
        xAxis: { type: "value" },
        yAxis: { type: "value" },
        animationDuration: TIEMPO_ANIMACION,
        // Al usar ECOption, TS ya sabe que "cubicOut" es válido
        //animationEasing: "cubicOut",
        series: [
          {
            data: [
              [1, 6],
              [1.2, 40],
              [1.5, 35],
              [2.5, 25],
              [3, 15],
              [4, 5],
              [4.3, 0],
            ],
            type: "line",
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 4, color: "#ef4444" },
            //areaStyle: { opacity: 0.1, color: "#ef4444" },
          },
        ],
      };

      const runAnimation = () => {
        myChart.clear();
        myChart.setOption(option);
      };

      runAnimation();
      const loopInterval = setInterval(runAnimation, INTERVALO_TOTAL);

      return () => {
        clearInterval(loopInterval);
        myChart.dispose();
      };
    }
  }, []);

  return <div ref={chartRef} style={{ width: "100%", height: "400px" }} />;
};

export default GraficoPaciente;
