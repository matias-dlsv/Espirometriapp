use calamine::{open_workbook, DataType, Reader, Xls};

// Cambiamos el nombre (no puede ser 'main' si lo vas a llamar desde 'main.rs')
// y le añadimos tipos a los parámetros, lo cual es obligatorio en Rust.

pub fn leer_tabla_espirometria(edad: u32, altura: f32, sexo: &str) {
    // Nota: Cuidado con las rutas absolutas. Cuando compiles tu app de Tauri,
    // esta ruta no funcionará en otras computadoras.
    let mut excel: Xls<_> =
        open_workbook("/home/matia/projects/espirometriapp/src-tauri/lookuptables.xls")
            .expect("No se pudo abrir el archivo Excel");

    // 1. El alcance (scope) de las variables
    // En Rust, 'if' es una expresión, así que podemos asignar su resultado directamente.
    let gender = if sexo == "Masculino" {
        "male"
    } else {
        "female"
    };

    // 2. Construcción del String
    // Usamos la macro format! para construir el nombre de la hoja de forma limpia.
    let sheet_name = format!("FEV1{}s", gender);

    // 3. Pasamos el nombre de la hoja creado
    if let Ok(r) = excel.worksheet_range(&sheet_name) {
        for row in r.rows() {
            println!("Fila completa={:?}, Primera celda={:?}", row, row[0]);
        }
    } else {
        // 4. Arreglamos la variable 'name' que no existía
        println!("No se encontró la hoja '{}'", sheet_name);
    }
}
