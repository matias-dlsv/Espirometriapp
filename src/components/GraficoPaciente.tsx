import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  LegendComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { LineSeriesOption } from "echarts/charts";

echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  LegendComponent,
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
  multiData?: { puntos: number[][]; color: string; label?: string }[];
  mostrarEstatico?: boolean;
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  duracionAnimacion?: number;
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
      multiData,
      mostrarEstatico = false,
      minX = 0,
      maxX = 10,
      minY = 0,
      maxY = 10,
      duracionAnimacion = 15000,
    },
    ref,
  ) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<echarts.ECharts | null>(null);
    const animationRef = useRef<number | null>(null);

    // Refs para que ejecutarAnimacion siempre lea los valores actuales
    // sin necesitar ser recreada cuando cambian las props.
    const dataRef = useRef(data);
    const mostrarEstaticoRef = useRef(mostrarEstatico);
    const multiDataRef = useRef(multiData);
    dataRef.current = data;
    mostrarEstaticoRef.current = mostrarEstatico;
    multiDataRef.current = multiData;

    const buildOption = (
      currentData: number[][] = [],
      currentSecundaria?: number[][],
    ): echarts.EChartsCoreOption => {
      const series: LineSeriesOption[] = [];

      if (multiData && multiData.length > 0) {
        multiData.forEach((serie, index) => {
          series.push({
            name: serie.label,
            data: serie.puntos,
            type: "line",
            smooth: false,
            showSymbol: false,
            lineStyle: { width: 2, color: serie.color },
            z: 3 + index,
          });
        });
      } else {
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
      }

      return {
        title: {
          text: titulo,
          left: "center",
          textStyle: { color: "#333", fontSize: 14, fontWeight: "bold" },
        },
        tooltip: { trigger: "axis" },
        legend: multiData ? { top: 25, icon: "circle" } : undefined,
        grid: {
          top: multiData ? 55 : 35,
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
            lineStyle: { color: "rgb(85,85,85)", width: 2 },
          },
          splitLine: {
            show: true,
            lineStyle: { color: "rgba(0,0,0,0.1)", type: "dashed" },
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
            lineStyle: { color: "rgb(85,85,85)", width: 2 },
          },
          splitLine: {
            show: true,
            lineStyle: { color: "rgba(0,0,0,0.1)", type: "dashed" },
          },
          axisLabel: { color: "#555" },
        },
        backgroundColor: "#ffffff",
        animation: false,
        series,
      };
    };

    // ── Efecto 1: montar/desmontar el gráfico UNA SOLA VEZ ────────────────
    useEffect(() => {
      if (!chartRef.current) return;
      const chart = echarts.init(chartRef.current);
      instanceRef.current = chart;

      // ResizeObserver: reacciona cuando el contenedor cambia de tamaño
      const ro = new ResizeObserver(() => {
        chart.resize();
      });
      ro.observe(chartRef.current);

      // fallback para window resize
      const handleResize = () => chart.resize();
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        ro.disconnect();
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        chart.dispose();
        instanceRef.current = null;
      };
    }, []);

    // ── Efecto 2: actualizar opciones cuando cambian props ────────────────
    // NO destruye el gráfico, solo llama setOption.
    useEffect(() => {
      const chart = instanceRef.current;
      if (!chart) return;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      const dataInicial = mostrarEstatico ? data : [];
      const secundariaInicial = mostrarEstatico ? dataSecundaria : undefined;
      chart.setOption(buildOption(dataInicial, secundariaInicial), true);
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
      data,
      dataSecundaria,
      multiData,
    ]);

    // ── Imperativo: ejecutarAnimacion ─────────────────────────────────────
    useImperativeHandle(ref, () => ({
      ejecutarAnimacion: () => {
        if (mostrarEstaticoRef.current || multiDataRef.current) return;
        const chart = instanceRef.current;
        const currentData = dataRef.current;
        if (!chart || !currentData || currentData.length < 2) return;

        if (animationRef.current) cancelAnimationFrame(animationRef.current);

        let startTime: number | null = null;

        const animate = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duracionAnimacion, 1);

          const totalSegments = currentData.length - 1;
          const currentSegmentFloat = progress * totalSegments;
          const currentSegmentIndex = Math.floor(currentSegmentFloat);
          const segmentProgress = currentSegmentFloat - currentSegmentIndex;

          const slice = currentData.slice(0, currentSegmentIndex + 1);

          if (currentSegmentIndex < totalSegments) {
            const p1 = currentData[currentSegmentIndex];
            const p2 = currentData[currentSegmentIndex + 1];
            slice.push([
              p1[0] + (p2[0] - p1[0]) * segmentProgress,
              p1[1] + (p2[1] - p1[1]) * segmentProgress,
            ]);
          }

          chart.setOption({ series: [{ data: slice }] });

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          }
        };

        animationRef.current = requestAnimationFrame(animate);
      },

      resize: () => {
        instanceRef.current?.resize();
      },
    })); // sin dependencias — usa refs para leer valores actuales

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
        <div ref={chartRef} style={{ width: "100%", height: "100%" }} />
      </div>
    );
  },
);

export default GraficoPaciente;
