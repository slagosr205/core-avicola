import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { costosApi } from '@/services/api'
import { formatHnl } from '@/utils/money'
import { toast } from 'sonner'

export default function CostosListPage() {
  const [costos, setCostos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await costosApi.list()
        setCostos(res.data || [])
      } catch {
        toast.error('Error al cargar costos')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const total = costos.reduce((s, c) => s + (c.monto || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">Costos</h1><p className="text-slate-500">Control de costos por lote</p></div>
        <Link to="/costos/nuevo" className="btn btn-primary">➕ Registrar Costo</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4"><p className="text-sm text-slate-500">Total Costos</p><p className="text-xl font-bold text-slate-800">{formatHnl(total)}</p></div>
        <div className="card p-4"><p className="text-sm text-slate-500">Registros</p><p className="text-xl font-bold text-slate-800">{costos.length}</p></div>
        <div className="card p-4"><p className="text-sm text-slate-500">Último Registro</p><p className="text-xl font-bold text-slate-800">{costos.length > 0 ? new Date(costos[0].fecha).toLocaleDateString('es-ES') : '-'}</p></div>
      </div>
      <div className="card p-6">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Cargando...</div>
        ) : costos.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No hay costos registrados</div>
        ) : (
          <table className="w-full">
            <thead><tr className="bg-slate-50"><th className="table-header">Lote</th><th className="table-header">Fecha</th><th className="table-header">Tipo</th><th className="table-header">Descripción</th><th className="table-header text-right">Monto</th></tr></thead>
            <tbody>
              {costos.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="table-cell font-medium">{c.lote_id || '-'}</td>
                  <td className="table-cell">{c.fecha ? new Date(c.fecha).toLocaleDateString('es-ES') : '-'}</td>
                  <td className="table-cell"><span className="badge badge-neutral">{c.tipo || '-'}</span></td>
                  <td className="table-cell">{c.descripcion || '-'}</td>
                  <td className="table-cell text-right font-medium">{formatHnl(c.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}