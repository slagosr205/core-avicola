import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { inventarioApi } from '@/services/api'
import { formatHnl } from '@/utils/money'

interface Movimiento {
  id: string
  insumo_id: string
  fecha: string
  tipo: string
  cantidad: number
  costo_unitario: number
  costo_total: number
  referencia_tipo?: string
  observaciones?: string
}

interface KardexData {
  insumo_id: string
  insumo_nombre: string
  saldo_anterior: number
  entradas: number
  salidas: number
  saldo_final: number
  movimientos: Movimiento[]
}

export default function KardexPage() {
  const { id } = useParams<{ id: string }>()
  const [kardex, setKardex] = useState<KardexData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return

    const loadKardex = async () => {
      try {
        setLoading(true)
        const res = await inventarioApi.getKardex(id)
        setKardex(res.data)
      } catch {
        setError('Error al cargar el kardex')
      } finally {
        setLoading(false)
      }
    }

    loadKardex()
  }, [id])

  const getTipoBadge = (tipo: string) => {
    const map: Record<string, string> = {
      'ENTRADA': 'badge badge-success',
      'SALIDA': 'badge badge-danger',
      'TRANSFERENCIA': 'badge badge-warning',
    }
    return map[tipo] || 'badge badge-neutral'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-slate-500">Cargando kardex...</div>
      </div>
    )
  }

  if (error || !kardex) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/inventario" className="btn btn-secondary">
            ← Volver
          </Link>
        </div>
        <div className="card p-6 text-center text-red-500">
          {error || 'No se encontró el kardex'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kardex</h1>
          <p className="text-slate-500">{kardex.insumo_nombre}</p>
        </div>
        <Link to="/inventario" className="btn btn-secondary">
          ← Volver al Inventario
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-slate-500">Saldo Anterior</p>
          <p className="text-2xl font-bold text-slate-800">{kardex.saldo_anterior.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Entradas</p>
          <p className="text-2xl font-bold text-green-600">{kardex.entradas.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Salidas</p>
          <p className="text-2xl font-bold text-red-600">{kardex.salidas.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Saldo Final</p>
          <p className="text-2xl font-bold text-slate-800">{kardex.saldo_final.toLocaleString()}</p>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Movimientos</h2>
        </div>

        {kardex.movimientos.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            No hay movimientos registrados
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="table-header">Fecha</th>
                <th className="table-header">Tipo</th>
                <th className="table-header">Referencia</th>
                <th className="table-header text-right">Cantidad</th>
                <th className="table-header text-right">Costo Unit.</th>
                <th className="table-header text-right">Costo Total</th>
              </tr>
            </thead>
            <tbody>
              {kardex.movimientos.map((m) => (
                <tr key={m.id} className="table-row">
                  <td className="table-cell">
                    {m.fecha ? new Date(m.fecha).toLocaleDateString('es-ES') : '-'}
                  </td>
                  <td className="table-cell">
                    <span className={getTipoBadge(m.tipo)}>{m.tipo}</span>
                  </td>
                  <td className="table-cell text-slate-600">
                    {m.referencia_tipo || '-'}
                  </td>
                  <td className="table-cell text-right">{m.cantidad.toLocaleString()}</td>
                  <td className="table-cell text-right">{formatHnl(m.costo_unitario)}</td>
                  <td className="table-cell text-right font-medium">
                    {formatHnl(m.costo_total)}
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