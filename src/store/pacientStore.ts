import { create } from 'zustand';
// A. Definimos la estructura de los datos que Rust va a generar
export interface DatosEspirometria {
  datosBase: number[]; // El primer set de datos default (ej. la curva)
  resultadosEsperados: { // El segundo set de datos generado a partir del primero
    fvc: number;
    fev1: number;
    cvf: number;
    diagnostico: string;
  };
  fecha: string;
}
// 1. Definimos qué forma tiene un Paciente
export interface Paciente {
  id: string;
  nombre: string;
  edad: string; // Es string porque usas rangos "20-30"
  sexo: string;
  talla: number;
  raza: string;
  peso: number;
  fechaRegistro: string;
  espirometrias: DatosEspirometria[]; 
}

// 2. Definimos qué tiene tu Store (Estado + Funciones)
interface PacientState {
  pacientes: Paciente[];
  addPaciente: (paciente: Paciente) => void;
  setPacientes: (pacientes: Paciente[]) => void;
}

// 3. Creamos el store pasando el tipo <PacientState>
export const usePacientStore = create<PacientState>((set) => ({
  pacientes: [],

  addPaciente: (paciente) =>
    set((state) => ({
      pacientes: [...state.pacientes, paciente],
    })),

  setPacientes: (nuevosPacientes) =>
    set(() => ({
      pacientes: nuevosPacientes
    })),
}));