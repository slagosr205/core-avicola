import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { sidebarItems } from './sidebarItems'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-background">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } flex-shrink-0 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col`}
      >
        <div className="h-14 flex items-center justify-center border-b border-slate-200">
          {sidebarOpen ? (
            <div className="flex items-center gap-2 px-4">
              <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CA</span>
              </div>
              <span className="font-semibold text-slate-800">Core Avicola</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CA</span>
            </div>
          )}
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path))
              return (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full sidebar-item ${
                      isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
                    }`}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
        
        <div className="p-3 border-t border-slate-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full sidebar-item sidebar-item-inactive justify-center"
          >
            <span>{sidebarOpen ? '◀' : '▶'}</span>
            {sidebarOpen && <span>Colapsar</span>}
          </button>
        </div>
      </aside>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-800">
              Sistema de Gestión Avícola
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative">
              <span>🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 text-sm font-medium">A</span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-slate-700">Administrador</p>
                <p className="text-xs text-slate-500">admin@coreavicola.com</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
              title="Cerrar sesión"
            >
              <span>🚪</span>
            </button>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}