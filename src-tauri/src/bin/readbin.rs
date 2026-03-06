use calamine::{open_workbook, Data, Reader, Xls};

fn main() {
    // ==========================================
    // ¡Edita estas variables para probar!
    // ==========================================
    let edad_prueba: u32 = 25;
    let altura_prueba: f32 = 1.80;
    let sexo_prueba: &str = "Masculino";
    let raza_prueba: &str = "Caucasico"; // Añadimos la variable aquí para pasarla a la función

    println!("--- Iniciando prueba independiente ---");
    println!(
        "Buscando datos para: Edad = {}, Altura = {}, Sexo = {}, Raza = {}",
        edad_prueba, altura_prueba, sexo_prueba, raza_prueba
    );

    // Pasamos todas las variables requeridas (incluyendo la raza)
    leer_tabla_espirometria(edad_prueba, altura_prueba, sexo_prueba, raza_prueba);
}

pub fn leer_tabla_espirometria(edad: u32, altura: f32, sexo: &str, raza: &str) {
    let mut excel: Xls<_> =
        open_workbook("/home/matia/projects/espirometriapp/src-tauri/lookuptables.xls")
            .expect("No se pudo abrir el archivo Excel");

    let gender = if sexo == "Masculino" {
        "male"
    } else {
        "female"
    };

    // Ojo: En tu ejemplo pusiste un espacio "FEV1 {}s", lo ajusté a "FEV1{}s"
    // asumiendo que el nombre de la hoja es "FEV1males" o "FEV1females".
    let sheet_name = format!("FEV1 {}s", gender);

    if let Ok(r) = excel.worksheet_range(&sheet_name) {
        let extraer_coef = |fila: u32, col: u32| -> f64 {
            match r.get_value((fila, col)) {
                Some(Data::Float(f)) => *f,
                Some(Data::Int(num)) => *num as f64,
                Some(Data::String(s)) => s.replace(",", ".").parse::<f64>().unwrap_or(0.0),
                _ => 0.0,
            }
        };

        // Extraemos a0, a1, a2, a3 (Asumiendo que están uno debajo del otro)
        // Cambia estos números de fila (3, 4, 5, 6) y columna (8) según tu Excel
        let a0 = extraer_coef(3, 8);
        let a1 = extraer_coef(4, 8); // Fila 5, Col J
        let a2 = extraer_coef(5, 8); // Fila 6, Col J
        let a3 = extraer_coef(6, 8); // Fila 7, Col J
        let a4 = extraer_coef(7, 8); // Fila 7, Col J
        let a5 = extraer_coef(8, 8); // Fila 7, Col J
        let a6 = extraer_coef(9, 8); // Fila 7, Col J

        println!("Coeficientes fijos extraídos:");
        println!("a0: {}", a0);
        println!("a1: {}", a1);
        println!("a2: {}", a2);
        println!("a3: {}", a3);
        println!("a4: {}", a4);
        println!("a5: {}", a5);
        println!("a6: {}", a6);
        println!("-------------------------------");
        // ========================================================

        let mut encontrado = false;

        // .enumerate() nos da el índice de la fila (empezando en 0) junto con sus datos
        for (i, row) in r.rows().enumerate() {
            // Solo nos interesan las filas de la 3 a la 372 (índices 2 al 371)
            if i >= 2 && i <= 371 {
                // La Columna B es el índice 1
                // Extraemos el valor numérico (puede venir como entero o flotante desde Excel)
                let edad_excel = match row.get(0) {
                    Some(Data::Float(f)) => *f,
                    Some(Data::Int(num)) => *num as f64,
                    _ => continue, // Si está vacía o es texto, saltamos a la siguiente fila
                };

                // Comparamos si la edad coincide (convertimos nuestro u32 a f64 para comparar)
                if edad_excel == (edad as f64) {
                    // Encontramos la edad. Extraemos Col D (índice 3) y Col E (índice 4)
                    let mspline = match row.get(2) {
                        Some(Data::Float(f)) => *f,
                        Some(Data::Int(num)) => *num as f64,
                        _ => 0.0,
                    };

                    let sspline: f64 = match row.get(3) {
                        Some(Data::Float(f)) => *f,
                        Some(Data::Int(num)) => *num as f64,
                        _ => 0.0,
                    };

                    println!(
                        "¡Éxito! Edad {} encontrada en la fila {} del Excel.",
                        edad,
                        i + 1
                    );
                    println!("Mspline (Columna D): {}", mspline);
                    println!("Sspline (Columna E): {}", sspline);

                    encontrado = true;
                    break; // Detenemos el loop porque ya encontramos lo que buscábamos
                }
            }
        }

        // Si terminó el ciclo (loop) y no se activó la bandera "encontrado"
        if !encontrado {
            println!(
                "La edad {} no fue encontrada en la columna B (filas 3 a 372).",
                edad
            );
        }
    } else {
        println!("No se encontró la hoja '{}'", sheet_name);
    }
}
