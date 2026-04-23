import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { tercerosApi } from '@/services/api'
import { toast } from 'sonner'

export default function TercerizacionListPage() {
  const [terceros, setTerceros] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await tercerosApi.list()
        setTerceros(res.data)
      } catch {
        toast.error('Error al cargar terceros')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">Tercerización</h1><p className="text-slate-500">Control de lotes tercerizados</p></div>
        <Link to="/tercerizacion/nuevo" className="btn btn-primary">➕ Nuevo Contrato</Link>
      </div>
      <div className="card p-6">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Cargando...</div>
        ) : terceros.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No hay terceros registrados</div>
        ) : (
          <table className="w-full">
            <thead><tr className="bg-slate-50"><th className="table-header">Nombre</th><th className="table-header">Tipo</th><th className="table-header">NIT</th><th className="table-header">Teléfono</th><th className="table-header">Estado</th></tr></thead>
            <tbody>
              {terceros.map(t => (
                <tr key={t.id} className="table-row">
                  <td className="table-cell font-medium">{t.nombre}</td>
                  <td className="table-cell">{t.tipo || '-'}</td>
                  <td className="table-cell">{t.nit || '-'}</td>
                  <td className="table-cell">{t.telefono || '-'}</td>
                  <td className="table-cell"><span className={`badge ${t.activo ? 'badge-success' : 'badge-neutral'}`}>{t.activo ? 'Activo' : 'Inactivo'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}