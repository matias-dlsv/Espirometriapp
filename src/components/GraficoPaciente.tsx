import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";

const GraficoPaciente: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      const myChart = echarts.init(chartRef.current);

      // Definimos los tiempos
      const TIEMPO_ANIMACION = 3000; // Tarda 3s en dibujarse
      const TIEMPO_ESPERA = 2000; // Espera 2s con el gráfico completo
      const INTERVALO_TOTAL = TIEMPO_ANIMACION + TIEMPO_ESPERA;

      const option: echarts.EChartsOption = {
        title: { text: "Monitor Cíclico" },
        tooltip: { trigger: "axis" },
        xAxis: { type: "value" },
        yAxis: { type: "value" },
        // Aseguramos que la animación dure menos que el intervalo del loop
        animationDuration: TIEMPO_ANIMACION,
        animationEasing: "cubicOut",
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
            areaStyle: { opacity: 0.1, color: "#ef4444" },
          },
        ],
      };

      // Función que ejecuta el ciclo de dibujado
      const runAnimation = () => {
        // 1. EL TRUCO: Limpiar el lienzo completamente
        myChart.clear();
        // 2. Volver a establecer las opciones
        myChart.setOption(option);
      };

      // Ejecutamos la primera vez inmediatamente
      runAnimation();

      // Configurar el intervalo
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
