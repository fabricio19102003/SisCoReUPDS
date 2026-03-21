import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { getListas, imprimirListas } from '../api/client'
import type { ListaGrupo, GrupoDisponible } from '../types'
import {
  ArrowLeft,
  Printer,
  Filter,
  Users,
  List,
  ChevronDown,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  Check,
} from 'lucide-react'

const TURNO_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Mañana': Sun,
  'Tarde': Sunset,
  'Noche': Moon,
}

export default function ListasPage() {
  const { id } = useParams<{ id: string }>()
  if (!id) return null
  return <ListasDetalle id={Number(id)} />
}

function ListasDetalle({ id }: { id: number }) {
  const [filtroSemestre, setFiltroSemestre] = useState<number | null>(null)
  const [filtroTurno, setFiltroTurno] = useState<string | null>(null)
  const [gruposSeleccionados, setGruposSeleccionados] = useState<Set<string>>(new Set())
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [imprimiendo, setImprimiendo] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['listas', id],
    queryFn: () => getListas(id),
  })

  // Filtrar listas localmente
  const listasFiltradas = useMemo(() => {
    if (!data) return []
    return data.listas.filter((l) => {
      if (filtroSemestre !== null && l.semestre !== filtroSemestre) return false
      if (filtroTurno !== null && l.turno !== filtroTurno) return false
      if (gruposSeleccionados.size > 0 && !gruposSeleccionados.has(l.grupo)) return false
      return true
    })
  }, [data, filtroSemestre, filtroTurno, gruposSeleccionados])

  // Grupos disponibles filtrados por semestre y turno
  const gruposVisibles = useMemo(() => {
    if (!data) return []
    return data.filtros_disponibles.grupos.filter((g) => {
      if (filtroSemestre !== null && g.semestre !== filtroSemestre) return false
      if (filtroTurno !== null && g.turno !== filtroTurno) return false
      return true
    })
  }, [data, filtroSemestre, filtroTurno])

  const toggleGrupo = (grupo: string) => {
    setGruposSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(grupo)) next.delete(grupo)
      else next.add(grupo)
      return next
    })
  }

  const toggleExpandido = (key: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const seleccionarTodos = () => {
    if (gruposSeleccionados.size === gruposVisibles.length) {
      setGruposSeleccionados(new Set())
    } else {
      setGruposSeleccionados(new Set(gruposVisibles.map((g) => g.grupo)))
    }
  }

  const handleImprimir = async () => {
    setImprimiendo(true)
    try {
      const params: { semestre?: number; turno?: string; grupos?: string } = {}
      if (filtroSemestre !== null) params.semestre = filtroSemestre
      if (filtroTurno !== null) params.turno = filtroTurno
      if (gruposSeleccionados.size > 0) params.grupos = Array.from(gruposSeleccionados).join(',')
      await imprimirListas(id, params)
    } catch {
      // Error handled silently
    } finally {
      setImprimiendo(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-64 bg-upds-fog rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="h-96 bg-white rounded-2xl border border-upds-fog animate-pulse" />
          <div className="lg:col-span-3 h-96 bg-white rounded-2xl border border-upds-fog animate-pulse" />
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-4 p-10 bg-white rounded-2xl border border-upds-fog">
        <List className="w-10 h-10 text-upds-steel" />
        <p className="text-sm text-upds-graphite font-medium">
          No se pudieron cargar las listas. Es posible que este analisis no tenga datos de listas guardados.
        </p>
        <p className="text-xs text-upds-steel">
          Re-suba el archivo Excel para generar las listas de estudiantes.
        </p>
        <Link
          to={`/analisis/${id}`}
          className="text-xs font-semibold text-upds-celeste hover:text-upds-navy transition-colors"
        >
          Volver al analisis
        </Link>
      </div>
    )
  }

  const totalEstFiltrados = listasFiltradas.reduce((s, l) => s + l.total_estudiantes, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6 animate-fade-in-up">
        <div>
          <Link
            to={`/analisis/${id}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-upds-celeste hover:text-upds-navy transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al analisis
          </Link>
          <h1 className="text-2xl font-bold text-upds-navy tracking-tight">
            Listas de Estudiantes
          </h1>
          <p className="text-sm text-upds-graphite mt-1">
            {data.periodo_nombre} — {data.archivo_nombre}
          </p>
        </div>
        <button
          onClick={handleImprimir}
          disabled={imprimiendo || listasFiltradas.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-upds-navy text-white text-xs font-semibold rounded-xl hover:bg-upds-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Printer className="w-3.5 h-3.5" />
          {imprimiendo ? 'Generando...' : 'Imprimir PDF'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6 animate-fade-in-up stagger-1">
        <div className="bg-white rounded-xl shadow-card border border-upds-fog/80 px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-upds-celeste-pale flex items-center justify-center">
            <Filter className="w-4 h-4 text-upds-celeste" />
          </div>
          <div>
            <p className="text-lg font-bold text-upds-navy tabular-nums">{listasFiltradas.length}</p>
            <p className="text-[10px] text-upds-steel uppercase font-semibold tracking-wider">Grupos</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-upds-fog/80 px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-upds-navy/[0.06] flex items-center justify-center">
            <Users className="w-4 h-4 text-upds-navy" />
          </div>
          <div>
            <p className="text-lg font-bold text-upds-navy tabular-nums">{totalEstFiltrados}</p>
            <p className="text-[10px] text-upds-steel uppercase font-semibold tracking-wider">Estudiantes</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-upds-fog/80 px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-violet-pale flex items-center justify-center">
            <List className="w-4 h-4 text-accent-violet" />
          </div>
          <div>
            <p className="text-lg font-bold text-accent-violet tabular-nums">{data.total_grupos}</p>
            <p className="text-[10px] text-upds-steel uppercase font-semibold tracking-wider">Total grupos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de filtros */}
        <div className="animate-fade-in-up stagger-2">
          <div className="bg-white rounded-2xl shadow-card border border-upds-fog/80 p-5 sticky top-4">
            <h3 className="text-xs font-semibold text-upds-navy uppercase tracking-wider mb-4 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" />
              Filtros
            </h3>

            {/* Semestre */}
            <div className="mb-5">
              <label className="text-[11px] font-semibold text-upds-steel uppercase tracking-wider mb-2 block">
                Semestre
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFiltroSemestre(null)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filtroSemestre === null
                      ? 'bg-upds-navy text-white'
                      : 'bg-upds-fog/60 text-upds-graphite hover:bg-upds-fog'
                  }`}
                >
                  Todos
                </button>
                {data.filtros_disponibles.semestres.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFiltroSemestre(s === filtroSemestre ? null : s)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filtroSemestre === s
                        ? 'bg-upds-navy text-white'
                        : 'bg-upds-fog/60 text-upds-graphite hover:bg-upds-fog'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Turno */}
            <div className="mb-5">
              <label className="text-[11px] font-semibold text-upds-steel uppercase tracking-wider mb-2 block">
                Turno
              </label>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setFiltroTurno(null)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    filtroTurno === null
                      ? 'bg-upds-navy text-white'
                      : 'bg-upds-fog/60 text-upds-graphite hover:bg-upds-fog'
                  }`}
                >
                  Todos los turnos
                </button>
                {data.filtros_disponibles.turnos.map((t) => {
                  const Icon = TURNO_ICONS[t] || Sun
                  return (
                    <button
                      key={t}
                      onClick={() => setFiltroTurno(t === filtroTurno ? null : t)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        filtroTurno === t
                          ? 'bg-upds-navy text-white'
                          : 'bg-upds-fog/60 text-upds-graphite hover:bg-upds-fog'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Grupos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold text-upds-steel uppercase tracking-wider">
                  Grupos
                </label>
                <button
                  onClick={seleccionarTodos}
                  className="text-[10px] font-semibold text-upds-celeste hover:text-upds-navy transition-colors"
                >
                  {gruposSeleccionados.size === gruposVisibles.length && gruposVisibles.length > 0
                    ? 'Deseleccionar'
                    : 'Seleccionar todos'}
                </button>
              </div>
              <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
                {gruposVisibles.map((g) => (
                  <button
                    key={`${g.semestre}-${g.grupo}`}
                    onClick={() => toggleGrupo(g.grupo)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                      gruposSeleccionados.has(g.grupo)
                        ? 'bg-upds-celeste-pale text-upds-navy border border-upds-celeste/30'
                        : 'bg-upds-fog/40 text-upds-graphite hover:bg-upds-fog/80 border border-transparent'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                        gruposSeleccionados.has(g.grupo)
                          ? 'bg-upds-celeste text-white'
                          : 'bg-white border border-upds-steel/40'
                      }`}
                    >
                      {gruposSeleccionados.has(g.grupo) && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <span className="font-semibold">{g.grupo}</span>
                    <span className="text-upds-steel ml-auto tabular-nums">S{g.semestre}</span>
                    <span className="text-upds-steel tabular-nums">{g.total}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Botón limpiar filtros */}
            {(filtroSemestre !== null || filtroTurno !== null || gruposSeleccionados.size > 0) && (
              <button
                onClick={() => {
                  setFiltroSemestre(null)
                  setFiltroTurno(null)
                  setGruposSeleccionados(new Set())
                }}
                className="w-full mt-4 px-3 py-2 rounded-lg text-xs font-medium text-accent-rose bg-accent-rose-pale/50 hover:bg-accent-rose-pale transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Panel de listas */}
        <div className="lg:col-span-3 space-y-4 animate-fade-in-up stagger-3">
          {listasFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-card border border-upds-fog/80 px-6 py-16 text-center">
              <List className="w-10 h-10 text-upds-steel mx-auto mb-3" />
              <p className="text-sm font-medium text-upds-graphite">
                No hay listas que coincidan con los filtros seleccionados
              </p>
            </div>
          ) : (
            listasFiltradas.map((lista) => {
              const key = `${lista.semestre}-${lista.grupo}`
              const isExpanded = expandidos.has(key)
              const TurnoIcon = TURNO_ICONS[lista.turno] || Sun

              return (
                <div
                  key={key}
                  className="bg-white rounded-2xl shadow-card border border-upds-fog/80 overflow-hidden transition-all duration-200"
                >
                  {/* Header clickable */}
                  <button
                    onClick={() => toggleExpandido(key)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-upds-celeste-ghost/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-upds-navy/[0.06] flex items-center justify-center">
                        <span className="text-sm font-bold text-upds-navy">{lista.grupo}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-upds-navy">
                          Semestre {lista.semestre} — Grupo {lista.grupo}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="inline-flex items-center gap-1 text-xs text-upds-graphite">
                            <TurnoIcon className="w-3 h-3" />
                            {lista.turno}
                          </span>
                          <span className="text-xs text-upds-steel">
                            {lista.total_estudiantes} estudiantes
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-upds-navy tabular-nums">
                        {lista.total_estudiantes}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-upds-steel" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-upds-steel" />
                      )}
                    </div>
                  </button>

                  {/* Lista expandida */}
                  {isExpanded && (
                    <div className="border-t border-upds-fog">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-upds-ice">
                              <th className="px-6 py-2.5 text-[11px] font-semibold text-upds-steel uppercase tracking-wider w-14 text-center">
                                N
                              </th>
                              <th className="px-6 py-2.5 text-[11px] font-semibold text-upds-steel uppercase tracking-wider text-left">
                                Codigo
                              </th>
                              <th className="px-6 py-2.5 text-[11px] font-semibold text-upds-steel uppercase tracking-wider text-left">
                                Nombre Completo
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-upds-fog/60">
                            {lista.estudiantes.map((est, i) => (
                              <tr
                                key={est.id}
                                className="hover:bg-upds-celeste-ghost/30 transition-colors"
                              >
                                <td className="px-6 py-2.5 text-xs text-upds-steel text-center tabular-nums">
                                  {i + 1}
                                </td>
                                <td className="px-6 py-2.5 text-xs text-upds-graphite font-mono">
                                  {est.id}
                                </td>
                                <td className="px-6 py-2.5 text-sm text-upds-navy font-medium">
                                  {est.nombre}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
