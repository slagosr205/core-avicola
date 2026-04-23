import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { lotesApi, granjasApi, galponesApi } from '@/services/api'
import { toast } from 'sonner'

interface Lote {
  id: string
  numero_lote: string
  tipo_lote: 'PROPIO' | 'TERCERIZADO'
  estado: 'ACTIVO' | 'EN_CRIANZA' | 'EN_PROCESO' | 'CERRADO' | 'LIQUIDADO'
  cantidad_inicial: number
  cantidad_actual: number
  peso_promedio_actual: number
  fecha_ingreso: string
  fecha_cierre?: string
  granja_id?: string | null
  galpon_id?: string | null
}

interface Granja {
  id: string
  nombre: string
}

interface Galpon {
  id: string
  numero: string
  granja_id?: string | null
}

export default function LotesListPage() {
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [lotes, setLotes] = useState<Lote[]>([])
  const [granjas, setGranjas] = useState<Granja[]>([])
  const [galpones, setGalpones] = useState<Galpon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const [lotesRes, granjasRes, galponesRes] = await Promise.all([
          lotesApi.list(estadoFiltro ? { estado: estadoFiltro } : undefined),
          granjasApi.list(),
          galponesApi.list(),
        ])
        setLotes(lotesRes.data || [])
        setGranjas(granjasRes.data || [])
        setGalpones(galponesRes.data || [])
      } catch {
        toast.error('No se pudieron cargar los lotes')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [estadoFiltro])

  const getGranjaNombre = (granjaId?: string | null) => {
    if (!granjaId) return 'Sin granja'
    const granja = granjas.find(g => g.id === granjaId)
    return granja?.nombre || 'Sin granja'
  }

  const getGalponNumero = (galponId?: string | null) => {
    if (!galponId) return 'Sin galpón'
    const galpon = galpones.find(g => g.id === galponId)
    return galpon?.numero || 'Sin galpón'
  }

  const filteredLotes = lotes.filter(lote => {
    const matchFiltro = !filtro || 
      lote.numero_lote.toLowerCase().includes(filtro.toLowerCase()) ||
      getGranjaNombre(lote.granja_id).toLowerCase().includes(filtro.toLowerCase())
    const matchEstado = !estadoFiltro || lote.estado === estadoFiltro
    return matchFiltro && matchEstado
  })

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
          <h1 className="text-2xl font-bold text-slate-800">Lotes</h1>
          <p className="text-slate-500">Gestión de lotes de pollos de engorde</p>
        </div>
        <button onClick={() => navigate('/lotes/nuevo')} className="btn btn-primary">
          ➕ Nuevo Lote
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar lote, granja..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="input"
              />
            </div>
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="input w-48"
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVO">Activo</option>
              <option value="EN_CRIANZA">En Crianza</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="CERRADO">Cerrado</option>
              <option value="LIQUIDADO">Liquidado</option>
            </select>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="table-header">Lote</th>
              <th className="table-header">Tipo</th>
              <th className="table-header">Estado</th>
              <th className="table-header text-right">Cantidad Inicial</th>
              <th className="table-header text-right">Cantidad Actual</th>
              <th className="table-header text-right">Peso Prom.</th>
              <th className="table-header">Ubicación</th>
              <th className="table-header">Fecha Ingreso</th>
              <th className="table-header"></th>
            </tr>
          </thead>
          <tbody>
            {filteredLotes.map((lote) => (
              <tr key={lote.id} className="table-row">
                <td className="table-cell font-medium">
                  <Link to={`/lotes/${lote.id}`} className="text-primary-600 hover:text-primary-700">
                    {lote.numero_lote}
                  </Link>
                </td>
                <td className="table-cell">
                  <span className={`badge ${lote.tipo_lote === 'PROPIO' ? 'badge-success' : 'badge-warning'}`}>
                    {lote.tipo_lote}
                  </span>
                </td>
                <td className="table-cell">
                  <span className={`badge ${getEstadoBadge(lote.estado)}`}>
                    {lote.estado.replace('_', ' ')}
                  </span>
                </td>
                <td className="table-cell text-right">{lote.cantidad_inicial.toLocaleString()}</td>
                <td className="table-cell text-right">{lote.cantidad_actual.toLocaleString()}</td>
                <td className="table-cell text-right">{lote.peso_promedio_actual} lb</td>
                <td className="table-cell">
                  <div>
                    <p className="text-sm font-medium">{getGranjaNombre(lote.granja_id)}</p>
                    <p className="text-xs text-slate-500">{getGalponNumero(lote.galpon_id)}</p>
                  </div>
                </td>
                <td className="table-cell">
                  {new Date(lote.fecha_ingreso).toLocaleDateString('es-ES')}
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/lotes/${lote.id}`}
                      className="p-1 text-slate-500 hover:text-slate-700"
                      title="Ver detalle"
                    >
                      👁️
                    </Link>
                    <Link
                      to={`/lotes/${lote.id}/editar`}
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

        {loading && (
          <div className="p-8 text-center text-slate-500">
            Cargando lotes...
          </div>
        )}

        {!loading && filteredLotes.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No se encontraron lotes con los filtros seleccionados.
          </div>
        )}

        <div className="p-4 border-t border-slate-200 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Mostrando {filteredLotes.length} de {lotes.length} lotes
          </p>
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary" disabled>Anterior</button>
            <button className="btn btn-secondary" disabled>Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  )
}
