use calamine::{open_workbook, Data, Reader, Xls};

// Estructura para devolver los 3 valores ordenados
#[derive(Debug)]
pub struct IndicesEspirometria {
    pub fev1: f64,
    pub fvc: f64,
    pub fev1fvc: f64,
}

fn main() {
    // ==========================================
    // ¡Edita estas variables para probar!
    // ==========================================
    let edad_prueba: u32 = 25;
    let altura_prueba: f32 = 180.0;
    let sexo_prueba: &str = "Masculino";
    let raza_prueba: &str = "Caucasico";

    println!("--- Iniciando prueba independiente ---");
    println!(
        "Buscando datos para: Edad = {}, Altura = {}, Sexo = {}, Raza = {}",
        edad_prueba, altura_prueba, sexo_prueba, raza_prueba
    );

    // Llamamos a la función y guardamos el resultado
    let resultados = leer_tabla_espirometria(edad_prueba, altura_prueba, sexo_prueba, raza_prueba);

    // Mostramos los resultados devueltos
    println!("\n--- Resultados Finales Obtenidos ---");
    println!("Índice FEV1:     {:.4}", resultados.fev1);
    println!("Índice FVC:      {:.4}", resultados.fvc);
    println!("Índice FEV1/FVC: {:.4}", resultados.fev1fvc);
}

pub fn leer_tabla_espirometria(
    edad: u32,
    altura: f32,
    sexo: &str,
    raza: &str,
) -> IndicesEspirometria {
    let mut excel: Xls<_> =
        open_workbook("/home/matia/projects/espirometriapp/src-tauri/lookuptables.xls")
            .expect("No se pudo abrir el archivo Excel");

    let gender = if sexo == "Masculino" {
        "male"
    } else {
        "female"
    };

    // Variables de raza corregidas (f64 para la fórmula)
    let mut afr_am: f64 = 0.0;
    let mut ne_asia: f64 = 0.0;
    let mut se_asia: f64 = 0.0;
    let mut other: f64 = 0.0;

    match raza {
        "Afrodescendiente" => afr_am = 1.0,
        "Asiático (Noreste)" => ne_asia = 1.0,
        "Asiático (Sureste)" => se_asia = 1.0,
        "Otro" => other = 1.0,
        _ => {} // Caucásico u otra raza mantiene todo en 0.0
    }

    // Vector para guardar temporalmente los cálculos de cada hoja
    let mut indices_calculados = Vec::new();

    // Iteramos por las 3 hojas que nos interesan
    let parametros = ["FEV1", "FVC", "FEV1FVC"];

    for parametro in parametros {
        let sheet_name = format!("{} {}s", parametro, gender);
        let mut index_result = 0.0;

        if let Ok(r) = excel.worksheet_range(&sheet_name) {
            let extraer_coef = |fila: u32, col: u32| -> f64 {
                match r.get_value((fila, col)) {
                    Some(Data::Float(f)) => *f,
                    Some(Data::Int(num)) => *num as f64,
                    Some(Data::String(s)) => s.replace(",", ".").parse::<f64>().unwrap_or(0.0),
                    _ => 0.0,
                }
            };

            let a0 = extraer_coef(3, 8);
            let a1 = extraer_coef(4, 8);
            let a2 = extraer_coef(5, 8);
            let a3 = extraer_coef(6, 8);
            let a4 = extraer_coef(7, 8);
            let a5 = extraer_coef(8, 8);
            let a6 = extraer_coef(9, 8);

            // ========================================================

            let mut mspline = 0.0;
            // let mut sspline = 0.0; // Descomentar si requieres usar sspline después
            let mut encontrado = false;

            for (i, row) in r.rows().enumerate() {
                if i >= 2 && i <= 371 {
                    let edad_excel = match row.get(0) {
                        Some(Data::Float(f)) => *f,
                        Some(Data::Int(num)) => *num as f64,
                        _ => continue,
                    };

                    if edad_excel == (edad as f64) {
                        mspline = match row.get(2) {
                            Some(Data::Float(f)) => *f,
                            Some(Data::Int(num)) => *num as f64,
                            _ => 0.0,
                        };

                        /* sspline = match row.get(3) {
                            Some(Data::Float(f)) => *f,
                            Some(Data::Int(num)) => *num as f64,
                            _ => 0.0,
                        }; */

                        encontrado = true;
                        break;
                    }
                }
            }

            println!("Coeficientes fijos extraídos:");
            println!("mspline: {}", mspline);
            println!("a0: {}", a0);
            println!("a1: {}", a1);
            println!("a2: {}", a2);
            println!("a3: {}", a3);
            println!("a4: {}", a4);
            println!("a5: {}", a5);
            println!("a6: {}", a6);
            println!("afr_am: {}", afr_am);
            println!("ne_asia: {}", ne_asia);
            println!("se_asia: {}", se_asia);
            println!("other: {}", other);
            println!("-------------------------------");

            println!("{}", a1 + (altura as f64).ln());
            println!("{}", a2 * (edad as f64).ln());

            if encontrado {
                // Cálculo de la fórmula
                // Usamos f64::ln() y exp() de manera correcta para Rust
                index_result = (a0
                    + a1 * (altura as f64).ln()
                    + a2 * (edad as f64).ln()
                    + a3 * afr_am
                    + a4 * ne_asia
                    + a5 * se_asia
                    + a6 * other
                    + mspline)
                    .exp();
            } else {
                println!(
                    "Advertencia: La edad {} no fue encontrada en la hoja '{}'.",
                    edad, sheet_name
                );
            }
        } else {
            println!("Error: No se encontró la hoja '{}'", sheet_name);
        }

        // Guardamos el resultado del parámetro actual
        indices_calculados.push(index_result);
    }

    // Retornamos la estructura con los tres índices
    IndicesEspirometria {
        fev1: indices_calculados[0],
        fvc: indices_calculados[1],
        fev1fvc: indices_calculados[2],
    }
}
