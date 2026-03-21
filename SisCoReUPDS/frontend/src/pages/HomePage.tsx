import { useQuery } from '@tanstack/react-query'
import { getAnalisisList, getPeriodos, getTendencia } from '../api/client'
import { Link } from 'react-router-dom'
import {
  Users,
  CalendarRange,
  BarChart3,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Clock,
  GitCompareArrows,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'

export default function HomePage() {
  const { data: analisis, isLoading: loadingAnalisis } = useQuery({
    queryKey: ['analisis'],
    queryFn: getAnalisisList,
  })
  const { data: periodos, isLoading: loadingPeriodos } = useQuery({
    queryKey: ['periodos'],
    queryFn: getPeriodos,
  })
  const { data: tendencia, isLoading: loadingTendencia } = useQuery({
    queryKey: ['tendencia'],
    queryFn: () => getTendencia(5),
  })

  if (loadingAnalisis || loadingPeriodos) return <LoadingSkeleton />

  const ultimoAnalisis = analisis?.[analisis.length - 1]

  return (
    <div>
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-2xl font-bold text-upds-navy tracking-tight">
          Panel de Control
        </h1>
        <p className="text-sm text-upds-graphite mt-1">
          Resumen general del sistema de matriculados
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon={CalendarRange}
          label="Períodos"
          value={periodos?.length ?? 0}
          subtitle="registrados"
          accentColor="navy"
          className="stagger-1"
        />
        <StatCard
          icon={BarChart3}
          label="Análisis"
          value={analisis?.length ?? 0}
          subtitle="realizados"
          accentColor="celeste"
          className="stagger-2"
        />
        <StatCard
          icon={Users}
          label="Estudiantes"
          value={ultimoAnalisis?.total_unicos ?? 0}
          subtitle="último análisis"
          accentColor="emerald"
          className="stagger-3"
        />
        <StatCard
          icon={TrendingUp}
          label="Repitentes"
          value={ultimoAnalisis?.total_repitentes ?? 0}
          subtitle="detectados"
          accentColor="amber"
          className="stagger-4"
        />
      </div>

      {/* Trend Widget */}
      <TrendWidget periodos={tendencia?.periodos ?? []} isLoading={loadingTendencia} />

      {/* Recent Analysis Table */}
      <div className="bg-white rounded-2xl shadow-card border border-upds-fog/80 animate-fade-in-up stagger-3">
        <div className="px-6 py-5 border-b border-upds-fog flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-upds-celeste-pale flex items-center justify-center">
              <Clock className="w-4 h-4 text-upds-celeste" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-upds-navy">
                Análisis recientes
              </h2>
              <p className="text-xs text-upds-steel mt-0.5">
                Historial de archivos procesados
              </p>
            </div>
          </div>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-upds-navy text-white text-xs font-semibold rounded-lg hover:bg-upds-navy-light transition-colors duration-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Nuevo análisis
          </Link>
        </div>

        {!analisis?.length ? (
          <div className="px-6 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-upds-celeste-ghost flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-upds-celeste" />
            </div>
            <p className="text-sm font-medium text-upds-graphite">
              No hay análisis registrados
            </p>
            <p className="text-xs text-upds-steel mt-1.5">
              Sube un archivo Excel de matriculados para comenzar
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-upds-celeste hover:text-upds-navy transition-colors"
            >
              Ir a cargar archivo
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="px-6 py-3 text-[11px] font-semibold text-upds-steel uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-upds-steel uppercase tracking-wider">
                    Archivo
                  </th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-upds-steel uppercase tracking-wider text-right">
                    Estudiantes
                  </th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-upds-steel uppercase tracking-wider text-right">
                    Repitentes
                  </th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-upds-steel uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-upds-fog/60">
                {analisis.map((a) => (
                  <tr
                    key={a.id}
                    className="group hover:bg-upds-celeste-ghost/50 transition-colors duration-150"
                  >
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-upds-navy/[0.06] text-upds-navy text-xs font-semibold">
                        {a.periodo_nombre}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-upds-graphite">
                      {a.archivo_nombre}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="text-sm font-bold text-upds-navy tabular-nums">
                        {a.total_unicos}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded-full bg-accent-amber-pale text-accent-amber text-xs font-bold tabular-nums">
                        {a.total_repitentes}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-upds-steel tabular-nums">
                      {new Date(a.fecha_analisis).toLocaleDateString('es-BO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-3.5">
                      <Link
                        to={`/analisis/${a.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-upds-celeste hover:text-upds-navy transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Ver detalle
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  accentColor,
  className = '',
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  value: number | string
  subtitle: string
  accentColor: 'navy' | 'celeste' | 'emerald' | 'amber'
  className?: string
}) {
  const colorMap = {
    navy: {
      iconBg: 'bg-upds-navy/[0.07]',
      iconColor: 'text-upds-navy',
      valuColor: 'text-upds-navy',
    },
    celeste: {
      iconBg: 'bg-upds-celeste-pale',
      iconColor: 'text-upds-celeste',
      valuColor: 'text-upds-celeste',
    },
    emerald: {
      iconBg: 'bg-accent-emerald-pale',
      iconColor: 'text-accent-emerald',
      valuColor: 'text-accent-emerald',
    },
    amber: {
      iconBg: 'bg-accent-amber-pale',
      iconColor: 'text-accent-amber',
      valuColor: 'text-accent-amber',
    },
  }

  const colors = colorMap[accentColor]

  return (
    <div
      className={`animate-fade-in-up bg-white rounded-2xl shadow-card border border-upds-fog/80 p-5 hover:shadow-card-hover transition-shadow duration-300 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-upds-steel uppercase tracking-wider">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-lg ${colors.iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${colors.iconColor}`} strokeWidth={2} />
        </div>
      </div>
      <p className={`text-3xl font-bold ${colors.valuColor} tracking-tight tabular-nums`}>
        {value}
      </p>
      <p className="text-xs text-upds-steel mt-1">{subtitle}</p>
    </div>
  )
}

function TrendWidget({
  periodos,
  isLoading,
}: {
  periodos: Array<{
    periodo_id: number
    periodo_nombre: string
    total_unicos: number
    total_repitentes: number
  }>
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-upds-fog/80 mb-8 animate-pulse h-64" />
    )
  }

  if (periodos.length < 2) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-upds-fog/80 mb-8 animate-fade-in-up stagger-3">
        <div className="px-6 py-5 border-b border-upds-fog flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-upds-celeste-pale flex items-center justify-center">
            <GitCompareArrows className="w-4 h-4 text-upds-celeste" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-upds-navy">
              Tendencia de Matriculacion
            </h2>
            <p className="text-xs text-upds-steel mt-0.5">
              Evolucion entre periodos
            </p>
          </div>
        </div>
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-upds-steel">
            Se necesitan al menos 2 periodos para mostrar tendencia
          </p>
        </div>
      </div>
    )
  }

  const chartData = periodos.map((p) => ({
    name: p.periodo_nombre,
    unicos: p.total_unicos,
    repitentes: p.total_repitentes,
  }))

  return (
    <div className="bg-white rounded-2xl shadow-card border border-upds-fog/80 mb-8 animate-fade-in-up stagger-3">
      <div className="px-6 py-5 border-b border-upds-fog flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-upds-celeste-pale flex items-center justify-center">
            <GitCompareArrows className="w-4 h-4 text-upds-celeste" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-upds-navy">
              Tendencia de Matriculacion
            </h2>
            <p className="text-xs text-upds-steel mt-0.5">
              Evolucion de estudiantes entre periodos
            </p>
          </div>
        </div>
        <Link
          to="/comparativa"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-upds-celeste hover:text-upds-navy transition-colors"
        >
          Ver comparativa
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="px-6 py-5">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                fontSize: '12px',
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            />
            <Line
              type="monotone"
              dataKey="unicos"
              name="Estudiantes"
              stroke="#0c2340"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#0c2340' }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="repitentes"
              name="Repitentes"
              stroke="#d97706"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#d97706' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div>
      <div className="mb-8">
        <div className="h-7 w-44 bg-upds-fog rounded-lg animate-pulse" />
        <div className="h-4 w-64 bg-upds-fog rounded mt-2 animate-pulse" />
      </div>
      <div className="grid grid-cols-4 gap-5 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white rounded-2xl border border-upds-fog animate-pulse" />
        ))}
      </div>
      <div className="h-80 bg-white rounded-2xl border border-upds-fog animate-pulse" />
    </div>
  )
}
