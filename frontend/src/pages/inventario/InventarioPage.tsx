import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { inventarioApi, insumosApi } from '@/services/api'
import { formatHnl } from '@/utils/money'

interface Saldo {
  insumo_id: string
  insumo_nombre: string
  tipo_insumo: string
  unidad: string
  stock_actual: number
  costo_promedio: number
  valor_total: number
}

interface Resumen {
  total_insumos: number
  total_stock: number
  valor_total_inventario: number
  alertas_stock_bajo: Saldo[]
}

export default function InventarioPage() {
  const [saldos, setSaldos] = useState<Saldo[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [saldosRes, resumenRes] = await Promise.all([
          inventarioApi.getSaldos(),
          inventarioApi.getResumen(),
        ])
        setSaldos(saldosRes.data || [])
        setResumen(resumenRes.data)
      } catch {
        console.error('Error al cargar inventario')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredSaldos = saldos.filter(s => {
    const matchFiltro = !filtro || s.insumo_nombre.toLowerCase().includes(filtro.toLowerCase())
    const matchTipo = !tipoFiltro || s.tipo_insumo === tipoFiltro
    return matchFiltro && matchTipo
  })

  const getTipoLabel = (tipo: string) => {
    const map: Record<string, string> = {
      'ALIMENTO': 'Alimento',
      'MEDICAMENTO': 'Medicamento',
      'MATERIAL': 'Material',
      'EQUIPO': 'Equipo',
    }
    return map[tipo] || tipo
  }

  const getTipoBadge = (tipo: string) => {
    const map: Record<string, string> = {
      'ALIMENTO': 'badge-primary',
      'MEDICAMENTO': 'badge-danger',
      'MATERIAL': 'badge-warning',
      'EQUIPO': 'badge-info',
    }
    return map[tipo] || 'badge-neutral'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventario</h1>
          <p className="text-slate-500">Control de insumos y concentrado</p>
        </div>
        <div className="flex gap-2">
          <Link to="/inventario/nuevo-insumo" className="btn btn-primary">
            ➕ Nuevo Insumo
          </Link>
          <Link to="/inventario/entrada" className="btn btn-secondary">
            📥 Entrada (Compra)
          </Link>
          <Link to="/inventario/transferencia" className="btn btn-secondary">
            🔄 Transferencia
          </Link>
        </div>
      </div>

      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-sm text-slate-500">Total Insumos</p>
            <p className="text-2xl font-bold text-slate-800">{resumen.total_insumos}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-slate-500">Stock Total</p>
            <p className="text-2xl font-bold text-slate-800">{resumen.total_stock.toLocaleString()}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-slate-500">Valor Inventario</p>
            <p className="text-2xl font-bold text-green-600">{formatHnl(resumen.valor_total_inventario)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-slate-500">Alertas</p>
            <p className="text-2xl font-bold text-red-600">{resumen.alertas_stock_bajo.length}</p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar insumo..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="input"
              />
            </div>
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="input w-48"
            >
              <option value="">Todos los tipos</option>
              <option value="ALIMENTO">Alimento</option>
              <option value="MEDICAMENTO">Medicamento</option>
              <option value="MATERIAL">Material</option>
            </select>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="table-header">Insumo</th>
              <th className="table-header">Tipo</th>
              <th className="table-header text-right">Stock</th>
              <th className="table-header text-right">Costo Unit.</th>
              <th className="table-header text-right">Valor Total</th>
              <th className="table-header text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredSaldos.map((s) => (
              <tr key={s.insumo_id} className="table-row">
                <td className="table-cell font-medium">{s.insumo_nombre}</td>
                <td className="table-cell">
                  <span className={`badge ${getTipoBadge(s.tipo_insumo)}`}>
                    {getTipoLabel(s.tipo_insumo)}
                  </span>
                </td>
                <td className="table-cell text-right">
                  <span className={s.stock_actual < 100 ? 'text-red-600 font-medium' : ''}>
                    {s.stock_actual.toLocaleString()} {s.unidad || ''}
                  </span>
                </td>
                <td className="table-cell text-right">{formatHnl(s.costo_promedio)}</td>
                <td className="table-cell text-right font-medium">{formatHnl(s.valor_total)}</td>
                <td className="table-cell text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/inventario/kardex/${s.insumo_id}`}
                      className="btn btn-sm btn-secondary"
                    >
                      Kardex
                    </Link>
                    <Link
                      to={`/inventario/${s.insumo_id}/editar`}
                      className="btn btn-sm btn-warning"
                    >
                      ✏️ Editar
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {filteredSaldos.length === 0 && (
              <tr>
                <td colSpan={6} className="table-cell text-center text-slate-400 py-8">
                  {loading ? 'Cargando...' : 'No hay insumos registrados'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}