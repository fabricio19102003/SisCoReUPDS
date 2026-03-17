"""
Servicio de exportación a Excel y PDF.
Migrado desde exportar_excel() y exportar_pdf() del script v3.
"""

import io
from datetime import datetime
from collections import defaultdict

from app.services.analizador import sort_key_grupo


TURNOS = {
    "M": "Mañana",
    "T": "Tarde",
    "N": "Noche",
}


def exportar_excel(stats: dict, configs_grupos: dict) -> io.BytesIO:
    """
    Genera el reporte Excel en memoria y retorna un BytesIO.
    """
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

    wb = Workbook()

    titulo_font = Font(name="Arial", bold=True, size=14, color="1F4E79")
    header_font = Font(name="Arial", bold=True, size=10, color="FFFFFF")
    header_fill = PatternFill("solid", fgColor="1F4E79")
    data_font = Font(name="Arial", size=10)
    repitente_fill = PatternFill("solid", fgColor="FFE0E0")
    border = Border(
        left=Side(style="thin", color="B0B0B0"),
        right=Side(style="thin", color="B0B0B0"),
        top=Side(style="thin", color="B0B0B0"),
        bottom=Side(style="thin", color="B0B0B0"),
    )
    center = Alignment(horizontal="center", vertical="center")

    def apply_header(ws, row, cols):
        for col_idx, val in enumerate(cols, 1):
            cell = ws.cell(row=row, column=col_idx, value=val)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = center
            cell.border = border

    def apply_data(ws, row, cols, fill=None):
        for col_idx, val in enumerate(cols, 1):
            cell = ws.cell(row=row, column=col_idx, value=val)
            cell.font = data_font
            cell.border = border
            if fill:
                cell.fill = fill
            if isinstance(val, (int, float)):
                cell.alignment = center

    # === Hoja 1: Resumen ===
    ws1 = wb.active
    ws1.title = "Resumen"
    ws1.cell(row=1, column=1, value="REPORTE DE MATRICULADOS - MEDICINA UPDS").font = titulo_font
    ws1.cell(row=2, column=1, value=f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')}").font = data_font
    ws1.cell(row=3, column=1, value=f"Total estudiantes únicos: {stats['total_estudiantes_unicos']}").font = Font(name="Arial", bold=True, size=11)
    ws1.cell(row=4, column=1, value=f"Repitentes detectados: {len(stats['repitentes'])}").font = Font(name="Arial", bold=True, size=11, color="CC0000")

    row = 6
    apply_header(ws1, row, ["Semestre", "Únicos", "Regulares", "Repitentes", "% Repitentes"])
    row += 1
    for sem in sorted(stats["estudiantes_por_semestre"].keys()):
        unicos = len(stats["estudiantes_por_semestre"][sem])
        rep = len(stats["repitentes_por_semestre"].get(sem, set()))
        reg = unicos - rep
        pct = round(rep / unicos * 100, 1) if unicos > 0 else 0
        apply_data(ws1, row, [f"Semestre {sem}", unicos, reg, rep, f"{pct}%"])
        row += 1

    for col in ["A", "B", "C", "D", "E"]:
        ws1.column_dimensions[col].width = 18

    # === Hoja 2: Grupos por Semestre ===
    ws2 = wb.create_sheet("Grupos por Semestre")
    ws2.cell(row=1, column=1, value="DETALLE POR GRUPO Y SEMESTRE").font = titulo_font
    row = 3

    for sem in sorted(stats["estudiantes_por_semestre"].keys()):
        if sem in configs_grupos:
            _, grupo_a_letras, grupo_info = configs_grupos[sem]
        else:
            grupo_a_letras = {}
            grupo_info = {}

        total_sem = len(stats["estudiantes_por_semestre"][sem])
        rep_sem = len(stats["repitentes_por_semestre"].get(sem, set()))
        ws2.cell(row=row, column=1, value=f"SEMESTRE {sem} — {total_sem} únicos ({total_sem - rep_sem} regulares + {rep_sem} repitentes)")
        ws2.cell(row=row, column=1).font = Font(name="Arial", bold=True, size=11, color="1F4E79")
        row += 1

        apply_header(ws2, row, ["Grupo", "Turno", "Letras", "Matriculados", "Repitentes", "Regulares"])
        row += 1

        grupos_del_sem = {}
        for (s, g), ids in stats["grupo_real_semestre"].items():
            if s == sem:
                grupos_del_sem[g] = ids

        for grupo in sorted(grupos_del_sem.keys(), key=lambda g: sort_key_grupo(g, grupo_info)):
            ids = grupos_del_sem[grupo]
            count = len(ids)
            info = grupo_info.get(grupo)
            rep_g = sum(1 for eid in ids if eid in stats["repitentes_por_semestre"].get(sem, set()))

            if info:
                letras = grupo_a_letras.get(grupo, [])
                letras_str = "+".join(letras)
                turno = info["turno_nombre"]
            else:
                letras_str = grupo
                turno = "?"

            fill = repitente_fill if rep_g > 0 else None
            apply_data(ws2, row, [grupo, turno, letras_str, count, rep_g, count - rep_g], fill)
            row += 1

        row += 1

    for col, w in [("A", 10), ("B", 12), ("C", 10), ("D", 14), ("E", 13), ("F", 12)]:
        ws2.column_dimensions[col].width = w

    # === Hoja 3: Repitentes ===
    ws3 = wb.create_sheet("Repitentes")
    ws3.cell(row=1, column=1, value=f"ESTUDIANTES REPITENTES ({len(stats['repitentes'])})").font = titulo_font
    row = 3
    apply_header(ws3, row, ["ID", "Nombre", "Semestre Principal", "Semestres donde repite", "Todos los semestres"])
    row += 1

    for est in stats["repitentes"]:
        rep_str = ", ".join(f"S{s}" for s in est["semestres_donde_repite"])
        all_str = ", ".join(f"S{s}" for s in est["todos_los_semestres"])
        apply_data(ws3, row, [est["id"], est["nombre"], est["semestre_principal"], rep_str, all_str], repitente_fill)
        row += 1

    for col, w in [("A", 22), ("B", 48), ("C", 20), ("D", 28), ("E", 22)]:
        ws3.column_dimensions[col].width = w

    # === Hoja 4: Origen Repitentes ===
    ws4 = wb.create_sheet("Origen Repitentes")
    ws4.cell(row=1, column=1, value="ORIGEN DE REPITENTES POR SEMESTRE").font = titulo_font
    row = 3
    apply_header(ws4, row, ["Semestre donde repite", "Total repitentes", "Vienen del semestre", "Cantidad"])
    row += 1

    for sem in sorted(stats["repitentes_por_semestre"].keys()):
        ids = stats["repitentes_por_semestre"][sem]
        origenes = defaultdict(int)
        for eid in ids:
            origenes[stats["est_sem_principal"][eid]] += 1
        first = True
        for s_o in sorted(origenes.keys()):
            if first:
                apply_data(ws4, row, [f"Semestre {sem}", len(ids), f"Semestre {s_o}", origenes[s_o]])
                first = False
            else:
                apply_data(ws4, row, ["", "", f"Semestre {s_o}", origenes[s_o]])
            row += 1
        row += 1

    for col, w in [("A", 22), ("B", 18), ("C", 22), ("D", 12)]:
        ws4.column_dimensions[col].width = w

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output


def exportar_pdf(stats: dict, configs_grupos: dict) -> io.BytesIO:
    """
    Genera el reporte PDF en memoria y retorna un BytesIO.
    """
    from reportlab.lib.pagesizes import letter, landscape
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.lib.units import inch

    output = io.BytesIO()

    doc = SimpleDocTemplate(
        output,
        pagesize=landscape(letter),
        leftMargin=0.5 * inch,
        rightMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="TituloReporte", fontName="Helvetica-Bold", fontSize=16, textColor=colors.HexColor("#1F4E79"), spaceAfter=6))
    styles.add(ParagraphStyle(name="Subtitulo", fontName="Helvetica-Bold", fontSize=12, textColor=colors.HexColor("#1F4E79"), spaceAfter=4, spaceBefore=12))
    styles.add(ParagraphStyle(name="Info", fontName="Helvetica", fontSize=10, spaceAfter=2))

    story = []
    AZUL = colors.HexColor("#1F4E79")
    GRIS_CLARO = colors.HexColor("#F2F2F2")
    ROJO_CLARO = colors.HexColor("#FFE0E0")

    header_style = TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), AZUL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, GRIS_CLARO]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ])

    # Portada
    story.append(Paragraph("REPORTE DE MATRICULADOS", styles["TituloReporte"]))
    story.append(Paragraph("Carrera de Medicina - UPDS", styles["Subtitulo"]))
    story.append(Paragraph(f"Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles["Info"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"Total estudiantes únicos: <b>{stats['total_estudiantes_unicos']}</b>", styles["Info"]))
    story.append(Paragraph(f"Repitentes detectados: <b>{len(stats['repitentes'])}</b>", styles["Info"]))
    story.append(Spacer(1, 20))

    # Tabla resumen
    story.append(Paragraph("RESUMEN POR SEMESTRE", styles["Subtitulo"]))
    data = [["Semestre", "Únicos", "Regulares", "Repitentes", "% Repitentes"]]
    for sem in sorted(stats["estudiantes_por_semestre"].keys()):
        u = len(stats["estudiantes_por_semestre"][sem])
        r = len(stats["repitentes_por_semestre"].get(sem, set()))
        pct = f"{r / u * 100:.1f}%" if u > 0 else "0%"
        data.append([f"Semestre {sem}", str(u), str(u - r), str(r), pct])

    t = Table(data, colWidths=[100, 80, 80, 80, 90])
    t.setStyle(header_style)
    story.append(t)

    # Detalle grupos por semestre
    for sem in sorted(stats["estudiantes_por_semestre"].keys()):
        story.append(PageBreak())
        total_sem = len(stats["estudiantes_por_semestre"][sem])
        rep_sem = len(stats["repitentes_por_semestre"].get(sem, set()))
        story.append(Paragraph(f"SEMESTRE {sem} — {total_sem} únicos ({total_sem - rep_sem} reg. + {rep_sem} repit.)", styles["Subtitulo"]))

        if sem in configs_grupos:
            _, grupo_a_letras, grupo_info = configs_grupos[sem]
        else:
            grupo_a_letras = {}
            grupo_info = {}

        data = [["Grupo", "Turno", "Letras", "Matriculados", "Repitentes", "Regulares"]]
        row_fills = []

        grupos_del_sem = {}
        for (s, g), ids in stats["grupo_real_semestre"].items():
            if s == sem:
                grupos_del_sem[g] = ids

        for grupo in sorted(grupos_del_sem.keys(), key=lambda g: sort_key_grupo(g, grupo_info)):
            ids = grupos_del_sem[grupo]
            count = len(ids)
            info = grupo_info.get(grupo)
            rep_g = sum(1 for eid in ids if eid in stats["repitentes_por_semestre"].get(sem, set()))

            turno = info["turno_nombre"] if info else "?"
            letras_str = "+".join(grupo_a_letras.get(grupo, [grupo]))
            data.append([grupo, turno, letras_str, str(count), str(rep_g), str(count - rep_g)])
            row_fills.append(rep_g > 0)

        t = Table(data, colWidths=[60, 80, 60, 90, 80, 80])
        style_cmds = list(header_style.getCommands())
        for i, has_rep in enumerate(row_fills):
            if has_rep:
                style_cmds.append(("BACKGROUND", (0, i + 1), (-1, i + 1), ROJO_CLARO))
        t.setStyle(TableStyle(style_cmds))
        story.append(t)

    # Lista de repitentes
    story.append(PageBreak())
    story.append(Paragraph(f"ESTUDIANTES REPITENTES ({len(stats['repitentes'])})", styles["Subtitulo"]))

    if stats["repitentes"]:
        data = [["ID", "Nombre", "Sem. Principal", "Repite en"]]
        for est in stats["repitentes"]:
            rep_str = ", ".join(f"S{s}" for s in est["semestres_donde_repite"])
            nombre = est["nombre"][:50]
            data.append([est["id"], nombre, str(est["semestre_principal"]), rep_str])

        t = Table(data, colWidths=[130, 250, 90, 100])
        t.setStyle(header_style)
        story.append(t)

    doc.build(story)
    output.seek(0)
    return output
