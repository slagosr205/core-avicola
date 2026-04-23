import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { inventarioApi, insumosApi, lotesApi } from '@/services/api'
import { toast } from 'sonner'

interface Insumo {
  id: string
  nombre: string
  tipo: string
  unidad: string
}

interface Lote {
  id: string
  numero_lote: string
}

export default function TransferenciaPage() {
  const navigate = useNavigate()
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [lotes, setLotes] = useState<Lote[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    insumo_id: '',
    lote_id: '',
    cantidad_inicio: '',
    cantidad_final: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [insumosRes, lotesRes] = await Promise.all([
          insumosApi.list('ALIMENTO'),
          lotesApi.list({ estado: 'ACTIVO' }),
        ])
        setInsumos(insumosRes.data || [])
        setLotes(lotesRes.data || [])
      } catch {
        toast.error('Error al cargar datos')
      }
    }
    loadData()
  }, [])

  const inicio = parseFloat(formData.cantidad_inicio) || 0
  const final = parseFloat(formData.cantidad_final) || 0
  const consumo = inicio - final

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.insumo_id || !formData.lote_id || !formData.cantidad_inicio || !formData.cantidad_final) {
      toast.error('Complete todos los campos requeridos')
      return
    }
    setLoading(true)
    try {
      await inventarioApi.crearTransferencia({
        insumo_id: formData.insumo_id,
        lote_id: formData.lote_id,
        cantidad_inicio: parseFloat(formData.cantidad_inicio),
        cantidad_final: parseFloat(formData.cantidad_final),
        descripcion: formData.descripcion || null,
        fecha: formData.fecha,
      })
      toast.success('Transferencia registrada correctamente')
      navigate('/inventario')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al registrar transferencia')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Registrar Concentrado</h1>
        <p className="text-slate-500">Registra el concentrado de inicio y final para un lote</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Insumo *</label>
            <select
              className="input"
              required
              value={formData.insumo_id}
              onChange={e => setFormData({ ...formData, insumo_id: e.target.value })}
            >
              <option value="">Seleccionar concentrado</option>
              {insumos.map(i => (
                <option key={i.id} value={i.id}>{i.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Lote *</label>
            <select
              className="input"
              required
              value={formData.lote_id}
              onChange={e => setFormData({ ...formData, lote_id: e.target.value })}
            >
              <option value="">Seleccionar lote</option>
              {lotes.map(l => (
                <option key={l.id} value={l.id}>{l.numero_lote}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Concentrado Inicio *</label>
            <input
              type="number"
              className="input"
              required
              step="0.01"
              min="0"
              placeholder="Cantidad al inicio"
              value={formData.cantidad_inicio}
              onChange={e => setFormData({ ...formData, cantidad_inicio: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Concentrado Final *</label>
            <input
              type="number"
              className="input"
              required
              step="0.01"
              min="0"
              placeholder="Cantidad al final"
              value={formData.cantidad_final}
              onChange={e => setFormData({ ...formData, cantidad_final: e.target.value })}
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
          <label className="label">Descripción</label>
          <textarea
            className="input h-20"
            placeholder="Ej: Semana 4 - Consumo de concentrado Inicia vs Final"
            value={formData.descripcion}
            onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
          />
        </div>

        {inicio > 0 && final > 0 && (
          <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
            <h3 className="font-semibold text-primary-700 mb-2">Resumen de Consumo</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary-600">{inicio}</p>
                <p className="text-sm text-slate-500">Inicio (lb)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-600">-</p>
                <p className="text-sm text-slate-500">-</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-600">{final}</p>
                <p className="text-sm text-slate-500">Final (lb)</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-primary-200">
              <div className="flex justify-between">
                <span className="font-semibold text-primary-700">Consumo Real</span>
                <span className="text-xl font-bold text-primary-700">{consumo.toFixed(2)} lb</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={() => navigate('/inventario')} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Guardando...' : 'Registrar Transferencia'}
          </button>
        </div>
      </form>
    </div>
  )
}