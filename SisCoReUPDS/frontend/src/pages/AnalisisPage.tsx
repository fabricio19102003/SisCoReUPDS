import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { getAnalisisCompleto, getAnalisisList, exportarAnalisis } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Users,
  Layers,
  Grid3X3,
  Download,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
} from 'lucide-react'

const CHART_COLORS = {
  regulares: '#1a2b5f',
  repitentes: '#4a90d9',
  pie: ['#0f1d42', '#1a2b5f', '#243a7a', '#4a90d9', '#6bb0f0', '#8b5cf6'],
}

export default function AnalisisPage() {
  const { id } = useParams<{ id: string }>()
  if (id) return <AnalisisDetalle id={Number(id)} />
  return <AnalisisListado />
}

function AnalisisListado() {
  const { data: analisis, isLoading } = useQuery({
    queryKey: ['analisis'],
    queryFn: getAnalisisList,
  })

  if (isLoading) {
    return (
      <div>
        <div className="h-7 w-52 bg-upds-fog rounded-lg animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-upds-fog animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-2xl font-bold text-upds-navy tracking-tight">
          Historial de Análisis
        </h1>
        <p className="text-sm text-upds-graphite mt-1">
          Todos los análisis de matriculados realizados
        </p>
      </div>

      {!analisis?.length ? (
        <div className="bg-white rounded-2xl shadow-card border border-upds-fog/80 px-6 py-16 text-center animate-fade-in-up">
          <div className="w-14 h-14 rounded-2xl bg-upds-celeste-ghost flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-6 h-6 text-upds-celeste" />
          </div>
          <p className="text-sm font-medium text-upds-graphite">No hay análisis registrados</p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-upds-celeste hover:text-upds-navy transition-colors"
          >
            Subir un archivo para comenzar
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {analisis.map((a, i) => (
            <Link
              key={a.id}
              to={`/analisis/${a.id}`}
              className={`animate-fade-in-up stagger-${Math.min(i + 1, 4)} group bg-white rounded-2xl shadow-card border border-upds-fog/80 p-6 hover:shadow-card-hover transition-all duration-300 flex justify-between items-center`}
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-upds-navy/[0.06] flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-upds-navy" />
                </div>
                <div>
                  <p className="font-semibold text-upds-navy text-sm">
                    {a.periodo_nombre}
                    <span className="text-upds-steel font-normal ml-2">—</span>
                    <span className="text-upds-graphite font-normal ml-2">{a.archivo_nombre}</span>
                  </p>
                  <p className="text-xs text-upds-steel mt-1 tabular-nums">
                    {new Date(a.fecha_analisis).toLocaleDateString('es-BO', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-2xl font-bold text-upds-navy tabular-nums">{a.total_unicos}</p>
                  <p className="text-[11px] text-upds-steel">estudiantes</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-accent-amber tabular-nums">{a.total_repitentes}</p>
                  <p className="text-[11px] text-upds-steel">repitentes</p>
                </div>
                <ArrowRight className="w-4 h-4 text-upds-steel group-hover:text-upds-celeste transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function AnalisisDetalle({ id }: { id: number }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analisis', id],
    queryFn: () => getAnalisisCompleto(id),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-64 bg-upds-fog rounded-lg animate-pulse" />
        <div className="grid grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-upds-fog animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-white rounded-2xl border border-upds-fog animate-pulse" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center gap-3 p-6 bg-accent-rose-pale/30 rounded-2xl border border-accent-rose/20">
        <AlertTriangle className="w-5 h-5 text-accent-rose" />
        <p className="text-sm text-accent-rose font-medium">Error al cargar el análisis</p>
      </div>
    )
  }

  const analisis = data.resumen
  const semestres = data.detalle_semestres
  const grupos = data.detalle_grupos

  const chartData = [...semestres]
    .sort((a, b) => a.semestre - b.semestre)
    .map((s) => ({
      semestre: `Sem ${s.semestre}`,
      Regulares: s.regulares,
      Repitentes: s.repitentes,
    }))

  const turnoMap: Record<string, number> = {}
  grupos.forEach((g) => {
    const turno = g.turno || 'Sin turno'
    turnoMap[turno] = (turnoMap[turno] || 0) + g.matriculados
  })
  const turnoData = Object.entries(turnoMap).map(([name, value]) => ({ name, value }))

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-8 animate-fade-in-up">
        <div>
          <Link
            to="/analisis"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-upds-celeste hover:text-upds-navy transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al historial
          </Link>
          <h1 className="text-2xl font-bold text-upds-navy tracking-tight">
            {analisis.periodo_nombre}
          </h1>
          <p className="text-sm text-upds-graphite mt-1">
            {analisis.archivo_nombre} — {new Date(analisis.fecha_analisis).toLocaleDateString('es-BO', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportarAnalisis(id, 'excel')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-emerald/10 text-accent-emerald text-xs font-semibold rounded-xl hover:bg-accent-emerald/20 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Excel
          </button>
          <button
            onClick={() => exportarAnalisis(id, 'pdf')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-rose/10 text-accent-rose text-xs font-semibold rounded-xl hover:bg-accent-rose/20 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <MiniCard icon={Users} label="Total Estudiantes" value={analisis.total_unicos} color="navy" className="stagger-1" />
        <MiniCard icon={Users} label="Repitentes" value={analisis.total_repitentes} color="amber" className="stagger-2" />
        <MiniCard icon={Layers} label="Semestres" value={semestres.length} color="celeste" className="stagger-3" />
        <MiniCard icon={Grid3X3} label="Grupos" value={grupos.length} color="violet" className="stagger-4" />
      </div>

      {/* Warnings */}
      {analisis.materias_no_encontradas?.length > 0 && (
        <div className="animate-fade-in-up flex items-start gap-3 p-4 rounded-xl bg-accent-amber-pale/50 border border-accent-amber/20 mb-8">
          <AlertTriangle className="w-4 h-4 text-accent-amber mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-accent-amber">
              {analisis.materias_no_encontradas.length} materias no encontradas en la malla
            </p>
            <p className="text-xs text-accent-amber/70 mt-1 font-mono">
              {analisis.materias_no_encontradas.join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-upds-fog/80 p-6 animate-fade-in-up stagger-2">
          <h2 className="text-sm font-semibold text-upds-navy mb-5">Estudiantes por Semestre</h2>
          <ResponsiveContainer width="100%" height={300}>
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
              <Bar dataKey="Regulares" fill={CHART_COLORS.regulares} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Repitentes" fill={CHART_COLORS.repitentes} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-upds-fog/80 p-6 animate-fade-in-up stagger-3">
          <h2 className="text-sm font-semibold text-upds-navy mb-5">Distribución por Turno</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={turnoData}
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={50}
                dataKey="value"
                paddingAngle={3}
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={{ stroke: '#94a3b8' }}
              >
                {turnoData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS.pie[i % CHART_COLORS.pie.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #edf1f7',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(15,29,66,0.08)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Semester table */}
      <div className="bg-white rounded-2xl shadow-card border border-upds-fog/80 mb-8 animate-fade-in-up stagger-3">
        <div className="px-6 py-5 border-b border-upds-fog">
          <h2 className="text-sm font-semibold text-upds-navy">Detalle por Semestre</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-3 text-[11px] font-semibold text-upds-steel uppercase tracking-wider">Semestre</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-upds-steel uppercase tracking-wider text-right">Únicos</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-upds-steel uppercase tracking-wider text-right">Regulares</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-upds-steel uppercase tracking-wider text-right">Repitentes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-upds-fog/60">
              {[...semestres]
                .sort((a, b) => a.semestre - b.semestre)
                .map((s) => (
                  <tr key={s.semestre} className="hover:bg-upds-celeste-ghost/30 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-upds-navy">
                        <span className="w-6 h-6 rounded-md bg-upds-navy/[0.07] flex items-center justify-center text-[11px] font-bold text-upds-navy tabular-nums">
                          {s.semestre}
                        </span>
                        Semestre {s.semestre}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right text-sm font-bold text-upds-navy tabular-nums">{s.unicos}</td>
                    <td className="px-6 py-3.5 text-right text-sm text-upds-celeste font-semibold tabular-nums">{s.regulares}</td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-accent-amber-pale text-accent-amber text-xs font-bold tabular-nums">
                        {s.repitentes}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Groups table */}
      <div className="bg-white rounded-2xl shadow-card border border-upds-fog/80 animate-fade-in-up stagger-4">
        <div className="px-6 py-5 border-b border-upds-fog">
          <h2 className="text-sm font-semibold text-upds-navy">Detalle por Grupo</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-3 text-[11px] font-semibold text-upds-steel uppercase tracking-wider">Semestre</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-upds-steel uppercase tracking-wider">Grupo</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-upds-steel uppercase tracking-wider">Turno</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-upds-steel uppercase tracking-wider text-right">Matriculados</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-upds-steel uppercase tracking-wider text-right">Repitentes</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-upds-steel uppercase tracking-wider">Desglose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-upds-fog/60">
              {[...grupos]
                .sort((a, b) => a.semestre - b.semestre || a.nombre_grupo.localeCompare(b.nombre_grupo))
                .map((g, i) => (
                  <tr key={`${g.semestre}-${g.nombre_grupo}-${i}`} className="hover:bg-upds-celeste-ghost/30 transition-colors">
                    <td className="px-6 py-3 text-xs text-upds-steel tabular-nums">Sem {g.semestre}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-upds-celeste-pale text-upds-navy-mid text-xs font-semibold">
                        {g.nombre_grupo}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-upds-graphite">{g.turno}</td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-upds-navy tabular-nums">{g.matriculados}</td>
                    <td className="px-6 py-3 text-right text-xs text-accent-amber font-semibold tabular-nums">{g.repitentes_count}</td>
                    <td className="px-6 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {Object.entries(g.letras_desglose || {}).map(([letra, count]) => (
                          <span key={letra} className="px-1.5 py-0.5 rounded bg-upds-fog/80 text-[10px] font-mono text-upds-graphite">
                            {letra}:{count}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MiniCard({
  icon: Icon,
  label,
  value,
  color,
  className = '',
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  value: number
  color: 'navy' | 'celeste' | 'amber' | 'violet'
  className?: string
}) {
  const styles = {
    navy: { bg: 'bg-upds-navy/[0.06]', icon: 'text-upds-navy', val: 'text-upds-navy' },
    celeste: { bg: 'bg-upds-celeste-pale', icon: 'text-upds-celeste', val: 'text-upds-celeste' },
    amber: { bg: 'bg-accent-amber-pale', icon: 'text-accent-amber', val: 'text-accent-amber' },
    violet: { bg: 'bg-accent-violet-pale', icon: 'text-accent-violet', val: 'text-accent-violet' },
  }
  const s = styles[color]

  return (
    <div className={`animate-fade-in-up bg-white rounded-2xl shadow-card border border-upds-fog/80 p-5 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-upds-steel uppercase tracking-wider">{label}</span>
        <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 ${s.icon}`} strokeWidth={2} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${s.val} tracking-tight tabular-nums`}>{value}</p>
    </div>
  )
}
