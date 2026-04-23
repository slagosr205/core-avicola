import axios, { AxiosError, AxiosRequestConfig } from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export const lotesApi = {
  list: (params?: Record<string, unknown>) => api.get('/lotes', { params }),
  proximo: () => api.get('/lotes/proximo'),
  get: (id: string) => api.get(`/lotes/${id}`),
  create: (data: Record<string, unknown>) => api.post('/lotes', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/lotes/${id}`, data),
  delete: (id: string) => api.delete(`/lotes/${id}`),
  cerrar: (id: string) => api.post(`/lotes/${id}/cerrar`),
  liquidar: (id: string) => api.post(`/lotes/${id}/liquidar`),
}

export const pesajesApi = {
  list: (loteId?: string) => api.get('/pesajes', { params: { lote_id: loteId } }),
  get: (id: string) => api.get(`/pesajes/${id}`),
  create: (data: Record<string, unknown>) => api.post('/pesajes', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/pesajes/${id}`, data),
  delete: (id: string) => api.delete(`/pesajes/${id}`),
}

export const mortalidadApi = {
  list: (loteId?: string) => api.get('/mortalidad', { params: { lote_id: loteId } }),
  get: (id: string) => api.get(`/mortalidad/${id}`),
  create: (data: Record<string, unknown>) => api.post('/mortalidad', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/mortalidad/${id}`, data),
  delete: (id: string) => api.delete(`/mortalidad/${id}`),
}

export const alimentacionApi = {
  list: (loteId?: string) => api.get('/consumos', { params: { lote_id: loteId } }),
  create: (data: Record<string, unknown>) => api.post('/consumos', data),
  getResumen: (loteId: string) => api.get(`/consumos/resumen/${loteId}`),
}

export const costosApi = {
  list: (loteId?: string) => api.get('/costos', { params: { lote_id: loteId } }),
  create: (data: Record<string, unknown>) => api.post('/costos', data),
}

export const procesamientoApi = {
  list: () => api.get('/procesamientos'),
  get: (id: string) => api.get(`/procesamientos/${id}`),
  create: (data: Record<string, unknown>) => api.post('/procesamientos', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/procesamientos/${id}`, data),
}

export const tercerosApi = {
  list: (tipo?: string) => api.get('/terceros', { params: { tipo } }),
  get: (id: string) => api.get(`/terceros/${id}`),
  create: (data: Record<string, unknown>) => api.post('/terceros', data),
}

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getAlerts: () => api.get('/dashboard/alertas'),
  getLotesRecientes: () => api.get('/dashboard/lotes-recientes'),
}

export const ambienteApi = {
  listRegistros: (loteId?: string) => api.get('/ambiente/registros', { params: { lote_id: loteId } }),
  createRegistro: (data: Record<string, unknown>) => api.post('/ambiente/registros', data),
  getProgramacion: (loteId: string) => api.get(`/ambiente/programacion/${loteId}`),
  upsertProgramacion: (loteId: string, data: Record<string, unknown>) => api.put(`/ambiente/programacion/${loteId}`, data),
  getEstado: (loteId: string) => api.get('/ambiente/estado', { params: { lote_id: loteId } }),
}

export const presupuestoPesosApi = {
  list: (loteId?: string) => api.get('/presupuesto-pesos', { params: { lote_id: loteId } }),
  replace: (loteId: string, items: Array<{
    semana: number
    edad: number
    peso_objetivo: number
    gd?: number | null
    ca?: number | null
  }>) =>
    api.put(`/presupuesto-pesos/${loteId}`, { items }),
  getEstado: (loteId: string) => api.get('/presupuesto-pesos/estado', { params: { lote_id: loteId } }),
}

export const granjasApi = {
  list: (includeInactive?: boolean) => api.get('/granjas', { params: { include_inactive: includeInactive } }),
  get: (id: string) => api.get(`/granjas/${id}`),
  create: (data: Record<string, unknown>) => api.post('/granjas', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/granjas/${id}`, data),
  delete: (id: string) => api.delete(`/granjas/${id}`),
}

export const galponesApi = {
  list: (granjaId?: string, includeInactive?: boolean) => api.get('/galpones', { params: { granja_id: granjaId, include_inactive: includeInactive } }),
  get: (id: string) => api.get(`/galpones/${id}`),
  create: (data: Record<string, unknown>) => api.post('/galpones', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/galpones/${id}`, data),
  delete: (id: string) => api.delete(`/galpones/${id}`),
}

export const insumosApi = {
  list: (tipo?: string, includeInactive?: boolean) => api.get('/inventario/insumos', { params: { tipo, include_inactive: includeInactive } }),
  get: (id: string) => api.get(`/inventario/insumos/${id}`),
  create: (data: Record<string, unknown>) => api.post('/inventario/insumos', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/inventario/insumos/${id}`, data),
  delete: (id: string) => api.delete(`/inventario/insumos/${id}`),
}

export const inventarioApi = {
  getResumen: () => api.get('/inventario/resumen'),
  getSaldos: () => api.get('/inventario/saldos'),
  getSaldo: (insumoId: string) => api.get(`/inventario/saldos/${insumoId}`),
  getKardex: (insumoId: string, fechaDesde?: string) => api.get('/inventario/kardex/' + insumoId, { params: { fechaDesde } }),
  getMovimientos: (insumoId?: string, limite?: number) => api.get('/inventario/movimientos', { params: { insumo_id: insumoId, limite } }),
  crearEntrada: (data: Record<string, unknown>) => api.post('/inventario/entradas', data),
  crearSalida: (data: Record<string, unknown>) => api.post('/inventario/salidas', data),
  crearTransferencia: (data: Record<string, unknown>) => api.post('/inventario/transferencias', data),
}

export const reportesApi = {
  generate: (tipo: string, params: Record<string, unknown>) =>
    api.get(`/reportes/${tipo}`, { params }),
  exportExcel: (tipo: string, params: Record<string, unknown>) =>
    api.get(`/reportes/${tipo}/excel`, { params, responseType: 'blob' }),
  exportPdf: (tipo: string, params: Record<string, unknown>) =>
    api.get(`/reportes/${tipo}/pdf`, { params, responseType: 'blob' }),
}

export const odooApi = {
  testConnection: () => api.get('/odoo/test'),
  syncMaestros: () => api.post('/odoo/sync/maestros'),
  syncInventario: () => api.post('/odoo/sync/inventario'),
  getLogs: () => api.get('/odoo/logs'),
}
