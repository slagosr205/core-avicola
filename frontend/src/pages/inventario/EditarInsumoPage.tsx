import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { insumosApi } from '@/services/api'

interface Insumo {
  id: string
  codigo: string
  nombre: string
  tipo: string
  unidad?: string
  costo_unitario?: number
  activo: boolean
}

export default function EditarInsumoPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'ALIMENTO',
    unidad: '',
    costo_unitario: '',
    activo: true,
  })

  useEffect(() => {
    if (!id) {
      toast.error('ID de insumo no encontrado')
      navigate('/inventario')
      return
    }

    const loadInsumo = async () => {
      try {
        const res = await insumosApi.get(id)
        const insumo: Insumo = res.data
        setFormData({
          nombre: insumo.nombre || '',
          tipo: insumo.tipo || 'ALIMENTO',
          unidad: insumo.unidad || '',
          costo_unitario: insumo.costo_unitario?.toString() || '',
          activo: insumo.activo ?? true,
        })
      } catch {
        toast.error('Error al cargar insumo')
        navigate('/inventario')
      } finally {
        setLoading(false)
      }
    }

    loadInsumo()
  }, [id, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre) {
      toast.error('El nombre es requerido')
      return
    }

    if (!id) return

    setSaving(true)
    try {
      await insumosApi.update(id, {
        ...formData,
        costo_unitario: formData.costo_unitario ? parseFloat(formData.costo_unitario) : null,
      })
      toast.success('Insumo actualizado correctamente')
      navigate('/inventario')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar insumo'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-slate-500">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Editar Insumo</h1>
          <p className="text-slate-500">Modifica los datos del insumo</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/inventario')}
          className="btn btn-secondary"
        >
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label">Nombre *</label>
          <input
            type="text"
            className="input w-full"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Nombre del insumo"
            required
          />
        </div>

        <div>
          <label className="label">Tipo</label>
          <select
            className="input w-full"
            value={formData.tipo}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
          >
            <option value="ALIMENTO">Alimento</option>
            <option value="MEDICAMENTO">Medicamento</option>
            <option value="VACUNA">Vacuna</option>
            <option value="POLLITO">Pollito</option>
            <option value="MATERIAL">Material</option>
            <option value="EQUIPO">Equipo</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>

        <div>
          <label className="label">Unidad</label>
          <input
            type="text"
            className="input w-full"
            value={formData.unidad}
            onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
            placeholder="Ej: kg, lb, unidades"
          />
        </div>

        <div>
          <label className="label">Costo Unitario (L)</label>
          <input
            type="number"
            step="0.01"
            className="input w-full"
            value={formData.costo_unitario}
            onChange={(e) => setFormData({ ...formData, costo_unitario: e.target.value })}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">Activo</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/inventario')}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}