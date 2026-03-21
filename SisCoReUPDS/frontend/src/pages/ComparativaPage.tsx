import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPeriodos, getAnalisisList, getComparativa } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  GitCompareArrows,
  Search,
  Users,
  AlertTriangle,
  CheckSquare,
  BarChart3,
  Table2,
} from 'lucide-react'
import type { ComparativaResponse, RepitenteCruzado } from '../types'

const PERIOD_COLORS = ['#0f1d42', '#4a90d9', '#f59e0b', '#10b981', '#8b5cf6']

const MAX_PERIODS = 5
const MIN_PERIODS = 2

export default function ComparativaPage() {
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [compareTriggered, setCompareTriggered] = useState(false)
  const [validationMsg, setValidationMsg] = useState('')
  const [searchText, setSearchText] = useState('')

  const { data: periodos, isLoading: loadingPeriodos } = useQuery({
    queryKey: ['periodos'],
    queryFn: getPeriodos,
  })

  const { data: analisisList, isLoading: loadingAnalisis } = useQuery({
    queryKey: ['analisis'],
    queryFn: getAnalisisList,
  })

  // Periods that have a completed analysis
  const periodosConAnalisis = useMemo(() => {
    if (!periodos || !analisisList) return []
    const analisisPeriodoIds = new Set(analisisList.map((a) => a.periodo_id))
    return periodos.filter((p) => analisisPeriodoIds.has(p.id))
  }, [periodos, analisisList])

  const sortedSelectedIds = useMemo(
    () => [...selectedIds].sort((a, b) => a - b),
    [selectedIds],
  )

  const {
    data: comparativa,
    isLoading: loadingComparativa,
    isError,
    error,
  } = useQuery({
    queryKey: ['comparativa', sortedSelectedIds],
    queryFn: () => getComparativa(sortedSelectedIds),
    enabled: compareTriggered && sortedSelectedIds.length >= MIN_PERIODS,
  })

  const handleTogglePeriod = (periodoId: number) => {
    setValidationMsg('')
    setSelectedIds((prev) => {
      if (prev.includes(periodoId)) {
        return prev.filter((id) => id !== periodoId)
      }
      if (prev.length >= MAX_PERIODS) return prev
      return [...prev, periodoId]
    })
  }

  const handleCompare = () => {
    if (selectedIds.length < MIN_PERIODS) {
      setValidationMsg(`Selecciona al menos ${MIN_PERIODS} periodos para comparar`)
      return
    }
    setValidationMsg('')
    setCompareTriggered(true)
  }

  // Reset comparison when selection changes
  const handleSelectionChange = (periodoId: number) => {
    setCompareTriggered(false)
    handleTogglePeriod(periodoId)
  }

  if (loadingPeriodos || loadingAnalisis) return <LoadingSkeleton />

  return (
    <div>
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-2xl font-bold text-upds-navy tracking-tight">
          Comparativa entre Periodos
        </h1>
        <p className="text-sm text-upds-graphite mt-1">
          Selecciona periodos para comparar matriculados y repitentes
        </p>
      </div>

      {/* Period Selector */}
      <div className="animate-fade-in-up stagger-1 bg-white rounded-2xl shadow-card border border-upds-fog/80 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-upds-celeste" />
            <h2 className="text-sm font-semibold text-upds-navy">Seleccionar Periodos</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-upds-steel tabular-nums">
              {selectedIds.length}/{MAX_PERIODS} seleccionados
            </span>
            <button
              onClick={handleCompare}
              disabled={selectedIds.length < MIN_PERIODS}
              className="inline-flex items-center gap-2 px-4 py-2 bg-upds-navy text-white text-xs font-semibold rounded-xl hover:bg-upds-navy-light transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <GitCompareArrows className="w-3.5 h-3.5" />
              Comparar
            </button>
          </div>
        </div>

        {validationMsg && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-accent-amber-pale/60 border border-accent-amber/20">
            <AlertTriangle className="w-3.5 h-3.5 text-accent-amber flex-shrink-0" />
            <p className="text-xs font-medium text-accent-amber">{validationMsg}</p>
          </div>
        )}

        {!periodosConAnalisis.length ? (
          <p className="text-sm text-upds-steel text-center py-4">
            No hay periodos con analisis completados
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {periodosConAnalisis.map((p) => {
              const isSelected = selectedIds.includes(p.id)
              const isDisabled = !isSelected && selectedIds.length >= MAX_PERIODS
              const colorIndex = isSelected ? selectedIds.indexOf(p.id) : -1

              return (
                <label
                  key={p.id}
                  className={`
                    relative flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200
                    ${isSelected
                      ? 'border-upds-celeste bg-upds-celeste-ghost shadow-sm'
                      : 'border-upds-fog hover:border-upds-celeste/40 bg-white'}
                    ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => handleSelectionChange(p.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'border-upds-celeste bg-upds-celeste'
                        : 'border-upds-steel/40 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-upds-navy truncate">{p.nombre}</p>
                    {p.fecha_inicio && (
                      <p className="text-[10px] text-upds-steel mt-0.5">
                        {new Date(p.fecha_inicio).toLocaleDateString('es-BO', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                  {isSelected && colorIndex >= 0 && (
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PERIOD_COLORS[colorIndex] }}
                    />
                  )}
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* States */}
      {!compareTriggered ? (
        <InitialState />
      ) : loadingComparativa ? (
        <ComparisonSkeleton />
      ) : isError ? (
        <ErrorState error={error} />
      ) : comparativa && comparativa.periodos_comparados.length === 0 ? (
        <NoResultsState />
      ) : comparativa ? (
        <ComparisonResults
          data={comparativa}
          searchText={searchText}
          onSearchChange={setSearchText}
        />
      ) : null}
    </div>
  )
}

/* ─── Comparison Results ─────────────────────────────────────── */

function ComparisonResults({
  data,
  searchText,
  onSearchChange,
}: {
  data: ComparativaResponse
  searchText: string
  onSearchChange: (v: string) => void
}) {
  const periodoColorMap = useMemo(() => {
    const map: Record<number, string> = {}
    data.periodos_comparados.forEach((p, i) => {
      map[p.periodo_id] = PERIOD_COLORS[i % PERIOD_COLORS.length]
    })
    return map
  }, [data.periodos_comparados])

  const periodoNameMap = useMemo(() => {
    const map: Record<number, string> = {}
    data.periodos_comparados.forEach((p) => {
      map[p.periodo_id] = p.periodo_nombre
    })
    return map
  }, [data.periodos_comparados])

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 animate-fade-in-up stagger-1">
        {data.periodos_comparados.map((p, i) => (
          <div
            key={p.periodo_id}
            className="bg-white rounded-2xl shadow-card border border-upds-fog/80 p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-upds-steel uppercase tracking-wider truncate max-w-[70%]">
                {p.periodo_nombre}
              </span>
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: PERIOD_COLORS[i % PERIOD_COLORS.length] }}
              />
            </div>
            <p className="text-2xl font-bold text-upds-navy tracking-tight tabular-nums">
              {p.total_unicos}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-upds-steel">estudiantes</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-accent-amber-pale text-accent-amber text-[10px] font-bold tabular-nums">
                {p.total_repitentes} rep.
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals Bar Chart */}
      <div className="bg-white rounded-2xl shadow-card border border-upds-fog/80 p-6 animate-fade-in-up stagger-2">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-4 h-4 text-upds-celeste" />
          <h2 className="text-sm font-semibold text-upds-navy">
            Matriculados vs Repitentes por Periodo
          </h2>
        </div>
        <TotalsBarChart periodos={data.periodos_comparados} />
      </div>

      {/* Semester Grouped Bar Chart */}
      <div className="bg-white rounded-2xl shadow-card border border-upds-fog/80 p-6 animate-fade-in-up stagger-3">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-4 h-4 text-upds-celeste" />
          <h2 className="text-sm font-semibold text-upds-navy">
            Comparativa por Semestre
          </h2>
        </div>
        <SemesterGroupedChart
          semestres={data.detalle_semestres}
          periodos={data.periodos_comparados}
          colorMap={periodoColorMap}
          nameMap={periodoNameMap}
        />
      </div>

      {/* Cross-Period Repeater Table */}
      <div className="bg-white rounded-2xl shadow-card border border-upds-fog/80 animate-fade-in-up stagger-4">
        <div className="px-6 py-5 border-b border-upds-fog flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Table2 className="w-4 h-4 text-upds-celeste" />
            <h2 className="text-sm font-semibold text-upds-navy">
              Repitentes en Multiples Periodos
            </h2>
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-upds-navy/[0.07] text-upds-navy text-xs font-bold tabular-nums">
              {data.repitentes_cruzados.length}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-upds-steel" />
            <input
              type="text"
              placeholder="Buscar por nombre o ID..."
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full sm:w-64 border border-upds-fog rounded-xl pl-9 pr-3 py-2 text-sm text-upds-ink bg-upds-ice/50 focus:outline-none focus:ring-2 focus:ring-upds-celeste/30 focus:border-upds-celeste transition-all placeholder:text-upds-steel/60"
            />
          </div>
        </div>
        <CrossPeriodTable
          repitentes={data.repitentes_cruzados}
          searchText={searchText}
          nameMap={periodoNameMap}
          colorMap={periodoColorMap}
        />
      </div>
    </div>
  )
}

/* ─── Totals Bar Chart ───────────────────────────────────────── */

function TotalsBarChart({
  periodos,
}: {
  periodos: ComparativaResponse['periodos_comparados']
}) {
  const chartData = periodos.map((p, i) => ({
    name: p.periodo_nombre,
    Matriculados: p.total_unicos,
    Repitentes: p.total_repitentes,
    fill: PERIOD_COLORS[i % PERIOD_COLORS.length],
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#edf1f7" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <Tooltip
          contentStyle={{
            background: '#fff',
            border: '1px solid #edf1f7',
            borderRadius: '12px',
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(15,29,66,0.08)',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Bar dataKey="Matriculados" fill="#0f1d42" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Repitentes" fill="#4a90d9" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ─── Semester Grouped Bar Chart ─────────────────────────────── */

function SemesterGroupedChart({
  semestres,
  periodos,
  colorMap,
  nameMap,
}: {
  semestres: ComparativaResponse['detalle_semestres']
  periodos: ComparativaResponse['periodos_comparados']
  colorMap: Record<number, string>
  nameMap: Record<number, string>
}) {
  const chartData = useMemo(() => {
    return [...semestres]
      .sort((a, b) => a.semestre - b.semestre)
      .map((sem) => {
        const row: Record<string, string | number> = { semestre: `Sem ${sem.semestre}` }
        periodos.forEach((p) => {
          const match = sem.periodos.find((sp) => sp.periodo_id === p.periodo_id)
          row[nameMap[p.periodo_id]] = match ? match.unicos : 0
        })
        return row
      })
  }, [semestres, periodos, nameMap])

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="#edf1f7" />
        <XAxis dataKey="semestre" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <Tooltip
          contentStyle={{
            background: '#fff',
            border: '1px solid #edf1f7',
            borderRadius: '12px',
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(15,29,66,0.08)',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        {periodos.map((p) => (
          <Bar
            key={p.periodo_id}
            dataKey={nameMap[p.periodo_id]}
            fill={colorMap[p.periodo_id]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ─── Cross-Period Repeater Table ────────────────────────────── */

function CrossPeriodTable({
  repitentes,
  searchText,
  nameMap,
  colorMap,
}: {
  repitentes: RepitenteCruzado[]
  searchText: string
  nameMap: Record<number, string>
  colorMap: Record<number, string>
}) {
  const filtered = useMemo(() => {
    if (!searchText.trim()) return repitentes
    const q = searchText.toLowerCase()
    return repitentes.filter(
      (r) =>
        r.nombre.toLowerCase().includes(q) ||
        r.estudiante_id.toLowerCase().includes(q),
    )
  }, [repitentes, searchText])

  // Sort by number of periods descending
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.periodos.length - a.periodos.length),
    [filtered],
  )

  if (!repitentes.length) {
    return (
      <div className="px-6 py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-accent-emerald-pale flex items-center justify-center mx-auto mb-4">
          <Users className="w-6 h-6 text-accent-emerald" />
        </div>
        <p className="text-sm font-medium text-upds-graphite">
          No se encontraron repitentes en multiples periodos
        </p>
        <p className="text-xs text-upds-steel mt-1.5">
          Ninguno de los estudiantes repitentes aparece en 2 o mas de los periodos seleccionados
        </p>
      </div>
    )
  }

  if (!sorted.length) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm text-upds-steel">
          No se encontraron resultados para "{searchText}"
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left">
            <th className="px-6 py-3 text-[11px] font-semibold text-upds-steel uppercase tracking-wider">
              ID Estudiante
            </th>
            <th className="px-6 py-3 text-[11px] font-semibold text-upds-steel uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-6 py-3 text-[11px] font-semibold text-upds-steel uppercase tracking-wider text-center">
              Periodos
            </th>
            <th className="px-6 py-3 text-[11px] font-semibold text-upds-steel uppercase tracking-wider">
              Detalle por Periodo
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-upds-fog/60">
          {sorted.map((r) => (
            <tr key={r.estudiante_id} className="hover:bg-upds-celeste-ghost/30 transition-colors">
              <td className="px-6 py-3.5">
                <span className="font-mono text-xs text-upds-graphite bg-upds-fog/60 px-2 py-0.5 rounded">
                  {r.estudiante_id}
                </span>
              </td>
              <td className="px-6 py-3.5 text-sm font-medium text-upds-navy">
                {r.nombre}
              </td>
              <td className="px-6 py-3.5 text-center">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent-amber-pale text-accent-amber text-xs font-bold">
                  {r.periodos.length}
                </span>
              </td>
              <td className="px-6 py-3.5">
                <div className="flex flex-col gap-1.5">
                  {r.periodos.map((rp) => (
                    <div key={rp.periodo_id} className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: colorMap[rp.periodo_id] || '#94a3b8' }}
                      />
                      <span className="text-xs font-semibold text-upds-navy">
                        {nameMap[rp.periodo_id] || `Periodo ${rp.periodo_id}`}
                      </span>
                      <span className="text-[10px] text-upds-steel">
                        Sem. principal: {rp.semestre_principal}
                      </span>
                      {rp.semestres_donde_repite.length > 0 && (
                        <div className="flex gap-1">
                          {rp.semestres_donde_repite.map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 rounded-md bg-accent-amber-pale text-accent-amber text-[10px] font-semibold tabular-nums"
                            >
                              Sem {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── State Components ───────────────────────────────────────── */

function InitialState() {
  return (
    <div className="animate-fade-in-up stagger-2 bg-white rounded-2xl shadow-card border border-upds-fog/80 px-6 py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-upds-celeste-ghost flex items-center justify-center mx-auto mb-4">
        <GitCompareArrows className="w-6 h-6 text-upds-celeste" />
      </div>
      <p className="text-sm font-medium text-upds-graphite">
        Selecciona entre 2 y 5 periodos para comparar
      </p>
      <p className="text-xs text-upds-steel mt-1.5">
        Los graficos y tablas comparativas se mostraran una vez que hagas clic en "Comparar"
      </p>
    </div>
  )
}

function ComparisonSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-upds-fog animate-pulse" />
        ))}
      </div>
      <div className="h-80 bg-white rounded-2xl border border-upds-fog animate-pulse" />
      <div className="h-96 bg-white rounded-2xl border border-upds-fog animate-pulse" />
    </div>
  )
}

function ErrorState({ error }: { error: unknown }) {
  const message =
    error instanceof Error ? error.message : 'Error al cargar la comparativa'

  return (
    <div className="animate-fade-in-up flex items-center gap-3 p-6 bg-accent-rose-pale/30 rounded-2xl border border-accent-rose/20">
      <AlertTriangle className="w-5 h-5 text-accent-rose flex-shrink-0" />
      <div>
        <p className="text-sm text-accent-rose font-medium">Error al cargar la comparativa</p>
        <p className="text-xs text-accent-rose/70 mt-1">{message}</p>
      </div>
    </div>
  )
}

function NoResultsState() {
  return (
    <div className="animate-fade-in-up bg-white rounded-2xl shadow-card border border-upds-fog/80 px-6 py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-accent-amber-pale flex items-center justify-center mx-auto mb-4">
        <BarChart3 className="w-6 h-6 text-accent-amber" />
      </div>
      <p className="text-sm font-medium text-upds-graphite">
        No hay datos para comparar
      </p>
      <p className="text-xs text-upds-steel mt-1.5">
        Los periodos seleccionados no tienen datos de analisis disponibles
      </p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div>
      <div className="mb-8">
        <div className="h-7 w-64 bg-upds-fog rounded-lg animate-pulse" />
        <div className="h-4 w-80 bg-upds-fog rounded mt-2 animate-pulse" />
      </div>
      <div className="h-48 bg-white rounded-2xl border border-upds-fog animate-pulse mb-6" />
      <div className="h-64 bg-white rounded-2xl border border-upds-fog animate-pulse" />
    </div>
  )
}
