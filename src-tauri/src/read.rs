use calamine::{open_workbook, Data, Reader, Xls};
use serde::{Deserialize, Serialize};

// Estructura para almacenar los 3 índices de cada parámetro
#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
pub struct ValoresMLS {
    pub m: f64,
    pub l: f64,
    pub s: f64,
}

// Estructura para devolver los resultados agrupados
#[derive(Debug, Serialize, Deserialize)]
pub struct IndicesEspirometria {
    pub fev1: ValoresMLS,
    pub fvc: ValoresMLS,
    pub fev1fvc: ValoresMLS,
}

pub fn leer_tabla_espirometria(
    edad: u32,
    altura: f32,
    sexo: &str,
    raza: &str,
    app_handle: &tauri::AppHandle,
) -> IndicesEspirometria {
    // 2. Resolvemos la ruta del archivo empaquetado dinámicamente
    let excel_path = app_handle
        .path_resolver()
        .resolve_resource("lookuptables.xls") // Nombre de tu archivo empaquetado
        .expect("No se pudo encontrar el archivo lookuptables.xls en los recursos");

    // 3. Abrimos el workbook usando la ruta dinámica
    let mut excel: Xls<_> = open_workbook(excel_path).expect("No se pudo abrir el archivo Excel");

    let gender = if sexo == "Masculino" {
        "male"
    } else {
        "female"
    };

    let mut afr_am: f64 = 0.0;
    let mut ne_asia: f64 = 0.0;
    let mut se_asia: f64 = 0.0;
    let mut other: f64 = 0.0;

    match raza {
        "Afrodescendiente" => afr_am = 1.0,
        "Asiático (Noreste)" => ne_asia = 1.0,
        "Asiático (Sureste)" => se_asia = 1.0,
        "Otro" => other = 1.0,
        _ => {}
    }

    let mut indices_calculados = Vec::new();
    let parametros = ["FEV1", "FVC", "FEV1FVC"];

    for parametro in parametros {
        let sheet_name = format!("{} {}s", parametro, gender);
        let mut l_result = 0.0;
        let mut m_result = 0.0;
        let mut s_result = 0.0;

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

            let p0 = extraer_coef(3, 10);
            let p1 = extraer_coef(5, 10);
            let p2 = extraer_coef(6, 10);
            let p3 = extraer_coef(7, 10);
            let p4 = extraer_coef(8, 10);
            let p5 = extraer_coef(9, 10);

            let q0 = extraer_coef(3, 12);
            let q1 = extraer_coef(5, 12);

            let mut mspline = 0.0;
            let mut lspline = 0.0;
            let mut sspline = 0.0;
            let mut encontrado = false;

            for (i, row) in r.rows().enumerate() {
                if i >= 2 && i <= 371 {
                    let edad_excel = match row.get(0) {
                        Some(Data::Float(f)) => *f,
                        Some(Data::Int(num)) => *num as f64,
                        _ => continue,
                    };

                    if edad_excel == (edad as f64) {
                        lspline = match row.get(1) {
                            Some(Data::Float(f)) => *f,
                            Some(Data::Int(num)) => *num as f64,
                            _ => 0.0,
                        };

                        mspline = match row.get(2) {
                            Some(Data::Float(f)) => *f,
                            Some(Data::Int(num)) => *num as f64,
                            _ => 0.0,
                        };

                        sspline = match row.get(3) {
                            Some(Data::Float(f)) => *f,
                            Some(Data::Int(num)) => *num as f64,
                            _ => 0.0,
                        };

                        encontrado = true;
                        break;
                    }
                }
            }

            if encontrado {
                // Cálculo de L
                match sheet_name.as_str() {
                    "FVC males" | "FEV1 females" | "FVC females" => {
                        l_result = q0;
                    }
                    "FEV1 males" | "FEV1FVC females" => {
                        l_result = q0 + q1 * (edad as f64).ln();
                    }
                    "FEV1FVC males" => {
                        l_result = q0 + q1 * (edad as f64).ln() + lspline;
                    }
                    _ => {}
                }

                // Cálculo de M
                m_result = (a0
                    + a1 * (altura as f64).ln()
                    + a2 * (edad as f64).ln()
                    + a3 * afr_am
                    + a4 * ne_asia
                    + a5 * se_asia
                    + a6 * other
                    + mspline)
                    .exp();

                // Cálculo de S
                s_result = (p0
                    + p1 * (edad as f64).ln()
                    + p2 * afr_am
                    + p3 * ne_asia
                    + p4 * se_asia
                    + p5 * other
                    + sspline)
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

        // Empaquetamos los 3 resultados en la estructura
        let resultado_hoja = ValoresMLS {
            m: m_result,
            l: l_result,
            s: s_result,
        };

        indices_calculados.push(resultado_hoja);
    }

    // Retornamos la estructura principal asignando cada valor del vector
    IndicesEspirometria {
        fev1: indices_calculados[0],
        fvc: indices_calculados[1],
        fev1fvc: indices_calculados[2],
    }
}
