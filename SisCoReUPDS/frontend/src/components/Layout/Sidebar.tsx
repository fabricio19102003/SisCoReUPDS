import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileUp,
  BarChart3,
  Users,
  Settings,
  GraduationCap,
  Activity,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/upload', label: 'Cargar Archivo', icon: FileUp },
  { to: '/analisis', label: 'Análisis', icon: BarChart3 },
  { to: '/repitentes', label: 'Repitentes', icon: Users },
  { to: '/config', label: 'Configuración', icon: Settings },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-[272px] h-screen bg-upds-navy flex flex-col shadow-sidebar relative overflow-hidden sticky top-0">
      {/* Subtle geometric pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 20px,
            rgba(255,255,255,0.5) 20px,
            rgba(255,255,255,0.5) 21px
          )`,
        }}
      />

      {/* Logo / Brand */}
      <div className="relative z-10 px-6 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-upds-celeste/20 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-upds-celeste-light" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-white tracking-tight leading-none">
              SisCoRe
            </h1>
            <p className="text-[11px] text-upds-celeste/70 font-medium tracking-wider uppercase mt-0.5">
              UPDS Medicina
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-white/[0.07]" />

      {/* Navigation */}
      <nav className="relative z-10 flex-1 px-4 py-5">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to)

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={`
                    group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium
                    transition-all duration-200 relative
                    ${isActive
                      ? 'bg-upds-celeste/15 text-white'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                    }
                  `}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-upds-celeste rounded-r-full" />
                  )}
                  <item.icon
                    className={`w-[18px] h-[18px] transition-colors duration-200 ${
                      isActive ? 'text-upds-celeste-light' : 'text-white/40 group-hover:text-white/60'
                    }`}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  {item.label}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom status */}
      <div className="relative z-10 px-5 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-accent-emerald" />
          <span className="text-[11px] text-white/40 font-medium">Sistema activo</span>
        </div>
        <p className="text-[10px] text-white/20 mt-1.5 tracking-wide">
          v1.0.0 — Conteo y Reportes
        </p>
      </div>
    </aside>
  )
}
