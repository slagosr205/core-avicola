import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export default function ProcesamientoFormPage() {
  const navigate = useNavigate()
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); toast.success('Procesamiento registrado'); navigate('/procesamiento') }
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Nuevo Procesamiento</h1><p className="text-slate-500">Registrar procesamiento de lote</p></div>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div><label className="label">Lote *</label><select className="input" required><option value="">Seleccionar</option></select></div>
        <div><label className="label">Fecha Recepción *</label><input type="date" className="input" required /></div>
        <div><label className="label">Peso Vivo Recibido (lb) *</label><input type="number" className="input" required /></div>
        <div><label className="label">Merma Transporte (lb)</label><input type="number" className="input" defaultValue="0" /></div>
        <div><label className="label">Peso Carne (lb)</label><input type="number" className="input" /></div>
        <div><label className="label">Peso Menudos (lb)</label><input type="number" className="input" /></div>
        <div><label className="label">Decomiso (lb)</label><input type="number" className="input" defaultValue="0" /></div>
        <div className="flex gap-4 pt-4"><button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Registrar</button></div>
      </form>
    </div>
  )
}