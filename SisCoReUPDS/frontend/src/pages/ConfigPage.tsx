import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPeriodos,
  createPeriodo,
  deletePeriodo,
  getMalla,
  getConfigGrupos,
  createConfigGrupo,
  deleteConfigGrupo,
} from '../api/client'
import {
  CalendarRange,
  GraduationCap,
  Grid3X3,
  Plus,
  Trash2,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Save,
} from 'lucide-react'

export default function ConfigPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-2xl font-bold text-upds-navy tracking-tight">
          Configuración
        </h1>
        <p className="text-sm text-upds-graphite mt-1">
          Gestiona períodos, malla curricular y configuración de grupos
        </p>
      </div>

      <div className="space-y-8">
        <PeriodosSection />
        <MallaSection />
        <GruposSection />
      </div>
    </div>
  )
}

/* ─── Períodos ──────────────────────────────────────────────────── */
function PeriodosSection() {
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState('')

  const { data: periodos, isLoading } = useQuery({
    queryKey: ['periodos'],
    queryFn: getPeriodos,
  })

  const createMut = useMutation({
    mutationFn: () => createPeriodo({ nombre }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodos'] })
      setNombre('')
    },
  })

  const deleteMut = useMutation({
    mutationFn: deletePeriodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['periodos'] }),
  })

  return (
    <div className="animate-fade-in-up stagger-1 bg-white rounded-2xl shadow-card border border-upds-fog/80">
      <div className="px-6 py-5 border-b border-upds-fog flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-upds-navy/[0.07] flex items-center justify-center">
          <CalendarRange className="w-4 h-4 text-upds-navy" />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-upds-navy">Períodos Académicos</h2>
          <p className="text-xs text-upds-steel">Crear y gestionar períodos de matriculación</p>
        </div>
      </div>

      <div className="p-6">
        {/* Form */}
        <div className="flex gap-3 mb-5">
          <input
            type="text"
            placeholder="Ej: 1/2026"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && nombre.trim() && createMut.mutate()}
            className="flex-1 border border-upds-fog rounded-xl px-4 py-2.5 text-sm text-upds-ink bg-upds-ice/50 focus:outline-none focus:ring-2 focus:ring-upds-celeste/30 focus:border-upds-celeste transition-all placeholder:text-upds-steel/60"
          />
          <button
            onClick={() => createMut.mutate()}
            disabled={!nombre.trim() || createMut.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-upds-navy text-white text-xs font-semibold rounded-xl hover:bg-upds-navy-light disabled:bg-upds-fog disabled:text-upds-steel transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Crear
          </button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 bg-upds-fog/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !periodos?.length ? (
          <p className="text-sm text-upds-steel text-center py-6">
            No hay períodos creados
          </p>
        ) : (
          <div className="space-y-2">
            {periodos.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center py-3 px-4 bg-upds-ice/60 rounded-xl group hover:bg-upds-celeste-ghost/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-upds-celeste-pale flex items-center justify-center text-xs font-bold text-upds-navy-mid tabular-nums">
                    {p.id}
                  </span>
                  <span className="text-sm font-semibold text-upds-navy">{p.nombre}</span>
                  {p.activo && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-accent-emerald-pale text-accent-emerald px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      activo
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar el período "${p.nombre}" y todos sus datos asociados?`))
                      deleteMut.mutate(p.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent-rose hover:bg-accent-rose-pale/60 rounded-lg transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Malla Curricular ──────────────────────────────────────────── */
function MallaSection() {
  const { data: malla, isLoading } = useQuery({
    queryKey: ['malla'],
    queryFn: getMalla,
  })

  const semestres = malla
    ? [...new Set(malla.map((m) => m.semestre))].sort((a, b) => a - b)
    : []

  return (
    <div className="animate-fade-in-up stagger-2 bg-white rounded-2xl shadow-card border border-upds-fog/80">
      <div className="px-6 py-5 border-b border-upds-fog flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-upds-celeste-pale flex items-center justify-center">
          <GraduationCap className="w-4 h-4 text-upds-celeste" />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-upds-navy">Malla Curricular</h2>
          <p className="text-xs text-upds-steel">Materias de la carrera de Medicina</p>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-5 gap-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-20 bg-upds-fog/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !malla?.length ? (
          <div className="text-center py-8">
            <BookOpen className="w-8 h-8 text-upds-steel mx-auto mb-3" />
            <p className="text-sm text-upds-steel">No hay malla cargada</p>
            <p className="text-xs text-upds-steel/60 mt-1">
              La malla se carga automáticamente al iniciar el sistema
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
              <p className="text-sm text-upds-graphite">
                <span className="font-semibold text-upds-navy">{malla.length}</span> materias en{' '}
                <span className="font-semibold text-upds-navy">{semestres.length}</span> semestres
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {semestres.map((sem) => {
                const count = malla.filter((m) => m.semestre === sem).length
                return (
                  <div
                    key={sem}
                    className="relative bg-upds-ice/80 rounded-xl p-4 text-center border border-upds-fog/60 hover:border-upds-celeste/30 hover:bg-upds-celeste-ghost/30 transition-all group"
                  >
                    <p className="text-[10px] text-upds-steel font-semibold uppercase tracking-wider">
                      Semestre
                    </p>
                    <p className="text-2xl font-bold text-upds-navy mt-0.5 tabular-nums group-hover:text-upds-celeste transition-colors">
                      {sem}
                    </p>
                    <p className="text-[11px] text-upds-steel mt-0.5">
                      {count} {count === 1 ? 'materia' : 'materias'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Config Grupos ─────────────────────────────────────────────── */
function GruposSection() {
  const queryClient = useQueryClient()
  const [periodoId, setPeriodoId] = useState<number | ''>('')
  const [semestre, setSemestre] = useState(1)
  const [configTexto, setConfigTexto] = useState('')

  const { data: periodos } = useQuery({
    queryKey: ['periodos'],
    queryFn: getPeriodos,
  })

  const { data: configs, isLoading } = useQuery({
    queryKey: ['config-grupos', periodoId],
    queryFn: () => getConfigGrupos(periodoId as number),
    enabled: periodoId !== '',
  })

  const createMut = useMutation({
    mutationFn: () =>
      createConfigGrupo(periodoId as number, { semestre, config_texto: configTexto }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-grupos', periodoId] })
      setConfigTexto('')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (sem: number) => deleteConfigGrupo(periodoId as number, sem),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config-grupos', periodoId] }),
  })

  const semestresConConfig = configs
    ? [...new Set(configs.map((c) => c.semestre))].sort((a, b) => a - b)
    : []

  return (
    <div className="animate-fade-in-up stagger-3 bg-white rounded-2xl shadow-card border border-upds-fog/80">
      <div className="px-6 py-5 border-b border-upds-fog flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent-violet-pale flex items-center justify-center">
          <Grid3X3 className="w-4 h-4 text-accent-violet" />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-upds-navy">Configuración de Grupos</h2>
          <p className="text-xs text-upds-steel">Letras de grupo por semestre y período</p>
        </div>
      </div>

      <div className="p-6">
        {/* Period selector */}
        <div className="mb-5">
          <label className="block text-[11px] font-semibold text-upds-steel uppercase tracking-wider mb-1.5">
            Período
          </label>
          <select
            value={periodoId}
            onChange={(e) => setPeriodoId(e.target.value ? Number(e.target.value) : '')}
            className="w-full max-w-xs border border-upds-fog rounded-xl px-4 py-2.5 text-sm text-upds-ink bg-upds-ice/50 focus:outline-none focus:ring-2 focus:ring-upds-celeste/30 focus:border-upds-celeste transition-all"
          >
            <option value="">Seleccionar período...</option>
            {periodos?.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        {periodoId !== '' && (
          <>
            {/* Existing configs */}
            {isLoading ? (
              <div className="space-y-2 mb-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-upds-fog/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : semestresConConfig.length > 0 ? (
              <div className="mb-6 space-y-2">
                {semestresConConfig.map((sem) => {
                  const gruposSem = configs!.filter((c) => c.semestre === sem)
                  return (
                    <div
                      key={sem}
                      className="flex justify-between items-center py-3 px-4 bg-upds-ice/60 rounded-xl group hover:bg-upds-celeste-ghost/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-upds-celeste-pale flex items-center justify-center text-xs font-bold text-upds-navy-mid tabular-nums">
                          {sem}
                        </span>
                        <div>
                          <span className="text-sm font-medium text-upds-navy">
                            Semestre {sem}
                          </span>
                          <div className="flex gap-1 mt-1">
                            {gruposSem.map((g) => (
                              <span
                                key={g.id}
                                className="px-1.5 py-0.5 rounded bg-upds-fog/80 text-[10px] font-semibold text-upds-graphite"
                              >
                                {g.nombre_grupo}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteMut.mutate(sem)}
                        className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent-rose hover:bg-accent-rose-pale/60 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                        Eliminar
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="mb-6 py-6 text-center rounded-xl bg-upds-ice/40 border border-upds-fog/40">
                <p className="text-sm text-upds-steel">
                  No hay configuración de grupos para este período
                </p>
              </div>
            )}

            {/* Add form */}
            <div className="border-t border-upds-fog pt-5">
              <h3 className="text-xs font-semibold text-upds-navy uppercase tracking-wider mb-4">
                Agregar configuración
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-upds-steel uppercase tracking-wider mb-1.5">
                    Semestre
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={semestre}
                    onChange={(e) => setSemestre(Number(e.target.value))}
                    className="w-full border border-upds-fog rounded-xl px-4 py-2.5 text-sm text-upds-ink bg-upds-ice/50 focus:outline-none focus:ring-2 focus:ring-upds-celeste/30 focus:border-upds-celeste transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-upds-steel uppercase tracking-wider mb-1.5">
                    Configuración
                  </label>
                  <textarea
                    value={configTexto}
                    onChange={(e) => setConfigTexto(e.target.value)}
                    placeholder={"M1(A)=(Q)\nM2(D)=(R)\nT1(B)=(O)\nN1(C)=(T)"}
                    rows={4}
                    className="w-full border border-upds-fog rounded-xl px-4 py-2.5 text-sm font-mono text-upds-ink bg-upds-ice/50 focus:outline-none focus:ring-2 focus:ring-upds-celeste/30 focus:border-upds-celeste transition-all placeholder:text-upds-steel/40 resize-none"
                  />
                </div>
              </div>
              <button
                onClick={() => createMut.mutate()}
                disabled={!configTexto.trim() || createMut.isPending}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-upds-navy text-white text-xs font-semibold rounded-xl hover:bg-upds-navy-light disabled:bg-upds-fog disabled:text-upds-steel transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Guardar configuración
              </button>
              {createMut.isError && (
                <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-accent-rose-pale/40">
                  <AlertTriangle className="w-3.5 h-3.5 text-accent-rose" />
                  <p className="text-xs text-accent-rose font-medium">
                    Error al guardar: {(createMut.error as Error).message}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
