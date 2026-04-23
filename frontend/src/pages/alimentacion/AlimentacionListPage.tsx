import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { alimentacionApi } from '@/services/api'
import { formatHnl } from '@/utils/money'
import { toast } from 'sonner'

interface Consumo {
  id: string
  lote_id: string
  lote_nombre: string
  tipo: string
  descripcion: string
  fecha: string
  cantidad: number | null
  costo_total: number
  created_at: string
}

export default function AlimentacionListPage() {
  const [consumos, setConsumos] = useState<Consumo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await alimentacionApi.list()
        setConsumos(res.data || [])
      } catch {
        toast.error('Error al cargar consumos')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Alimentación e Insumos</h1>
          <p className="text-slate-500">Control de consumo de alimentos y medicamentos</p>
        </div>
        <Link to="/alimentacion/nuevo" className="btn btn-primary">
          ➕ Registrar Consumo
        </Link>
      </div>

      <div className="card p-6">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Cargando...</div>
        ) : consumos.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No hay consumos registrados
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="table-header">Lote</th>
                <th className="table-header">Fecha</th>
                <th className="table-header">Descripción</th>
                <th className="table-header">Tipo</th>
                <th className="table-header text-right">Cantidad</th>
                <th className="table-header text-right">Costo Total</th>
              </tr>
            </thead>
            <tbody>
              {consumos.map((c) => (
                <tr key={c.id} className="table-row">
                  <td className="table-cell font-medium">{c.lote_nombre || c.lote_id}</td>
                  <td className="table-cell">
                    {c.fecha ? new Date(c.fecha).toLocaleDateString('es-ES') : '-'}
                  </td>
                  <td className="table-cell text-slate-600">{c.descripcion || '-'}</td>
                  <td className="table-cell">
                    <span className={`badge ${c.tipo === 'POLLITO_BABY' ? 'badge-warning' : 'badge-primary'}`}>
                      {c.tipo === 'POLLITO_BABY' ? 'Pollito Baby' : c.tipo}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    {c.cantidad != null ? c.cantidad.toLocaleString() : '-'}
                  </td>
                  <td className="table-cell text-right font-medium">
                    {formatHnl(c.costo_total || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}