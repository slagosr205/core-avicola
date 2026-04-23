import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { lotesApi, mortalidadApi } from '@/services/api'

type LoteLite = { id: string; numero_lote: string }

type MortalidadResponse = {
  id: string
  lote_id: string
  fecha: string
  cantidad: number
  causa: 'ENFERMEDAD' | 'CALOR' | 'FRIO' | 'PREDADORES' | 'OTRO'
  observaciones?: string | null
}

export default function MortalidadFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [loadingInitial, setLoadingInitial] = useState(true)
  const [lotes, setLotes] = useState<LoteLite[]>([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    lote_id: '',
    fecha: new Date().toISOString().split('T')[0],
    cantidad: 1,
    causa: 'ENFERMEDAD' as MortalidadResponse['causa'],
    observaciones: '',
  })

  const loteLabelById = useMemo(() => {
    const m: Record<string, string> = {}
    for (const l of lotes) m[l.id] = l.numero_lote
    return m
  }, [lotes])

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
        const res = await mortalidadApi.get(id)
        if (cancelled) return
        const m: MortalidadResponse = res.data
        setFormData({
          lote_id: m.lote_id,
          fecha: String(m.fecha).split('T')[0],
          cantidad: m.cantidad,
          causa: m.causa,
          observaciones: m.observaciones ?? '',
        })
      } catch {
        if (!cancelled) toast.error('No se pudo cargar el registro')
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
        await mortalidadApi.update(id, {
          fecha: formData.fecha,
          cantidad: Number(formData.cantidad),
          causa: formData.causa,
          observaciones: formData.observaciones || null,
        })
        toast.success('Mortalidad actualizada')
      } else {
        await mortalidadApi.create({
          lote_id: formData.lote_id,
          fecha: formData.fecha,
          cantidad: Number(formData.cantidad),
          causa: formData.causa,
          observaciones: formData.observaciones || null,
        })
        toast.success('Mortalidad registrada')
      }
      navigate('/mortalidad')
    } catch {
      toast.error('Error al guardar la mortalidad')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'Editar Mortalidad' : 'Registrar Mortalidad'}</h1>
        <p className="text-slate-500">{isEdit ? 'Actualizar el registro' : 'Registrar evento de mortalidad'}</p>
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
          <label className="label">Fecha *</label>
          <input
            type="date"
            className="input"
            required
            disabled={loadingInitial}
            value={formData.fecha}
            onChange={(e) => setFormData((p) => ({ ...p, fecha: e.target.value }))}
          />
        </div>

        <div>
          <label className="label">Cantidad *</label>
          <input
            type="number"
            className="input"
            required
            min="1"
            disabled={loadingInitial}
            value={formData.cantidad}
            onChange={(e) => setFormData((p) => ({ ...p, cantidad: Number(e.target.value) }))}
          />
          <p className="text-xs text-slate-500 mt-1">
            Este valor ajusta automáticamente la cantidad actual del lote (aves vivas).
          </p>
        </div>

        <div>
          <label className="label">Causa *</label>
          <select
            className="input"
            required
            disabled={loadingInitial}
            value={formData.causa}
            onChange={(e) => setFormData((p) => ({ ...p, causa: e.target.value as MortalidadResponse['causa'] }))}
          >
            <option value="ENFERMEDAD">Enfermedad</option>
            <option value="CALOR">Calor</option>
            <option value="FRIO">Frío</option>
            <option value="PREDADORES">Depredadores</option>
            <option value="OTRO">Otro</option>
          </select>
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
            {loading ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Registrar'}
          </button>
        </div>
      </form>
    </div>
  )
}
