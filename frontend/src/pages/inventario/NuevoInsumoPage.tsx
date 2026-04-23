import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { insumosApi } from '@/services/api'

export default function NuevoInsumoPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'ALIMENTO',
    unidad: '',
    costo_unitario: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre) {
      toast.error('El nombre es requerido')
      return
    }

    setLoading(true)
    try {
      await insumosApi.create({
        ...formData,
        costo_unitario: formData.costo_unitario ? parseFloat(formData.costo_unitario) : null,
      })
      toast.success('Insumo creado correctamente')
      navigate('/inventario')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear insumo'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nuevo Insumo</h1>
          <p className="text-slate-500">Registra un nuevo insumo o concentrado</p>
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
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Guardando...' : 'Guardar Insumo'}
          </button>
        </div>
      </form>
    </div>
  )
}