"""
Servicio de análisis estadístico de matriculados.
Migrado desde generar_estadisticas() y determinar_semestre_principal() del script v3.
"""

import re
from collections import defaultdict
from sqlalchemy.orm import Session

from app.models.grupo_config import GrupoConfig


TURNOS = {
    "M": "Mañana",
    "T": "Tarde",
    "N": "Noche",
}


def parsear_config_texto(config_texto: str) -> list[dict]:
    """
    Parsea configuración de grupos en formato texto.
    Retorna lista de dicts con la info de cada grupo.
    """
    grupos = []
    for linea in config_texto.strip().split("\n"):
        linea = linea.strip()
        if not linea:
            continue

        match = re.match(r"^([A-Z]\d+)", linea)
        if not match:
            continue

        nombre_grupo = match.group(1)
        turno_letra = nombre_grupo[0]
        letras = re.findall(r"\(([A-Z])\)", linea)
        if not letras:
            continue

        letra_principal = letras[0]
        letras_overflow = letras[1:]

        grupos.append({
            "nombre_grupo": nombre_grupo,
            "turno": turno_letra,
            "letra_principal": letra_principal,
            "letras_overflow": letras_overflow,
            "letras": letras,
        })

    return grupos


def obtener_configs_grupos(db: Session, periodo_id: int) -> dict:
    """
    Carga la configuración de grupos de la BD y la devuelve en el formato
    que necesita el analizador: {semestre -> (letra_a_grupo, grupo_a_letras, grupo_info)}
    """
    configs_db = db.query(GrupoConfig).filter(GrupoConfig.periodo_id == periodo_id).all()

    # Agrupar por semestre
    por_semestre = defaultdict(list)
    for cfg in configs_db:
        por_semestre[cfg.semestre].append(cfg)

    configs = {}
    for semestre, grupos in por_semestre.items():
        letra_a_grupo = {}
        grupo_a_letras = {}
        grupo_info = {}

        for g in grupos:
            todas_letras = g.letras if g.letras else [g.letra_principal] + (g.letras_overflow or [])
            grupo_a_letras[g.nombre_grupo] = todas_letras
            turno_numero = g.nombre_grupo[1:]

            grupo_info[g.nombre_grupo] = {
                "turno": g.turno,
                "turno_nombre": TURNOS.get(g.turno, g.turno),
                "numero": turno_numero,
                "letra_principal": g.letra_principal,
                "letras_overflow": g.letras_overflow or [],
            }

            for letra in todas_letras:
                letra_a_grupo[letra] = g.nombre_grupo

        configs[semestre] = (letra_a_grupo, grupo_a_letras, grupo_info)

    return configs


def determinar_semestre_principal(registros: list[dict]) -> tuple[dict, dict, dict]:
    """
    Para cada estudiante, determina su semestre principal (el más alto).
    """
    estudiante_semestres = defaultdict(set)
    estudiante_nombre = {}

    for r in registros:
        if r["semestre"] is None:
            continue
        for est in r["estudiantes"]:
            estudiante_semestres[est["id"]].add(r["semestre"])
            estudiante_nombre[est["id"]] = est["nombre"]

    estudiante_sem_principal = {}
    for est_id, semestres in estudiante_semestres.items():
        estudiante_sem_principal[est_id] = max(semestres)

    return estudiante_semestres, estudiante_sem_principal, estudiante_nombre


def generar_estadisticas(registros: list[dict], configs_grupos: dict) -> dict:
    """
    Genera todas las estadísticas del análisis.
    Migrado directamente del script v3.
    """
    est_semestres, est_sem_principal, est_nombre = determinar_semestre_principal(registros)

    # A) Estudiantes únicos por semestre
    estudiantes_por_semestre = defaultdict(set)
    for r in registros:
        if r["semestre"] is None:
            continue
        for est in r["estudiantes"]:
            estudiantes_por_semestre[r["semestre"]].add(est["id"])

    # B) Grupos reales por semestre
    grupo_real_semestre = defaultdict(set)
    grupo_real_letra_semestre = defaultdict(set)

    for r in registros:
        if r["semestre"] is None:
            continue
        sem = r["semestre"]
        letra = r["letra_grupo"]

        if sem in configs_grupos:
            letra_a_grupo, _, _ = configs_grupos[sem]
        else:
            letra_a_grupo = {}

        grupo_real = letra_a_grupo.get(letra, letra)

        for est in r["estudiantes"]:
            grupo_real_semestre[(sem, grupo_real)].add(est["id"])
            grupo_real_letra_semestre[(sem, grupo_real, letra)].add(est["id"])

    # C) Repitentes
    repitentes = []
    repitentes_por_semestre = defaultdict(set)

    for est_id, semestres in est_semestres.items():
        sem_principal = est_sem_principal[est_id]
        semestres_inf = {s for s in semestres if s < sem_principal}

        if semestres_inf:
            repitentes.append({
                "id": est_id,
                "nombre": est_nombre[est_id],
                "semestre_principal": sem_principal,
                "semestres_donde_repite": sorted(semestres_inf),
                "todos_los_semestres": sorted(semestres),
            })
            for s in semestres_inf:
                repitentes_por_semestre[s].add(est_id)

    repitentes.sort(key=lambda x: (-x["semestre_principal"], x["nombre"]))

    # D) Total
    todos = set()
    for r in registros:
        for est in r["estudiantes"]:
            todos.add(est["id"])

    return {
        "estudiantes_por_semestre": estudiantes_por_semestre,
        "grupo_real_semestre": grupo_real_semestre,
        "grupo_real_letra_semestre": grupo_real_letra_semestre,
        "total_estudiantes_unicos": len(todos),
        "repitentes": repitentes,
        "repitentes_por_semestre": repitentes_por_semestre,
        "est_semestres": est_semestres,
        "est_sem_principal": est_sem_principal,
        "est_nombre": est_nombre,
    }


def sort_key_grupo(nombre_grupo: str, grupo_info: dict) -> tuple:
    info = grupo_info.get(nombre_grupo)
    if info:
        turno_order = {"M": 0, "T": 1, "N": 2}
        return (turno_order.get(info["turno"], 3), int(info["numero"]))
    return (9, str(nombre_grupo))
