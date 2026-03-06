// IMPORTANTE: Le decimos a Rust que busque e incluya el archivo "read.rs"
mod read;

use serde::{Deserialize, Serialize};

// 1. Estructura para recibir los datos básicos desde el formulario de React
#[derive(Deserialize)]
pub struct PacienteInput {
    nombre: String,
    edad: u32, // <-- AÑADIDO: Necesitamos la edad para buscar en el Excel
    talla: f64,
    peso: f64,
    sexo: String,
    raza: String,
}

// 2. Estructura para los valores predeterminados de la espirometría
#[derive(Serialize)]
pub struct ParametrosEspirometria {
    fvc: f64,
    fev1: f64,
    cvf: f64,
}

// 3. Estructura final que agrupa todo para enviarlo a TypeScript
#[derive(Serialize)]
pub struct DatosEspirometria {
    parametros: ParametrosEspirometria,
    curva_generada: Vec<f64>,
    fecha: String,
}

// 4. Nuestro comando principal
#[tauri::command]
fn procesar_nuevo_paciente(datos: PacienteInput) -> DatosEspirometria {
    println!(
        "Procesando: {}, Edad: {}, Talla: {}, Peso: {}, Sexo: {}, Raza: {}",
        datos.nombre, datos.edad, datos.talla, datos.peso, datos.sexo, datos.raza
    );

    // ==========================================
    // ¡AQUÍ CONECTAMOS CON TU ARCHIVO read.rs!
    // ==========================================
    // Llamamos a la función usando `read::` antes del nombre.
    // - Pasamos `datos.edad` directamente (es u32)
    // - Convertimos `datos.talla` de f64 a f32 usando `as f32`
    // - Pasamos una referencia del String sexo usando `&` para que sea un &str
    read::leer_tabla_espirometria(datos.edad, datos.talla as f32, &datos.sexo);

    // A. Establecemos los parámetros por default (Por ahora fijos)
    // Más adelante, en lugar de poner 4.5 fijo, pondrás lo que te devuelva `leer_tabla_espirometria`
    let valores_base = ParametrosEspirometria {
        fvc: 4.5,
        fev1: 3.6,
        cvf: 4.5,
    };

    // B. Generamos la curva basándonos en esos parámetros
    let curva_mock = vec![
        0.0,
        valores_base.fev1 * 1.5,
        valores_base.fev1 * 0.8,
        valores_base.fvc * 0.5,
        0.0,
    ];

    // C. Empaquetamos todo y lo retornamos
    DatosEspirometria {
        parametros: valores_base,
        curva_generada: curva_mock,
        fecha: "2026-02-24".to_string(),
    }
}

// 5. El arranque de la aplicación
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![procesar_nuevo_paciente])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
