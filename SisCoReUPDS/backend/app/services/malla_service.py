"""
Servicio para gestionar la malla curricular.
Migrado desde cargar_malla() del script v3.
"""

import json
from sqlalchemy.orm import Session

from app.models.malla import MallaMateria


def cargar_malla_desde_json(contenido: str, db: Session) -> dict:
    """
    Parsea el JSON de la malla curricular y lo guarda en la BD.
    Retorna estadísticas de la carga.
    """
    contenido = contenido.replace('"CR: 2"', '"CR": 2')
    data = json.loads(contenido)

    # Limpiar malla existente
    db.query(MallaMateria).delete()

    total = 0
    semestres_set = set()

    for sem in data["semestres"]:
        for mat in sem["materias"]:
            codigo = mat.get("codigo")
            if codigo is None:
                continue

            codigo_norm = codigo.strip().replace(" ", "-")
            semestres_set.add(sem["semestre"])

            materia = MallaMateria(
                codigo=codigo_norm,
                nombre=mat["nombre"],
                semestre=sem["semestre"],
                creditos=mat["CR"],
                HT=mat.get("HT", 0),
                HP=mat.get("HP", 0),
            )
            db.add(materia)
            total += 1

    db.commit()

    return {
        "total_materias": total,
        "semestres": len(semestres_set),
        "mensaje": f"Malla cargada: {total} materias en {len(semestres_set)} semestres",
    }


def obtener_malla_dict(db: Session) -> dict:
    """
    Retorna la malla como diccionario {codigo_normalizado -> info}
    para usar en el procesamiento de Excel.
    """
    materias = db.query(MallaMateria).all()
    malla = {}
    for mat in materias:
        malla[mat.codigo] = {
            "semestre": mat.semestre,
            "nombre_malla": mat.nombre,
            "creditos": mat.creditos,
            "HT": mat.HT,
            "HP": mat.HP,
        }
    return malla


def obtener_todas_materias(db: Session) -> list[MallaMateria]:
    return db.query(MallaMateria).order_by(MallaMateria.semestre, MallaMateria.codigo).all()
