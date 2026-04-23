import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { lotesApi, pesajesApi } from '@/services/api'
import { toast } from 'sonner'
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

type LoteLite = { id: string; numero_lote: string }

type Pesaje = {
  id: string
  lote_id: string
  semana: number
  fecha: string
  cantidad_muestreada: number
  peso_total_muestra: number
  peso_promedio: number
  variacion_semanal?: number | null
}

type Regression = {
  slope: number
  intercept: number
  r2: number | null
}

function linearRegression(points: Array<{ x: number; y: number }>): Regression | null {
  const n = points.length
  if (n < 2) return null

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0
  for (const p of points) {
    sumX += p.x
    sumY += p.y
    sumXY += p.x * p.y
    sumX2 += p.x * p.x
  }

  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return null

  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n

  const meanY = sumY / n
  let ssRes = 0
  let ssTot = 0
  for (const p of points) {
    const yHat = slope * p.x + intercept
    ssRes += (p.y - yHat) ** 2
    ssTot += (p.y - meanY) ** 2
  }
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : null

  return { slope, intercept, r2 }
}

export default function PesajesListPage() {
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState('')
  const [loading, setLoading] = useState(true)
  const [pesajes, setPesajes] = useState<Pesaje[]>([])
  const [lotes, setLotes] = useState<LoteLite[]>([])
  const [chartLoteId, setChartLoteId] = useState<string>('')
  const [chartMetric, setChartMetric] = useState<'variacion' | 'peso'>('variacion')

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      try {
        const [pesajesRes, lotesRes] = await Promise.all([pesajesApi.list(), lotesApi.list()])
        if (cancelled) return
        setPesajes(pesajesRes.data)
        setLotes(lotesRes.data)
      } catch {
        if (!cancelled) toast.error('No se pudieron cargar los pesajes')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  const lotesById = useMemo(() => {
    const m: Record<string, string> = {}
    for (const l of lotes) m[l.id] = l.numero_lote
    return m
  }, [lotes])

  useEffect(() => {
    // Default: primer lote con al menos 2 pesajes.
    if (chartLoteId) return
    const counts: Record<string, number> = {}
    for (const p of pesajes) counts[p.lote_id] = (counts[p.lote_id] ?? 0) + 1
    const candidate = lotes.find((l) => (counts[l.id] ?? 0) >= 2)?.id
    if (candidate) setChartLoteId(candidate)
  }, [chartLoteId, lotes, pesajes])

  const chartPesajes = useMemo(() => {
    if (!chartLoteId) return []
    const byWeek = new Map<number, Pesaje>()
    const rows = pesajes
      .filter((p) => p.lote_id === chartLoteId)
      .slice()
      .sort((a, b) => {
        if (a.semana !== b.semana) return a.semana - b.semana
        return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      })

    // Si hay multiples registros en la misma semana, nos quedamos con el mas reciente por fecha.
    for (const p of rows) byWeek.set(p.semana, p)
    return Array.from(byWeek.values()).sort((a, b) => a.semana - b.semana)
  }, [chartLoteId, pesajes])

  const seriesByWeek = useMemo(() => {
    // Variacion semanal calculada como delta entre puntos consecutivos
    // (asi funciona aunque variacion_semanal venga null desde backend).
    return chartPesajes.map((p, idx) => {
      const prev = idx > 0 ? chartPesajes[idx - 1] : null
      const variacion = prev ? p.peso_promedio - prev.peso_promedio : null
      return {
        semana: p.semana,
        peso: p.peso_promedio,
        variacion,
      }
    })
  }, [chartPesajes])

  const regression = useMemo(() => {
    if (chartMetric === 'peso') {
      const pts = seriesByWeek.map((p) => ({ x: p.semana, y: p.peso }))
      return linearRegression(pts)
    }

    const pts = seriesByWeek
      .filter((p) => p.variacion != null)
      .map((p) => ({ x: p.semana, y: p.variacion as number }))
    return linearRegression(pts)
  }, [chartMetric, seriesByWeek])

  const chartData = useMemo(() => {
    if (!regression) {
      return seriesByWeek.map((p) => ({
        ...p,
        regresion: null as number | null,
      }))
    }

    return seriesByWeek.map((p) => ({
      ...p,
      regresion: regression.slope * p.semana + regression.intercept,
    }))
  }, [seriesByWeek, regression])

  const filteredPesajes = useMemo(() => {
    const q = filtro.trim().toLowerCase()
    if (!q) return pesajes

    return pesajes.filter((p) => {
      const numero = lotesById[p.lote_id]?.toLowerCase()
      return (
        (numero && numero.includes(q)) ||
        p.lote_id.toLowerCase().includes(q) ||
        String(p.semana).includes(q)
      )
    })
  }, [filtro, lotesById, pesajes])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pesajes</h1>
          <p className="text-slate-500">Control de peso semanal por muestreo</p>
        </div>
        <button onClick={() => navigate('/pesajes/nuevo')} className="btn btn-primary">
          ➕ Registrar Pesaje
        </button>
      </div>

      <div className="card p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-3">
            <div>
              <label className="label">Buscar</label>
              <input
                type="text"
                placeholder="Buscar por lote..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="input w-64"
              />
            </div>

            <div>
              <label className="label">Gráfico</label>
              <select
                className="input w-64"
                value={chartLoteId}
                onChange={(e) => setChartLoteId(e.target.value)}
              >
                <option value="">Seleccionar lote</option>
                {lotes.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.numero_lote}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Métrica</label>
              <select
                className="input w-64"
                value={chartMetric}
                onChange={(e) => setChartMetric(e.target.value as 'variacion' | 'peso')}
              >
                <option value="variacion">Variación semanal (Δ)</option>
                <option value="peso">Peso promedio</option>
              </select>
            </div>
          </div>

          {regression && (
            <div className="text-sm text-slate-600">
              <span className="font-medium text-slate-700">Regresión lineal:</span>{' '}
              y = {regression.slope.toFixed(4)}x + {regression.intercept.toFixed(4)}
              {regression.r2 == null ? null : (
                <>
                  {' '}| R² = {regression.r2.toFixed(3)}
                </>
              )}
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="card p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800">Tendencia de Peso</h2>
                <p className="text-sm text-slate-500">
                  {chartLoteId ? (lotesById[chartLoteId] ?? chartLoteId) : 'Seleccione un lote para ver el gráfico'}
                </p>
              </div>
            </div>

            {chartLoteId && (chartMetric === 'peso' ? chartPesajes.length < 2 : chartPesajes.length < 3) ? (
              <div className="p-6 text-sm text-slate-500">
                {chartMetric === 'peso'
                  ? 'Se requieren al menos 2 pesajes para calcular la regresión.'
                  : 'Se requieren al menos 3 pesajes para calcular la regresión de variación (Δ).'}
              </div>
            ) : chartLoteId ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 24, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="semana" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: unknown, name: string) => {
                        const label =
                          name === 'peso'
                            ? 'Peso prom.'
                            : name === 'variacion'
                              ? 'Variación (Δ)'
                              : name === 'regresion'
                                ? 'Regresión'
                                : name
                        if (typeof value === 'number') return [value.toFixed(3), label]
                        return [String(value ?? ''), label]
                      }}
                      labelFormatter={(label) => `Semana ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey={chartMetric === 'peso' ? 'peso' : 'variacion'}
                      name={chartMetric === 'peso' ? 'Peso prom.' : 'Variación (Δ)'}
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls={chartMetric === 'variacion'}
                    />
                    <Line
                      type="monotone"
                      dataKey="regresion"
                      name="Regresión"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="6 4"
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="p-6 text-sm text-slate-500">Seleccione un lote para ver el gráfico.</div>
            )}
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="table-header">Lote</th>
              <th className="table-header">Semana</th>
              <th className="table-header">Fecha</th>
              <th className="table-header text-right">Muestra</th>
              <th className="table-header text-right">Peso Total (lb)</th>
              <th className="table-header text-right">Peso Prom. (lb)</th>
              <th className="table-header text-right">Variación</th>
              <th className="table-header"></th>
            </tr>
          </thead>
          <tbody>
            {filteredPesajes.map((p) => (
              <tr key={p.id} className="table-row">
                <td className="table-cell font-medium">{lotesById[p.lote_id] ?? p.lote_id}</td>
                <td className="table-cell">{p.semana}</td>
                <td className="table-cell">{new Date(p.fecha).toLocaleDateString('es-ES')}</td>
                <td className="table-cell text-right">{p.cantidad_muestreada}</td>
                <td className="table-cell text-right">{p.peso_total_muestra}</td>
                <td className="table-cell text-right font-medium">{p.peso_promedio}</td>
                <td className="table-cell text-right">
                  {p.variacion_semanal == null ? (
                    <span className="text-slate-400">-</span>
                  ) : (
                    <span className={p.variacion_semanal > 0 ? 'text-green-600' : 'text-slate-500'}>
                      {p.variacion_semanal > 0 ? '+' : ''}
                      {p.variacion_semanal}
                    </span>
                  )}
                </td>
                <td className="table-cell">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/pesajes/${p.id}/editar`}
                      className="p-1 text-slate-500 hover:text-slate-700"
                      title="Editar"
                    >
                      ✏️
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && <div className="p-8 text-center text-slate-500">Cargando pesajes...</div>}

        {!loading && filteredPesajes.length === 0 && (
          <div className="p-8 text-center text-slate-500">No hay pesajes para mostrar.</div>
        )}
      </div>
    </div>
  )
}
