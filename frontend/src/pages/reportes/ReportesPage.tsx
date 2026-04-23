import { useState } from 'react'

const reportes = [
  { id: 'lote', nombre: 'Reporte de Lotes', descripcion: 'Listado completo de lotes' },
  { id: 'costos', nombre: 'Reporte de Costos', descripcion: 'Resumen de costos por lote' },
  { id: 'mortalidad', nombre: 'Reporte de Mortalidad', descripcion: 'Control de mortalidad por lote' },
  { id: 'pesajes', nombre: 'Reporte de Pesajes', descripcion: 'Historial de pesajes' },
  { id: 'procesamiento', nombre: 'Reporte de Procesamiento', descripcion: 'Rendimiento y costos' },
  { id: 'comparativo', nombre: 'Reporte Comparativo', descripcion: 'Comparación entre lotes' },
]

export default function ReportesPage() {
  const [reporteSeleccionado, setReporteSeleccionado] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  const generarReporte = () => {
    console.log('Generando reporte:', reporteSeleccionado, fechaInicio, fechaFin)
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Reportes</h1><p className="text-slate-500">Generar reportes del sistema</p></div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Seleccionar Reporte</h2>
            <div className="space-y-2">
              {reportes.map(r => (
                <button key={r.id} onClick={() => setReporteSeleccionado(r.id)} className={`w-full text-left p-3 rounded-lg border ${reporteSeleccionado === r.id ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <p className="font-medium text-slate-800">{r.nombre}</p>
                  <p className="text-sm text-slate-500">{r.descripcion}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Parámetros</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="label">Fecha Inicio</label><input type="date" className="input" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} /></div>
              <div><label className="label">Fecha Fin</label><input type="date" className="input" value={fechaFin} onChange={e => setFechaFin(e.target.value)} /></div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Vista Previa</h2>
            <div className="h-96 flex items-center justify-center text-slate-400">Seleccione un reporte para ver la vista previa</div>
          </div>

          <div className="flex gap-4">
            <button onClick={generarReporte} disabled={!reporteSeleccionado} className="btn-primary">📄 Ver Reporte</button>
            <button disabled={!reporteSeleccionado} className="btn-secondary">📊 Exportar Excel</button>
            <button disabled={!reporteSeleccionado} className="btn-secondary">📑 Exportar PDF</button>
          </div>
        </div>
      </div>
    </div>
  )
}