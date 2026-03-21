import { create } from 'zustand';

// 1. NUEVA INTERFAZ: Espejo exacto de ValoresMLS en Rust
export interface ValoresMLS {
  m: number;
  l: number;
  s: number;
}

// 2. ACTUALIZADO: Espejo exacto de IndicesEspirometria en Rust
export interface ParametrosEspirometria {
  fvc: ValoresMLS;     
  fev1: ValoresMLS;    
  fev1fvc: ValoresMLS; 
}

// --- NUEVO: Interfaz para guardar las maniobras en el frontend ---
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
// -----------------------------------------------------------------

// 3. Espejo exacto de DatosEspirometria en Rust
export interface DatosEspirometria {
  parametros: ParametrosEspirometria;
  curva_generada: number[]; 
  fecha: string;
  // NUEVO: Arreglo opcional para ir guardando las pruebas exitosas
  maniobras?: ManiobraGuardada[]; 
}

// 4. Estructura del Paciente (Sin cambios)
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

// Interfaz del estado de Zustand
interface PacientState {
  pacientes: Paciente[];
  addPaciente: (paciente: Paciente) => void;
  setPacientes: (pacientes: Paciente[]) => void;
  // NUEVO: Acción para guardar la maniobra
  guardarManiobra: (pacienteId: string, maniobra: ManiobraGuardada) => void; 
}

// Store de Zustand
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

  // NUEVO: Implementación de la acción
  guardarManiobra: (pacienteId, maniobra) =>
    set((state) => ({
      pacientes: state.pacientes.map((paciente) => {
        if (paciente.id === pacienteId) {
          // Copiamos las espirometrías del paciente
          const espirometriasActualizadas = [...paciente.espirometrias];
          
          if (espirometriasActualizadas.length > 0) {
            // Trabajamos sobre la última espirometría activa
            const ultimaEspiroIndex = espirometriasActualizadas.length - 1;
            const ultimaEspiro = { ...espirometriasActualizadas[ultimaEspiroIndex] };
            
            // Agregamos la nueva maniobra al arreglo
            ultimaEspiro.maniobras = [...(ultimaEspiro.maniobras || []), maniobra];
            
            // Actualizamos la espirometría en el arreglo
            espirometriasActualizadas[ultimaEspiroIndex] = ultimaEspiro;
          }

          return { ...paciente, espirometrias: espirometriasActualizadas };
        }
        return paciente; // Si no es el paciente, lo dejamos igual
      }),
    })),
}));