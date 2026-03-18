# Plan de Desarrollo — Sistema de Matriculados UPDS
## Monorepo: React + Python Backend

> **Última actualización:** 2026-03-18
> **Estado actual:** Fase 1 y Fase 2 completadas (Backend + Frontend MVP). Próximo paso: Fase 3 (Refinamiento).

---

## 1. Visión General del Proyecto

El sistema reemplaza el proceso manual de conteo de matriculados en la carrera
de Medicina de la UPDS. El personal administrativo trabaja con un sistema antiguo
que genera listas en Excel sin ofrecer reportes ni estadísticas. SisCoRe recibe
esos archivos, los analiza automáticamente y presenta resultados en una interfaz
web moderna con gráficos, tablas y exportación a PDF/Excel.

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

## 2. Estructura del Monorepo

```
SisCoReUPDS/
├── agents.md                              # Este archivo (plan del proyecto)
├── analisis_matriculados_v3.py            # Script original (referencia)
├── Malla-curricular-medicina-UPDS.txt     # Malla curricular fuente (JSON)
│
├── backend/                               # ✅ IMPLEMENTADO
│   ├── .env                               # DATABASE_URL PostgreSQL (gitignored)
│   ├── requirements.txt                   # Dependencias Python
│   ├── uploads/                           # Archivos subidos (temporal, gitignored)
│   ├── app/
│   │   ├── main.py                        # FastAPI + CORS + routers + carga malla auto
│   │   ├── config.py                      # Settings (.env) + ruta malla
│   │   ├── db/
│   │   │   └── database.py               # SQLAlchemy engine (PostgreSQL/SQLite)
│   │   ├── models/
│   │   │   ├── periodo.py                 # Periodo académico
│   │   │   ├── malla.py                   # MallaMateria
│   │   │   ├── grupo_config.py            # GrupoConfig (letras por semestre)
│   │   │   └── analisis.py                # Analisis + DetalleSemestre + DetalleGrupo + Repitente
│   │   ├── schemas/
│   │   │   ├── periodo.py                 # PeriodoCreate, PeriodoResponse
│   │   │   ├── malla.py                   # MallaMateriaResponse
│   │   │   ├── grupo_config.py            # GrupoConfigTextoCreate, BulkCreate
│   │   │   └── reporte.py                 # AnalisisCompletoResponse, RepitienteResponse
│   │   ├── services/
│   │   │   ├── parser_excel.py            # parsear_hoja() + procesar_excel()
│   │   │   ├── analizador.py              # generar_estadisticas() + config grupos
│   │   │   ├── malla_service.py           # Carga JSON → BD, consulta malla
│   │   │   └── exportador.py              # Exportar PDF/Excel en memoria (BytesIO)
│   │   └── api/
│   │       ├── periodos.py                # CRUD períodos
│   │       ├── malla.py                   # GET malla + upload JSON/TXT
│   │       ├── config_grupos.py           # Config texto + bulk + delete
│   │       ├── upload.py                  # POST upload Excel → análisis completo
│   │       └── reportes.py                # GET análisis + repitentes + exportar
│   └── tests/
│
├── frontend/                              # ✅ IMPLEMENTADO
│   ├── package.json
│   ├── vite.config.ts                     # Vite + Tailwind + proxy /api → :8000
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx                       # Entry: QueryClient + BrowserRouter
│       ├── App.tsx                        # Router con todas las rutas
│       ├── index.css                      # Tailwind v4 + tema UPDS + animaciones
│       ├── api/
│       │   └── client.ts                  # Axios client: todos los endpoints
│       ├── types/
│       │   └── index.ts                   # Tipos TS alineados con schemas backend
│       ├── components/
│       │   └── Layout/
│       │       ├── MainLayout.tsx          # Layout con sidebar + outlet
│       │       └── Sidebar.tsx             # Nav lateral con Lucide icons
│       └── pages/
│           ├── HomePage.tsx               # Dashboard: cards resumen + tabla análisis
│           ├── UploadPage.tsx             # Drag & drop Excel + selector período
│           ├── AnalisisPage.tsx           # Gráficos + tablas semestre/grupo
│           ├── RepitentesPage.tsx         # Tabla repitentes con filtros
│           └── ConfigPage.tsx             # Períodos + malla + config grupos
│
└── shared/
    └── malla.json                         # Copia de la malla curricular
```

---

## 3. Stack Tecnológico

### Backend — ✅ Implementado

| Componente | Tecnología | Versión |
|---|---|---|
| Framework | FastAPI | 0.115.6 |
| Servidor | Uvicorn | 0.34.0 |
| ORM | SQLAlchemy | 2.0.36 |
| Base de datos | **PostgreSQL** | 18 |
| Driver BD | psycopg2-binary | 2.9.11 |
| Validación | Pydantic + pydantic-settings | 2.7.1 |
| Excel parsing | pandas + openpyxl | 2.2.3 / 3.1.5 |
| PDF | ReportLab | 4.2.5 |
| Migraciones | Alembic | 1.14.1 |

### Frontend — ✅ Implementado

| Componente | Tecnología |
|---|---|
| Framework | React 19 + TypeScript |
| Bundler | Vite 8 |
| Estilos | Tailwind CSS v4 (colores UPDS) |
| Gráficos | Recharts |
| Navegación | React Router DOM |
| Estado servidor | TanStack Query (React Query) |
| HTTP client | Axios |
| Iconos | Lucide React |
| Tipografía | Plus Jakarta Sans + JetBrains Mono |

### Base de datos — PostgreSQL

- **URL:** `postgresql://postgres:1234@localhost:5432/core_bd`
- Configurada en `backend/.env`
- 7 tablas con relaciones y cascade delete
- Columnas JSON nativas de PostgreSQL para datos flexibles
- Compatible con SQLite vía `DATABASE_URL` (solo cambiar .env)

---

## 4. Base de Datos (7 tablas)

**periodos**: Período académico (ej: 1/2026, 2/2026).
- id, nombre (unique), fecha_inicio, fecha_fin, activo, created_at

**malla_materias**: Malla curricular de Medicina (76 materias, 10 semestres).
- id, codigo (unique, indexed), nombre, semestre, creditos, HT, HP
- Se carga automáticamente al iniciar desde `Malla-curricular-medicina-UPDS.txt`

**config_grupos**: Letras de grupo por semestre y período.
- id, periodo_id (FK), semestre, nombre_grupo, turno, letra_principal,
  letras_overflow (JSON), letras (JSON)

**analisis**: Cada análisis de un archivo Excel subido.
- id, periodo_id (FK), fecha_analisis, archivo_nombre, total_unicos,
  total_repitentes, materias_no_encontradas (JSON)

**analisis_detalle_semestre**: Resumen por semestre.
- id, analisis_id (FK), semestre, unicos, regulares, repitentes

**analisis_detalle_grupo**: Detalle por grupo.
- id, analisis_id (FK), semestre, nombre_grupo, turno, matriculados,
  repitentes_count, letras_desglose (JSON)

**repitentes**: Estudiantes repitentes detectados.
- id, analisis_id (FK), estudiante_id, nombre, semestre_principal,
  semestres_donde_repite (JSON), todos_los_semestres (JSON)

### Relaciones

- Periodo → GrupoConfig (cascade delete)
- Periodo → Analisis (cascade delete)
- Analisis → DetalleSemestre, DetalleGrupo, Repitente (cascade delete)

---

## 5. API REST (Endpoints)

### Períodos
```
GET    /api/periodos/              → Lista todos
POST   /api/periodos/              → Crear {nombre, fecha_inicio?, fecha_fin?, activo?}
GET    /api/periodos/{id}          → Obtener por ID
DELETE /api/periodos/{id}          → Eliminar (cascade)
```

### Malla curricular
```
GET    /api/malla/                 → Lista materias (orden por semestre)
POST   /api/malla/upload           → Subir .json o .txt → reemplaza existente
```
> La malla se carga automáticamente al iniciar si la BD está vacía.

### Configuración de grupos
```
GET    /api/periodos/{id}/config-grupos/         → Lista config del período
POST   /api/periodos/{id}/config-grupos/         → Crear con formato texto
POST   /api/periodos/{id}/config-grupos/bulk     → Config masiva
DELETE /api/periodos/{id}/config-grupos/{sem}     → Eliminar config de un semestre
```

### Upload y análisis
```
POST   /api/upload                 → Subir Excel + periodo_id (multipart/form-data)
```

### Reportes
```
GET    /api/analisis/              → Lista análisis (con periodo_nombre)
GET    /api/analisis/{id}          → Análisis completo:
       Retorna: {resumen, detalle_semestres, detalle_grupos, repitentes}
GET    /api/analisis/{id}/semestre/{sem}   → Detalle de un semestre
GET    /api/analisis/{id}/repitentes       → Filtros: ?semestre_principal= &semestre_repite= &buscar=
GET    /api/analisis/{id}/exportar?formato=excel|pdf → Descarga archivo
```

---

## 6. Flujo Principal de Uso

```
1. Admin abre http://localhost:5173                    ✅
2. Crea un período en Configuración (ej: "1/2026")    ✅
3. Configura letras de grupo por semestre              ✅
4. Va a "Cargar Archivo" → drag & drop Excel           ✅
5. Backend procesa:                                     ✅
   a. Parsea cada hoja → código, letra, estudiantes
   b. Cruza con malla → determina semestres
   c. Aplica config grupos → fusiona letras
   d. Detecta repitentes
   e. Guarda en BD
6. Redirige al dashboard del análisis con:              ✅
   - Tarjetas: total estudiantes, repitentes, semestres, grupos
   - Gráfico de barras (regulares vs repitentes por semestre)
   - Gráfico circular (distribución por turno)
   - Tablas de detalle por semestre y por grupo
7. Admin puede exportar a PDF o Excel                   ✅
8. Admin puede consultar repitentes con filtros          ✅
```

---

## 7. Frontend — Diseño Institucional UPDS

### Paleta de colores
- **Navy primario:** `#0f1d42`, `#1a2b5f`, `#243a7a`
- **Celeste acento:** `#4a90d9`, `#6bb0f0`
- **Neutros:** `#f7f9fc` (ice), `#edf1f7` (fog), `#94a3b8` (steel)
- **Acentos:** amber (repitentes), emerald (activo), rose (errores), violet (grupos)

### Páginas implementadas

| Página | Ruta | Descripción |
|---|---|---|
| Dashboard | `/` | Cards resumen + tabla análisis recientes |
| Cargar Archivo | `/upload` | Selector período + drag & drop + estado de carga |
| Análisis (lista) | `/analisis` | Historial de análisis con cards clickeables |
| Análisis (detalle) | `/analisis/:id` | Gráficos + tablas + botones exportar |
| Repitentes | `/repitentes` | Tabla con 4 filtros (análisis, búsqueda, semestres) |
| Configuración | `/config` | 3 secciones: períodos, malla, config grupos |

---

## 8. Consideraciones Técnicas

### Carga automática de malla curricular
Al iniciar, `main.py` verifica si `malla_materias` está vacía en la BD.
Si lo está, carga automáticamente desde `Malla-curricular-medicina-UPDS.txt`
(76 materias en 10 semestres). No requiere acción manual del usuario.

### Procesamiento de Excel
- El archivo se guarda temporalmente en `uploads/`, se procesa, y se elimina.
- `pd.ExcelFile` se usa como context manager (`with`) para liberar el file
  handle antes de eliminar el archivo (requisito en Windows).
- El procesamiento es síncrono. Para archivos muy grandes (500+ hojas) se
  puede migrar a BackgroundTasks de FastAPI.

### Normalización de códigos de materia
- Espacios → guiones (ej: "MRF 0100" → "MRF-0100")
- Corrección automática SPC → SCP

### Proxy de desarrollo
Vite proxy: `/api/*` → `http://localhost:8000` (configurado en `vite.config.ts`).
No hay problemas de CORS en desarrollo.

### Compatibilidad de tipos Frontend ↔ Backend
Los tipos TypeScript en `types/index.ts` deben coincidir exactamente con los
schemas Pydantic del backend. Especialmente `AnalisisCompleto`:
- Backend: `{resumen, detalle_semestres, detalle_grupos, repitentes}`
- Frontend: debe usar los mismos nombres de campo

---

## 9. Plan de Desarrollo por Fases

### Fase 1 — MVP Backend ✅ COMPLETADA (2026-03-17)

- [x] Estructura monorepo
- [x] FastAPI + SQLAlchemy + PostgreSQL
- [x] Migración del script v3 a services modulares
- [x] Endpoints: períodos, malla, config grupos, upload, reportes, exportar
- [x] Carga automática de malla curricular al iniciar
- [x] Manejo de errores con logging detallado
- [ ] Tests unitarios para parser y analizador

### Fase 2 — MVP Frontend ✅ COMPLETADA (2026-03-18)

- [x] Proyecto React + Vite + TypeScript + Tailwind CSS v4
- [x] Layout con sidebar institucional (Lucide icons, colores UPDS)
- [x] Dashboard con tarjetas resumen y tabla de análisis
- [x] Página de carga con drag & drop
- [x] Página de análisis con gráficos (Recharts) y tablas
- [x] Página de repitentes con filtros
- [x] Página de configuración (períodos, malla, grupos)
- [x] Botones de exportación PDF/Excel
- [x] Tipos TS alineados con schemas del backend

### Fase 3 — Refinamiento 🔲 PENDIENTE

- [ ] Autenticación básica (JWT)
- [ ] Historial comparativo entre períodos
- [ ] Mejoras en la página de configuración de grupos (UI más visual)
- [ ] Loading states más detallados durante procesamiento de Excel
- [ ] Responsive design (tablet)

### Fase 4 — Pulido y Despliegue 🔲 PENDIENTE

- [ ] Manejo de errores amigable en español
- [ ] Documentación de uso para el personal
- [ ] Despliegue en servidor (Docker o servidor local)
- [ ] Tests E2E

---

## 10. Cómo Ejecutar

### Backend
```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate    # Windows (Git Bash)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# Swagger UI: http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

### Requisitos previos
- Python 3.11+
- Node.js 22+
- PostgreSQL 18 con BD `core_bd` creada
- Archivo `.env` en `backend/` con `DATABASE_URL`

---

## 11. Decisiones Clave

| Decisión | Elección | Razón | Estado |
|---|---|---|---|
| Monorepo | Sí | Proyecto pequeño, equipo pequeño | ✅ |
| Backend | FastAPI | Tipado, docs auto, async, Pydantic | ✅ |
| Frontend | React + Vite + TS | Ecosistema maduro, tipado fuerte | ✅ |
| Base de datos | PostgreSQL | JSON nativo, robusto, escalable | ✅ |
| Estilos | Tailwind CSS v4 | Tema UPDS personalizado | ✅ |
| Estado | TanStack Query | Cache, loading, refetch automático | ✅ |
| Gráficos | Recharts | Simple, React nativo | ✅ |
| Iconos | Lucide React | Profesional, ligero, consistente | ✅ |
| Exportación | ReportLab + openpyxl | Generan en memoria (BytesIO) | ✅ |
| Autenticación | JWT simple | Pendiente (Fase 3) | 🔲 |
