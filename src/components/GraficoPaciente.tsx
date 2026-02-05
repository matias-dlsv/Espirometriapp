import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
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

// 1. Definimos qué Props recibe (colores, datos, títulos)
interface GraficoProps {
  titulo?: string;
  colorLinea?: string;
  ejeX?: string;
  ejeY?: string;
}

// 2. Definimos qué funciones exponemos al padre (el "Mando a distancia")
export interface GraficoRef {
  ejecutarAnimacion: () => void;
  resize: () => void;
}

// 3. Usamos forwardRef para permitir el control externo
const GraficoPaciente = forwardRef<GraficoRef, GraficoProps>(
  ({ titulo, colorLinea = "#ef4444", ejeX = "", ejeY = "" }, ref) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstanceRef = useRef<echarts.ECharts | null>(null);

    // Configuración base del gráfico
    const getOption = (): ECOption => ({
      title: {
        text: titulo,
        left: "center",
        textStyle: { color: "#aaa", fontSize: 12 },
      },
      tooltip: { trigger: "axis" },
      grid: { top: 30, bottom: 20, left: 40, right: 20, containLabel: true },
      xAxis: { type: "value", name: ejeX, splitLine: { show: false } },
      yAxis: {
        type: "value",
        name: ejeY,
        splitLine: { lineStyle: { color: "#333" } },
      }, // Líneas tenues
      backgroundColor: "transparent",
      animationDuration: 3000,
      series: [
        {
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
            [3.1843584494915036, 3.94],
            [2.9088280209247164, 4.54],
            [2.6942738625163813, 5.49],
            [2.385276884253392, 6.307],
            [2.217944135772384, 7.324],
            [2.0678861920698353, 8.171],
            [1.9529193878545668, 8.611],
            [1.6927684093099824, 9.286],
            [1.6587603296834215, 9.558],
            [1.5254356608289736, 10.30],
            [1.3144014469679735, 10.809],
            [1.1182051531988173, 11.451],
            [0.9206550346037625, 12.264],
            [0.3782586563559365, 12.389],
            [0.5180275313816591, 12.834],
            [0.755, 12.974],
            [0.208, 11.739],
            [0.182, 11.024],
            [0.172, 10.20],
            [0.128, 9.696],
            [0.132, 9.22],
          ],
          type: "line",
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 3, color: colorLinea },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: colorLinea },
              { offset: 1, color: "transparent" },
            ]),
            opacity: 0.2,
          },
        },
      ],
    });

    // Inicialización
    useEffect(() => {
      if (chartRef.current) {
        chartInstanceRef.current = echarts.init(chartRef.current);
        chartInstanceRef.current.setOption(getOption());
      }

      // Resize Observer para que el gráfico se ajuste si cambias el tamaño de ventana
      const handleResize = () => {
        chartInstanceRef.current?.resize();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        chartInstanceRef.current?.dispose();
      };
    }, [colorLinea, titulo]); // Se reinicia si cambian props básicas

    // 4. Exponemos funciones al padre mediante useImperativeHandle
    useImperativeHandle(ref, () => ({
      ejecutarAnimacion: () => {
        const instance = chartInstanceRef.current;
        if (instance) {
          instance.clear(); // Limpia para reiniciar animación
          instance.setOption(getOption());
        }
      },
      resize: () => {
        chartInstanceRef.current?.resize();
      },
    }));

    return (
      <div
        ref={chartRef}
        // IMPORTANTE: width y height al 100% para llenar el contenedor del padre
        style={{ width: "100%", height: "100%", minHeight: "200px" }}
      />
    );
  },
);

export default GraficoPaciente;
