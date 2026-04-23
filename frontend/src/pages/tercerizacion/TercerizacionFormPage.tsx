import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export default function TercerizacionFormPage() {
  const navigate = useNavigate()
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); toast.success('Contrato creado'); navigate('/tercerizacion') }
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Nuevo Contrato</h1></div>
      <form onSubmit={handleSubmit} className="card p-6 max-w-2xl space-y-4">
        <div><label className="label">Tercero *</label><select className="input" required><option value="">Seleccionar</option></select></div>
        <div><label className="label">Lote *</label><select className="input" required><option value="">Seleccionar</option></select></div>
        <div><label className="label">Tipo de Contrato *</label><select className="input" required><option value="POR_CABEZA">Por Cabeza</option><option value="POR_LIBRA">Por Libra</option></select></div>
        <div><label className="label">Tarifa *</label><input type="number" className="input" required step="0.01" /></div>
        <div><label className="label">Cantidad de Aves</label><input type="number" className="input" /></div>
        <div className="flex gap-4 pt-4"><button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Crear</button></div>
      </form>
    </div>
  )
}