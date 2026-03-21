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
  data?: number[][];
  // AGREGAMOS LOS LÍMITES FIJOS AQUÍ
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
}

export interface GraficoRef {
  ejecutarAnimacion: () => void;
  resize: () => void;
}

const GraficoPaciente = forwardRef<GraficoRef, GraficoProps>(
  (
    {
      titulo,
      colorLinea = "#ef4444",
      ejeX = "",
      ejeY = "",
      data = [],
      minX = 0, // Valores por defecto si no le pasas nada
      maxX = 10,
      minY = 0,
      maxY = 10,
    },
    ref,
  ) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstanceRef = useRef<echarts.ECharts | null>(null);
    const animationRef = useRef<number | null>(null);

    const getOption = (currentData: number[][] = []): ECOption => {
      return {
        title: {
          text: titulo,
          left: "center",
          // 1. Título más oscuro para que resalte en el fondo blanco
          textStyle: { color: "#333", fontSize: 14, fontWeight: "bold" },
        },
        tooltip: { trigger: "axis" },
        grid: {
          top: 35,
          bottom: 15,
          left: 25,
          right: 25,
          containLabel: true,
        },
        xAxis: {
          type: "value",
          name: ejeX,
          nameLocation: "end",
          min: minX,
          max: maxX,
          axisLine: {
            show: true,
            onZero: true,
            // 2. Líneas de los ejes principales en un gris oscuro
            lineStyle: { color: "rgb(85, 85, 85)", width: 2 },
          },
          splitLine: {
            show: true,
            // 3. Grilla punteada en negro semi-transparente (antes era blanco)
            lineStyle: { color: "rgba(0, 0, 0, 0.1)", type: "dashed" },
          },
          axisLabel: { color: "#555" }, // Números en gris oscuro
        },
        yAxis: {
          type: "value",
          name: ejeY,
          nameLocation: "end",
          min: minY,
          max: maxY,
          axisLine: {
            show: true,
            onZero: true,
            lineStyle: { color: "rgb(85, 85, 85)", width: 2 },
          },
          splitLine: {
            show: true,
            // Grilla punteada en negro semi-transparente
            lineStyle: { color: "rgba(0, 0, 0, 0.1)", type: "dashed" },
          },
          axisLabel: { color: "#555" }, // Números en gris oscuro
        },

        // 4. ¡EL FONDO BLANCO!
        backgroundColor: "#ffffff",

        animation: false,
        series: [
          {
            data: currentData,
            type: "line",
            smooth: false,
            showSymbol: false,
            lineStyle: { width: 3, color: colorLinea },
          },
        ],
      };
    };

    useEffect(() => {
      if (!chartInstanceRef.current && chartRef.current) {
        chartInstanceRef.current = echarts.init(chartRef.current);
      }
      chartInstanceRef.current?.setOption(getOption([]), true);

      const handleResize = () => {
        chartInstanceRef.current?.resize();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        chartInstanceRef.current?.dispose();
        chartInstanceRef.current = null;
      };
      // Agregamos los límites a las dependencias
    }, [titulo, colorLinea, ejeX, ejeY, minX, maxX, minY, maxY]);

    useImperativeHandle(
      ref,
      () => ({
        ejecutarAnimacion: () => {
          const instance = chartInstanceRef.current;
          if (!instance || !data || data.length < 2) return;

          if (animationRef.current) cancelAnimationFrame(animationRef.current);

          const totalDuration = 10000;
          let startTime: number | null = null;

          const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / totalDuration, 1);

            const totalSegments = data.length - 1;
            const currentSegmentFloat = progress * totalSegments;
            const currentSegmentIndex = Math.floor(currentSegmentFloat);
            const segmentProgress = currentSegmentFloat - currentSegmentIndex;

            const currentData = data.slice(0, currentSegmentIndex + 1);

            if (currentSegmentIndex < totalSegments) {
              const p1 = data[currentSegmentIndex];
              const p2 = data[currentSegmentIndex + 1];
              const interpolatedX = p1[0] + (p2[0] - p1[0]) * segmentProgress;
              const interpolatedY = p1[1] + (p2[1] - p1[1]) * segmentProgress;
              currentData.push([interpolatedX, interpolatedY]);
            }

            instance.setOption({ series: [{ data: currentData }] });

            if (progress < 1) {
              animationRef.current = requestAnimationFrame(animate);
            }
          };

          animationRef.current = requestAnimationFrame(animate);
        },
        resize: () => {
          chartInstanceRef.current?.resize();
        },
      }),
      [data],
    );

    return (
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
