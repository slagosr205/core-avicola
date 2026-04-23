import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { lotesApi, pesajesApi, presupuestoPesosApi } from '@/services/api'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Semaforo = 'OK' | 'WARN' | 'BAD' | 'NA'

type LoteLite = { id: string; numero_lote: string }

type PresupuestoRow = {
  semana: number
  edad: number
  peso_objetivo: number
  gd: number | null
  ca: number | null
}

type Pesaje = {
  semana: number
  fecha: string
  peso_promedio: number
}

type EstadoSemana = {
  semana: number
  edad: number
  peso_objetivo: number
  gd?: number | null
  ca?: number | null
  peso_real?: number | null
  delta?: number | null
  ganancia_objetivo?: number | null
  estado: Semaforo
  mensaje?: string | null
}

type EstadoResponse = {
  lote_id: string
  estado_global: Semaforo
  semanas: EstadoSemana[]
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

function fmtLb(v: number | null | undefined) {
  if (typeof v !== 'number' || Number.isNaN(v)) return '-'
  return v.toFixed(3)
}

export default function PresupuestoPesosPage() {
  const [lotes, setLotes] = useState<LoteLite[]>([])
  const [loteId, setLoteId] = useState('')
  const [weeksCount, setWeeksCount] = useState(8)
  const [presupuesto, setPresupuesto] = useState<Record<number, PresupuestoRow>>({})
  const [pesajes, setPesajes] = useState<Record<number, Pesaje>>({})
  const [estado, setEstado] = useState<EstadoResponse | null>(null)
  const [loading, setLoading] = useState(true)

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
      const [presRes, pesRes] = await Promise.all([
        presupuestoPesosApi.list(targetLoteId),
        pesajesApi.list(targetLoteId),
      ])

      const mPres: Record<number, PresupuestoRow> = {}
      for (const r of presRes.data as Array<{
        semana: number
        edad: number
        peso_objetivo: number
        gd?: number | null
        ca?: number | null
      }>) {
        mPres[Number(r.semana)] = {
          semana: Number(r.semana),
          edad: Number(r.edad),
          peso_objetivo: Number(r.peso_objetivo),
          gd: r.gd != null ? Number(r.gd) : null,
          ca: r.ca != null ? Number(r.ca) : null,
        }
      }
      setPresupuesto(mPres)

      const byWeek: Record<number, Pesaje> = {}
      const rows = (pesRes.data as Array<Pesaje>).slice().sort((a, b) => {
        if (a.semana !== b.semana) return a.semana - b.semana
        return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      })
      for (const p of rows) byWeek[Number(p.semana)] = p
      setPesajes(byWeek)

      const maxWeek = Math.max(
        0,
        ...Object.keys(mPres).map((k) => Number(k) || 0),
        ...Object.keys(byWeek).map((k) => Number(k) || 0),
      )
      if (maxWeek > 0) setWeeksCount(Math.max(weeksCount, maxWeek))

      try {
        const estRes = await presupuestoPesosApi.getEstado(targetLoteId)
        setEstado(estRes.data)
      } catch {
        setEstado(null)
      }
    } catch {
      toast.error('No se pudo cargar el presupuesto/pesajes')
      setPresupuesto({})
      setPesajes({})
      setEstado(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!loteId) return
    void reload(loteId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loteId])

  const rows: PresupuestoRow[] = useMemo(() => {
    const r: PresupuestoRow[] = []
    for (let semana = 1; semana <= weeksCount; semana++) {
r.push(
        presupuesto[semana] ?? {
          semana,
          edad: semana * 7,
          peso_objetivo: 0,
          gd: null,
          ca: null,
        },
      )
    }
    return r
  }, [presupuesto, weeksCount])

  const estadoByWeek = useMemo(() => {
    const m: Record<number, EstadoSemana> = {}
    for (const s of estado?.semanas ?? []) m[s.semana] = s
    return m
  }, [estado])

  const chartData = useMemo(() => {
    return rows
      .filter((r) => r.peso_objetivo > 0 || pesajes[r.semana])
      .map((r) => ({
        semana: r.semana,
        objetivo: r.peso_objetivo > 0 ? r.peso_objetivo : null,
        real: pesajes[r.semana]?.peso_promedio ?? null,
      }))
  }, [rows, pesajes])

  const resumen = useMemo(() => {
    const counts: Record<Semaforo, number> = { OK: 0, WARN: 0, BAD: 0, NA: 0 }
    for (const s of estado?.semanas ?? []) counts[s.estado] = (counts[s.estado] ?? 0) + 1
    return counts
  }, [estado])

  const save = async () => {
    if (!loteId) return
    const items = rows
      .filter((r) => Number(r.peso_objetivo) > 0)
      .map((r) => ({
        semana: r.semana,
        edad: r.edad,
        peso_objetivo: Number(r.peso_objetivo),
        gd: r.gd,
        ca: r.ca,
      }))

    try {
      await presupuestoPesosApi.replace(loteId, items)
      toast.success('Presupuesto guardado')
      await reload(loteId)
    } catch {
      toast.error('No se pudo guardar el presupuesto')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Presupuesto de Peso</h1>
          <p className="text-slate-500">Plan semanal vs peso real con semáforo</p>
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
          <button className="btn btn-primary" onClick={() => void save()} disabled={!loteId || loading}>
            💾 Guardar
          </button>
        </div>
      </div>

      {!loteId ? (
        <div className="card p-6 text-sm text-slate-500">Seleccione un lote.</div>
      ) : loading ? (
        <div className="card p-6 text-sm text-slate-500">Cargando...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Curva objetivo vs real</h2>
                  <p className="text-sm text-slate-500">{loteLabel || 'Lote'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-500">Semanas</label>
                  <input
                    className="input w-24"
                    type="number"
                    min={1}
                    max={52}
                    value={weeksCount}
                    onChange={(e) => setWeeksCount(Math.max(1, Math.min(52, Number(e.target.value) || 1)))}
                  />
                </div>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 24, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="semana" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: unknown, name: string) => {
                        const label = name === 'objetivo' ? 'Objetivo' : name === 'real' ? 'Real' : name
                        if (typeof value === 'number') return [value.toFixed(3), label]
                        return [String(value ?? ''), label]
                      }}
                      labelFormatter={(label) => `Semana ${label}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="objetivo" name="Objetivo" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    <Line type="monotone" dataKey="real" name="Real" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-800">Semáforo</h2>
              <p className="text-sm text-slate-500 mb-4">Estado global: <span className={semaforoBadge(estado?.estado_global ?? 'NA')}>{estado?.estado_global ?? 'NA'}</span></p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-slate-600">OK</span><span className="font-medium">{resumen.OK}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-600">WARN</span><span className="font-medium">{resumen.WARN}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-600">BAD</span><span className="font-medium">{resumen.BAD}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-600">NA</span><span className="font-medium">{resumen.NA}</span></div>
              </div>

              <p className="text-xs text-slate-500 mt-4">
                Reglas: OK si real ≥ objetivo; WARN si cae hasta 5% por debajo; BAD si está por debajo.
              </p>
            </div>
          </div>

          <div className="card p-0 overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="table-header">Semana</th>
                  <th className="table-header text-right">Edad (días)</th>
                  <th className="table-header text-right">Peso (lbs)</th>
                  <th className="table-header text-right">GD (LBS)</th>
                  <th className="table-header text-right">CA (lbs)</th>
                  <th className="table-header text-right">Ganancia obj. (lb)</th>
                  <th className="table-header text-right">Real (lb)</th>
                  <th className="table-header text-right">Δ (real-obj)</th>
                  <th className="table-header">Estado</th>
                  <th className="table-header">Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const s = estadoByWeek[r.semana]
                  const prevObj = idx > 0 ? rows[idx - 1].peso_objetivo : 0
                  const prevRow = presupuesto[r.semana]
                  const gain = r.peso_objetivo > 0 && prevObj > 0 ? r.peso_objetivo - prevObj : null
                  return (
                    <tr key={r.semana} className="table-row">
                      <td className="table-cell">{r.semana}</td>
                      <td className="table-cell text-right">
                        <input
                          className="input w-24 text-right"
                          type="number"
                          step="1"
                          value={r.edad || ''}
                          onChange={(e) => {
                            const val = e.target.value
                            setPresupuesto((p) => ({
                              ...p,
                              [r.semana]: {
                                ...(p[r.semana] || prevRow || { semana: r.semana, edad: 0, peso_objetivo: 0, gd: null, ca: null }),
                                edad: val === '' ? 0 : parseInt(val, 10),
                              },
                            }))
                          }}
                          placeholder="0"
                        />
                      </td>
                      <td className="table-cell text-right">
                        <input
                          className="input w-32 text-right"
                          type="number"
                          step="any"
                          value={r.peso_objetivo || ''}
                          onChange={(e) => {
                            const val = e.target.value
                            setPresupuesto((p) => ({
                              ...p,
                              [r.semana]: {
                                ...(p[r.semana] || prevRow || { semana: r.semana, edad: r.edad, peso_objetivo: 0, gd: null, ca: null }),
                                peso_objetivo: val === '' ? 0 : parseFloat(val),
                              },
                            }))
                          }}
                          placeholder="0.000"
                        />
                      </td>
                      <td className="table-cell text-right">
                        <input
                          className="input w-24 text-right"
                          type="number"
                          step="any"
                          value={r.gd ?? ''}
                          onChange={(e) => {
                            const val = e.target.value
                            setPresupuesto((p) => ({
                              ...p,
                              [r.semana]: {
                                ...(p[r.semana] || prevRow || { semana: r.semana, edad: r.edad, peso_objetivo: r.peso_objetivo, gd: null, ca: null }),
                                gd: val === '' ? null : parseFloat(val),
                              },
                            }))
                          }}
                          placeholder="0.000"
                        />
                      </td>
                      <td className="table-cell text-right">
                        <input
                          className="input w-24 text-right"
                          type="number"
                          step="any"
                          value={r.ca ?? ''}
                          onChange={(e) => {
                            const val = e.target.value
                            setPresupuesto((p) => ({
                              ...p,
                              [r.semana]: {
                                ...(p[r.semana] || prevRow || { semana: r.semana, edad: r.edad, peso_objetivo: r.peso_objetivo, gd: r.gd, ca: null }),
                                ca: val === '' ? null : parseFloat(val),
                              },
                            }))
                          }}
                          placeholder="0.000"
                        />
                      </td>
                      <td className="table-cell text-right text-slate-600">{fmtLb(s?.ganancia_objetivo ?? gain)}</td>
                      <td className="table-cell text-right font-medium">{fmtLb(pesajes[r.semana]?.peso_promedio ?? s?.peso_real ?? null)}</td>
                      <td className="table-cell text-right">
                        {s?.delta == null ? <span className="text-slate-400">-</span> : <span className={s.delta >= 0 ? 'text-green-600' : 'text-red-600'}>{fmtLb(s.delta)}</span>}
                      </td>
                      <td className="table-cell">
                        <span className={semaforoBadge(s?.estado ?? 'NA')}>{s?.estado ?? 'NA'}</span>
                      </td>
                      <td className="table-cell text-slate-600">{s?.mensaje ?? '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}