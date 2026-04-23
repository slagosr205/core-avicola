import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { galponesApi, granjasApi } from '@/services/api'

type Granja = { id: string; nombre: string; ubicacion?: string; activo: boolean }
type Galpon = { id: string; numero: string; capacidad?: number; granja_id?: string; activo: boolean }

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('granjas')
  const [granjas, setGranjas] = useState<Granja[]>([])
  const [galpones, setGalpones] = useState<Galpon[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Granja | Galpon | null>(null)
  const [formData, setFormData] = useState<Record<string, string | number | boolean>>({})

  const loadGranjas = async () => {
    try {
      const res = await granjasApi.list()
      setGranjas(res.data)
    } catch {
      toast.error('Error al cargar granjas')
    }
  }

  const loadGalpones = async () => {
    try {
      const res = await galponesApi.list()
      setGalpones(res.data)
    } catch {
      toast.error('Error al cargar galpones')
    }
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([loadGranjas(), loadGalpones()]).finally(() => setLoading(false))
  }, [])

  const openModal = (item?: Granja | Galpon, type?: 'granja' | 'galpon') => {
    setEditItem(item || null)
    if (item) {
      setFormData({ ...item } as Record<string, string | number | boolean>)
    } else {
      setFormData(type === 'galpon' ? { numero: '', capacidad: '', granja_id: '' } : { nombre: '', ubicacion: '' })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditItem(null)
    setFormData({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (activeTab === 'granjas') {
        if (editItem) {
          await granjasApi.update(editItem.id, formData)
          toast.success('Granja actualizada')
        } else {
          await granjasApi.create(formData)
          toast.success('Granja creada')
        }
        await loadGranjas()
      } else {
        if (editItem) {
          await galponesApi.update(editItem.id, formData)
          toast.success('Galpón actualizado')
        } else {
          await galponesApi.create(formData)
          toast.success('Galpón creado')
        }
        await loadGalpones()
      }
      closeModal()
    } catch {
      toast.error('Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return
    setLoading(true)
    try {
      if (activeTab === 'granjas') {
        await granjasApi.delete(id)
        await loadGranjas()
      } else {
        await galponesApi.delete(id)
        await loadGalpones()
      }
      toast.success('Eliminado correctamente')
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'granjas', label: 'Granjas' },
    { id: 'galpones', label: 'Galpones' },
    { id: 'usuarios', label: 'Usuarios' },
    { id: 'parametros', label: 'Parámetros' },
  ]

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Configuración</h1><p className="text-slate-500">Parámetros del sistema</p></div>

      <div className="card">
        <div className="border-b border-slate-200">
          <nav className="flex gap-6 px-6">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'granjas' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-slate-700">Granjas</h3>
                <button onClick={() => openModal(undefined, 'granja')} className="btn btn-primary">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Nueva Granja
                </button>
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="table-header">Nombre</th>
                      <th className="table-header">Ubicación</th>
                      <th className="table-header">Estado</th>
                      <th className="table-header text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {granjas.map(g => (
                      <tr key={g.id} className="table-row">
                        <td className="table-cell font-medium text-slate-800">{g.nombre}</td>
                        <td className="table-cell text-slate-600">{g.ubicacion || '-'}</td>
                        <td className="table-cell">
                          <span className={`badge ${g.activo ? 'badge-success' : 'badge-neutral'}`}>{g.activo ? 'Activo' : 'Inactivo'}</span>
                        </td>
                        <td className="table-cell text-right">
                          <button onClick={() => openModal(g)} className="btn-icon btn-icon-edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(g.id)} className="btn-icon btn-icon-delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {granjas.length === 0 && (
                      <tr><td colSpan={4} className="table-cell text-center text-slate-400 py-8">No hay granjas registradas</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'galpones' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-slate-700">Galpones</h3>
                <button onClick={() => openModal(undefined, 'galpon')} className="btn btn-primary">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Nuevo Galpón
                </button>
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="table-header">Número</th>
                      <th className="table-header">Granja</th>
                      <th className="table-header">Capacidad</th>
                      <th className="table-header">Estado</th>
                      <th className="table-header text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {galpones.map(g => {
                      const granja = granjas.find(gr => gr.id === g.granja_id)
                      return (
                        <tr key={g.id} className="table-row">
                          <td className="table-cell font-medium text-slate-800">{g.numero}</td>
                          <td className="table-cell text-slate-600">{granja?.nombre || '-'}</td>
                          <td className="table-cell text-slate-600">{g.capacidad?.toLocaleString() || '-'}</td>
                          <td className="table-cell">
                            <span className={`badge ${g.activo ? 'badge-success' : 'badge-neutral'}`}>{g.activo ? 'Activo' : 'Inactivo'}</span>
                          </td>
                          <td className="table-cell text-right">
                            <button onClick={() => openModal(g)} className="btn-icon btn-icon-edit">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(g.id)} className="btn-icon btn-icon-delete">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {galpones.length === 0 && (
                      <tr><td colSpan={5} className="table-cell text-center text-slate-400 py-8">No hay galpones registrados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'usuarios' && <div className="p-8 text-center text-slate-500"><p>Gestión de usuarios del sistema</p></div>}
          {activeTab === 'parametros' && <div className="p-8 text-center text-slate-500"><p>Parámetros generales del sistema</p></div>}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editItem ? 'Editar' : 'Nueva'} {activeTab === 'granjas' ? 'Granja' : 'Galpón'}</h2>
              <button onClick={closeModal} className="modal-close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              {activeTab === 'granjas' ? (
                <>
                  <div className="form-group">
                    <label className="label">Nombre *</label>
                    <input type="text" className="input" required value={String(formData.nombre || '')} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="label">Ubicación</label>
                    <input type="text" className="input" value={String(formData.ubicacion || '')} onChange={e => setFormData({ ...formData, ubicacion: e.target.value })} />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="label">Número *</label>
                    <input type="text" className="input" required value={String(formData.numero || '')} onChange={e => setFormData({ ...formData, numero: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="label">Granja *</label>
                    <select className="input" required value={String(formData.granja_id || '')} onChange={e => setFormData({ ...formData, granja_id: e.target.value })}>
                      <option value="">Seleccionar granja</option>
                      {granjas.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">Capacidad</label>
                    <input type="number" className="input" value={Number(formData.capacidad || 0)} onChange={e => setFormData({ ...formData, capacidad: Number(e.target.value) })} />
                  </div>
                </>
              )}
              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}