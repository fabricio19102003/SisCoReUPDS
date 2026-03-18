import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-upds-ice">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top accent line */}
        <div className="h-[2px] bg-gradient-to-r from-upds-navy via-upds-celeste to-upds-celeste-light" />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
