import { create } from 'zustand';
import { PatronClinico } from "../utils/transformaciones";

export interface ValoresMLS {
  m: number;
  l: number;
  s: number;
}

export interface ParametrosEspirometria {
  fvc: ValoresMLS;
  fev1: ValoresMLS;
  fev1fvc: ValoresMLS;
}

export interface ManiobraGuardada {
  id?: number; // Añadido para mejor control
  color?: string;
  datosFlujoVolumen: number[][];
  datosVolumenTiempo: number[][];
  criterios: {
    vtestables: boolean;
    esfuerzomaximo: boolean;
    volumenextrapolado: boolean;
    pefcontinuo: boolean;
  };
  fecha: string;
  indices?: {
    fvc: number;
    fev1: number;
    fev1fvc: number;
  }
}

export interface DatosEspirometria {
  parametros: ParametrosEspirometria;
  curva_generada: number[];
  fecha: string;
  maniobras?: ManiobraGuardada[];
}

export interface Paciente {
  id: string;
  nombre: string;
  edad: number;
  sexo: string;
  talla: number;
  raza: string;
  peso: number;
  fechaRegistro: string;
  espirometrias: DatosEspirometria[];
}

interface PacientState {
  pacientes: Paciente[];
  pacienteSeleccionado: Paciente | null;
  addPaciente: (paciente: Paciente) => void;
  setPacientes: (pacientes: Paciente[]) => void;
  seleccionarPaciente: (id: string) => void;
  guardarManiobra: (pacienteId: string, maniobra: ManiobraGuardada) => void;
  patronActivo: PatronClinico | null;
  setPatron: (patron: PatronClinico | null) => void;
}

export const usePacientStore = create<PacientState>((set) => ({
  pacientes: [],
  pacienteSeleccionado: null,
  patronActivo: null,

  addPaciente: (paciente) =>
    set((state) => ({
      pacientes: [...state.pacientes, paciente],
    })),

  setPacientes: (nuevosPacientes) =>
    set(() => ({
      pacientes: nuevosPacientes,
    })),

  seleccionarPaciente: (id) =>
    set((state) => ({
      pacienteSeleccionado: state.pacientes.find((p) => p.id === id) ?? null,
    })),

  setPatron: (patron) => set(() => ({ patronActivo: patron })),

  guardarManiobra: (pacienteId, maniobra) =>
    set((state) => {
      // 1. Mapeamos los pacientes para encontrar el correcto y actualizar sus maniobras
      const nuevosPacientes = state.pacientes.map((paciente) => {
        if (paciente.id === pacienteId) {
          const espirometriasActualizadas = [...paciente.espirometrias];

          if (espirometriasActualizadas.length > 0) {
            const ultimaIndex = espirometriasActualizadas.length - 1;
            const ultimaEspiro = { ...espirometriasActualizadas[ultimaIndex] };

            // Actualizamos el array de maniobras de la última espirometría
            ultimaEspiro.maniobras = [...(ultimaEspiro.maniobras || []), maniobra];
            espirometriasActualizadas[ultimaIndex] = ultimaEspiro;
          }

          return { ...paciente, espirometrias: espirometriasActualizadas };
        }
        return paciente;
      });

      // 2. Buscamos el paciente ya actualizado para refrescar la referencia de 'pacienteSeleccionado'
      const nuevoSeleccionado = nuevosPacientes.find(p => p.id === pacienteId) || null;

      // 3. Devolvemos el nuevo estado con ambas listas actualizadas
      return {
        pacientes: nuevosPacientes,
        pacienteSeleccionado: nuevoSeleccionado,
      };
    }),
}));