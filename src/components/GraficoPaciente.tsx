import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

// Tipos de ECharts
import type { ComposeOption } from "echarts/core";
import type { LineSeriesOption } from "echarts/charts";
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
  DatasetComponentOption,
} from "echarts/components";

echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  LineChart,
  CanvasRenderer,
]);

type ECOption = ComposeOption<
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | DatasetComponentOption
>;

interface GraficoProps {
  titulo?: string;
  colorLinea?: string;
  ejeX?: string;
  ejeY?: string;
}

export interface GraficoRef {
  ejecutarAnimacion: () => void;
  resize: () => void;
}

const GraficoPaciente = forwardRef<GraficoRef, GraficoProps>(
  ({ titulo, colorLinea = "#ef4444", ejeX = "", ejeY = "" }, ref) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstanceRef = useRef<echarts.ECharts | null>(null);

    const getOption = (): ECOption => {
      // 1. SOLUCIÓN TYPESCRIPT: Definimos el grid como 'any' o forzamos la propiedad
      // Esto le dice a ECharts: "Dibuja el área del gráfico como un cuadrado perfecto"
      // Independientemente de si el div contenedor es rectangular.
      const gridConfig: any = {
        top: 40,
        bottom: 20,
        left: 40,
        right: 20,
        containLabel: true,
      };

      return {
        title: {
          text: titulo,
          left: "center",
          textStyle: { color: "#aaa", fontSize: 12 },
        },
        tooltip: { trigger: "axis" },

        // Asignamos la configuración con el "truco" de tipos
        grid: gridConfig,

        xAxis: {
          type: "value",
          min: 0,
          name: ejeX,
          splitLine: { show: false },
        },
        yAxis: {
          type: "value",
          min: 0,
          name: ejeY,
          splitLine: { lineStyle: { color: "#333" } },
        },
        backgroundColor: "transparent",
        animationDuration: 3000,
        series: [
          {
            // ... (tus datos se mantienen igual)
            data: [
              [0.089, 8.7],
              [0.04, 8.26],
              [0.017, 7.75],
              [0.024, 6.803],
              [0.031, 5.987],
              [-0.01, 5.27],
              [0.015, 3.91],
              [0.0255, 2.687],
              [0.0336, 1.667],
              [0.043, 0.409],
              [3.876, 1.065],
              [4.055, 0.491],
              [4.537, -0.0],
              [4.649, -0.1],
              [3.678, 1.844],
              [3.495, 2.86],
              [3.348, 3.33],
              [3.184, 3.94],
              [2.908, 4.54],
              [2.694, 5.49],
              [2.385, 6.307],
              [2.217, 7.324],
              [2.067, 8.171],
              [1.952, 8.611],
              [1.692, 9.286],
              [1.658, 9.558],
              [1.525, 10.3],
              [1.314, 10.809],
              [1.118, 11.451],
              [0.92, 12.264],
              [0.378, 12.389],
              [0.518, 12.834],
              [0.755, 12.974],
              [0.208, 11.739],
              [0.182, 11.024],
              [0.172, 10.2],
              [0.128, 9.696],
              [0.132, 9.22],
            ],
            type: "line",
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 3, color: colorLinea },
          },
        ],
      };
    };

    useEffect(() => {
      if (chartRef.current) {
        chartInstanceRef.current = echarts.init(chartRef.current);
        chartInstanceRef.current.setOption(getOption());
      }

      const handleResize = () => {
        chartInstanceRef.current?.resize();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        chartInstanceRef.current?.dispose();
      };
    }, [colorLinea, titulo]);

    useImperativeHandle(ref, () => ({
      ejecutarAnimacion: () => {
        const instance = chartInstanceRef.current;
        if (instance) {
          instance.clear();
          instance.setOption(getOption());
        }
      },
      resize: () => {
        chartInstanceRef.current?.resize();
      },
    }));

    return (
      // 2. CSS: Flexbox para centrar el gráfico si sobra espacio
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          ref={chartRef}
          style={{ width: "100%", height: "100%", minHeight: "200px" }}
        />
      </div>
    );
  },
);

export default GraficoPaciente;
