import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatHnl } from '@/utils/money'
import { dashboardApi, lotesApi } from '@/services/api'
import { toast } from 'sonner'

interface DashboardStats {
  lotes_activos: number
  aves_vivas: number
  peso_promedio: number
  mortalidad_mes: number
  costo_promedio_lb: number
  lotes_proceso: number
}

interface AlertItem {
  id: string
  tipo: 'warning' | 'danger' | 'info'
  mensaje: string
  lote_id?: string
}

interface LoteItem {
  id: string
  numero_lote: string
  estado: string
  cantidad_actual: number
  peso_promedio_actual?: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [alertas, setAlertas] = useState<AlertItem[]>([])
  const [lotesRecientes, setLotesRecientes] = useState<LoteItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, alertasRes, lotesRes] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getAlerts(),
          lotesApi.list(),
        ])
        setStats(statsRes.data)
        setAlertas(alertasRes.data || [])
        setLotesRecientes(lotesRes.data?.slice(0, 5) || [])
      } catch {
        toast.error('Error al cargar datos del dashboard')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Cargando...</div>
  }

  const getEstadoBadge = (estado: string) => {
    const map: Record<string, string> = {
      ACTIVO: 'badge-success',
      EN_CRIANZA: 'badge-info',
      EN_PROCESO: 'badge-primary',
      CERRADO: 'badge-warning',
      LIQUIDADO: 'badge-neutral',
    }
    return map[estado] || 'badge-neutral'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500">Resumen ejecutivo del sistema</p>
        </div>
        <span className="text-sm text-slate-500">
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Lotes Activos"
          value={stats?.lotes_activos.toString() || '0'}
          subtitle="lotes en cría"
          icon="🐔"
          color="primary"
        />
        <KPICard
          title="Aves Vivas"
          value={stats?.aves_vivas.toLocaleString() || '0'}
          subtitle="pollos en inventario"
          icon="🦌"
          color="green"
        />
        <KPICard
          title="Peso Promedio"
          value={stats?.peso_promedio ? `${stats.peso_promedio.toFixed(2)} lb` : '- lb'}
          subtitle="por ave"
          icon="⚖️"
          color="blue"
        />
        <KPICard
          title="Costo / Libra"
          value={stats?.costo_promedio_lb ? formatHnl(stats.costo_promedio_lb, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
          subtitle="costo vivo"
          icon="💵"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Resumen Mensual</h2>
            <select className="input w-32">
              <option>Este mes</option>
              <option>Mes anterior</option>
              <option>Último trimestre</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryItem label="Mortalidad" value={stats?.mortalidad_mes ? `${stats.mortalidad_mes.toFixed(1)}%` : '0%'} trend="-0.3" />
            <SummaryItem label="Lotes en Proceso" value={stats?.lotes_proceso.toString() || '0'} trend="+1" />
            <SummaryItem label="Conv. Alimenticia" value="1.85" trend="+0.05" />
            <SummaryItem label="Índice Mortalidad" value={stats?.mortalidad_mes ? `${stats.mortalidad_mes.toFixed(1)}%` : '0%'} trend="ok" />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Alertas</h2>
          {alertas.length === 0 ? (
            <div className="text-center py-4 text-slate-400">Sin alertas</div>
          ) : (
            <div className="space-y-3">
              {alertas.map((alerta) => (
                <AlertItem key={alerta.id} alerta={alerta} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Lotes Recientes</h2>
            <Link to="/lotes" className="text-sm text-primary-600 hover:text-primary-700">
              Ver todos →
            </Link>
          </div>
          {lotesRecientes.length === 0 ? (
            <div className="text-center py-4 text-slate-400">No hay lotes registrados</div>
          ) : (
            <div className="space-y-2">
              {lotesRecientes.map((lote) => (
                <Link
                  key={lote.id}
                  to={`/lotes/${lote.id}`}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-800">{lote.numero_lote}</p>
                    <p className="text-sm text-slate-500">
                      {lote.cantidad_actual.toLocaleString()} aves{lote.peso_promedio_actual ? ` • ${lote.peso_promedio_actual} lb` : ''}
                    </p>
                  </div>
                  <span className={`badge ${getEstadoBadge(lote.estado)}`}>
                    {lote.estado.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Acciones Rápidas</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction label="Nuevo Lote" icon="➕" path="/lotes/nuevo" />
            <QuickAction label="Registrar Pesaje" icon="⚖️" path="/pesajes/nuevo" />
            <QuickAction label="Registrar Mortalidad" icon="☠️" path="/mortalidad/nuevo" />
            <QuickAction label="Registrar Costo" icon="💰" path="/costos/nuevo" />
            <QuickAction label="Procesamiento" icon="🏭" path="/procesamiento/nuevo" />
            <QuickAction label="Reportes" icon="📈" path="/reportes" />
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color 
}: { 
  title: string
  value: string
  subtitle: string
  icon: string
  color: 'primary' | 'green' | 'blue' | 'purple'
}) {
  const colorClasses = {
    primary: 'bg-primary-50 border-primary-200 text-primary-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  }
  
  return (
    <div className={`card p-5 border-l-4 ${colorClasses[color].split(' ')[0]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  )
}

function SummaryItem({ label, value, trend }: { label: string; value: string; trend: string }) {
  const trendClass = trend.startsWith('+') ? 'text-green-600' : trend.startsWith('-') ? 'text-red-600' : 'text-slate-600'
  
  return (
    <div className="text-center p-4 bg-slate-50 rounded-lg">
      <p className="text-lg font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {trend !== 'ok' && (
        <p className={`text-xs mt-1 ${trendClass}`}>{trend}</p>
      )}
    </div>
  )
}

function AlertItem({ alerta }: { alerta: AlertItem }) {
  const colors = {
    warning: 'bg-yellow-50 border-yellow-300 text-yellow-800',
    danger: 'bg-red-50 border-red-300 text-red-800',
    info: 'bg-blue-50 border-blue-300 text-blue-800',
  }
  
  return (
    <div className={`p-3 rounded-lg border ${colors[alerta.tipo]}`}>
      <p className="text-sm">{alerta.mensaje}</p>
    </div>
  )
}

function QuickAction({ label, icon, path }: { label: string; icon: string; path: string }) {
  return (
    <Link
      to={path}
      className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </Link>
  )
}