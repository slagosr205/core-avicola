import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { costosApi, lotesApi, insumosApi } from '@/services/api'

interface Lote {
  id: string
  numero_lote: string
  estado: string
}

interface Insumo {
  id: string
  nombre: string
  tipo: string
  stock_actual?: number
}

const TIPOS_CON_INSUMO = ['ALIMENTO', 'MEDICAMENTO']
const TIPOS_COSTO = [
  { value: 'MANO_OBRA', label: 'Mano de Obra' },
  { value: 'ENERGIA', label: 'Energía' },
  { value: 'AGUA', label: 'Agua' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'MEDICAMENTO', label: 'Medicamento' },
  { value: 'ALIMENTO', label: 'Alimento/Concentrado' },
  { value: 'OTRO', label: 'Otro' },
]

export default function CostoFormPage() {
  const navigate = useNavigate()
  const [lotes, setLotes] = useState<Lote[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    lote_id: '',
    tipo_costo: 'MANO_OBRA',
    descripcion: '',
    monto: '',
    cantidad: '',
    insumo_id: '',
    fecha: new Date().toISOString().split('T')[0],
  })

  const usaInsumo = TIPOS_CON_INSUMO.includes(formData.tipo_costo)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [lotesRes, insumosRes] = await Promise.all([
          lotesApi.list({ estado: 'ACTIVO' }),
          insumosApi.list(),
        ])
        setLotes(lotesRes.data || [])
        setInsumos(insumosRes.data || [])
      } catch {
        toast.error('Error al cargar datos')
      }
    }
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload: Record<string, any> = {
        lote_id: formData.lote_id,
        tipo_costo: formData.tipo_costo,
        descripcion: formData.descripcion || null,
        fecha: formData.fecha,
      }

      if (usaInsumo && formData.insumo_id && formData.cantidad) {
        payload.insumo_id = formData.insumo_id
        payload.cantidad = parseFloat(formData.cantidad)
      } else if (formData.monto) {
        payload.monto = parseFloat(formData.monto)
      } else {
        toast.error('Ingrese monto o seleccione insumo con cantidad')
        setLoading(false)
        return
      }

      await costosApi.create(payload)
      toast.success('Costo registrado correctamente')
      navigate('/costos')
    } catch {
      toast.error('Error al registrar el costo')
    } finally {
      setLoading(false)
    }
  }

  const insumoSeleccionado = insumos.find(i => i.id === formData.insumo_id)

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Registrar Costo</h1><p className="text-slate-500">Agrega un nuevo costo al sistema</p></div>
      <form onSubmit={handleSubmit} className="card p-6 max-w-2xl space-y-4">
        <div>
          <label className="label">Lote *</label>
          <select
            className="input"
            required
            value={formData.lote_id}
            onChange={e => setFormData({ ...formData, lote_id: e.target.value })}
          >
            <option value="">Seleccionar lote</option>
            {lotes.map(lote => (
              <option key={lote.id} value={lote.id}>{lote.numero_lote}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Tipo de Costo *</label>
          <select
            className="input"
            required
            value={formData.tipo_costo}
            onChange={e => setFormData({ ...formData, tipo_costo: e.target.value, insumo_id: '', cantidad: '', monto: '' })}
          >
            {TIPOS_COSTO.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        
        {usaInsumo ? (
          <>
            <div>
              <label className="label">Insumo *</label>
              <select
                className="input"
                required
                value={formData.insumo_id}
                onChange={e => setFormData({ ...formData, insumo_id: e.target.value })}
              >
                <option value="">Seleccionar insumo</option>
                {insumos.map(insumo => (
                  <option key={insumo.id} value={insumo.id}>
                    {insumo.nombre} {insumo.stock_actual ? `(${insumo.stock_actual} disponible)` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Cantidad consumida *</label>
              <input
                type="number"
                className="input"
                required
                step="0.01"
                min="0"
                placeholder="Cantidad en unidades"
                value={formData.cantidad}
                onChange={e => setFormData({ ...formData, cantidad: e.target.value })}
              />
              {insumoSeleccionado?.stock_actual !== undefined && (
                <p className="text-sm text-slate-500 mt-1">
                  Stock disponible: {insumoSeleccionado.stock_actual}
                </p>
              )}
            </div>
          </>
        ) : (
          <div>
            <label className="label">Monto (L) *</label>
            <input
              type="number"
              className="input"
              required
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.monto}
              onChange={e => setFormData({ ...formData, monto: e.target.value })}
            />
          </div>
        )}
        
        <div>
          <label className="label">Descripción</label>
          <input
            type="text"
            className="input"
            placeholder="Descripción del costo"
            value={formData.descripcion}
            onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
          />
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
        <div className="flex gap-4 pt-4">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Guardando...' : usaInsumo ? 'Registrar y descontar inventario' : 'Registrar Costo'}
          </button>
        </div>
      </form>
    </div>
  )
}