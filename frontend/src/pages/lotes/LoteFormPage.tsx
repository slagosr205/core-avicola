import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { galponesApi, granjasApi, lotesApi } from '@/services/api'

type Granja = { id: string; nombre: string }
type Galpon = { id: string; numero: string; granja_id?: string | null }

export default function LoteFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    numero_lote: '',
    tipo_lote: 'PROPIO',
    cantidad_inicial: 10000,
    peso_promedio_inicial: 0.8,
    fecha_ingreso: new Date().toISOString().split('T')[0],
    granja_id: '',
    galpon_id: '',
    observaciones: '',
  })

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [granjas, setGranjas] = useState<Granja[]>([])
  const [galpones, setGalpones] = useState<Galpon[]>([])
 
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [granjasRes, lotesRes] = await Promise.all([
          granjasApi.list(),
          isEdit ? lotesApi.get(id!) : Promise.resolve({ data: null }),
        ])
        
        setGranjas(granjasRes.data || [])
        
        if (isEdit && lotesRes.data) {
          const lote = lotesRes.data
          const galponesRes = await galponesApi.list(lote.granja_id || undefined)
          setGalpones(galponesRes.data || [])
          
          setFormData({
            numero_lote: lote.numero_lote || '',
            tipo_lote: lote.tipo_lote || 'PROPIO',
            cantidad_inicial: lote.cantidad_inicial || 10000,
            peso_promedio_inicial: lote.peso_promedio_inicial ?? 0.8,
            fecha_ingreso: String(lote.fecha_ingreso).split('T')[0],
            granja_id: lote.granja_id || '',
            galpon_id: lote.galpon_id || '',
            observaciones: lote.observaciones || '',
          })
        } else if (!isEdit) {
          try {
            const proximo = await lotesApi.proximo()
            setFormData(prev => ({
              ...prev,
              numero_lote: proximo.data?.numero_lote || '',
            }))
          } catch {
            // ignore error
          }
        }
      } catch {
        toast.error('Error al cargar datos')
      } finally {
        setLoadingData(false)
      }
    }

    loadInitialData()
  }, [id, isEdit])

  useEffect(() => {
    if (isEdit) return
    if (!formData.granja_id) {
      setGalpones([])
      return
    }
    
    const loadGalpones = async () => {
      try {
        const res = await galponesApi.list(formData.granja_id)
        setGalpones(res.data || [])
      } catch {
        toast.error('Error al cargar galpones')
      }
    }
    loadGalpones()
  }, [formData.granja_id, isEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        tipo_lote: formData.tipo_lote,
        observaciones: formData.observaciones,
        granja_id: formData.granja_id || null,
        galpon_id: formData.galpon_id || null,
      }

      if (isEdit && id) {
        await lotesApi.update(id, payload)
        toast.success('Lote actualizado correctamente')
      } else {
        await lotesApi.create({
          numero_lote: formData.numero_lote,
          ...payload,
          cantidad_inicial: formData.cantidad_inicial,
          peso_promedio_inicial: formData.peso_promedio_inicial,
          fecha_ingreso: formData.fecha_ingreso,
        })
        toast.success('Lote creado correctamente')
      }
      navigate('/lotes')
    } catch {
      toast.error('Error al guardar el lote')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? 'Editar Lote' : 'Nuevo Lote'}
          </h1>
          <p className="text-slate-500">
            {isEdit ? 'Modifique los datos del lote' : 'Registre un nuevo lote de pollos'}
          </p>
        </div>
      </div>

      {loadingData ? (
        <div className="text-center py-8 text-slate-500">Cargando...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Información del Lote</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="label">Número de Lote</label>
                <input
                  type="text"
                  value={formData.numero_lote}
                  readOnly
                  className="input bg-slate-100 cursor-not-allowed"
                  title="Se genera automáticamente"
                />
                <p className="text-xs text-slate-500 mt-1">Se genera automáticamente</p>
              </div>

              <div>
                <label className="label">Tipo de Lote *</label>
                <select
                  required
                  value={formData.tipo_lote}
                  onChange={(e) => setFormData({ ...formData, tipo_lote: e.target.value })}
                  className="input"
                >
                  <option value="PROPIO">Propio</option>
                  <option value="TERCERIZADO">Tercerizado</option>
                </select>
              </div>

              <div>
                <label className="label">Fecha de Ingreso *</label>
                <input
                  type="date"
                  required
                  value={formData.fecha_ingreso}
                  disabled={isEdit}
                  onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })}
                  className={isEdit ? 'input bg-slate-100 cursor-not-allowed' : 'input'}
                />
                {isEdit && <p className="text-xs text-slate-500 mt-1">No editable</p>}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Parámetros del Lote</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="label">Cantidad Inicial *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.cantidad_inicial}
                  onChange={(e) => setFormData({ ...formData, cantidad_inicial: parseInt(e.target.value) })}
                  className="input"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="label">Peso Promedio Inicial (lb) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.peso_promedio_inicial}
                  onChange={(e) => setFormData({ ...formData, peso_promedio_inicial: parseFloat(e.target.value) })}
                  className="input"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="label">Granja *</label>
                <select
                  required
                  value={formData.granja_id}
                  onChange={(e) => {
                    setFormData({ ...formData, granja_id: e.target.value, galpon_id: '' })
                  }}
                  className="input"
                >
                  <option value="">Seleccionar granja</option>
                  {granjas.map((g) => (
                    <option key={g.id} value={g.id}>{g.nombre}</option>
                  ))}
                </select>
                {formData.granja_id && (
                  <p className="text-xs text-green-600 mt-1">ID: {formData.granja_id}</p>
                )}
              </div>

              <div>
                <label className="label">Galpón *</label>
                <select
                
                  required
                  value={formData.galpon_id}
                  onChange={(e) => setFormData({ ...formData, galpon_id: e.target.value })}
                  className="input"
                  disabled={!formData.granja_id}
                >
                  <option value="">Seleccionar galpón</option>
                  {galpones.map((g) => (
                    <option key={g.id} value={g.id}>{g.numero}</option>
                  ))}
                </select>
                {!formData.granja_id && (
                  <p className="text-xs text-slate-500 mt-1">Seleccione una granja primero</p>
                )}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Observaciones</h2>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              className="input h-24"
              placeholder="Observaciones adicionales..."
            />
          </div>

          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/lotes')}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || loadingData}
              className="btn btn-primary"
            >
              {loading ? 'Guardando...' : isEdit ? 'Actualizar Lote' : 'Crear Lote'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}