import { create } from 'zustand';

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
  espirometrias: any[]; // Puedes definir una interfaz para esto luego si quieres
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
      pacientes: nuevosPacientes,
    })),
}));