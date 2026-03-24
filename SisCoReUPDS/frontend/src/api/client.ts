import axios from 'axios'
import type {
  Periodo,
  PeriodoCreate,
  MallaMateria,
  GrupoConfig,
  GrupoConfigTextoCreate,
  GrupoConfigBulkCreate,
  Analisis,
  AnalisisCompleto,
  Repitente,
  UploadResponse,
  DetalleSemestre,
  DetalleGrupo,
  ListasResponse,
  MateriasResponse,
  ComparativaResponse,
  TendenciaResponse,
} from '../types'

const api = axios.create({
  baseURL: '/api',
})

// === Períodos ===
export const getPeriodos = () =>
  api.get<Periodo[]>('/periodos/').then((r) => r.data)

export const createPeriodo = (data: PeriodoCreate) =>
  api.post<Periodo>('/periodos/', data).then((r) => r.data)

export const getPeriodo = (id: number) =>
  api.get<Periodo>(`/periodos/${id}`).then((r) => r.data)

export const deletePeriodo = (id: number) =>
  api.delete(`/periodos/${id}`).then((r) => r.data)

// === Malla ===
export const getMalla = () =>
  api.get<MallaMateria[]>('/malla/').then((r) => r.data)

export const uploadMalla = (file: File) => {
  const form = new FormData()
  form.append('archivo', file)
  return api.post('/malla/upload', form).then((r) => r.data)
}

// === Config Grupos ===
export const getConfigGrupos = (periodoId: number) =>
  api.get<GrupoConfig[]>(`/periodos/${periodoId}/config-grupos/`).then((r) => r.data)

export const createConfigGrupo = (periodoId: number, data: GrupoConfigTextoCreate) =>
  api.post(`/periodos/${periodoId}/config-grupos/`, data).then((r) => r.data)

export const createConfigGruposBulk = (periodoId: number, data: GrupoConfigBulkCreate) =>
  api.post(`/periodos/${periodoId}/config-grupos/bulk`, data).then((r) => r.data)

export const deleteConfigGrupo = (periodoId: number, semestre: number) =>
  api.delete(`/periodos/${periodoId}/config-grupos/${semestre}`).then((r) => r.data)

// === Upload ===
export const uploadExcel = (file: File, periodoId: number) => {
  const form = new FormData()
  form.append('archivo', file)
  form.append('periodo_id', periodoId.toString())
  return api.post<UploadResponse>('/upload', form).then((r) => r.data)
}

// === Análisis / Reportes ===
export const getAnalisisList = () =>
  api.get<Analisis[]>('/analisis/').then((r) => r.data)

export const getAnalisisCompleto = (id: number) =>
  api.get<AnalisisCompleto>(`/analisis/${id}`).then((r) => r.data)

export const getAnalisisSemestre = (id: number, semestre: number) =>
  api.get<{ semestre: DetalleSemestre; grupos: DetalleGrupo[]; repitentes: Repitente[] }>(
    `/analisis/${id}/semestre/${semestre}`
  ).then((r) => r.data)

export const getRepitentes = (
  id: number,
  params?: { semestre_principal?: number; semestre_repite?: number; buscar?: string }
) =>
  api.get<Repitente[]>(`/analisis/${id}/repitentes`, { params }).then((r) => r.data)

export const exportarAnalisis = (id: number, formato: 'excel' | 'pdf') =>
  api.get(`/analisis/${id}/exportar`, {
    params: { formato },
    responseType: 'blob',
  }).then((r) => {
    const ext = formato === 'excel' ? 'xlsx' : 'pdf'
    const url = window.URL.createObjectURL(new Blob([r.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `reporte_analisis_${id}.${ext}`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  })

// === Exportar repitentes ===
export const exportarRepitentes = (
  id: number,
  formato: 'excel' | 'pdf',
  params?: { semestre_principal?: number; semestre_repite?: number; buscar?: string }
) =>
  api.get(`/analisis/${id}/repitentes/exportar`, {
    params: { formato, ...params },
    responseType: 'blob',
  }).then((r) => {
    const ext = formato === 'excel' ? 'xlsx' : 'pdf'
    const url = window.URL.createObjectURL(new Blob([r.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `repitentes_analisis_${id}.${ext}`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  })

// === Listas de estudiantes ===
export const getListas = (
  id: number,
  params?: { semestre?: number; turno?: string; grupo?: string }
) =>
  api.get<ListasResponse>(`/analisis/${id}/listas`, { params }).then((r) => r.data)

export const imprimirListas = (
  id: number,
  params?: { semestre?: number; turno?: string; grupos?: string }
) =>
  api.get(`/analisis/${id}/listas/imprimir`, {
    params,
    responseType: 'blob',
  }).then((r) => {
    const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `listas_analisis_${id}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  })

// === Listas por materia ===
export const getMaterias = (
  id: number,
  params?: { semestre?: number; grupo?: string; buscar?: string }
) =>
  api.get<MateriasResponse>(`/analisis/${id}/materias`, { params }).then((r) => r.data)

export const imprimirMaterias = (
  id: number,
  params?: { semestre?: number; grupo?: string; buscar?: string }
) =>
  api.get(`/analisis/${id}/materias/imprimir`, {
    params,
    responseType: 'blob',
  }).then((r) => {
    const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `materias_analisis_${id}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  })

// === Comparativas ===
export const getComparativa = (periodoIds: number[]) =>
  api.get<ComparativaResponse>('/analisis/comparar', {
    params: { periodo_ids: periodoIds.join(',') },
  }).then((r) => r.data)

export const getTendencia = (limite: number = 5) =>
  api.get<TendenciaResponse>('/analisis/tendencia', {
    params: { limite },
  }).then((r) => r.data)
