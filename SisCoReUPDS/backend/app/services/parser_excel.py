"""
Servicio de parseo de archivos Excel de matriculados.
Migrado desde parsear_hoja() y procesar_excel() del script v3.
"""

import re
import pandas as pd


def parsear_hoja(df: pd.DataFrame) -> dict | None:
    """
    Parsea una hoja individual del Excel de matriculados.
    Extrae: código de materia, letra de grupo, lista de estudiantes.
    """
    if df.shape[0] < 7:
        return None

    fila_materia = df.iloc[4]
    codigo_materia = None
    letra_grupo = None
    nombre_materia = None

    for col_idx in range(df.shape[1]):
        val = str(fila_materia.iloc[col_idx]).strip()
        if val == "nan" or val == "":
            continue

        match = re.match(r"^([A-Z]{2,4}[-\s]?\d{3,4})\s+([A-Z])$", val)
        if match:
            codigo_materia = match.group(1)
            letra_grupo = match.group(2)
            codigo_materia = re.sub(r"\s+", "-", codigo_materia)
            continue

        if codigo_materia and nombre_materia is None and val != "nan":
            nombre_materia = val.strip()

    if not codigo_materia or not letra_grupo:
        return None

    estudiantes = []
    for idx in range(7, df.shape[0]):
        fila = df.iloc[idx]
        id_est = str(fila.iloc[2]).strip() if pd.notna(fila.iloc[2]) else None
        nombre = str(fila.iloc[3]).strip() if pd.notna(fila.iloc[3]) else None

        if id_est and id_est != "nan" and nombre and nombre != "nan":
            estudiantes.append({"id": id_est, "nombre": nombre})

    return {
        "codigo_materia": codigo_materia,
        "letra_grupo": letra_grupo,
        "nombre_materia": nombre_materia,
        "estudiantes": estudiantes,
        "num_estudiantes": len(estudiantes),
    }


def procesar_excel(ruta_excel: str, malla: dict) -> tuple[list[dict], set[str]]:
    """
    Procesa todas las hojas del archivo Excel.
    Cruza con la malla curricular para determinar semestres.
    Retorna (registros, materias_no_encontradas).
    """
    xls = pd.ExcelFile(ruta_excel)
    registros = []
    materias_no_encontradas = set()

    for sheet_name in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet_name, header=None)
        datos = parsear_hoja(df)
        if datos is None:
            continue

        codigo = datos["codigo_materia"]
        info_malla = malla.get(codigo)

        # Intentar corrección SPC -> SCP
        if info_malla is None:
            codigo_alt = codigo.replace("SPC-", "SCP-")
            info_malla = malla.get(codigo_alt)
            if info_malla:
                codigo = codigo_alt
                datos["codigo_materia"] = codigo

        if info_malla:
            datos["semestre"] = info_malla["semestre"]
            datos["nombre_malla"] = info_malla["nombre_malla"]
            datos["creditos"] = info_malla["creditos"]
        else:
            datos["semestre"] = None
            datos["nombre_malla"] = None
            datos["creditos"] = None
            materias_no_encontradas.add(datos["codigo_materia"])

        datos["hoja"] = sheet_name
        registros.append(datos)

    return registros, materias_no_encontradas
