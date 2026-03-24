# PRD - Features basadas en Excel de inscritos

## 1. Objetivo

Definir la ampliacion funcional de `SisCoReUPDS` para incorporar el archivo `LISTA ESTUDIANTES REGISTRADOS.xlsx` como nueva fuente operativa de inscripcion, permitiendo consolidar un padron limpio de inscritos, visualizar la carga academica por estudiante, analizar la demanda real por materia/grupo y conciliar esa informacion con los analisis ya existentes del sistema.

## 2. Problema de negocio

Hoy `SisCoReUPDS` procesa archivos de matriculados orientados al analisis por malla, semestre, grupo y repitencia. Eso resuelve el conteo y la lectura academica de la demanda, pero no cubre con suficiente detalle la dimension operativa de inscripcion nominal.

Con el nuevo Excel aparecen necesidades que el flujo actual no resuelve por completo:

- Identificar estudiantes concretos con sus datos de contacto y trazabilidad de registros.
- Consolidar una unica vista confiable de inscripcion pese a duplicados y problemas de calidad de datos.
- Entender la carga academica real por estudiante, no solo agregados por semestre/grupo.
- Medir demanda por materia y grupo con base transaccional.
- Cruzar inscripcion registrada vs analisis academico ya calculado.
- Visualizar beneficios/becas, turnos y comportamiento temporal de registros.

El problema central es de conciliacion y calidad de informacion: existe una fuente operativa rica, pero su estructura y suciedad impiden convertirla directamente en reportes confiables para gestion academica y administrativa.

## 3. Alcance

Este documento cubre la incorporacion funcional del Excel `LISTA ESTUDIANTES REGISTRADOS.xlsx` dentro de `SisCoReUPDS` para soportar:

- Ingesta y normalizacion del archivo fuente.
- Limpieza y deduplicacion de registros de inscripcion.
- Construccion de un padron nominal de estudiantes inscritos.
- Visualizacion de carga por estudiante.
- Reporte academico por materia y grupo.
- Buscador avanzado de estudiantes.
- Distribucion por turnos.
- Mapa de beneficios/becas.
- Timeline de registros por fecha.
- Conciliacion entre registros operativos y analisis de demanda real por materia.
- Integracion con periodo academico y estructuras ya existentes del sistema.

Incluye especificacion funcional, modelo conceptual, reglas de negocio y roadmap.

## 4. Fuera de alcance

- Reemplazo del pipeline actual de analisis de matriculados.
- Automatizacion de lectura desde sistemas externos o APIs institucionales.
- Correccion manual masiva dentro del sistema de errores de origen del Excel.
- Motor de matching probabilistico avanzado entre identidades ambiguas.
- Auditoria legal o validacion documental de beneficios/becas.
- Gestion transaccional de inscripcion o edicion de registros desde la UI.
- Autenticacion/autorizacion avanzada si aun no existe en el producto.
- Reporteria financiera o cobranza.
- Integracion con horarios, asistencia o notas finales.

## 5. Usuarios y casos de uso

| Usuario | Necesidad principal | Casos de uso |
|---|---|---|
| Personal administrativo | Ver padron limpio y estado operativo de inscritos | Buscar estudiante, validar registros, exportar listados, detectar duplicados |
| Direccion de carrera | Entender demanda academica real | Ver demanda por materia/grupo, distribucion por turnos, comparativas por periodo |
| Coordinacion academica | Revisar apertura de grupos y carga | Analizar concentracion por grupo, materia, turno y docente |
| Secretaria/registro | Conciliar informacion entre reportes | Contrastar inscritos nominales vs analisis agregados |
| Soporte/analista | Detectar calidad de datos | Ver errores de encoding, duplicados, faltantes y anomalias |

Casos de uso clave:

- Consultar todos los estudiantes inscritos de un periodo con busqueda avanzada.
- Ver la carga academica completa de un estudiante.
- Detectar cuantos estudiantes estan inscritos en una materia y como se distribuyen por grupo/turno.
- Identificar beneficios otorgados y su cobertura.
- Analizar el comportamiento temporal de registros.
- Conciliar diferencias entre inscripcion operativa y analisis de demanda academica.

## 6. Modelo conceptual de datos

| Entidad | Descripcion | Campos conceptuales |
|---|---|---|
| Periodo | Contexto temporal de la carga | id, nombre, fechas, estado |
| Lote de importacion | Ejecucion de carga del Excel | id, periodo_id, archivo, fecha_proceso, hoja, total_filas, total_validas, total_descartadas |
| Registro crudo | Fila original del Excel | fila_origen, columnas originales, hash_fila, observaciones_calidad |
| Registro normalizado | Inscripcion limpia utilizable | inscripcion_id, estudiante_id logico, sigla_materia, grupo, turno, fecha_registro, estado_dedupe |
| Estudiante | Persona inscrita consolidada | inscripcion_id base, apellidos, nombres, CI, genero, celular, correo |
| Materia | Asignatura reportada | sigla, nombre_materia, malla_semestre, carrera |
| Grupo aperturado | Unidad operativa de cursado | id_grupo_aperturado, grupo, turno, sistema_ensenanza, sistema_estudio, docente, aula |
| Inscripcion academica | Relacion estudiante-materia-grupo | estudiante, materia, grupo, fecha_registro, beneficio |
| Beneficio | Clasificacion de beca/beneficio | tipo_beneficio, cobertura, observaciones |
| Incidencia de calidad | Problema detectado | tipo, severidad, fila, campo, valor_original, valor_normalizado |

Claves conceptuales recomendadas:

- Clave tecnica de fila: `lote_importacion + fila_origen`
- Clave candidata de inscripcion deduplicada: `ID de Inscripcion + Sigla Materia + Grupo`
- Clave de conciliacion alternativa: `ID de Inscripcion + Sigla Materia`
- Clave de estudiante consolidado: priorizar `CI del Estudiante`; fallback controlado a combinacion de nombre completo + celular/correo cuando falte CI
- Clave de grupo operativo: `ID Grupo Aperturado`

## 7. Pipeline de procesamiento recomendado

- `Ingesta`: leer hoja correcta, detectar encabezado real en fila 7, validar estructura y registrar lote.
- `Estandarizacion`: renombrar columnas, tipar fechas/textos/nulos, ignorar C e I como vacias estructurales.
- `Limpieza`: corregir encoding, normalizar espacios, CI, correos, celulares, nombres, siglas, grupos, turnos y beneficios.
- `Perfilado/calidad`: medir completitud y detectar duplicados por distintas claves.
- `Deduplicacion`: consolidar registros exactos, conflictivos y revisables manteniendo trazabilidad.
- `Enriquecimiento`: cruzar `sigla materia` con malla actual, derivar semestre y preparar metricas.
- `Persistencia`: guardar lote, crudos, limpios, incidencias y agregados.
- `Exposicion`: publicar vistas para padron, carga, materias/grupos, beneficios, timeline y conciliacion.

## 8. Reglas de negocio

- Solo se procesa la hoja `ACA-EstudiantesRegistradosxModu`.
- La fila `7` es el encabezado oficial.
- El archivo debe cargarse asociado a un periodo del sistema.
- `CI del Estudiante` es la identidad preferente; si falta, usar identificador logico temporal.
- Columnas C e I vacias no invalidan el archivo.
- Problemas de encoding se corrigen ANTES de deduplicar o conciliar.
- Campos minimos para registro usable: `ID de Inscripcion`, `Sigla Materia`, `Grupo` o `ID Grupo Aperturado`.
- Duplicado exacto: misma clave y mismos atributos relevantes; se conserva uno.
- Duplicado `inscripcion + materia + mismo grupo`: se conserva el mas completo y se trazan los fusionados.
- Duplicado `inscripcion + materia + distinto grupo`: conflicto revisable salvo regla institucional explicita.
- Si una `sigla materia` no existe en la malla, no se descarta: queda como "no conciliada".
- Toda metrica sensible debe poder distinguir vista `bruta` vs `limpia`.

## 9. Especificacion de features

### 9.1 Padron limpio de inscritos

- Objetivo: lista nominal confiable y deduplicada por periodo.
- Inputs: lote procesado + periodo.
- Outputs: estudiantes unicos, detalle de identidad, estado de calidad.
- Filtros: periodo, nombre, CI, inscripcion, genero, beneficio, turno, estado de calidad.
- KPIs: total unicos, inscripciones limpias, porcentaje con CI/correo/celular, duplicados fusionados, conflictos pendientes.

### 9.2 Malla de carga por estudiante

- Objetivo: ver materias inscritas por estudiante y su distribucion por malla.
- Outputs: perfil con materias, semestre conciliado, grupo, turno, docente, beneficio, estado de conciliacion.
- Edge cases: materias no conciliadas, duplicados conflictivos, estudiantes sin CI.

### 9.3 Reporte academico por materia/grupo

- Objetivo: medir demanda operativa real por materia y grupo.
- Outputs: ranking por materia, detalle por grupo, docente, aula, turno.
- Metricas: inscritos unicos por materia, por grupo, grupos por materia, diferencias con analisis previo.

### 9.4 Buscador avanzado de estudiantes

- Objetivo: localizar rapido cualquier estudiante o inscripcion.
- Busquedas: nombre, apellidos, CI, inscripcion, correo, celular, materia, sigla, grupo, docente.
- Requisito clave: busqueda tolerante a acentos/encoding corregido.

### 9.5 Distribucion por turnos

- Objetivo: entender reparto de la inscripcion entre manana/tarde/noche.
- Segmentacion: periodo, materia, grupo, carrera, beneficio.
- Metricas: cantidad y porcentaje por turno, materias con mayor concentracion.

### 9.6 Mapa de beneficios/becas

- Objetivo: visualizar cobertura y distribucion de beneficios.
- Outputs: catalogo detectado, conteo por tipo, cruce con materia/turno/periodo, vista nominal.
- Metricas: total con beneficio, porcentaje sobre inscritos, distribucion por tipo.

### 9.7 Timeline de registros

- Objetivo: analizar comportamiento temporal de inscripcion.
- Outputs: serie diaria por `Fecha de Registro`, picos por rango, segmentacion por materia/grupo/turno.
- Uso: detectar ventanas pico, registros tardios y carga operativa.

### 9.8 Conciliacion entre reportes

- Objetivo: unir la fuente nominal con el analisis academico actual.
- Outputs: diferencias por materia, grupo, semestre y turno.
- Causas probables: duplicados, materias no conciliadas, reglas distintas, diferencias de fuente.

### 9.9 Analisis de demanda real por materia

- Objetivo: convertir la inscripcion nominal limpia en insumo para decisiones operativas.
- Outputs: ranking de materias, demanda por grupo/turno, tendencia por periodo cuando exista historico.

## 10. Integracion con SisCoRe actual

- No se reemplaza el flujo actual; se complementa.
- El `periodo` sigue siendo el punto de union principal.
- La `malla curricular` actual es la referencia academica oficial.
- Recomendacion: mantener datasets separados para analisis academico actual, inscripciones operativas normalizadas y capa de conciliacion.
- Navegacion sugerida en frontend: modulo `Inscritos` con submodulos `Padron`, `Carga`, `Materias/Grupos`, `Beneficios`, `Timeline`, `Conciliacion`.

## 11. Requerimientos no funcionales

- Trazabilidad completa desde fila original a registro consolidado.
- Reproceso idempotente por lote.
- Auditoria de deduplicaciones e incidencias.
- Soportar al menos aproximadamente 20 mil filas por archivo sin degradacion seria.
- Busquedas y filtros fluidos.
- Lenguaje claro para personal no tecnico.
- Separacion estricta entre datos crudos, normalizados y reportables.
- Proteccion de datos personales: `CI`, correo, celular.
- Reglas de limpieza y deduplicacion versionables.

## 12. Riesgos y decisiones abiertas

- Duplicados conflictivos pueden inflar metricas si se resuelven mal.
- Encoding roto puede romper matching por nombre, materia o beneficio.
- `ID de Inscripcion` puede no ser identidad estable en todos los casos.
- Materias no conciliadas afectan reportes por semestre.
- La conciliacion puede mostrar brechas dificiles de explicar si no se define una metrica oficial.

Decisiones abiertas:

- Regla oficial cuando `ID de Inscripcion + Sigla Materia` aparece en grupos distintos.
- Catalogo oficial de beneficios/becas.
- Jerarquia entre `Grupo` e `ID Grupo Aperturado`.
- Fuente oficial para reporting institucional: analisis actual, nueva fuente limpia o ambas.

## 13. Roadmap por fases

### Fase 1 - Ingesta y calidad base

- Importacion del Excel.
- Validacion estructural.
- Normalizacion.
- Correccion de encoding.
- Deteccion de duplicados.
- Padron limpio inicial.

### Fase 2 - Explotacion nominal

- Buscador avanzado.
- Detalle de estudiante.
- Carga academica.
- Reporte por materia/grupo.
- Distribucion por turnos.

### Fase 3 - Analitica extendida

- Mapa de beneficios.
- Timeline de registros.
- Comparativas por periodos sobre esta fuente.

### Fase 4 - Conciliacion institucional

- Tablero de conciliacion.
- Diferencias por materia/grupo/semestre.
- Causas probables.
- Exportables consolidados.

### Fase 5 - Refinamiento

- Versionado de reglas.
- Documentacion operativa.
- Catalogo validado de beneficios.
- Mejoras de UX/performance.

## 14. Criterios de aceptacion

- El sistema procesa `LISTA ESTUDIANTES REGISTRADOS.xlsx` detectando hoja y encabezado correctos.
- Registra filas totales, validas, descartadas y observadas.
- Detecta y clasifica duplicados sin perder trazabilidad.
- Corrige o marca incidencias de encoding.
- Expone un padron limpio por periodo con filtros y busqueda.
- Cada estudiante tiene vista de detalle con materias inscritas.
- Existe reporte por materia/grupo, distribucion por turnos, beneficios y timeline.
- Existe conciliacion con analisis actuales por materia y, cuando aplique, por grupo/semestre.
- La carga puede repetirse por periodo sin perder historico de lotes.
