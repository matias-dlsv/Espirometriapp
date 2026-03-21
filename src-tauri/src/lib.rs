// IMPORTANTE: Le decimos a Rust que busque e incluya el archivo "read.rs"
pub mod read;

use serde::{Deserialize, Serialize};

// 1. Estructura para recibir los datos básicos desde el formulario de React
#[derive(Deserialize)]
pub struct PacienteInput {
    pub nombre: String,
    pub edad: u32,
    pub talla: f64,
    pub peso: f64,
    pub sexo: String,
    pub raza: String,
}

// 2. Estructura para los parámetros de la espirometría
#[derive(Serialize)]
pub struct ParametrosEspirometria {
    pub fvc: read::ValoresMLS,
    pub fev1: read::ValoresMLS,
    pub fev1fvc: read::ValoresMLS,
}

// 3. Estructura final que agrupa todo para enviarlo a TypeScript
#[derive(Serialize)]
pub struct DatosEspirometria {
    pub parametros: ParametrosEspirometria,
    pub curva_generada: Vec<f64>,
    pub fecha: String,
}

// 4. Nuestro comando principal
#[tauri::command]
fn procesar_nuevo_paciente(
    datos: PacienteInput,
    app_handle: tauri::AppHandle, // <-- NUEVO 1: Le pedimos a Tauri el AppHandle
) -> DatosEspirometria {
    println!(
        "Procesando: {}, Edad: {}, Talla: {}, Peso: {}, Sexo: {}, Raza: {}",
        datos.nombre, datos.edad, datos.talla, datos.peso, datos.sexo, datos.raza
    );

    // ==========================================
    // ¡AQUÍ CONECTAMOS CON TU ARCHIVO read.rs!
    // ==========================================
    // Guardamos el resultado en la variable `indices_calculados`
    let indices_calculados = read::leer_tabla_espirometria(
        datos.edad,
        datos.talla as f32,
        &datos.sexo,
        &datos.raza,
        &app_handle, // <-- NUEVO 2: Se lo pasamos a tu función de lectura
    );

    // A. Establecemos los parámetros con los datos REALES extraídos del Excel
    let valores_base = ParametrosEspirometria {
        fvc: indices_calculados.fvc,
        fev1: indices_calculados.fev1,
        fev1fvc: indices_calculados.fev1fvc,
    };

    // B. Generamos la curva basándonos en esos parámetros reales
    let curva_mock = vec![
        0.0,
        valores_base.fev1.m * 1.5,
        valores_base.fev1.m * 0.8,
        valores_base.fvc.m * 0.5,
        0.0,
    ];

    // C. Empaquetamos todo y lo retornamos
    DatosEspirometria {
        parametros: valores_base,
        curva_generada: curva_mock,
        fecha: "2026-03-21".to_string(), // Actualicé a la fecha de hoy por si acaso :)
    }
}

// 5. El arranque de la aplicación (Queda igual)
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![procesar_nuevo_paciente])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
