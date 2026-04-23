import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { lotesApi, pesajesApi } from '@/services/api'

type LoteLite = { id: string; numero_lote: string }

type PesajeResponse = {
  id: string
  lote_id: string
  semana: number
  fecha: string
  cantidad_muestreada: number
  peso_total_muestra: number
  observaciones?: string | null
}

export default function PesajeFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [lotes, setLotes] = useState<LoteLite[]>([])

  const [formData, setFormData] = useState({
    lote_id: '',
    semana: 1,
    fecha: new Date().toISOString().split('T')[0],
    cantidad_muestreada: 50,
    peso_total_muestra: 0,
    observaciones: '',
  })

  const loteLabelById = useMemo(() => {
    const m: Record<string, string> = {}
    for (const l of lotes) m[l.id] = l.numero_lote
    return m
  }, [lotes])

  const pesoPromedio = useMemo(() => {
    const cant = Number(formData.cantidad_muestreada)
    const total = Number(formData.peso_total_muestra)
    if (!Number.isFinite(cant) || cant <= 0) return null
    if (!Number.isFinite(total) || total <= 0) return null
    return total / cant
  }, [formData.cantidad_muestreada, formData.peso_total_muestra])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const res = await lotesApi.list()
        if (cancelled) return
        setLotes(res.data)
      } catch {
        if (!cancelled) toast.error('No se pudieron cargar los lotes')
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoadingInitial(true)
      try {
        if (!isEdit || !id) return

        const res = await pesajesApi.get(id)
        if (cancelled) return
        const p: PesajeResponse = res.data
        setFormData({
          lote_id: p.lote_id,
          semana: p.semana,
          fecha: String(p.fecha).split('T')[0],
          cantidad_muestreada: p.cantidad_muestreada,
          peso_total_muestra: p.peso_total_muestra,
          observaciones: p.observaciones ?? '',
        })
      } catch {
        if (!cancelled) toast.error('No se pudo cargar el pesaje')
      } finally {
        if (!cancelled) setLoadingInitial(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEdit && id) {
        await pesajesApi.update(id, {
          peso_total_muestra: Number(formData.peso_total_muestra),
          observaciones: formData.observaciones || null,
        })
        toast.success('Pesaje actualizado correctamente')
      } else {
        await pesajesApi.create({
          lote_id: formData.lote_id,
          semana: Number(formData.semana),
          fecha: formData.fecha,
          cantidad_muestreada: Number(formData.cantidad_muestreada),
          peso_total_muestra: Number(formData.peso_total_muestra),
          observaciones: formData.observaciones || null,
        })
        toast.success('Pesaje registrado correctamente')
      }

      navigate('/pesajes')
    } catch {
      toast.error('Error al guardar el pesaje')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'Editar Pesaje' : 'Nuevo Pesaje'}</h1>
        <p className="text-slate-500">{isEdit ? 'Modificar peso y observaciones' : 'Registrar pesaje semanal'}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="card p-6 max-w-2xl space-y-4">
        <div>
          <label className="label">Lote *</label>
          <select
            className={isEdit ? 'input bg-slate-100 cursor-not-allowed' : 'input'}
            required
            disabled={isEdit || loadingInitial}
            value={formData.lote_id}
            onChange={(e) => setFormData((p) => ({ ...p, lote_id: e.target.value }))}
          >
            <option value="">Seleccionar lote</option>
            {lotes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.numero_lote}
              </option>
            ))}
          </select>
          {isEdit && formData.lote_id && (
            <p className="text-xs text-slate-500 mt-1">No editable ({loteLabelById[formData.lote_id] ?? formData.lote_id})</p>
          )}
        </div>
        <div>
          <label className="label">Semana *</label>
          <input
            type="number"
            className={isEdit ? 'input bg-slate-100 cursor-not-allowed' : 'input'}
            required
            min="1"
            disabled={isEdit || loadingInitial}
            value={formData.semana}
            onChange={(e) => setFormData((p) => ({ ...p, semana: Number(e.target.value) }))}
          />
          {isEdit && <p className="text-xs text-slate-500 mt-1">No editable</p>}
        </div>
        <div>
          <label className="label">Fecha *</label>
          <input
            type="date"
            className={isEdit ? 'input bg-slate-100 cursor-not-allowed' : 'input'}
            required
            disabled={isEdit || loadingInitial}
            value={formData.fecha}
            onChange={(e) => setFormData((p) => ({ ...p, fecha: e.target.value }))}
          />
          {isEdit && <p className="text-xs text-slate-500 mt-1">No editable</p>}
        </div>
        <div>
          <label className="label">Cantidad Muestreada *</label>
          <input
            type="number"
            className={isEdit ? 'input bg-slate-100 cursor-not-allowed' : 'input'}
            required
            min="1"
            disabled={isEdit || loadingInitial}
            value={formData.cantidad_muestreada}
            onChange={(e) => setFormData((p) => ({ ...p, cantidad_muestreada: Number(e.target.value) }))}
            placeholder="50"
          />
          {isEdit && <p className="text-xs text-slate-500 mt-1">No editable</p>}
        </div>
        <div>
          <label className="label">Peso Total de Muestra (lb) *</label>
          <input
            type="number"
            className="input"
            required
            min="0.01"
            step="0.01"
            disabled={loadingInitial}
            value={formData.peso_total_muestra}
            onChange={(e) => setFormData((p) => ({ ...p, peso_total_muestra: Number(e.target.value) }))}
          />
          {pesoPromedio != null && (
            <p className="text-xs text-slate-500 mt-1">
              Peso promedio estimado: <span className="font-medium text-slate-700">{pesoPromedio.toFixed(3)} lb</span>
            </p>
          )}
        </div>
        <div>
          <label className="label">Observaciones</label>
          <textarea
            className="input h-20"
            disabled={loadingInitial}
            value={formData.observaciones}
            onChange={(e) => setFormData((p) => ({ ...p, observaciones: e.target.value }))}
          />
        </div>
        <div className="flex gap-4 pt-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Registrar Pesaje'}
          </button>
        </div>
      </form>
    </div>
  )
}
