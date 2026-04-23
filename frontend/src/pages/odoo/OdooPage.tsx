import { useState } from 'react'
import { toast } from 'sonner'

const mockLogs = [
  { id: '1', modulo: 'lotes', operacion: 'sync', status: 'SUCCESS', mensaje: 'Sincronización exitosa', fecha: '2024-02-05 10:30:00' },
  { id: '2', modulo: 'productos', operacion: 'import', status: 'ERROR', mensaje: 'Producto no encontrado', fecha: '2024-02-05 09:15:00' },
  { id: '3', modulo: 'terceros', operacion: 'sync', status: 'SUCCESS', mensaje: '3 terceros actualizados', fecha: '2024-02-04 16:45:00' },
]

export default function OdooPage() {
  const [ conectando, setConectando] = useState(false)
  const [url, setUrl] = useState('http://localhost:8069')
  const [db, setDb] = useState('odoo')
  const [user, setUser] = useState('admin')

  const testConnection = async () => {
    setConectando(true)
    await new Promise(r => setTimeout(r, 2000))
    toast.success('Conexión exitosa con Odoo')
    setConectando(false)
  }

  const syncMaestros = async () => toast.success('Sincronización de maestros iniciada')
  const syncInventario = async () => toast.success('Sincronización de inventario iniciada')

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Integración Odoo</h1><p className="text-slate-500">Configuración de conexión con Odoo ERP</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Conexión</h2>
          <div className="space-y-4">
            <div><label className="label">URL de Odoo</label><input type="text" className="input" value={url} onChange={e => setUrl(e.target.value)} /></div>
            <div><label className="label">Base de Datos</label><input type="text" className="input" value={db} onChange={e => setDb(e.target.value)} /></div>
            <div><label className="label">Usuario</label><input type="text" className="input" value={user} onChange={e => setUser(e.target.value)} /></div>
            <div><label className="label">Contraseña</label><input type="password" className="input" defaultValue="admin" /></div>
            <button onClick={testConnection} disabled={conectando} className="btn-primary">{conectando ? 'Conectando...' : 'Probar Conexión'}</button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Sincronización</h2>
          <div className="space-y-3">
            <button onClick={syncMaestros} className="w-full btn-secondary justify-start">📥 Sincronizar Maestros</button>
            <button onClick={syncInventario} className="w-full btn-secondary justify-start">📦 Sincronizar Inventario</button>
            <button className="w-full btn-secondary justify-start">📋 Enviar Movimiento</button>
            <button className="w-full btn-secondary justify-start">📝 Liquidar Lote</button>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Logs de Integración</h2>
        <table className="w-full">
          <thead><tr className="bg-slate-50"><th className="table-header">Fecha</th><th className="table-header">Módulo</th><th className="table-header">Operación</th><th className="table-header">Estado</th><th className="table-header">Mensaje</th></tr></thead>
          <tbody>{mockLogs.map(l => (<tr key={l.id} className="table-row"><td className="table-cell text-xs">{l.fecha}</td><td className="table-cell">{l.modulo}</td><td className="table-cell">{l.operacion}</td><td className="table-cell"><span className={`badge ${l.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'}`}>{l.status}</span></td><td className="table-cell">{l.mensaje}</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  )
}