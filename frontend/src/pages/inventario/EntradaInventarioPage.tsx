import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { inventarioApi, insumosApi } from '@/services/api'
import { toast } from 'sonner'
import { formatHnl } from '@/utils/money'

interface Insumo {
  id: string
  nombre: string
  tipo: string
  unidad: string
  costo_unitario: number
}

export default function EntradaInventarioPage() {
  const navigate = useNavigate()
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    insumo_id: '',
    cantidad: '',
    costo_unitario: '',
    numero_factura: '',
    observaciones: '',
    fecha: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    const loadInsumos = async () => {
      try {
        const res = await insumosApi.list()
        setInsumos(res.data || [])
      } catch {
        toast.error('Error al cargar insumos')
      }
    }
    loadInsumos()
  }, [])

  const insumoSeleccionado = insumos.find(i => i.id === formData.insumo_id)
  const cantidad = parseFloat(formData.cantidad) || 0
  const costoUnitario = parseFloat(formData.costo_unitario) || 0
  const costoTotal = cantidad * costoUnitario

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.insumo_id || !formData.cantidad || !formData.costo_unitario) {
      toast.error('Complete todos los campos requeridos')
      return
    }
    setLoading(true)
    try {
      await inventarioApi.crearEntrada({
        insumo_id: formData.insumo_id,
        cantidad: parseFloat(formData.cantidad),
        costo_unitario: parseFloat(formData.costo_unitario),
        numero_factura: formData.numero_factura || null,
        observaciones: formData.observaciones || null,
        fecha: formData.fecha,
      })
      toast.success('Entrada registrada correctamente')
      navigate('/inventario')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al registrar entrada')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Registrar Entrada (Compra)</h1>
        <p className="text-slate-500">Registra una nueva compra de concentrado o insumo</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 max-w-2xl space-y-4">
        <div>
          <label className="label">Insumo *</label>
          <select
            className="input"
            required
            value={formData.insumo_id}
            onChange={e => setFormData({ ...formData, insumo_id: e.target.value })}
          >
            <option value="">Seleccionar insumo</option>
            {insumos.map(i => (
              <option key={i.id} value={i.id}>
                {i.nombre} {i.costo_unitario ? `(Actual: ${formatHnl(i.costo_unitario)})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Cantidad *</label>
            <input
              type="number"
              className="input"
              required
              step="0.01"
              min="0"
              value={formData.cantidad}
              onChange={e => setFormData({ ...formData, cantidad: e.target.value })}
            />
            {insumoSeleccionado?.unidad && (
              <p className="text-xs text-slate-500 mt-1">Unidad: {insumoSeleccionado.unidad}</p>
            )}
          </div>
          <div>
            <label className="label">Costo Unitario (L) *</label>
            <input
              type="number"
              className="input"
              required
              step="0.01"
              min="0"
              value={formData.costo_unitario}
              onChange={e => setFormData({ ...formData, costo_unitario: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label">Fecha *</label>
          <input
            type="date"
            className="input"
            required
            value={formData.fecha}
            onChange={e => setFormData({ ...formData, fecha: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Número de Factura</label>
          <input
            type="text"
            className="input"
            placeholder="Opcional"
            value={formData.numero_factura}
            onChange={e => setFormData({ ...formData, numero_factura: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Observaciones</label>
          <textarea
            className="input h-20"
            placeholder="Notas adicionales..."
            value={formData.observaciones}
            onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
          />
        </div>

        {costoTotal > 0 && (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-700 mb-2">Resumen</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Cantidad × Costo Unitario</span>
                <span>{cantidad} × {formatHnl(costoUnitario)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-1 mt-2">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary-600">{formatHnl(costoTotal)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={() => navigate('/inventario')} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Guardando...' : 'Registrar Entrada'}
          </button>
        </div>
      </form>
    </div>
  )
}