import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { formatHnl } from '@/utils/money'
import { lotesApi, pesajesApi, mortalidadApi, costosApi } from '@/services/api'

export default function LoteDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('pesajes')
  const [lote, setLote] = useState<any>(null)
  const [pesajes, setPesajes] = useState<any[]>([])
  const [mortalidad, setMortalidad] = useState<any[]>([])
  const [costos, setCostos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!id) return
      try {
        const [loteRes, pesajesRes, mortalidadRes, costosRes] = await Promise.all([
          lotesApi.get(id),
          pesajesApi.list(id),
          mortalidadApi.list(id),
          costosApi.list(id),
        ])
        setLote(loteRes.data)
        setPesajes(pesajesRes.data || [])
        setMortalidad(mortalidadRes.data || [])
        setCostos(costosRes.data || [])
      } catch {
        toast.error('Error al cargar datos del lote')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

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

  const mortalidadTotal = mortalidad.reduce((sum, m) => sum + (m.cantidad || 0), 0)
  const costosTotal = costos.reduce((sum, c) => sum + (c.monto || 0), 0)
  const pesoTotalMortalidad = mortalidad.reduce((sum, m) => sum + (m.peso_estimado || 0), 0)

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Cargando...</div>
  }

  if (!lote) {
    return <div className="text-center py-8 text-slate-500">Lote no encontrado</div>
  }

  const tabs = [
    { id: 'pesajes', label: 'Pesajes', count: pesajes.length },
    { id: 'mortalidad', label: 'Mortalidad', count: mortalidad.length },
    { id: 'costos', label: 'Costos', count: costos.length },
    { id: 'alimentacion', label: 'Alimentación', count: 0 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="btn btn-secondary">← Volver</button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{lote.numero_lote}</h1>
            <p className="text-slate-500">
              {lote.granja_id || 'Sin granja'} • {lote.galpon_id || 'Sin galpón'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${getEstadoBadge(lote.estado)} text-sm py-1`}>
            {lote.estado?.replace('_', ' ')}
          </span>
          <Link to={`/lotes/${id}/editar`} className="btn btn-secondary">
            ✏️ Editar
          </Link>
          {lote.estado === 'ACTIVO' && (
            <>
              <button className="btn btn-info">
                🏭 Enviar a Procesamiento
              </button>
              <button className="btn btn-danger-outline">Cerrar Lote</button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Cantidad Inicial" value={lote.cantidad_inicial?.toLocaleString() || '-'} unit="aves" />
        <StatCard label="Cantidad Actual" value={lote.cantidad_actual?.toLocaleString() || '-'} unit="aves" />
        <StatCard label="Peso Promedio" value={lote.peso_promedio_actual?.toFixed(2) || '-'} unit="lb" />
        <StatCard label="Fecha Ingreso" value={lote.fecha_ingreso ? new Date(lote.fecha_ingreso).toLocaleDateString('es-ES') : '-'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Mortalidad" value={mortalidadTotal.toString()} unit="aves" highlight="red" />
        <StatCard label="% Mortalidad" value={lote.cantidad_inicial ? ((mortalidadTotal / lote.cantidad_inicial) * 100).toFixed(2) : '0'} unit="%" highlight="red" />
        <StatCard label="Costo Total" value={formatHnl(costosTotal)} />
        <StatCard label="Costo/Libra" value={formatHnl(lote.peso_promedio_actual ? costosTotal / (lote.cantidad_actual * lote.peso_promedio_actual) : 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} highlight="green" />
      </div>

      <div className="card">
        <div className="border-b border-slate-200">
          <nav className="flex gap-6 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-slate-100">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'pesajes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Historial de Pesajes</h3>
                <Link to="/pesajes/nuevo" className="btn btn-secondary text-sm">
                  ➕ Nuevo Pesaje
                </Link>
              </div>
              {pesajes.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No hay pesajes registrados</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="table-header">Semana</th>
                      <th className="table-header">Fecha</th>
                      <th className="table-header text-right">Muestra</th>
                      <th className="table-header text-right">Peso Total</th>
                      <th className="table-header text-right">Peso Prom.</th>
                      <th className="table-header text-right">Variación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pesajes.map((p, i) => {
                      const variacion = i > 0 ? (p.peso_promedio || 0) - (pesajes[i - 1].peso_promedio || 0) : 0
                      return (
                        <tr key={p.id} className="table-row">
                          <td className="table-cell">{p.semana || i + 1}</td>
                          <td className="table-cell">{p.fecha ? new Date(p.fecha).toLocaleDateString('es-ES') : '-'}</td>
                          <td className="table-cell text-right">{p.cantidad || '-'}</td>
                          <td className="table-cell text-right">{p.peso_total ? `${p.peso_total} lb` : '-'}</td>
                          <td className="table-cell text-right font-medium">{p.peso_promedio ? `${p.peso_promedio} lb` : '-'}</td>
                          <td className="table-cell text-right">
                            <span className={variacion > 0 ? 'text-green-600' : 'text-slate-500'}>
                              {variacion > 0 ? '+' : ''}{variacion.toFixed(2)} lb
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'mortalidad' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Registro de Mortalidad</h3>
                <Link to="/mortalidad/nuevo" className="btn btn-secondary text-sm">
                  ➕ Registrar Mortalidad
                </Link>
              </div>
              {mortalidad.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No hay mortalidades registradas</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="table-header">Fecha</th>
                      <th className="table-header text-right">Cantidad</th>
                      <th className="table-header">Causa</th>
                      <th className="table-header text-right">Peso Estimado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mortalidad.map((m) => (
                      <tr key={m.id} className="table-row">
                        <td className="table-cell">{m.fecha ? new Date(m.fecha).toLocaleDateString('es-ES') : '-'}</td>
                        <td className="table-cell text-right font-medium text-red-600">{m.cantidad}</td>
                        <td className="table-cell">
                          <span className="badge badge-danger">{m.causa || 'N/A'}</span>
                        </td>
                        <td className="table-cell text-right">{m.peso_estimado ? `${m.peso_estimado} lb` : '-'}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-medium">
                      <td className="table-cell">Total</td>
                      <td className="table-cell text-right text-red-600">{mortalidadTotal}</td>
                      <td className="table-cell"></td>
                      <td className="table-cell text-right">{pesoTotalMortalidad.toFixed(2)} lb</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'costos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Costos del Lote</h3>
                <Link to="/costos/nuevo" className="btn btn-secondary text-sm">
                  ➕ Registrar Costo
                </Link>
              </div>
              {costos.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No hay costos registrados</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="table-header">Fecha</th>
                      <th className="table-header">Tipo</th>
                      <th className="table-header">Descripción</th>
                      <th className="table-header text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costos.map((c) => (
                      <tr key={c.id} className="table-row">
                        <td className="table-cell">{c.fecha ? new Date(c.fecha).toLocaleDateString('es-ES') : '-'}</td>
                        <td className="table-cell">
                          <span className="badge badge-neutral">{c.tipo || '-'}</span>
                        </td>
                        <td className="table-cell">{c.descripcion || '-'}</td>
                        <td className="table-cell text-right font-medium">
                          {formatHnl(c.monto || 0)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-medium">
                      <td className="table-cell" colSpan={3}>Total</td>
                      <td className="table-cell text-right text-green-600">
                        {formatHnl(costosTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, unit, highlight }: { label: string; value: string; unit?: string; highlight?: string }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-xl font-bold ${highlight === 'red' ? 'text-red-600' : highlight === 'green' ? 'text-green-600' : 'text-slate-800'}`}>
        {value}
        {unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
      </p>
    </div>
  )
}