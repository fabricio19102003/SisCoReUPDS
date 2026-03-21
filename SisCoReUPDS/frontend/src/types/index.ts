// === Períodos ===
export interface Periodo {
  id: number
  nombre: string
  fecha_inicio: string | null
  fecha_fin: string | null
  activo: boolean
  created_at: string
}

export interface PeriodoCreate {
  nombre: string
  fecha_inicio?: string | null
  fecha_fin?: string | null
  activo?: boolean
}

// === Malla Curricular ===
export interface MallaMateria {
  id: number
  codigo: string
  nombre: string
  semestre: number
  creditos: number
  HT: number
  HP: number
}

// === Configuración de Grupos ===
export interface GrupoConfig {
  id: number
  periodo_id: number
  semestre: number
  nombre_grupo: string
  turno: string
  letra_principal: string
  letras_overflow: string[]
  letras: string[]
}

export interface GrupoConfigTextoCreate {
  semestre: number
  config_texto: string
}

export interface GrupoConfigBulkCreate {
  configs: GrupoConfigTextoCreate[]
}

// === Análisis ===
export interface Analisis {
  id: number
  periodo_id: number
  periodo_nombre?: string
  fecha_analisis: string
  archivo_nombre: string
  total_unicos: number
  total_repitentes: number
  materias_no_encontradas: string[]
}

export interface DetalleSemestre {
  semestre: number
  unicos: number
  regulares: number
  repitentes: number
  porcentaje_repitentes: number
}

export interface DetalleGrupo {
  semestre: number
  nombre_grupo: string
  turno: string
  matriculados: number
  repitentes_count: number
  regulares: number
  letras_desglose: Record<string, number>
}

export interface Repitente {
  estudiante_id: string
  nombre: string
  semestre_principal: number
  semestres_donde_repite: number[]
  todos_los_semestres: number[]
}

export interface AnalisisCompleto {
  resumen: Analisis
  detalle_semestres: DetalleSemestre[]
  detalle_grupos: DetalleGrupo[]
  repitentes: Repitente[]
}

export interface UploadResponse {
  analisis_id: number
  total_registros_procesados: number
  total_estudiantes_unicos: number
  total_repitentes: number
  materias_no_encontradas: string[]
  semestres_detectados: number[]
}

// === Listas de estudiantes ===
export interface EstudianteLista {
  id: string
  nombre: string
}

export interface ListaGrupo {
  semestre: number
  grupo: string
  turno: string
  total_estudiantes: number
  estudiantes: EstudianteLista[]
}

export interface GrupoDisponible {
  semestre: number
  grupo: string
  turno: string
  total: number
}

export interface ListasResponse {
  analisis_id: number
  periodo_nombre: string | null
  archivo_nombre: string
  filtros_disponibles: {
    semestres: number[]
    turnos: string[]
    grupos: GrupoDisponible[]
  }
  listas: ListaGrupo[]
  total_grupos: number
  total_estudiantes: number
}
