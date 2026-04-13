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
import type { LineSeriesOption } from "echarts/charts";

echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  LineChart,
  CanvasRenderer,
]);

interface GraficoProps {
  titulo?: string;
  colorLinea?: string;
  colorSecundario?: string;
  ejeX?: string;
  ejeY?: string;
  data?: number[][];
  dataSecundaria?: number[][];
  mostrarEstatico?: boolean;
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
      colorSecundario = "#94a3b8",
      ejeX = "",
      ejeY = "",
      data = [],
      dataSecundaria,
      mostrarEstatico = false,
      minX = 0,
      maxX = 10,
      minY = 0,
      maxY = 10,
    },
    ref,
  ) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstanceRef = useRef<echarts.ECharts | null>(null);
    const animationRef = useRef<number | null>(null);

    const getOption = (
      currentData: number[][] = [],
      currentSecundaria?: number[][],
    ): echarts.EChartsCoreOption => {
      const series: LineSeriesOption[] = [];

      if (currentSecundaria && currentSecundaria.length > 0) {
        series.push({
          data: currentSecundaria,
          type: "line",
          smooth: false,
          showSymbol: false,
          lineStyle: { width: 2, color: colorSecundario },
          z: 1,
        });
      }

      series.push({
        data: currentData,
        type: "line",
        smooth: false,
        showSymbol: false,
        lineStyle: { width: 3, color: colorLinea },
        z: 2,
      });

      return {
        title: {
          text: titulo,
          left: "center",
          textStyle: { color: "#333", fontSize: 14, fontWeight: "bold" },
        },
        tooltip: { trigger: "axis" },
        grid: { top: 35, bottom: 15, left: 25, right: 25, containLabel: true },
        xAxis: {
          type: "value",
          name: ejeX,
          nameLocation: "end",
          min: minX,
          max: maxX,
          axisLine: {
            show: true,
            onZero: true,
            lineStyle: { color: "rgb(85, 85, 85)", width: 2 },
          },
          splitLine: {
            show: true,
            lineStyle: { color: "rgba(0, 0, 0, 0.1)", type: "dashed" },
          },
          axisLabel: { color: "#555" },
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
            lineStyle: { color: "rgba(0, 0, 0, 0.1)", type: "dashed" },
          },
          axisLabel: { color: "#555" },
        },
        backgroundColor: "#ffffff",
        animation: false,
        series,
      };
    };

    useEffect(() => {
      if (!chartInstanceRef.current && chartRef.current) {
        chartInstanceRef.current = echarts.init(chartRef.current);
      }

      const dataInicial = mostrarEstatico ? data : [];
      const secundariaInicial = mostrarEstatico ? dataSecundaria : undefined;
      chartInstanceRef.current?.setOption(
        getOption(dataInicial, secundariaInicial),
        true,
      );

      const handleResize = () => chartInstanceRef.current?.resize();
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        chartInstanceRef.current?.dispose();
        chartInstanceRef.current = null;
      };
    }, [
      titulo,
      colorLinea,
      colorSecundario,
      ejeX,
      ejeY,
      minX,
      maxX,
      minY,
      maxY,
      mostrarEstatico,
      data,          // CLAVE: actualiza el gráfico si cambian los datos
      dataSecundaria,
    ]);

    useImperativeHandle(
      ref,
      () => ({
        ejecutarAnimacion: () => {
          if (mostrarEstatico) return;
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
      [data, mostrarEstatico],
    );

    return (
      <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div ref={chartRef} style={{ width: "100%", height: "100%", minHeight: "200px" }} />
      </div>
    );
  },
);

export default GraficoPaciente;