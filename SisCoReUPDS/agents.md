# Plan de Desarrollo — Sistema de Matriculados UPDS
## Monorepo: React + Python Backend

> **Última actualización:** 2026-03-17
> **Estado actual:** Fase 1 completada (Backend MVP). Próximo paso: Fase 2 (Frontend).

---

## 1. Visión General del Proyecto

El sistema reemplaza el proceso manual de conteo de matriculados en la carrera
de Medicina de la UPDS. Actualmente el personal administrativo trabaja con un
sistema antiguo que genera listas en Excel sin ofrecer reportes ni estadísticas.
Nuestro sistema recibe esos archivos, los analiza automáticamente y presenta
resultados en una interfaz web moderna.

### Qué resuelve

- Eliminación del conteo manual hoja por hoja.
- Identificación automática de semestres usando la malla curricular.
- Fusión de letras de grupo (overflow del sistema antiguo de 50 cupos).
- Detección de estudiantes repitentes/rezagados.
- Generación de reportes exportables (PDF, Excel).
- Historial de análisis para comparar entre períodos.

### Usuarios objetivo

- Personal administrativo de matriculación.
- Dirección de carrera.
- No son usuarios técnicos: la interfaz debe ser simple e intuitiva.

---

## 2. Estructura del Monorepo (Implementada)

```
SisCoReUPDS/
├── README.md
├── agents.md                              # Este archivo (plan del proyecto)
├── analisis_matriculados_v3.py            # Script original (referencia)
├── Malla-curricular-medicina-UPDS.txt     # Malla curricular fuente
│
├── backend/                               # ✅ IMPLEMENTADO
│   ├── requirements.txt                   # Dependencias Python (con versiones fijas)
│   ├── .gitignore
│   ├── uploads/                           # Archivos subidos (gitignored)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                        # Punto de entrada FastAPI + CORS + routers
│   │   ├── config.py                      # Settings con pydantic-settings (.env)
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   └── database.py               # SQLAlchemy engine + session + Base
│   │   ├── models/
│   │   │   ├── __init__.py                # Re-exporta todos los modelos
│   │   │   ├── periodo.py                 # Periodo académico
│   │   │   ├── malla.py                   # MallaMateria
│   │   │   ├── grupo_config.py            # GrupoConfig (letras por semestre)
│   │   │   └── analisis.py                # Analisis + DetalleSemestre + DetalleGrupo + Repitente
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── periodo.py                 # PeriodoCreate, PeriodoResponse
│   │   │   ├── malla.py                   # MallaMateriaResponse, MallaUploadResponse
│   │   │   ├── grupo_config.py            # GrupoConfigTextoCreate, BulkCreate
│   │   │   └── reporte.py                 # AnalisisCompletoResponse, RepitienteResponse, etc.
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── parser_excel.py            # parsear_hoja() + procesar_excel()
│   │   │   ├── analizador.py              # generar_estadisticas() + config grupos
│   │   │   ├── malla_service.py           # Carga JSON → BD, consulta malla
│   │   │   └── exportador.py              # Exportar PDF/Excel en memoria (BytesIO)
│   │   └── api/
│   │       ├── __init__.py
│   │       ├── periodos.py                # CRUD períodos
│   │       ├── malla.py                   # GET malla + upload JSON/TXT
│   │       ├── config_grupos.py           # Config texto + bulk + delete
│   │       ├── upload.py                  # POST upload Excel → análisis completo
│   │       └── reportes.py                # GET análisis + semestre + repitentes + exportar
│   └── tests/
│       └── fixtures/
│           └── matriculados_test.xlsx     # Excel de prueba (31 hojas, generado)
│
├── frontend/                              # 🔲 PENDIENTE (Fase 2)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/
│       │   └── client.ts
│       ├── components/
│       │   ├── Layout/
│       │   ├── Upload/
│       │   ├── Dashboard/
│       │   ├── Reportes/
│       │   └── Config/
│       ├── pages/
│       │   ├── HomePage.tsx
│       │   ├── AnalisisPage.tsx
│       │   ├── RepitentesPage.tsx
│       │   └── ConfigPage.tsx
│       ├── hooks/
│       ├── types/
│       └── utils/
│
└── shared/
    └── malla.json                         # Copia de la malla curricular
```

### Por qué monorepo

- Un solo repositorio Git para todo el proyecto.
- Facilita el despliegue: ambos servicios se versionan juntos.
- Comparten archivos como la malla curricular.
- Para un equipo pequeño (1-3 personas) es la estructura más práctica.

---

## 3. Elección de Tecnologías

### Backend: FastAPI (Python) — ✅ Implementado

**Por qué FastAPI sobre Flask o Django:**

- Validación automática de datos con Pydantic (muy útil para los schemas
  de configuración de grupos y respuestas de la API).
- Documentación interactiva generada automáticamente (Swagger UI en /docs).
- Soporte nativo para async, útil cuando se procesan archivos Excel pesados.
- Más moderno y con mejor rendimiento que Flask para APIs REST.
- Tipado estricto que reduce errores.

**Dependencias instaladas (requirements.txt):**

```
fastapi==0.115.6
uvicorn[standard]==0.34.0
python-multipart==0.0.20
pandas==2.2.3
openpyxl==3.1.5
reportlab==4.2.5
sqlalchemy==2.0.36
alembic==1.14.1
pydantic-settings==2.7.1
```

### Frontend: React + TypeScript + Vite — 🔲 Pendiente

**Stack planificado:**

- **Vite** como bundler (rápido, configuración mínima).
- **TypeScript** para tipado (reduce bugs en la lógica de presentación).
- **Tailwind CSS** para estilos (productivo, sin pelear con CSS).
- **Recharts o Chart.js** para gráficos.
- **React Router** para navegación.
- **TanStack Query (React Query)** para manejo de estado servidor.
- **Axios** o fetch nativo para las llamadas HTTP.

### Base de datos: SQLite — ✅ Implementado

- No requiere instalar un servidor de BD aparte.
- Suficiente para un sistema con pocos usuarios concurrentes.
- Si en el futuro necesitas escalar, migrar a PostgreSQL con SQLAlchemy
  es cambiar una línea de configuración.
- Archivo: `backend/siscore.db` (auto-generado al iniciar).

---

## 4. Diseño de la Base de Datos (Implementado)

### Tablas implementadas

**periodos**: Cada período académico (ej: 1/2026, 2/2026).
- id, nombre, fecha_inicio, fecha_fin, activo, created_at

**malla_materias**: La malla curricular cargada.
- id, codigo (unique, indexed), nombre, semestre, creditos, HT, HP

**config_grupos**: La configuración de letras por semestre y período.
- id, periodo_id (FK), semestre, nombre_grupo, turno, letra_principal,
  letras_overflow (JSON), letras (JSON - todas las letras combinadas)

**analisis**: Cada vez que se sube y procesa un archivo Excel.
- id, periodo_id (FK), fecha_analisis, archivo_nombre, total_unicos,
  total_repitentes, materias_no_encontradas (JSON)

**analisis_detalle_semestre**: Resumen por semestre de cada análisis.
- id, analisis_id (FK), semestre, unicos, regulares, repitentes

**analisis_detalle_grupo**: Detalle por grupo.
- id, analisis_id (FK), semestre, nombre_grupo, turno, matriculados,
  repitentes_count, letras_desglose (JSON)

**repitentes**: Lista de repitentes detectados.
- id, analisis_id (FK), estudiante_id, nombre, semestre_principal,
  semestres_donde_repite (JSON), todos_los_semestres (JSON)

### Relaciones

- Periodo → tiene muchos GrupoConfig (cascade delete)
- Periodo → tiene muchos Analisis (cascade delete)
- Analisis → tiene muchos DetalleSemestre, DetalleGrupo, Repitente (cascade delete)

---

## 5. API Implementada (Endpoints)

### Períodos

```
GET    /api/periodos/              → Lista todos los períodos
POST   /api/periodos/              → Crear período {nombre, fecha_inicio?, fecha_fin?, activo?}
GET    /api/periodos/{id}          → Obtener período por ID
DELETE /api/periodos/{id}          → Eliminar período (cascade)
```

### Malla curricular

```
GET    /api/malla/                 → Lista todas las materias (ordenadas por semestre)
POST   /api/malla/upload           → Subir malla (.json o .txt) → reemplaza la existente
```

### Configuración de grupos

```
GET    /api/periodos/{id}/config-grupos/         → Lista config del período
POST   /api/periodos/{id}/config-grupos/         → Crear config con formato texto
       Body: {semestre: int, config_texto: "M1(A)=(Q)\nT1(B)=(O)"}
POST   /api/periodos/{id}/config-grupos/bulk     → Config masiva (múltiples semestres)
       Body: {configs: [{semestre, config_texto}, ...]}
DELETE /api/periodos/{id}/config-grupos/{semestre} → Eliminar config de un semestre
```

### Subida y análisis

```
POST   /api/upload                 → Subir Excel + periodo_id (multipart/form-data)
       Retorna: {analisis_id, total_registros_procesados, total_estudiantes_unicos,
                 total_repitentes, materias_no_encontradas, semestres_detectados}
```

### Reportes y consultas

```
GET    /api/analisis/              → Lista todos los análisis (con periodo_nombre)
GET    /api/analisis/{id}          → Análisis completo (resumen + semestres + grupos + repitentes)
GET    /api/analisis/{id}/semestre/{sem} → Detalle de un semestre (resumen + grupos + repitentes)
GET    /api/analisis/{id}/repitentes     → Repitentes con filtros:
       ?semestre_principal=N  ?semestre_repite=N  ?buscar=texto
GET    /api/analisis/{id}/exportar?formato=excel|pdf → Descarga archivo Excel o PDF
```

### Utilidad

```
GET    /                           → Info de la API
GET    /api/health                 → Health check
GET    /docs                       → Swagger UI (documentación interactiva)
```

---

## 6. Flujo Principal de Uso

```
1. Admin abre el sistema web
2. Selecciona o crea un período (ej: "1/2026")
3. Configura las letras de grupo para cada semestre del período
   (interfaz tipo formulario con campos dinámicos)
4. Sube el archivo Excel de matriculados
5. El backend procesa el archivo:                          ← ✅ Implementado y probado
   a. Parsea cada hoja → extrae código, letra, estudiantes
   b. Cruza códigos con la malla → determina semestres
   c. Aplica configuración de grupos → fusiona letras
   d. Detecta repitentes → compara semestres por estudiante
   e. Genera estadísticas → guarda en BD
6. El frontend muestra el dashboard con:                   ← 🔲 Pendiente
   - Resumen general (total únicos, repitentes)
   - Gráfico de barras por semestre
   - Tabla de grupos por semestre con desglose
   - Sección de repitentes con filtros
7. Admin puede exportar a PDF o Excel desde la interfaz    ← ✅ Backend listo
```

---

## 7. Componentes Clave del Frontend (Pendiente)

### Página de Dashboard (vista principal post-análisis)

- Tarjetas resumen: total estudiantes, total repitentes, total semestres.
- Gráfico de barras: estudiantes por semestre (regulares vs repitentes).
- Gráfico circular: distribución por turno (Mañana/Tarde/Noche).
- Selector de período para comparar entre análisis.

### Página de Carga de Archivo

- Zona de drag & drop para el Excel.
- Barra de progreso durante el procesamiento.
- Preview rápido de las primeras hojas detectadas.
- Botón de confirmar análisis.

### Página de Configuración de Grupos

- Un accordion/tab por semestre.
- Dentro de cada semestre: formulario con filas dinámicas.
- Cada fila: Nombre grupo (M1, T1, etc.) + Letra principal + Letras overflow.
- Botón de agregar/eliminar filas.
- Guardar configuración por período.

### Página de Repitentes

- Tabla con búsqueda y filtros (por semestre principal, por semestre donde
  repite, por nombre).
- Exportar la tabla filtrada.
- Vista detallada al hacer clic en un estudiante.

---

## 8. Consideraciones Técnicas Importantes

### Procesamiento de archivos pesados

El Excel puede tener más de 500 hojas. Hay que considerar:

- Procesar el archivo en el backend de forma asíncrona. El frontend sube
  el archivo, recibe un ID de tarea, y consulta el estado por polling
  o WebSocket.
- No cargar todo el Excel en memoria de golpe si es muy grande. Usar
  openpyxl en modo read_only si es necesario.
- Mostrar progreso al usuario: "Procesando hoja 234 de 597..."

> **Nota:** La implementación actual procesa de forma síncrona. Para archivos
> muy grandes (500+ hojas) se puede migrar a procesamiento async con tareas
> en background (usando BackgroundTasks de FastAPI o Celery).

### Normalización de códigos de materia — ✅ Implementado

El sistema antiguo tiene inconsistencias (SPC vs SCP, espacios vs guiones).
La función de normalización está en `parser_excel.py`:
- Espacios → guiones (ej: "MRF 0100" → "MRF-0100")
- Corrección SPC → SCP automática

### La malla curricular puede cambiar

Aunque no cambia frecuentemente, debe ser editable desde la interfaz
o al menos recargable subiendo un nuevo JSON.

> **Implementado:** Endpoint `POST /api/malla/upload` que acepta .json o .txt.
> Al subir una nueva malla, reemplaza la existente en la BD.

### Validación robusta del Excel — ✅ Implementado

El parser es tolerante a:

- Hojas vacías o con formato inesperado (skip silencioso, retorna None).
- Variaciones en las posiciones de las celdas.
- Caracteres especiales en nombres (portugués, español).
- IDs de estudiantes en formatos mixtos (con y sin guiones, prefijos).
- Validación de extensión (.xlsx/.xls) y tamaño máximo (50 MB configurable).

### Seguridad básica — 🔲 Pendiente

Aunque es un sistema interno, implementar al menos:

- Autenticación simple (usuario/contraseña). Puede ser un login básico
  con JWT, no necesita ser complejo.
- No exponer el sistema a Internet sin protección.
- Validar los archivos subidos (solo .xlsx, tamaño máximo). ← ✅ Hecho
- Sanitizar nombres de archivos.

---

## 9. Plan de Desarrollo por Fases

### Fase 1 — MVP Backend ✅ COMPLETADA (2026-03-17)

- [x] Inicializar monorepo con estructura de carpetas.
- [x] Configurar FastAPI con la estructura base (main.py, config.py, CORS).
- [x] Migrar la lógica del script v3 a los services del backend:
  - [x] parser_excel.py (parsear_hoja, procesar_excel)
  - [x] analizador.py (generar_estadisticas, determinar_semestre_principal, parsear_config_texto)
  - [x] malla_service.py (cargar_malla_desde_json, obtener_malla_dict)
  - [x] exportador.py (exportar_excel, exportar_pdf — generan BytesIO en memoria)
- [x] Implementar endpoints de upload y análisis.
- [x] Implementar endpoint de exportación PDF/Excel (StreamingResponse).
- [x] Configurar SQLite con SQLAlchemy (7 tablas, relaciones con cascade).
- [x] Implementar endpoints de períodos, malla, configuración de grupos.
- [x] Crear archivo Excel de prueba (31 hojas, 50 estudiantes simulados).
- [x] Probar flujo completo: período → malla → config → upload → análisis → exportar.
- [ ] Escribir tests unitarios para el parser y el analizador.

**Resultados de la prueba del flujo:**
- Período "1/2026" creado correctamente.
- Malla: 76 materias en 10 semestres cargadas.
- Config grupos: 63 grupos en 7 semestres (formato texto del script).
- Upload: 31 hojas procesadas, 45 estudiantes únicos, 35 repitentes.
- Consultas: análisis completo, filtros de repitentes, detalle por semestre.
- Exportación: Excel (9.8 KB) y PDF (10.2 KB) generados correctamente.

### Fase 2 — MVP Frontend 🔲 PENDIENTE

- [ ] Inicializar proyecto React con Vite + TypeScript + Tailwind.
- [ ] Crear layout base (sidebar, header).
- [ ] Página de carga de archivo con drag & drop.
- [ ] Dashboard con resumen y gráficos básicos.
- [ ] Tabla de detalle por semestre y grupo.
- [ ] Tabla de repitentes con búsqueda.
- [ ] Botones de exportación.

### Fase 3 — Configuración y Refinamiento 🔲 PENDIENTE

- [ ] Interfaz de configuración de grupos por semestre.
- [ ] Gestión de períodos.
- [ ] Gestión de malla curricular.
- [ ] Autenticación básica.
- [ ] Historial de análisis.

### Fase 4 — Pulido y Despliegue 🔲 PENDIENTE

- [ ] Manejo de errores amigable en el frontend.
- [ ] Loading states y feedback visual.
- [ ] Responsive design (por si lo ven en tablet).
- [ ] Documentación de uso para el personal.
- [ ] Despliegue en servidor local o nube.

---

## 10. Cómo Ejecutar el Backend

```bash
# Desde la raíz del proyecto
cd backend

# Crear y activar entorno virtual (solo la primera vez)
python -m venv .venv
source .venv/Scripts/activate    # Windows (Git Bash)
# source .venv/bin/activate      # Linux/Mac

# Instalar dependencias (solo la primera vez)
pip install -r requirements.txt

# Ejecutar el servidor
uvicorn app.main:app --reload --port 8000

# Abrir documentación interactiva
# http://localhost:8000/docs
```

### Flujo de prueba rápida con curl

```bash
# 1. Crear período
curl -X POST http://localhost:8000/api/periodos/ \
  -H "Content-Type: application/json" \
  -d '{"nombre": "1/2026"}'

# 2. Subir malla curricular
curl -X POST http://localhost:8000/api/malla/upload \
  -F "archivo=@Malla-curricular-medicina-UPDS.txt"

# 3. Configurar grupos (ejemplo semestre 1)
curl -X POST http://localhost:8000/api/periodos/1/config-grupos/ \
  -H "Content-Type: application/json" \
  -d '{"semestre": 1, "config_texto": "M1(A)=(Q)\nM2(D)=(R)\nT1(B)=(O)\nN1(C)=(T)"}'

# 4. Subir Excel y analizar
curl -X POST http://localhost:8000/api/upload \
  -F "archivo=@archivo_matriculados.xlsx" \
  -F "periodo_id=1"

# 5. Ver análisis completo
curl http://localhost:8000/api/analisis/1

# 6. Exportar a Excel
curl -o reporte.xlsx "http://localhost:8000/api/analisis/1/exportar?formato=excel"
```

---

## 11. Errores Comunes a Evitar

**No reinventar lo que ya funciona.** La lógica del script v3 ya está
probada con datos reales. ~~Migrar esas funciones al backend tal cual,
solo reorganizando en módulos.~~ ✅ Ya migrado.

**No sobre-diseñar la base de datos.** Para la primera versión, guardar
los resultados del análisis como JSON en una columna es perfectamente
válido. Normalizar solo lo que necesites consultar con filtros SQL.

**No hacer el frontend antes que el backend.** ✅ Backend completado primero.

**No ignorar los casos borde del Excel.** Cada semestre puede traer
sorpresas en el formato. Hacer que el parser loguee advertencias en
lugar de fallar silenciosamente.

**No olvidar que los usuarios no son técnicos.** Cada error debe mostrarse
con un mensaje claro en español. "El archivo no tiene el formato esperado
en la hoja 345" es mejor que un stack trace.

---

## 12. Resumen de Decisiones Clave

| Decisión | Elección | Razón | Estado |
|----------|----------|-------|--------|
| Monorepo vs repos separados | Monorepo | Proyecto pequeño, equipo pequeño | ✅ |
| Framework backend | FastAPI | Tipado, docs auto, async, moderno | ✅ |
| Framework frontend | React + Vite | Ecosistema maduro, tipado con TS | 🔲 |
| Base de datos | SQLite | Cero configuración, suficiente para el volumen | ✅ |
| Estilos CSS | Tailwind CSS | Productividad, consistencia visual | 🔲 |
| State management | React Query | Cache, loading, errores automáticos | 🔲 |
| Autenticación | JWT simple | Suficiente para sistema interno | 🔲 |
| Exportación | ReportLab + openpyxl | Ya probados, generan en memoria (BytesIO) | ✅ |
| Config grupos | Formato texto + BD | Compatible con formato del script original | ✅ |

---

## 13. Notas Técnicas de Implementación

### Migración del script v3 → services

| Función original | Archivo destino | Notas |
|---|---|---|
| `parsear_hoja()` | `services/parser_excel.py` | Sin cambios en lógica |
| `procesar_excel()` | `services/parser_excel.py` | Sin cambios en lógica |
| `cargar_malla()` | `services/malla_service.py` | Ahora carga desde BD, no archivo |
| `parsear_config_grupos()` | `services/analizador.py` | Renombrada a `parsear_config_texto()` |
| `cargar_todas_las_configs()` | `services/analizador.py` | Ahora lee desde BD: `obtener_configs_grupos()` |
| `determinar_semestre_principal()` | `services/analizador.py` | Sin cambios en lógica |
| `generar_estadisticas()` | `services/analizador.py` | Sin cambios en lógica |
| `exportar_excel()` | `services/exportador.py` | Retorna BytesIO en vez de guardar archivo |
| `exportar_pdf()` | `services/exportador.py` | Retorna BytesIO en vez de guardar archivo |
| `CONFIG_GRUPOS_POR_SEMESTRE` | BD: `config_grupos` | Configurable por período via API |
| `seleccionar_archivo()` | `api/upload.py` | Reemplazado por endpoint HTTP |
| `imprimir_reporte()` | No migrado | Reemplazado por endpoints JSON |

### Diferencias clave entre script y API

1. **Malla**: antes se leía de archivo JSON, ahora se sube via API y se guarda en BD.
2. **Config grupos**: antes era un dict hardcodeado, ahora es configurable por período.
3. **Exportación**: antes guardaba archivos en disco, ahora genera en memoria y envía como StreamingResponse.
4. **Resultados**: antes se imprimían en consola, ahora se guardan en BD y se consultan via API.
5. **Archivo Excel**: antes quedaba en disco, ahora se elimina tras procesar (temporal).
