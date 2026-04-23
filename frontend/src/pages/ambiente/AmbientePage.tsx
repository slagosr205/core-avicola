import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ambienteApi, lotesApi } from '@/services/api'

type Semaforo = 'OK' | 'WARN' | 'BAD' | 'NA'

type LoteLite = { id: string; numero_lote: string }

type ParametroEstado = {
  estado: Semaforo
  valor?: number | null
  minimo?: number | null
  maximo?: number | null
  mensaje?: string | null
}

type AmbienteEstado = {
  lote_id: string
  fecha_hora?: string | null
  temperatura: ParametroEstado
  humedad: ParametroEstado
  luz_horas: ParametroEstado
  comidas: ParametroEstado
}

type AmbienteRegistro = {
  id: string
  lote_id: string
  fecha_hora: string
  temperatura_c: number
  humedad_relativa: number
  observaciones?: string | null
}

type Programacion = {
  horas_comida: string[]
  luz_inicio?: string | null
  luz_fin?: string | null
}

function semaforoBadge(estado: Semaforo) {
  const map: Record<Semaforo, string> = {
    OK: 'badge badge-success',
    WARN: 'badge badge-warning',
    BAD: 'badge badge-danger',
    NA: 'badge badge-neutral',
  }
  return map[estado]
}

function numOrDash(v: unknown, digits = 1) {
  if (typeof v !== 'number' || Number.isNaN(v)) return '-'
  return v.toFixed(digits)
}

function toLocalDateTimeInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`
}

export default function AmbientePage() {
  const [tab, setTab] = useState<'estado' | 'programacion' | 'registros'>('estado')
  const [lotes, setLotes] = useState<LoteLite[]>([])
  const [loteId, setLoteId] = useState('')
  const [estado, setEstado] = useState<AmbienteEstado | null>(null)
  const [registros, setRegistros] = useState<AmbienteRegistro[]>([])
  const [programacion, setProgramacion] = useState<Programacion>({ horas_comida: [], luz_inicio: null, luz_fin: null })
  const [loading, setLoading] = useState(true)

  const [formRegistro, setFormRegistro] = useState({
    fecha_hora: toLocalDateTimeInputValue(new Date()),
    temperatura_c: 24,
    humedad_relativa: 60,
    observaciones: '',
  })
  const [horasComidaText, setHorasComidaText] = useState('')

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await lotesApi.list()
        if (cancelled) return
        setLotes(res.data)
        if (!loteId && res.data?.length) setLoteId(res.data[0].id)
      } catch {
        if (!cancelled) toast.error('No se pudieron cargar los lotes')
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [loteId])

  const loteLabel = useMemo(() => {
    return lotes.find((l) => l.id === loteId)?.numero_lote ?? ''
  }, [lotes, loteId])

  const reload = async (targetLoteId: string) => {
    setLoading(true)
    try {
      const [estadoRes, registrosRes] = await Promise.all([
        ambienteApi.getEstado(targetLoteId),
        ambienteApi.listRegistros(targetLoteId),
      ])
      setEstado(estadoRes.data)
      setRegistros(registrosRes.data)

      try {
        const progRes = await ambienteApi.getProgramacion(targetLoteId)
        const prog = progRes.data as { horas_comida: string[]; luz_inicio?: string | null; luz_fin?: string | null }
        setProgramacion({ horas_comida: prog.horas_comida ?? [], luz_inicio: prog.luz_inicio ?? null, luz_fin: prog.luz_fin ?? null })
        setHorasComidaText((prog.horas_comida ?? []).join(', '))
      } catch {
        setProgramacion({ horas_comida: [], luz_inicio: null, luz_fin: null })
        setHorasComidaText('')
      }
    } catch {
      toast.error('No se pudo cargar el estado de ambiente')
      setEstado(null)
      setRegistros([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!loteId) return
    void reload(loteId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loteId])

  const saveProgramacion = async () => {
    if (!loteId) return
    const horas = horasComidaText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    try {
      await ambienteApi.upsertProgramacion(loteId, {
        horas_comida: horas,
        luz_inicio: programacion.luz_inicio || null,
        luz_fin: programacion.luz_fin || null,
      })
      toast.success('Programación guardada')
      await reload(loteId)
    } catch {
      toast.error('No se pudo guardar la programación')
    }
  }

  const createRegistro = async () => {
    if (!loteId) return
    try {
      await ambienteApi.createRegistro({
        lote_id: loteId,
        fecha_hora: new Date(formRegistro.fecha_hora).toISOString(),
        temperatura_c: Number(formRegistro.temperatura_c),
        humedad_relativa: Number(formRegistro.humedad_relativa),
        observaciones: formRegistro.observaciones || null,
      })
      toast.success('Registro guardado')
      setFormRegistro((p) => ({ ...p, observaciones: '' }))
      await reload(loteId)
    } catch {
      toast.error('No se pudo guardar el registro')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ambiente</h1>
          <p className="text-slate-500">Temperatura, humedad, comida y luz con semáforo</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input w-72" value={loteId} onChange={(e) => setLoteId(e.target.value)}>
            <option value="">Seleccionar lote</option>
            {lotes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.numero_lote}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-slate-200">
          <nav className="flex gap-6 px-6">
            <button
              onClick={() => setTab('estado')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                tab === 'estado' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Estado
            </button>
            <button
              onClick={() => setTab('programacion')}
              className={` py-4 text-sm font-medium border-b-2 transition-colors ${
                tab === 'programacion'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Programación
            </button>
            <button
              onClick={() => setTab('registros')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                tab === 'registros'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Registros
            </button>
          </nav>
        </div>

        <div className="p-6">
          {!loteId ? (
            <div className="text-sm text-slate-500">Seleccione un lote.</div>
          ) : loading ? (
            <div className="text-sm text-slate-500">Cargando...</div>
          ) : tab === 'estado' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">{loteLabel || 'Lote'}</h2>
                  <p className="text-sm text-slate-500">
                    Última lectura: {estado?.fecha_hora ? new Date(estado.fecha_hora).toLocaleString('es-ES') : 'Sin registros'}
                  </p>
                </div>
                <button className="btn btn-secondary" onClick={() => void reload(loteId)}>
                  ↻ Actualizar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ParametroCard
                  title="Temperatura"
                  unit="°C"
                  p={estado?.temperatura}
                  valueFmt={(v) => numOrDash(v, 1)}
                />
                <ParametroCard title="Humedad Relativa" unit="%" p={estado?.humedad} valueFmt={(v) => numOrDash(v, 0)} />
                <ParametroCard title="Horas de Luz" unit="h" p={estado?.luz_horas} valueFmt={(v) => numOrDash(v, 1)} />
                <ParametroCard title="Comidas Programadas" unit="" p={estado?.comidas} valueFmt={(v) => numOrDash(v, 0)} />
              </div>
            </div>
          ) : tab === 'programacion' ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Programación</h2>
                <p className="text-sm text-slate-500">Defina horas de comida (HH:MM) y el rango de luz.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Horas de comida (separadas por coma)</label>
                  <input
                    className="input"
                    value={horasComidaText}
                    onChange={(e) => setHorasComidaText(e.target.value)}
                    placeholder="06:00, 12:00, 18:00"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Luz inicio</label>
                    <input
                      className="input"
                      type="time"
                      value={programacion.luz_inicio ?? ''}
                      onChange={(e) => setProgramacion((p) => ({ ...p, luz_inicio: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">Luz fin</label>
                    <input
                      className="input"
                      type="time"
                      value={programacion.luz_fin ?? ''}
                      onChange={(e) => setProgramacion((p) => ({ ...p, luz_fin: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="btn btn-primary" onClick={() => void saveProgramacion()}>
                  💾 Guardar
                </button>
                <span className="text-sm text-slate-500">Se usará para el semáforo de comidas y luz.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Registrar lectura</h2>
                <p className="text-sm text-slate-500">Registre temperatura y humedad del lote.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="label">Fecha y hora</label>
                  <input
                    className="input"
                    type="datetime-local"
                    value={formRegistro.fecha_hora}
                    onChange={(e) => setFormRegistro((p) => ({ ...p, fecha_hora: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Temperatura (°C)</label>
                  <input
                    className="input"
                    type="number"
                    step="0.1"
                    value={formRegistro.temperatura_c}
                    onChange={(e) => setFormRegistro((p) => ({ ...p, temperatura_c: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="label">Humedad (%)</label>
                  <input
                    className="input"
                    type="number"
                    step="1"
                    value={formRegistro.humedad_relativa}
                    onChange={(e) => setFormRegistro((p) => ({ ...p, humedad_relativa: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="label">Observaciones</label>
                  <input
                    className="input"
                    value={formRegistro.observaciones}
                    onChange={(e) => setFormRegistro((p) => ({ ...p, observaciones: e.target.value }))}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div>
                <button className="btn btn-primary" onClick={() => void createRegistro()}>
                  ➕ Guardar lectura
                </button>
              </div>

              <div className="card p-0">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="table-header">Fecha/hora</th>
                      <th className="table-header text-right">Temp (°C)</th>
                      <th className="table-header text-right">HR (%)</th>
                      <th className="table-header">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.map((r) => (
                      <tr key={r.id} className="table-row">
                        <td className="table-cell">{new Date(r.fecha_hora).toLocaleString('es-ES')}</td>
                        <td className="table-cell text-right">{r.temperatura_c.toFixed(1)}</td>
                        <td className="table-cell text-right">{Math.round(r.humedad_relativa)}</td>
                        <td className="table-cell">{r.observaciones || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {registros.length === 0 && <div className="p-6 text-sm text-slate-500">Sin registros.</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ParametroCard({
  title,
  unit,
  p,
  valueFmt,
}: {
  title: string
  unit: string
  p?: ParametroEstado | null
  valueFmt: (v: number) => string
}) {
  const estado = p?.estado ?? 'NA'
  const value = typeof p?.valor === 'number' ? valueFmt(p.valor) : '-'
  const range = p?.minimo != null && p?.maximo != null ? `${p.minimo}-${p.maximo}` : null

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-xl font-bold text-slate-800 mt-1">
            {value}
            {unit ? <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span> : null}
          </p>
          <p className="text-xs text-slate-500 mt-1">{p?.mensaje || (range ? `Rango: ${range}` : 'Sin datos')}</p>
        </div>
        <span className={semaforoBadge(estado)}>{estado}</span>
      </div>
    </div>
  )
}
