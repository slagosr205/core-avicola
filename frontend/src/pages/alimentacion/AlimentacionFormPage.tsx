import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { alimentacionApi, lotesApi, insumosApi } from '@/services/api'

interface Lote {
  id: string
  numero_lote: string
  estado: string
}

interface Insumo {
  id: string
  nombre: string
  tipo: string
  costo_unitario?: number
  stock_actual?: number
}

export default function AlimentacionFormPage() {
  const navigate = useNavigate()
  const [lotes, setLotes] = useState<Lote[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    lote_id: '',
    insumo_id: '',
    cantidad: '',
    costo_pollito_baby: '',
    fecha: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [lotesRes, insumosRes] = await Promise.all([
          lotesApi.list({ estado: 'ACTIVO' }),
          insumosApi.list('ALIMENTO'),
        ])
        setLotes(lotesRes.data || [])
        setInsumos(insumosRes.data || [])
      } catch {
        toast.error('Error al cargar datos')
      }
    }
    loadData()
  }, [])

  const insumoSeleccionado = insumos.find(i => i.id === formData.insumo_id)
  const cantidadNum = parseFloat(formData.cantidad) || 0
  const pollitoNum = parseFloat(formData.costo_pollito_baby) || 0
  const costoUnitario = insumoSeleccionado?.costo_unitario || 0
  const costoEstimado = cantidadNum * costoUnitario
  const costoTotal = costoEstimado + pollitoNum

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.lote_id || !formData.insumo_id || !formData.cantidad) {
      toast.error('Complete todos los campos requeridos')
      return
    }
    setLoading(true)
    try {
      await alimentacionApi.create({
        lote_id: formData.lote_id,
        insumo_id: formData.insumo_id,
        cantidad: parseFloat(formData.cantidad),
        fecha: formData.fecha,
        costo_pollito_baby: pollitoNum > 0 ? pollitoNum : null,
      })
      toast.success('Consumo registrado correctamente')
      navigate('/alimentacion')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al registrar consumo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Registrar Consumo de Alimento</h1><p className="text-slate-500">El costo se calcula automáticamente</p></div>
      <form onSubmit={handleSubmit} className="card p-6 max-w-2xl space-y-4">
        <div>
          <label className="label">Lote *</label>
          <select className="input" required value={formData.lote_id} onChange={e => setFormData({ ...formData, lote_id: e.target.value })}>
            <option value="">Seleccionar lote</option>
            {lotes.map(lote => (
              <option key={lote.id} value={lote.id}>{lote.numero_lote}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Concentrado *</label>
          <select className="input" required value={formData.insumo_id} onChange={e => setFormData({ ...formData, insumo_id: e.target.value })}>
            <option value="">Seleccionar concentrado</option>
            {insumos.map(insumo => (
              <option key={insumo.id} value={insumo.id}>
                {insumo.nombre} {insumo.costo_unitario ? `L ${insumo.costo_unitario.toFixed(2)}/lb` : ''}
              </option>
            ))}
          </select>
          {insumoSeleccionado?.stock_actual !== undefined && (
            <p className="text-sm text-slate-500 mt-1">Stock disponible: {insumoSeleccionado.stock_actual} unidades</p>
          )}
        </div>
        <div>
          <label className="label">Cantidad (libras) *</label>
          <input type="number" className="input" required step="0.1" min="0" placeholder="Ej: 100" value={formData.cantidad} onChange={e => setFormData({ ...formData, cantidad: e.target.value })} />
        </div>
        <div>
          <label className="label">Costo Pollito Baby (opcional)</label>
          <input type="number" className="input" step="0.01" min="0" placeholder="Costo del pollito inicial" value={formData.costo_pollito_baby} onChange={e => setFormData({ ...formData, costo_pollito_baby: e.target.value })} />
          <p className="text-xs text-slate-500 mt-1">Este costo se agrega una sola vez al inicio del lote</p>
        </div>
        <div>
          <label className="label">Fecha *</label>
          <input type="date" className="input" required value={formData.fecha} onChange={e => setFormData({ ...formData, fecha: e.target.value })} />
        </div>
        
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-700 mb-2">Resumen del Costo</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Concentrado ({cantidadNum} lb × L {costoUnitario.toFixed(2)})</span>
              <span className="font-medium">L {costoEstimado.toFixed(2)}</span>
            </div>
            {pollitoNum > 0 && (
              <div className="flex justify-between">
                <span>Pollito Baby</span>
                <span className="font-medium">L {pollitoNum.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-300 pt-1 mt-2">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-primary-600">L {costoTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Registrando...' : 'Registrar Consumo'}
          </button>
        </div>
      </form>
    </div>
  )
}