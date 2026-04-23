import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { lotesApi, mortalidadApi } from '@/services/api'
import { toast } from 'sonner'

type LoteLite = { id: string; numero_lote: string }

type Mortalidad = {
  id: string
  lote_id: string
  fecha: string
  cantidad: number
  causa: 'ENFERMEDAD' | 'CALOR' | 'FRIO' | 'PREDADORES' | 'OTRO'
  peso_estimado?: number | null
  observaciones?: string | null
}

export default function MortalidadListPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [registros, setRegistros] = useState<Mortalidad[]>([])
  const [lotes, setLotes] = useState<LoteLite[]>([])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      try {
        const [mRes, lRes] = await Promise.all([mortalidadApi.list(), lotesApi.list()])
        if (cancelled) return
        setRegistros(mRes.data)
        setLotes(lRes.data)
      } catch {
        if (!cancelled) toast.error('No se pudo cargar la mortalidad')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  const lotesById = useMemo(() => {
    const m: Record<string, string> = {}
    for (const l of lotes) m[l.id] = l.numero_lote
    return m
  }, [lotes])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mortalidad</h1>
          <p className="text-slate-500">Registro diario de mortalidad</p>
        </div>
        <button onClick={() => navigate('/mortalidad/nuevo')} className="btn btn-primary">
          ➕ Registrar Mortalidad
        </button>
      </div>
      <div className="card p-6">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="table-header">Lote</th>
              <th className="table-header">Fecha</th>
              <th className="table-header text-right">Cantidad</th>
              <th className="table-header">Causa</th>
              <th className="table-header text-right">Peso Est. (lb)</th>
              <th className="table-header"></th>
            </tr>
          </thead>
          <tbody>
            {registros.map(m => (
              <tr key={m.id} className="table-row">
                <td className="table-cell font-medium">{lotesById[m.lote_id] ?? m.lote_id}</td>
                <td className="table-cell">{new Date(m.fecha).toLocaleDateString('es-ES')}</td>
                <td className="table-cell text-right text-red-600 font-medium">{m.cantidad}</td>
                <td className="table-cell"><span className="badge badge-danger">{m.causa}</span></td>
                <td className="table-cell text-right">{m.peso_estimado ?? '-'}</td>
                <td className="table-cell">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/mortalidad/${m.id}/editar`}
                      className="p-1 text-slate-500 hover:text-slate-700"
                      title="Editar"
                    >
                      ✏️
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && <div className="p-8 text-center text-slate-500">Cargando registros...</div>}
        {!loading && registros.length === 0 && (
          <div className="p-8 text-center text-slate-500">No hay registros de mortalidad.</div>
        )}
      </div>
    </div>
  )
}
