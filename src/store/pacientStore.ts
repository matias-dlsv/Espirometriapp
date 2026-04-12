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
  datosFlujoVolumen: number[][];
  datosVolumenTiempo: number[][];
  criterios: {
    vtestables: boolean;
    esfuerzomaximo: boolean;
    volumenextrapolado: boolean;
    pefcontinuo: boolean;
  };
  fecha: string;
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
  // En la interfaz PacientState agrega:
  patronActivo: PatronClinico | null;
  setPatron: (patron: PatronClinico | null) => void;
}

export const usePacientStore = create<PacientState>((set) => ({
  pacientes: [],
  pacienteSeleccionado: null,

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

  guardarManiobra: (pacienteId, maniobra) =>
    set((state) => ({
      pacientes: state.pacientes.map((paciente) => {
        if (paciente.id === pacienteId) {
          const espirometriasActualizadas = [...paciente.espirometrias];

          if (espirometriasActualizadas.length > 0) {
            const ultimaEspiroIndex = espirometriasActualizadas.length - 1;
            const ultimaEspiro = { ...espirometriasActualizadas[ultimaEspiroIndex] };
            ultimaEspiro.maniobras = [...(ultimaEspiro.maniobras || []), maniobra];
            espirometriasActualizadas[ultimaEspiroIndex] = ultimaEspiro;
          }

          return { ...paciente, espirometrias: espirometriasActualizadas };
        }
        return paciente;
      }),
    })),
    patronActivo: null,
    setPatron: (patron) => set(() => ({ patronActivo: patron })),
})); // <-- este es el único cierre del create()