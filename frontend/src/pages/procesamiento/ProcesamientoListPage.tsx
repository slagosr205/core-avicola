import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { procesamientoApi } from '@/services/api'
import { formatHnl } from '@/utils/money'
import { toast } from 'sonner'

export default function ProcesamientoListPage() {
  const [procesamientos, setProcesamientos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await procesamientoApi.list()
        setProcesamientos(res.data)
      } catch {
        toast.error('Error al cargar procesamientos')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">Procesamiento</h1><p className="text-slate-500">Control de procesamiento en planta</p></div>
        <Link to="/procesamiento/nuevo" className="btn btn-primary">🏭 Nuevo Procesamiento</Link>
      </div>
      <div className="card p-6">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Cargando...</div>
        ) : procesamientos.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No hay procesamientos registrados</div>
        ) : (
          <table className="w-full">
            <thead><tr className="bg-slate-50"><th className="table-header">Lote</th><th className="table-header">Fecha</th><th className="table-header text-right">Peso Vivo (lb)</th><th className="table-header text-right">Rendimiento</th><th className="table-header text-right">Costo/Lb</th></tr></thead>
            <tbody>
              {procesamientos.map(p => (
                <tr key={p.id} className="table-row">
                  <td className="table-cell font-medium">{p.lote_id || '-'}</td>
                  <td className="table-cell">{p.fecha_recepcion ? new Date(p.fecha_recepcion).toLocaleDateString('es-ES') : '-'}</td>
                  <td className="table-cell text-right">{p.peso_vivo_recibido?.toLocaleString() || '-'}</td>
                  <td className="table-cell text-right">{p.rendimiento ? `${p.rendimiento.toFixed(1)}%` : '-'}</td>
                  <td className="table-cell text-right">{p.costo_libra ? formatHnl(p.costo_libra, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}