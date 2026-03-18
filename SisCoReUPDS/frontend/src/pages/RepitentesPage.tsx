import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAnalisisList, getRepitentes } from '../api/client'
import {
  Users,
  Search,
  Filter,
} from 'lucide-react'

export default function RepitentesPage() {
  const [analisisId, setAnalisisId] = useState<number | ''>('')
  const [buscar, setBuscar] = useState('')
  const [semestrePrincipal, setSemestrePrincipal] = useState<number | ''>('')
  const [semestreRepite, setSemestreRepite] = useState<number | ''>('')

  const { data: analisisList } = useQuery({
    queryKey: ['analisis'],
    queryFn: getAnalisisList,
  })

  const { data: repitentes, isLoading } = useQuery({
    queryKey: ['repitentes', analisisId, buscar, semestrePrincipal, semestreRepite],
    queryFn: () =>
      getRepitentes(analisisId as number, {
        buscar: buscar || undefined,
        semestre_principal: semestrePrincipal || undefined,
        semestre_repite: semestreRepite || undefined,
      }),
    enabled: analisisId !== '',
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-2xl font-bold text-upds-navy tracking-tight">
          Estudiantes Repitentes
        </h1>
        <p className="text-sm text-upds-graphite mt-1">
          Consulta y filtra los estudiantes que repiten en múltiples semestres
        </p>
      </div>

      {/* Filters */}
      <div className="animate-fade-in-up stagger-1 bg-white rounded-2xl shadow-card border border-upds-fog/80 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-upds-celeste" />
          <h2 className="text-sm font-semibold text-upds-navy">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-upds-steel uppercase tracking-wider mb-1.5">
              Análisis
            </label>
            <select
              value={analisisId}
              onChange={(e) => setAnalisisId(e.target.value ? Number(e.target.value) : '')}
              className="w-full border border-upds-fog rounded-xl px-3 py-2.5 text-sm text-upds-ink bg-upds-ice/50 focus:outline-none focus:ring-2 focus:ring-upds-celeste/30 focus:border-upds-celeste transition-all"
            >
              <option value="">Seleccionar...</option>
              {analisisList?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.periodo_nombre} — {a.archivo_nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-upds-steel uppercase tracking-wider mb-1.5">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-upds-steel" />
              <input
                type="text"
                placeholder="Nombre o ID..."
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                className="w-full border border-upds-fog rounded-xl pl-9 pr-3 py-2.5 text-sm text-upds-ink bg-upds-ice/50 focus:outline-none focus:ring-2 focus:ring-upds-celeste/30 focus:border-upds-celeste transition-all placeholder:text-upds-steel/60"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-upds-steel uppercase tracking-wider mb-1.5">
              Sem. principal
            </label>
            <input
              type="number"
              min={1}
              max={10}
              placeholder="1-10"
              value={semestrePrincipal}
              onChange={(e) => setSemestrePrincipal(e.target.value ? Number(e.target.value) : '')}
              className="w-full border border-upds-fog rounded-xl px-3 py-2.5 text-sm text-upds-ink bg-upds-ice/50 focus:outline-none focus:ring-2 focus:ring-upds-celeste/30 focus:border-upds-celeste transition-all placeholder:text-upds-steel/60"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-upds-steel uppercase tracking-wider mb-1.5">
              Sem. donde repite
            </label>
            <input
              type="number"
              min={1}
              max={10}
              placeholder="1-10"
              value={semestreRepite}
              onChange={(e) => setSemestreRepite(e.target.value ? Number(e.target.value) : '')}
              className="w-full border border-upds-fog rounded-xl px-3 py-2.5 text-sm text-upds-ink bg-upds-ice/50 focus:outline-none focus:ring-2 focus:ring-upds-celeste/30 focus:border-upds-celeste transition-all placeholder:text-upds-steel/60"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {analisisId === '' ? (
        <div className="animate-fade-in-up stagger-2 bg-white rounded-2xl shadow-card border border-upds-fog/80 px-6 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-upds-celeste-ghost flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-upds-celeste" />
          </div>
          <p className="text-sm font-medium text-upds-graphite">
            Selecciona un análisis para ver los repitentes
          </p>
          <p className="text-xs text-upds-steel mt-1.5">
            Usa los filtros de arriba para refinar la búsqueda
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-white rounded-xl border border-upds-fog animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="animate-fade-in-up stagger-2 bg-white rounded-2xl shadow-card border border-upds-fog/80">
          {/* Result count */}
          <div className="px-6 py-4 border-b border-upds-fog flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-upds-navy/[0.07] text-upds-navy text-xs font-bold tabular-nums">
                {repitentes?.length ?? 0}
              </span>
              <span className="text-xs text-upds-steel">repitentes encontrados</span>
            </div>
          </div>

          {!repitentes?.length ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-upds-steel">
                No se encontraron repitentes con los filtros aplicados
              </p>
            </div>
          ) : (
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
                      Sem. Principal
                    </th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-upds-steel uppercase tracking-wider">
                      Semestres donde repite
                    </th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-upds-steel uppercase tracking-wider">
                      Todos los semestres
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-upds-fog/60">
                  {repitentes.map((r) => (
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
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-upds-celeste-pale text-upds-navy-mid text-xs font-bold">
                          {r.semestre_principal}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex gap-1.5 flex-wrap">
                          {r.semestres_donde_repite.map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 rounded-md bg-accent-amber-pale text-accent-amber text-[11px] font-semibold tabular-nums"
                            >
                              Sem {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-upds-steel tabular-nums">
                        {r.todos_los_semestres.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
